import { app } from "../src/app.js";
import { connectDatabase } from "../src/config/database.js";
import { seedDefaultAdmin } from "../src/services/seedAdmin.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

let dbConnected = false;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!dbConnected) {
    try {
      await connectDatabase();
      await seedDefaultAdmin();
      dbConnected = true;
    } catch (error) {
      console.error("Database connection failed during Vercel function invocation:", error);
      return res.status(500).json({ success: false, message: "Database connection failed", errorType: "DB_ERROR" });
    }
  }
  
  // @ts-ignore - express app can handle vercel req/res natively
  return app(req, res);
}
