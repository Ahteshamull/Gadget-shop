import type { Gadget, GadgetSale } from "@/lib/gadget-store";
import type { PartnerTransaction, Sale, ShopExpense } from "@/lib/phone-store";

type DatedRecord = {
  createdAt?: string;
  updatedAt?: string;
};

export type BusinessLedgerEntryType =
  | "Partner Investment"
  | "Partner Withdrawal"
  | "Phone Purchase"
  | "Phone Sale"
  | "Gadget Purchase"
  | "Gadget Sale"
  | "Shop Expense";

export type BusinessLedgerEntry = {
  id: string;
  type: BusinessLedgerEntryType;
  date: string;
  timestamp: number;
  description: string;
  source: string;
  cashIn: number;
  cashOut: number;
  profitIn: number;
  profitUsed: number;
  capitalUsed: number;
  runningCash: number;
  runningProfit: number;
  runningCapital: number;
};

export type BusinessAccountingSummary = {
  totalCash: number;
  totalCapital: number;
  availableProfit: number;
  totalInvested: number;
  totalWithdrawn: number;
  productPurchaseCost: number;
  salesRevenue: number;
  grossProfit: number;
  totalExpenses: number;
  expenseFromProfit: number;
  expenseFromCapital: number;
};

type RawLedgerEntry = Omit<
  BusinessLedgerEntry,
  "profitUsed" | "capitalUsed" | "runningCash" | "runningProfit" | "runningCapital"
>;

type BuildBusinessAccountingArgs = {
  partnerTransactions: PartnerTransaction[];
  phoneSales: Sale[];
  gadgets: Gadget[];
  gadgetSales: GadgetSale[];
  expenses: ShopExpense[];
};

const eventPriority: Record<BusinessLedgerEntryType, number> = {
  "Partner Investment": 1,
  "Phone Purchase": 2,
  "Gadget Purchase": 2,
  "Phone Sale": 3,
  "Gadget Sale": 3,
  "Shop Expense": 4,
  "Partner Withdrawal": 5,
};

export function buildBusinessAccounting({
  partnerTransactions,
  phoneSales,
  gadgets,
  gadgetSales,
  expenses,
}: BuildBusinessAccountingArgs): {
  summary: BusinessAccountingSummary;
  ledger: BusinessLedgerEntry[];
} {
  const gadgetById = new Map(gadgets.map((gadget) => [gadget.id, gadget]));
  const rawEntries: RawLedgerEntry[] = [];

  partnerTransactions.forEach((transaction) => {
    const isInvestment = transaction.type === "Investment";
    rawEntries.push({
      id: `partner-${transaction.id}`,
      type: isInvestment ? "Partner Investment" : "Partner Withdrawal",
      date: transaction.date,
      timestamp: safeTimestamp(transaction.date),
      description: `${transaction.partner}${transaction.notes ? ` - ${transaction.notes}` : ""}`,
      source: transaction.partner,
      cashIn: isInvestment ? transaction.amount : 0,
      cashOut: isInvestment ? 0 : transaction.amount,
      profitIn: 0,
    });
  });

  phoneSales.forEach((phone) => {
    const phoneDate = purchaseDate(phone);
    rawEntries.push({
      id: `phone-purchase-${phone.id}`,
      type: "Phone Purchase",
      date: phoneDate,
      timestamp: safeTimestamp(phoneDate),
      description: `${phone.brand} ${phone.model}${phone.imei ? ` (${phone.imei})` : ""}`,
      source: phone.supplierName || "Phone supplier",
      cashIn: 0,
      cashOut: phone.purchasePrice,
      profitIn: 0,
    });

    if (phone.customerName.trim()) {
      const saleProfit = phone.finalPrice - phone.purchasePrice;
      rawEntries.push({
        id: `phone-sale-${phone.id}`,
        type: "Phone Sale",
        date: phone.saleDate,
        timestamp: safeTimestamp(phone.saleDate),
        description: `${phone.brand} ${phone.model} sold to ${phone.customerName}`,
        source: phone.invoiceNumber || phone.customerName,
        cashIn: phone.finalPrice,
        cashOut: 0,
        profitIn: saleProfit,
      });
    }
  });

  gadgets.forEach((gadget) => {
    const date = gadget.createdAt || new Date(0).toISOString();
    rawEntries.push({
      id: `gadget-purchase-${gadget.id}`,
      type: "Gadget Purchase",
      date,
      timestamp: safeTimestamp(date),
      description: `${gadget.productName} x ${gadget.quantity}`,
      source: gadget.supplierName,
      cashIn: 0,
      cashOut: gadget.purchasePrice * gadget.quantity,
      profitIn: 0,
    });
  });

  gadgetSales.forEach((sale) => {
    const gadget = gadgetById.get(sale.gadgetId);
    const purchaseCost = (gadget?.purchasePrice ?? 0) * sale.quantity;
    rawEntries.push({
      id: `gadget-sale-${sale.id}`,
      type: "Gadget Sale",
      date: sale.saleDate,
      timestamp: safeTimestamp(sale.saleDate),
      description: `${sale.productName} x ${sale.quantity} sold to ${sale.customerName}`,
      source: sale.invoiceNumber || sale.customerName,
      cashIn: sale.totalPrice,
      cashOut: 0,
      profitIn: sale.totalPrice - purchaseCost,
    });
  });

  expenses.forEach((expense) => {
    rawEntries.push({
      id: `expense-${expense.id}`,
      type: "Shop Expense",
      date: expense.date,
      timestamp: safeTimestamp(expense.date),
      description: `${expense.category}${expense.notes ? ` - ${expense.notes}` : ""}`,
      source: expense.category,
      cashIn: 0,
      cashOut: expense.amount,
      profitIn: 0,
    });
  });

  let runningCash = 0;
  let runningProfit = 0;
  let runningCapital = 0;
  const summary: BusinessAccountingSummary = {
    totalCash: 0,
    totalCapital: 0,
    availableProfit: 0,
    totalInvested: 0,
    totalWithdrawn: 0,
    productPurchaseCost: 0,
    salesRevenue: 0,
    grossProfit: 0,
    totalExpenses: 0,
    expenseFromProfit: 0,
    expenseFromCapital: 0,
  };

  const ledger = rawEntries
    .sort((a, b) => a.timestamp - b.timestamp || eventPriority[a.type] - eventPriority[b.type])
    .map<BusinessLedgerEntry>((entry) => {
      let profitUsed = 0;
      let capitalUsed = 0;

      runningCash += entry.cashIn - entry.cashOut;

      if (entry.type === "Partner Investment") {
        runningCapital += entry.cashIn;
        summary.totalInvested += entry.cashIn;
      } else if (entry.type === "Partner Withdrawal") {
        capitalUsed = Math.min(entry.cashOut, runningCapital);
        const profitWithdrawal = Math.max(0, entry.cashOut - capitalUsed);
        runningCapital -= capitalUsed;
        runningProfit = Math.max(0, runningProfit - profitWithdrawal);
        summary.totalWithdrawn += entry.cashOut;
      } else if (entry.type === "Phone Purchase" || entry.type === "Gadget Purchase") {
        summary.productPurchaseCost += entry.cashOut;
      } else if (entry.type === "Phone Sale" || entry.type === "Gadget Sale") {
        runningProfit += entry.profitIn;
        summary.salesRevenue += entry.cashIn;
        summary.grossProfit += entry.profitIn;
      } else if (entry.type === "Shop Expense") {
        profitUsed = Math.min(entry.cashOut, Math.max(0, runningProfit));
        capitalUsed = entry.cashOut - profitUsed;
        runningProfit -= profitUsed;
        runningCapital = Math.max(0, runningCapital - capitalUsed);
        summary.totalExpenses += entry.cashOut;
        summary.expenseFromProfit += profitUsed;
        summary.expenseFromCapital += capitalUsed;
      }

      return {
        ...entry,
        profitUsed,
        capitalUsed,
        runningCash,
        runningProfit,
        runningCapital,
      };
    });

  summary.totalCash = runningCash;
  summary.totalCapital = runningCapital;
  summary.availableProfit = runningProfit;

  return { summary, ledger: ledger.reverse() };
}

export function availableCashBeforePurchase(args: BuildBusinessAccountingArgs): number {
  return buildBusinessAccounting(args).summary.totalCash;
}

function purchaseDate(record: Sale): string {
  const dated = record as Sale & DatedRecord;
  return dated.createdAt || record.saleDate || new Date(0).toISOString();
}

function safeTimestamp(value: string): number {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}
