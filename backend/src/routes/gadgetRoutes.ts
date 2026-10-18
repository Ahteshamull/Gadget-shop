import { Router } from "express";
import {
  createGadget,
  createGadgetSale,
  deleteGadget,
  listGadgets,
  listGadgetSales,
  updateGadget,
} from "../controllers/gadgetController.js";
import { requireAdmin, requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import {
  createGadgetSaleSchema,
  createGadgetSchema,
  gadgetIdParamSchema,
  listQuerySchema,
  updateGadgetSchema,
} from "../schemas/gadgetSchemas.js";

export const gadgetRoutes = Router();
export const gadgetSaleRoutes = Router();

gadgetRoutes.use(requireAuth);
gadgetRoutes.get("/", validate(listQuerySchema), listGadgets);
gadgetRoutes.post("/", requireAdmin, validate(createGadgetSchema), createGadget);
gadgetRoutes.put("/:id", requireAdmin, validate(updateGadgetSchema), updateGadget);
gadgetRoutes.delete("/:id", requireAdmin, validate(gadgetIdParamSchema), deleteGadget);

gadgetSaleRoutes.use(requireAuth);
gadgetSaleRoutes.get("/", validate(listQuerySchema), listGadgetSales);
gadgetSaleRoutes.post("/", requireAdmin, validate(createGadgetSaleSchema), createGadgetSale);
