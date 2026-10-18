import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const accessRequestSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    message: { type: String, default: "", trim: true },
    requestedRole: { type: String, enum: ["admin", "staff"], default: "admin", index: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
    decidedBy: { type: Schema.Types.ObjectId, ref: "User" },
    decidedAt: { type: Date },
    decisionNote: { type: String, default: "", trim: true },
    createdUserId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

accessRequestSchema.index({ email: 1, status: 1 });
accessRequestSchema.index({ createdAt: -1 });

export type AccessRequestDocument = InferSchemaType<typeof accessRequestSchema> & {
  _id: Types.ObjectId;
};

export const AccessRequestModel = model("AccessRequest", accessRequestSchema);
