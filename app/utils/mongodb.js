import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

let client;
let clientPromise;

if (process.env.NODE_ENV === "development") {
  // Use global variable in development to prevent hot-reloading issues
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // Use a new MongoClient instance in production
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export default clientPromise;
