import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("❌ MONGODB_URI is not defined!");
}

let client;
let clientPromise;

if (process.env.NODE_ENV === "development") {
  // In development, use a global variable to preserve connection across hot reloads
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    global._mongoClientPromise = client
      .connect()
      .then(() => {
        console.log("✅ MongoDB Connected Successfully");
        return client;
      })
      .catch((error) => {
        console.error("❌ MongoDB Connection Error:", error.message);
        throw error;
      });
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production, create a single client
  client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  clientPromise = client
    .connect()
    .then(() => {
      console.log("✅ MongoDB Connected Successfully");
      return client;
    })
    .catch((error) => {
      console.error("❌ MongoDB Connection Error:", error.message);
      throw error;
    });
}

export default clientPromise;
