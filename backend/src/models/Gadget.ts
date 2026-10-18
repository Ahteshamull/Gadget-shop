import { Schema, model, type InferSchemaType } from "mongoose";

const gadgetSchema = new Schema(
  {
    supplierName: { type: String, required: true, trim: true, index: true },
    productName: { type: String, required: true, trim: true, index: true },
    quantity: { type: Number, required: true, min: 1 },
    purchasePrice: { type: Number, required: true, min: 0 },
    minSellingPrice: { type: Number, required: true, min: 0 },
    supplierPhone: { type: String, required: true, trim: true, index: true },
    color: { type: String, required: true, trim: true },
    category: { type: String, default: "General", trim: true, index: true },
    brand: { type: String, default: "Generic", trim: true, index: true },
    barcode: { type: String, default: "", trim: true, index: true },
    warrantyDays: { type: Number, default: 0, min: 0 },
    details: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

export type GadgetDocument = InferSchemaType<typeof gadgetSchema>;
export const GadgetModel = model("Gadget", gadgetSchema);
