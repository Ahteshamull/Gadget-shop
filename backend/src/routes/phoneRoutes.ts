import { Router } from "express";
import { createPhone, deletePhone, listPhones, updatePhone } from "../controllers/phoneController.js";
import { requireAdmin, requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { createPhoneSchema, idParamSchema, listQuerySchema, updatePhoneSchema } from "../schemas/phoneSchemas.js";

export const phoneRoutes = Router();

phoneRoutes.use(requireAuth);
phoneRoutes.get("/", validate(listQuerySchema), listPhones);
phoneRoutes.post("/", requireAdmin, validate(createPhoneSchema), createPhone);
phoneRoutes.put("/:id", requireAdmin, validate(updatePhoneSchema), updatePhone);
phoneRoutes.delete("/:id", requireAdmin, validate(idParamSchema), deletePhone);
