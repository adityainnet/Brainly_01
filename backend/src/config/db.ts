import mongoose from "mongoose";
import { MONGODB_URI } from "../config";

export const connectDB = async (): Promise<void> => {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  await mongoose.connect(MONGODB_URI);
  console.log("MongoDB connected successfully");
};
