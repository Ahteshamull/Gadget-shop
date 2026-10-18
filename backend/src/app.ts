import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { globalErrorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import { accessRequestRoutes } from "./routes/accessRequestRoutes.js";
import { adminUserRoutes } from "./routes/adminUserRoutes.js";
import { authRoutes } from "./routes/authRoutes.js";
import { businessProfileRoutes } from "./routes/businessProfileRoutes.js";
import { expenseRoutes, partnerRoutes } from "./routes/partnerRoutes.js";
import { gadgetRoutes, gadgetSaleRoutes } from "./routes/gadgetRoutes.js";
import { phoneRoutes } from "./routes/phoneRoutes.js";

export const app = express();
const corsOrigins = env.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean);

app.disable("etag");
app.use(helmet());
app.use(cors({ origin: corsOrigins, credentials: true }));
app.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

app.get("/", (_req, res) => {
  res.json({ success: true, message: "IMEI Guardian Pro API is running smoothly at root." });
});

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "IMEI Guardian Pro API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin/access-requests", accessRequestRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/business-profile", businessProfileRoutes);
app.use("/api/phones", phoneRoutes);
app.use("/api/gadgets", gadgetRoutes);
app.use("/api/gadgets-sales", gadgetSaleRoutes);
app.use("/api/partners", partnerRoutes);
app.use("/api/expenses", expenseRoutes);

app.use(notFoundHandler);
app.use(globalErrorHandler);
