export type Gadget = {
  id: string;
  supplierName: string;
  productName: string;
  quantity: number;
  purchasePrice: number;
  minSellingPrice: number;
  supplierPhone: string;
  color: string;
  details?: string;
  createdAt: string;
};

export type GadgetSale = {
  id: string;
  gadgetId: string;
  productName: string;
  customerName: string;
  customerPhone: string;
  saleDate: string;
  quantity: number;
  sellingPrice: number;
  totalPrice: number;
  paymentMethod: string;
  invoiceNumber: string;
  notes?: string;
  salesPerson?: string;
  warrantyDays?: number;
  warrantyExpiry?: string;
};

export function getGadgetSoldQuantity(gadgetId: string, sales: GadgetSale[]): number {
  return sales
    .filter((s) => s.gadgetId === gadgetId)
    .reduce((sum, s) => sum + s.quantity, 0);
}

export function getGadgetAvailableQuantity(gadget: Gadget, sales: GadgetSale[]): number {
  const sold = getGadgetSoldQuantity(gadget.id, sales);
  return Math.max(0, gadget.quantity - sold);
}
