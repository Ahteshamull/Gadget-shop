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
gadgetRoutes.get("/get-all-gadgets", validate(listQuerySchema), listGadgets);
gadgetRoutes.get("/", validate(listQuerySchema), listGadgets);

gadgetRoutes.post("/create-gadget", requireAdmin, validate(createGadgetSchema), createGadget);
gadgetRoutes.post("/", requireAdmin, validate(createGadgetSchema), createGadget);

gadgetRoutes.put("/update-gadget/:id", requireAdmin, validate(updateGadgetSchema), updateGadget);
gadgetRoutes.put("/:id", requireAdmin, validate(updateGadgetSchema), updateGadget);

gadgetRoutes.delete("/delete-gadget/:id", requireAdmin, validate(gadgetIdParamSchema), deleteGadget);
gadgetRoutes.delete("/:id", requireAdmin, validate(gadgetIdParamSchema), deleteGadget);

gadgetSaleRoutes.use(requireAuth);
gadgetSaleRoutes.get("/get-all-gadget-sales", validate(listQuerySchema), listGadgetSales);
gadgetSaleRoutes.get("/", validate(listQuerySchema), listGadgetSales);

gadgetSaleRoutes.post("/create-gadget-sale", requireAdmin, validate(createGadgetSaleSchema), createGadgetSale);
gadgetSaleRoutes.post("/", requireAdmin, validate(createGadgetSaleSchema), createGadgetSale);
