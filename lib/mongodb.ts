import "server-only";

import type { Db } from "mongodb";
import { MongoClient } from "mongodb";

const globalForMongo = globalThis as unknown as { mongodb: MongoClient | undefined };

function getMongoClient(): MongoClient | null {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return null;
  }

  if (!globalForMongo.mongodb) {
    globalForMongo.mongodb = new MongoClient(uri);
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

export { getMongoClient, getMongoDb };
