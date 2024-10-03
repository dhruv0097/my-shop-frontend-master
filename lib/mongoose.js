import mongoose from "mongoose";

// Variable to track if the connection has already been established
let isConnected = false;

// Function to connect to MongoDB using Mongoose
export async function mongooseConnect() {
  if (isConnected) {
    return mongoose.connection.asPromise();
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
  }

  try {
    // Connect to MongoDB if not already connected
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = true; // Mark the connection as established
    console.log("MongoDB connected successfully");
    return mongoose.connection.asPromise();
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw new Error("MongoDB connection failed");
  }
}
