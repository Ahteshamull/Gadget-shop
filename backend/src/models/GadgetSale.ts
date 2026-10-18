import { Schema, model, Types, type InferSchemaType } from "mongoose";

const gadgetSaleSchema = new Schema(
  {
    gadgetId: { type: Schema.Types.ObjectId, ref: "Gadget", required: true, index: true },
    productName: { type: String, required: true, trim: true, index: true },
    customerName: { type: String, required: true, trim: true, index: true },
    customerPhone: { type: String, required: true, trim: true, index: true },
    saleDate: { type: Date, default: Date.now, index: true },
    quantity: { type: Number, required: true, min: 1 },
    sellingPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, default: "Cash" },
    invoiceNumber: { type: String, required: true, unique: true, trim: true, index: true },
    notes: { type: String, default: "" },
    salesPerson: { type: String, default: "" },
    warrantyDays: { type: Number, min: 0 },
    warrantyExpiry: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        if (ret.gadgetId instanceof Types.ObjectId) ret.gadgetId = ret.gadgetId.toString();
        return ret;
      },
    },
    toObject: { virtuals: true },
  },
);

export type GadgetSaleDocument = InferSchemaType<typeof gadgetSaleSchema>;
export const GadgetSaleModel = model("GadgetSale", gadgetSaleSchema);
