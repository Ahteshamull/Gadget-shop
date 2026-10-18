import { Schema, model, type InferSchemaType } from "mongoose";

const partnerTransactionSchema = new Schema(
  {
    partner: { type: String, required: true, trim: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    type: { type: String, enum: ["Investment", "Withdrawal"], required: true, index: true },
    date: { type: Date, required: true, index: true },
    notes: { type: String, default: "" },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

export type PartnerTransactionDocument = InferSchemaType<typeof partnerTransactionSchema>;
export const PartnerTransactionModel = model("PartnerTransaction", partnerTransactionSchema);
