import { z } from "zod";

export const listQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(1000).optional(),
    search: z.string().trim().optional(),
  }),
});

export const gadgetBodySchema = z.object({
  supplierName: z.string().trim().min(1),
  productName: z.string().trim().min(1),
  quantity: z.coerce.number().int().min(1),
  purchasePrice: z.coerce.number().min(0),
  minSellingPrice: z.coerce.number().min(0),
  supplierPhone: z.string().trim().min(1),
  color: z.string().trim().min(1),
  details: z.string().optional().default(""),
  createdAt: z.coerce.date().optional().default(() => new Date()),
});

export const gadgetSaleBodySchema = z.object({
  gadgetId: z.string().min(1),
  productName: z.string().trim().min(1),
  customerName: z.string().trim().min(1),
  customerPhone: z.string().trim().min(1),
  saleDate: z.coerce.date().optional().default(() => new Date()),
  quantity: z.coerce.number().int().min(1),
  sellingPrice: z.coerce.number().min(0),
  totalPrice: z.coerce.number().min(0).optional(),
  paymentMethod: z.string().trim().optional().default("Cash"),
  invoiceNumber: z.string().trim().optional().default(""),
  notes: z.string().optional().default(""),
  salesPerson: z.string().optional().default("Admin"),
  warrantyDays: z.coerce.number().int().min(0).optional(),
  warrantyExpiry: z.coerce.date().optional(),
});

export const createGadgetSchema = z.object({ body: gadgetBodySchema });
export const updateGadgetSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: gadgetBodySchema.partial(),
});
export const createGadgetSaleSchema = z.object({ body: gadgetSaleBodySchema });
export const gadgetIdParamSchema = z.object({ params: z.object({ id: z.string().min(1) }) });
