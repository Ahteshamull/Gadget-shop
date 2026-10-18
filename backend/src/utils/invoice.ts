import { CounterModel } from "../models/Counter.js";

function makeInvoice(prefix: string, sequence: number): string {
  return `${prefix}-${new Date().getFullYear()}-${String(sequence).padStart(5, "0")}`;
}

async function nextSequence(key: string): Promise<number> {
  const counter = await CounterModel.findOneAndUpdate(
    { key },
    { $inc: { sequence: 1 } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  ).lean();
  return counter?.sequence ?? 1;
}

export async function nextPhoneInvoiceNumber(): Promise<string> {
  return makeInvoice("INV", await nextSequence("phone_invoice"));
}

export async function nextGadgetInvoiceNumber(): Promise<string> {
  return makeInvoice("G-INV", await nextSequence("gadget_invoice"));
}
