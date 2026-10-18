import { Schema, model, type InferSchemaType } from "mongoose";

const counterSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true, index: true },
    sequence: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true },
);

export type CounterDocument = InferSchemaType<typeof counterSchema>;
export const CounterModel = model("Counter", counterSchema);
