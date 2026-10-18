import type { PartnerTransaction, ShopExpense } from "@/lib/phone-store";
import type { BusinessAccountingSummary, BusinessLedgerEntry } from "@/lib/business-accounting";

export type PartnerTab = "overview" | "ledger" | "expenses";
export type ProfitSplitMode = "equal" | "proportional";
export type PartnerTransactionType = "Investment" | "Withdrawal";
export type ExpenseCategory = "Rent" | "Salary" | "Internet" | "Electricity" | "Others";

export type PartnerBalance = {
  invest: number;
  withdraw: number;
  net: number;
  share: number;
};

export type PartnerBalances = {
  partners: Record<string, PartnerBalance>;
  total: number;
};

export type SalesMetrics = {
  revenue: number;
  grossProfit: number;
  phoneSales: number;
  gadgetSales: number;
};

export type ExpenseMetrics = {
  rent: number;
  salary: number;
  internet: number;
  electricity: number;
  others: number;
  total: number;
};

export type ChartDatum = {
  name: string;
  value: number;
};

export type PartnerTransactionForm = {
  partner: string;
  amount: number;
  type: PartnerTransactionType;
  date: string;
  notes: string;
};

export type ExpenseRows = Record<ExpenseCategory, { amount: number; notes: string }>;

export type MonthlyExpenseItem = ShopExpense & {
  timestamp: number;
};

export type MonthlyExpenseGroup = {
  key: string;
  label: string;
  total: number;
  sortTime: number;
  items: MonthlyExpenseItem[];
};

export type PartnerTransactionRecord = PartnerTransaction;
export type ShopExpenseRecord = ShopExpense;
export type BusinessSummary = BusinessAccountingSummary;
export type BusinessLedgerRecord = BusinessLedgerEntry;
