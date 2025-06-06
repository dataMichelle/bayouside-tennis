import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("❌ MONGODB_URI is not defined!");
}

let client;
let clientPromise;

// Check if client is already initialized (for serverless environments)
if (!global._mongoClientPromise) {
  client = new MongoClient(uri, {
    maxPoolSize: 10,
    minPoolSize: 1,
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 30000,
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
