// app/lib/mongodb.js
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("❌ MONGODB_URI is not defined!");
}

let client;
let clientPromise;

if (process.env.NODE_ENV === "development") {
  // In dev, reuse the global connection if available
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In prod, always create a new connection
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export default clientPromise;
