import { Schema, model, type InferSchemaType } from "mongoose";

const expenseSchema = new Schema(
  {
    category: {
      type: String,
      enum: ["Rent", "Salary", "Internet", "Electricity", "Others"],
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 1 },
    date: { type: Date, required: true, index: true },
    notes: { type: String, default: "" },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

export type ExpenseDocument = InferSchemaType<typeof expenseSchema>;
export const ExpenseModel = model("Expense", expenseSchema);
