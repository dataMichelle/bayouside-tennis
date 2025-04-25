import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("❌ MONGODB_URI is not defined!");

let client;
let clientPromise;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    global._mongoClientPromise = client.connect().then((connectedClient) => {
      console.log("✅ MongoDB connected (dev)");
      return connectedClient;
    });
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
  });
  clientPromise = client.connect().then((connectedClient) => {
    console.log("✅ MongoDB connected (prod)");
    return connectedClient;
  });
}

export default clientPromise;
