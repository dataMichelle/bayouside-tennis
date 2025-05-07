import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("❌ MONGODB_URI is not defined!");
}

let client;
let clientPromise;

// Reuse client across all environments
if (!global._mongoClientPromise) {
  client = new MongoClient(uri, {
    maxPoolSize: 10, // Limit connection pool for serverless
    minPoolSize: 1,
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 10000,
  });
  global._mongoClientPromise = client.connect();
}
clientPromise = global._mongoClientPromise;

export async function connectDB() {
  try {
    const client = await clientPromise;
    const db = client.db("bayou-side-tennis");
    return db;
  } catch (error) {
    console.error("MongoDB connection error:", error.message, error.stack);
    throw error;
  }
}

export default clientPromise;
