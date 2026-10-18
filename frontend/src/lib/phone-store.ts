export type Sale = {
  id: string;
  imei: string;
  brand: string;
  model: string;
  variant: string;
  color: string;
  ram: string;
  storage: string;
  purchasePrice: number;
  sellingPrice: number;
  sellerNID: string;
  supplierName: string;
  supplierPhone: string;
  buyerName: string;
  buyerPhone: string;
  customerName: string;
  customerPhone: string;
  altPhone: string;
  email: string;
  nid: string;
  address: string;
  invoiceNumber: string;
  saleDate: string;
  quantity: number;
  discount: number;
  finalPrice: number;
  paymentMethod: string;
  salesPerson: string;
  addedBy?: string;
  warrantyExpiry: string;
  notes: string;
  ownership: { owner: string; phone: string; transferDate: string; note: string }[];
};

export function profit(s: Sale) {
  return s.finalPrice - s.purchasePrice;
}

export function warrantyStatus(s: Sale) {
  const exp = new Date(s.warrantyExpiry).getTime();
  const now = Date.now();
  const days = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
  return { active: days >= 0, days };
}

export function nextInvoiceNumber() {
  return "INV-TEMP";
}

export type PartnerTransaction = {
  id: string;
  partner: string;
  amount: number;
  type: "Investment" | "Withdrawal";
  date: string;
  notes: string;
};

export type ShopExpense = {
  id: string;
  category: string;
  amount: number;
  date: string;
  notes: string;
};
