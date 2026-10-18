import { Schema, model, type InferSchemaType } from "mongoose";

const ownerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ["Owner", "Partner"], required: true },
    share: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false },
);

const businessProfileSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "default", index: true },
    businessType: { type: String, enum: ["single", "multiple"], default: "single", required: true },
    owners: { type: [ownerSchema], default: [] },
    configuredBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    shopName: { type: String, default: "Gadget Shop", trim: true },
    shopTagline: { type: String, default: "SMART GADGETS & POS", trim: true },
    shopLogoUrl: { type: String, default: "" },
    loginHeadline: { type: String, default: "Track every gadget.\nSell with speed.", trim: true },
    loginDescription: { type: String, default: "Manage smart accessories, inventory, warranties, and sales invoices.", trim: true },
    loginFooterText: { type: String, default: "Gadget POS Management System", trim: true },
    loginBannerUrl: { type: String, default: "" },

    // Invoice & Memo Configuration
    shopAddress: { type: String, default: "", trim: true },
    shopPhone: { type: String, default: "", trim: true },
    shopEmail: { type: String, default: "", trim: true },
    shopWebsite: { type: String, default: "", trim: true },
    invoiceTitle: { type: String, default: "SALES INVOICE", trim: true },
    invoiceTerms: {
      type: [String],
      default: [
        "1 Year official warranty free of cost only for new devices.",
        "10 days instant replacement guarantee for hardware issues on pre-owned devices.",
        "Purchase product sell or exchange within 10 days: 25% will be reduced from recent price.",
        "Apple warranty may take around 6 to 12 weeks depending on customs & flights.",
        "Cosmetic dent, physical damage, liquid damage, electric shock, software bugs will not receive replacement or warranty.",
        "Two years service warranty without parts.",
        "No warranty if physical damage, display broken, bending, scratch, dent, burn, electric shock, liquid damage or root is found.",
        "Before leaving shop, kindly check product properly. Outside repair, scratch or waterproof issues will not be accepted.",
        "USA & CANADA region smartphones can experience blacklist or update delay. Warranty covers hardware only. No replacement for blacklisted issues.",
      ],
    },
    invoiceFooterNote: { type: String, default: "", trim: true },
    showWatermark: { type: Boolean, default: true },
    showPaidStamp: { type: Boolean, default: true },
    showBarcode: { type: Boolean, default: true },
    showQrCode: { type: Boolean, default: true },
    showSignatures: { type: Boolean, default: true },
    showAmountInWords: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

export type BusinessProfileDocument = InferSchemaType<typeof businessProfileSchema>;
export const BusinessProfileModel = model("BusinessProfile", businessProfileSchema);

