import { MongoClient } from "mongodb";

// The MongoDB URI from your environment variables
const uri = process.env.MONGODB_URI;
console.log("MONGODB_URI:", uri ? uri.substring(0, 20) + "..." : "undefined");

if (!uri) {
  throw new Error("❌ MONGODB_URI is not defined!");
}

let client;
let clientPromise;

// Use MongoClient as a singleton to avoid multiple connections in development
if (process.env.NODE_ENV === "development") {
  if (!global._mongoClient) {
    client = new MongoClient(uri);
    global._mongoClient = client.connect();
  }
  clientPromise = global._mongoClient;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

// Connect to MongoDB and get the DB instance
export async function connectDB() {
  try {
    const client = await clientPromise; // Wait for connection
    const db = client.db("bayou-side-tennis");
    return db; // Return the database instance
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    throw error;
  }
}

export default clientPromise; // Default export for other modules to use
