import "server-only";

import type { Db, MongoClientOptions } from "mongodb";
import { MongoClient, ServerApiVersion } from "mongodb";

const globalForMongo = globalThis as unknown as { mongodb: MongoClient | undefined };

const disableStableApi = process.env.MONGODB_DISABLE_STABLE_API === "1" || process.env.MONGODB_DISABLE_STABLE_API === "true";

/**
 * Options tuned for MongoDB Atlas + serverless (Vercel): reduces flaky TLS/selection on cold starts
 * and matches Atlas "Drivers" connect snippets (Stable API v1 + bounded pool + timeouts).
 */
function mongoClientOptions(): MongoClientOptions {
  const base: MongoClientOptions = {
    connectTimeoutMS: 20_000,
    minPoolSize: 0,
    maxPoolSize: 5,
    maxIdleTimeMS: 60_000,
    serverSelectionTimeoutMS: 20_000,
  };
  if (disableStableApi) {
    return base;
  }
  return {
    ...base,
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  };
}

/**
 * Closes the cached client (if any) so the next `getMongoClient()` creates a new one. Use after
 * connection/TLS errors so a poisoned pool does not keep failing every request.
 */
async function resetMongoClientForRetry(): Promise<void> {
  if (globalForMongo.mongodb) {
    try {
      await globalForMongo.mongodb.close();
    } catch {
      // best-effort close; still drop the reference
    }
    globalForMongo.mongodb = void 0;
  }
}

function isTransientConnectionFailure(e: unknown): boolean {
  if (e && typeof e === "object" && "name" in e) {
    const n = String((e as { name: string }).name);
    if (n === "MongoServerSelectionError" || n === "MongoNetworkError" || n === "MongoClientClosedError") {
      return true;
    }
  }
  if (e instanceof Error) {
    if (/\b(tlsv1|SSL|ERR_SSL|ETIMEDOUT|ECONNREFUSED|ENOTFOUND|getaddrinfo)\b/i.test(e.message)) {
      return true;
    }
  }
  return false;
}

/**
 * One retry with a fresh client after transient connection/TLS failures (common on Vercel + Atlas).
 */
async function withMongoConnectionRetry<T>(action: () => Promise<T>, attempts = 2): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await action();
    } catch (e) {
      lastError = e;
      if (i < attempts - 1 && isTransientConnectionFailure(e)) {
        await resetMongoClientForRetry();
        continue;
      }
      throw e;
    }
  }
  throw lastError;
}

function getMongoClient(): MongoClient | null {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return null;
  }

  if (!globalForMongo.mongodb) {
    globalForMongo.mongodb = new MongoClient(uri, mongoClientOptions());
  }

  return globalForMongo.mongodb;
}

/**
 * Same database name for reads (CSV) and writes (persist). Set MONGODB_DB_NAME if your
 * MONGODB_URI has no path segment (e.g. ends with .net/) so you are not using the default.
 */
function getMongoDb(): Db | null {
  const client = getMongoClient();
  if (!client) {
    return null;
  }
  const name = process.env.MONGODB_DB_NAME?.trim();
  if (name) {
    return client.db(name);
  }
  return client.db();
}

export { getMongoClient, getMongoDb, resetMongoClientForRetry, withMongoConnectionRetry };
