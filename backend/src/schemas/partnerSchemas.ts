import { z } from "zod";

export const listQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(1000).optional(),
    search: z.string().trim().optional(),
  }),
});

export const partnerTransactionSchema = z.object({
  body: z.object({
    partner: z.string().trim().min(1),
    amount: z.coerce.number().min(1),
    type: z.enum(["Investment", "Withdrawal"]),
    date: z.coerce.date(),
    notes: z.string().optional().default(""),
  }),
});

export const expenseSchema = z.object({
  body: z.object({
    category: z.enum(["Rent", "Salary", "Internet", "Electricity", "Others"]),
    amount: z.coerce.number().min(1),
    date: z.coerce.date(),
    notes: z.string().optional().default(""),
  }),
});

export const idParamSchema = z.object({ params: z.object({ id: z.string().min(1) }) });
