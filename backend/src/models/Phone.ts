import { Schema, model, type InferSchemaType } from "mongoose";

const ownershipSchema = new Schema(
  {
    owner: { type: String, default: "" },
    phone: { type: String, default: "" },
    transferDate: { type: Date, default: Date.now },
    note: { type: String, default: "" },
  },
  { _id: false },
);

const phoneSchema = new Schema(
  {
    imei: { type: String, required: true, unique: true, trim: true, index: true },
    brand: { type: String, required: true, trim: true, index: true },
    model: { type: String, required: true, trim: true, index: true },
    variant: { type: String, default: "", trim: true },
    color: { type: String, default: "", trim: true },
    ram: { type: String, default: "", trim: true },
    storage: { type: String, default: "", trim: true },
    purchasePrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    sellerNID: { type: String, default: "", trim: true },
    supplierName: { type: String, default: "", trim: true, index: true },
    supplierPhone: { type: String, default: "", trim: true, index: true },
    buyerName: { type: String, default: "", trim: true },
    buyerPhone: { type: String, default: "", trim: true },
    customerName: { type: String, default: "", trim: true, index: true },
    customerPhone: { type: String, default: "", trim: true, index: true },
    altPhone: { type: String, default: "", trim: true },
    email: { type: String, default: "", trim: true, lowercase: true },
    nid: { type: String, default: "", trim: true },
    address: { type: String, default: "", trim: true },
    invoiceNumber: { type: String, default: "", trim: true, index: true },
    saleDate: { type: Date, default: Date.now, index: true },
    quantity: { type: Number, default: 1, min: 1 },
    discount: { type: Number, default: 0, min: 0 },
    finalPrice: { type: Number, default: 0, min: 0 },
    paymentMethod: { type: String, default: "Cash" },
    salesPerson: { type: String, default: "", trim: true },
    addedBy: { type: String, default: "Admin", trim: true },
    warrantyExpiry: { type: Date, required: true },
    notes: { type: String, default: "" },
    ownership: { type: [ownershipSchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

phoneSchema.index({ brand: 1, model: 1 });

export type PhoneDocument = InferSchemaType<typeof phoneSchema>;
export const PhoneModel = model("Phone", phoneSchema);
