import dotenv from "dotenv";
dotenv.config();
import { z } from "zod";

const optionalString = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().optional(),
);

const optionalEmail = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().email().optional(),
);

const booleanFromEnv = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return value;
}, z.boolean());

const envSchema = z
  .object({
    PORT: z.coerce.number().int().positive().default(5000),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
    JWT_SECRET: z.string().min(24, "JWT_SECRET must be at least 24 characters"),
    JWT_EXPIRES_IN: z.string().min(1).default("30d"),
    CORS_ORIGIN: z.string().min(1).default("http://localhost:5173"),
    DEFAULT_ADMIN_EMAIL: z.string().email().default("mehedimdf@gmail.com"),
    DEFAULT_ADMIN_PASSWORD: z.string().min(6).default("admin123"),
    DEFAULT_ADMIN_NAME: z.string().min(1).default("Admin"),
    SMTP_HOST: optionalString,
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_SECURE: booleanFromEnv.default(false),
    SMTP_USER: optionalString,
    SMTP_PASS: optionalString,
    SMTP_FROM: optionalEmail,
    ADMIN_CONTACT_EMAIL: optionalEmail,
  })
  .superRefine((value, ctx) => {
    if (!value.SMTP_HOST) return;
    if (!value.SMTP_USER) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["SMTP_USER"],
        message: "SMTP_USER is required when SMTP_HOST is configured",
      });
    }
    if (!value.SMTP_PASS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["SMTP_PASS"],
        message: "SMTP_PASS is required when SMTP_HOST is configured",
      });
    }
  });

export const env = envSchema.parse(process.env);
