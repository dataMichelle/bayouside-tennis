// app/lib/mongodb.js
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("❌ MONGODB_URI is not defined in environment variables.");
  throw new Error("❌ MONGODB_URI is not defined!");
}

let client;
let clientPromise;

const options = {
  serverSelectionTimeoutMS: 5000, // Optional: reduces hang time
};

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    console.log("🧪 Connecting to MongoDB in development...");
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client
      .connect()
      .then((client) => {
        console.log("✅ MongoDB connected (dev)");
        return client;
      })
      .catch((err) => {
        console.error("❌ MongoDB connection failed (dev):", err.message);
        throw err;
      });
  }
  clientPromise = global._mongoClientPromise;
} else {
  console.log("🚀 Connecting to MongoDB in production...");
  client = new MongoClient(uri, options);
  clientPromise = client
    .connect()
    .then((client) => {
      console.log("✅ MongoDB connected (prod)");
      return client;
    })
    .catch((err) => {
      console.error("❌ MongoDB connection failed (prod):", err.message);
      throw err;
    });
}

export default clientPromise;
