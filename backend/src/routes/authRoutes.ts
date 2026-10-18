import { Router } from "express";
import {
  contactAdmin,
  createInitialAdmin,
  forgotPassword,
  getSetupStatus,
  login,
  resetPassword,
  verifyResetOtp,
} from "../controllers/authController.js";
import { validate } from "../middlewares/validate.js";
import {
  contactAdminSchema,
  createInitialAdminSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  verifyResetOtpSchema,
} from "../schemas/authSchemas.js";

export const authRoutes = Router();

authRoutes.get("/get-setup-status", getSetupStatus);
authRoutes.post("/create-initial-admin", validate(createInitialAdminSchema), createInitialAdmin);
authRoutes.post("/login", validate(loginSchema), login);
authRoutes.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
authRoutes.post("/verify-reset-otp", validate(verifyResetOtpSchema), verifyResetOtp);
authRoutes.post("/reset-password", validate(resetPasswordSchema), resetPassword);
authRoutes.post("/contact-admin", validate(contactAdminSchema), contactAdmin);

