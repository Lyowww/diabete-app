import "server-only";

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

export { getMongoClient };
