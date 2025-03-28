import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("❌ MONGODB_URI is not defined!");
}

let client;
let clientPromise;

try {
  client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 }); // 5 sec timeout
  clientPromise = client.connect();
  console.log("✅ MongoDB Connected Successfully");
} catch (error) {
  console.error("❌ MongoDB Connection Error:", error.message);
}

export default clientPromise;
