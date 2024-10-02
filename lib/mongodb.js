import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options = {};

let client;
let clientPromise;

if (process.env.NODE_ENV === "development") {
  // Use global to prevent multiple connections during development with HMR.
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect().catch((err) => {
      console.error("Failed to connect to MongoDB", err);
      throw new Error("MongoDB connection failed");
    });
  }
  clientPromise = global._mongoClientPromise;
} else {
  // For production, directly create a new client instance.
  client = new MongoClient(uri, options);
  clientPromise = client.connect().catch((err) => {
    console.error("Failed to connect to MongoDB", err);
    throw new Error("MongoDB connection failed");
  });
}

// Export a module-scoped MongoClient promise.
// Ensures client reuse across server-side functions.
export default clientPromise;
