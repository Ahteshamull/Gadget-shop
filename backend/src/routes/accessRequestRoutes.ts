import { Router } from "express";
import { decideAccessRequest, listAccessRequests } from "../controllers/accessRequestController.js";
import { requireAdmin, requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { accessRequestDecisionSchema } from "../schemas/authSchemas.js";

export const accessRequestRoutes = Router();

accessRequestRoutes.use(requireAuth, requireAdmin);
accessRequestRoutes.get("/", listAccessRequests);
accessRequestRoutes.patch("/:id", validate(accessRequestDecisionSchema), decideAccessRequest);
