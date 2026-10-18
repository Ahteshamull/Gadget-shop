import mongoose from "mongoose";
import { env } from "./env.js";
import dns from "node:dns";

// Force Node.js to use Cloudflare and Google DNS for resolving MongoDB SRV records
dns.setServers(["1.1.1.1", "8.8.8.8"]);

export async function connectDatabase(): Promise<void> {
  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`MongoDB connected: ${mongoose.connection.name}`);
  } catch (error) {
    console.error("MongoDB connection failed", error);
    process.exit(1);
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
