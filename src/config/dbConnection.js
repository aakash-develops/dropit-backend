import mongoose from "mongoose";

const dbConnect = async () => {
  // 1. Guard against missing environment variables
  if (!process.env.MONGO_URI) {
    console.error("FATAL ERROR: MONGO_URI is not defined in environment variables.");
    process.exit(1);
  }

  try {
    // 2. Establish connection
    const conn = await mongoose.connect(process.env.MONGO_URI);

    // 3. Log active connection host for better debugging
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database connection failed: ${error.message}`);
    process.exit(1);
  }
};

// 4. Handle runtime connection errors after initial boot
mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB connection lost. Attempting to reconnect...");
});

mongoose.connection.on("error", (err) => {
  console.error(`MongoDB connection error: ${err.message}`);
});

export default dbConnect;