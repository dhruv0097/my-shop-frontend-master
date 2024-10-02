import { MongoClient } from "mongodb";

// Check for the MongoDB URI in environment variables
if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options = {
  useNewUrlParser: true, // Use the new URL parser
  useUnifiedTopology: true, // Use the new unified topology layer
};

let client;
let clientPromise;

// Handle MongoDB connection based on the environment
if (process.env.NODE_ENV === "development") {
  // Use global variable to prevent multiple connections during development with HMR
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect().catch((err) => {
      console.error("Failed to connect to MongoDB", err);
      throw new Error("MongoDB connection failed");
    });
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production, create a new client instance and connect directly
  client = new MongoClient(uri, options);
  clientPromise = client.connect().catch((err) => {
    console.error("Failed to connect to MongoDB", err);
    throw new Error("MongoDB connection failed");
  });
}

// Export the MongoClient promise to be reused in other parts of the application
export default clientPromise;
