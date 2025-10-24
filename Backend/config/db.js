import mongoose from "mongoose";

const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () => console.log("Database connected"));

    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "rag",
      serverSelectionTimeoutMS: 30000,
    });
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
  }
};

export default connectDB;
