import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("❌ MONGODB_URI is not defined!");

let client;
let clientPromise;

if (process.env.NODE_ENV === "development") {
  // Preserve connection across hot reloads in dev
  if (!globalThis._mongoClient) {
    client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    globalThis._mongoClient = client;
    globalThis._mongoClientPromise = client.connect();
  }
  clientPromise = globalThis._mongoClientPromise;
} else {
  // Always create a new client in production
  client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  clientPromise = client.connect();
}

export default clientPromise;
