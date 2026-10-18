import { Router } from "express";
import multer from "multer";
import {
  getBusinessProfile,
  getLoginBanner,
  updateBrandingProfile,
  updateInvoiceSettings,
  updateLoginBanner,
  upsertBusinessProfile,
} from "../controllers/businessProfileController.js";
import { requireAdmin, requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import {
  businessProfileSchema,
  updateBrandingSchema,
  updateInvoiceSettingsSchema,
} from "../schemas/businessProfileSchemas.js";

const bannerUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Support all image types: jpg, jpeg, png, webp, svg, gif, avif, bmp, jfif, etc.
    const isImageMime = file.mimetype.startsWith("image/");
    const isImageExt = /\.(jpe?g|png|webp|svg|gif|avif|bmp|tiff|ico|heic|jfif)$/i.test(file.originalname);
    if (isImageMime || isImageExt || file.mimetype === "application/octet-stream") {
      cb(null, true);
    } else {
      cb(new Error("Only image files are supported"));
    }
  },
});

export const businessProfileRoutes = Router();

// Public banner endpoint for login screen
businessProfileRoutes.get("/get-banner", getLoginBanner);

// Authenticated endpoints
businessProfileRoutes.use(requireAuth);
businessProfileRoutes.get("/", getBusinessProfile);
businessProfileRoutes.get("/get-profile", getBusinessProfile);
businessProfileRoutes.put("/", requireAdmin, validate(businessProfileSchema), upsertBusinessProfile);
businessProfileRoutes.put("/update-profile", requireAdmin, validate(businessProfileSchema), upsertBusinessProfile);
businessProfileRoutes.put("/update-branding", requireAdmin, validate(updateBrandingSchema), updateBrandingProfile);
businessProfileRoutes.put(
  "/update-invoice-settings",
  requireAdmin,
  validate(updateInvoiceSettingsSchema),
  updateInvoiceSettings,
);
businessProfileRoutes.post("/update-banner", requireAdmin, bannerUpload.single("image"), updateLoginBanner);


