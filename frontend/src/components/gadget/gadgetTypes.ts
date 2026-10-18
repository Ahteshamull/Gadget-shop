export interface AddGadgetFormData {
  supplierName: string;
  productName: string;
  quantity: number;
  purchasePrice: number;
  minSellingPrice: number;
  supplierPhone: string;
  color: string;
  details: string;
}

export interface SellGadgetFormData {
  customerName: string;
  customerPhone: string;
  quantity: number;
  sellingPrice: number;
  paymentMethod: string;
  notes: string;
  warrantyDays: number;
}

export interface CashIssueData {
  availableCash: number;
  purchaseCost: number;
  shortage: number;
  quantity: number;
  unitPrice: number;
  productName: string;
}

export interface DeleteConfirmData {
  id: string;
  name: string;
}
