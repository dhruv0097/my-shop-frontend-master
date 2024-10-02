import mongoose from "mongoose";

// Function to connect to MongoDB using Mongoose
export async function mongooseConnect() {
  if (mongoose.connection.readyState === 1) {
    // If already connected, return the existing connection as a promise
    return mongoose.connection.asPromise();
  } else {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
    }

    try {
      // Connect to MongoDB
      await mongoose.connect(uri, {
        useNewUrlParser: true, // Use the new URL parser
        useUnifiedTopology: true, // Use the new unified topology layer
      });
      console.log("MongoDB connected successfully");
      return mongoose.connection.asPromise();
    } catch (error) {
      console.error("MongoDB connection error:", error);
      throw new Error("MongoDB connection failed");
    }
  }
}
