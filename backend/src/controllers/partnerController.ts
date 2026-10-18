import { ExpenseModel } from "../models/Expense.js";
import { PartnerTransactionModel } from "../models/PartnerTransaction.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendCreated, sendMessage, sendPaginated } from "../utils/apiResponse.js";
import { findPaginated, type ListQuery } from "../utils/pagination.js";

export const listPartnerTransactions = asyncHandler(async (req, res) => {
  const query = req.query as ListQuery;
  const search = query.search?.trim();
  const filter = search
    ? {
        $or: [
          { partner: new RegExp(search, "i") },
          { type: new RegExp(search, "i") },
          { notes: new RegExp(search, "i") },
        ],
      }
    : {};
  const result = await findPaginated(PartnerTransactionModel, filter, { date: -1 }, query);
  return sendPaginated(res, result.data, result.meta);
});

export const createPartnerTransaction = asyncHandler(async (req, res) => {
  const transaction = await PartnerTransactionModel.create(req.body);
  return sendCreated(res, "Capital transaction logged successfully", transaction.toJSON());
});

export const deletePartnerTransaction = asyncHandler(async (req, res) => {
  const deleted = await PartnerTransactionModel.findByIdAndDelete(req.params.id);
  if (!deleted) throw new AppError("Partner transaction record was not found", 404, "PARTNER_TRANSACTION_NOT_FOUND");
  return sendMessage(res, "Transaction deleted successfully");
});

export const listExpenses = asyncHandler(async (req, res) => {
  const query = req.query as ListQuery;
  const search = query.search?.trim();
  const filter = search
    ? {
        $or: [
          { category: new RegExp(search, "i") },
          { notes: new RegExp(search, "i") },
        ],
      }
    : {};
  const result = await findPaginated(ExpenseModel, filter, { date: -1 }, query);
  return sendPaginated(res, result.data, result.meta);
});

export const createExpense = asyncHandler(async (req, res) => {
  const expense = await ExpenseModel.create(req.body);
  return sendCreated(res, "Shop expense logged successfully", expense.toJSON());
});

export const deleteExpense = asyncHandler(async (req, res) => {
  const deleted = await ExpenseModel.findByIdAndDelete(req.params.id);
  if (!deleted) throw new AppError("Shop expense record was not found", 404, "SHOP_EXPENSE_NOT_FOUND");
  return sendMessage(res, "Expense deleted successfully");
});
