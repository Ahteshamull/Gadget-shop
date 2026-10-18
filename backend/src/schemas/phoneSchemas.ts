import { z } from "zod";

export const listQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(1000).optional(),
    search: z.string().trim().optional(),
  }),
});

const ownershipSchema = z.object({
  owner: z.string().default(""),
  phone: z.string().default(""),
  transferDate: z.coerce.date().default(() => new Date()),
  note: z.string().default(""),
});

export const phoneBodySchema = z.object({
  imei: z.string().trim().min(5),
  brand: z.string().trim().min(1),
  model: z.string().trim().min(1),
  variant: z.string().trim().optional().default(""),
  color: z.string().trim().optional().default(""),
  ram: z.string().trim().optional().default(""),
  storage: z.string().trim().optional().default(""),
  purchasePrice: z.coerce.number().min(0),
  sellingPrice: z.coerce.number().min(0),
  sellerNID: z.string().trim().optional().default(""),
  supplierName: z.string().trim().optional().default(""),
  supplierPhone: z.string().trim().optional().default(""),
  buyerName: z.string().trim().optional().default(""),
  buyerPhone: z.string().trim().optional().default(""),
  customerName: z.string().trim().optional().default(""),
  customerPhone: z.string().trim().optional().default(""),
  altPhone: z.string().trim().optional().default(""),
  email: z.string().trim().optional().default(""),
  nid: z.string().trim().optional().default(""),
  address: z.string().trim().optional().default(""),
  invoiceNumber: z.string().trim().optional().default(""),
  saleDate: z.coerce.date().optional().default(() => new Date()),
  quantity: z.coerce.number().int().min(1).optional().default(1),
  discount: z.coerce.number().min(0).optional().default(0),
  finalPrice: z.coerce.number().min(0).optional().default(0),
  paymentMethod: z.string().trim().optional().default("Cash"),
  salesPerson: z.string().trim().optional().default(""),
  addedBy: z.string().trim().optional().default("Admin"),
  warrantyExpiry: z.coerce.date(),
  notes: z.string().optional().default(""),
  ownership: z.array(ownershipSchema).optional().default([]),
});

export const createPhoneSchema = z.object({ body: phoneBodySchema });
export const updatePhoneSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: phoneBodySchema.partial(),
});
export const idParamSchema = z.object({ params: z.object({ id: z.string().min(1) }) });
