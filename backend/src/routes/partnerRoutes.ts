import { Router } from "express";
import {
  createExpense,
  createPartnerTransaction,
  deleteExpense,
  deletePartnerTransaction,
  listExpenses,
  listPartnerTransactions,
} from "../controllers/partnerController.js";
import { requireAdmin, requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { expenseSchema, idParamSchema, listQuerySchema, partnerTransactionSchema } from "../schemas/partnerSchemas.js";

export const partnerRoutes = Router();
export const expenseRoutes = Router();

partnerRoutes.use(requireAuth);
partnerRoutes.get("/transactions", validate(listQuerySchema), listPartnerTransactions);
partnerRoutes.post("/transactions", requireAdmin, validate(partnerTransactionSchema), createPartnerTransaction);
partnerRoutes.delete("/transactions/:id", requireAdmin, validate(idParamSchema), deletePartnerTransaction);

expenseRoutes.use(requireAuth);
expenseRoutes.get("/", validate(listQuerySchema), listExpenses);
expenseRoutes.post("/", requireAdmin, validate(expenseSchema), createExpense);
expenseRoutes.delete("/:id", requireAdmin, validate(idParamSchema), deleteExpense);
