import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BadgeDollarSign,
  Calendar,
  CircleDollarSign,
  FileText,
  History,
  Landmark,
  ReceiptText,
  ShoppingBag,
  Smartphone,
  WalletCards,
} from "lucide-react";
import { AppPagination } from "@/components/ui/pagination";
import { fmt } from "@/lib/phone-ui";
import type { BusinessLedgerRecord } from "./partnerTypes";

type BusinessLedgerTableProps = {
  entries: BusinessLedgerRecord[];
};

type MonthlyLedgerSummary = {
  cashIn: number;
  cashOut: number;
  profitIn: number;
  profitUsed: number;
  capitalUsed: number;
};

type MoneyTone = "in" | "out" | "neutral";

const PAGE_SIZE = 8;

const typeMeta: Record<
  BusinessLedgerRecord["type"],
  {
    icon: ComponentType<{ className?: string }>;
    tile: string;
    label: string;
  }
> = {
  "Partner Investment": {
    icon: Landmark,
    tile: "bg-emerald-500/10 text-emerald-600",
    label: "Investment",
  },
  "Partner Withdrawal": {
    icon: WalletCards,
    tile: "bg-red-500/10 text-red-600",
    label: "Withdrawal",
  },
  "Phone Purchase": {
    icon: Smartphone,
    tile: "bg-blue-500/10 text-blue-600",
    label: "Phone Buy",
  },
  "Phone Sale": {
    icon: BadgeDollarSign,
    tile: "bg-cyan-500/10 text-cyan-600",
    label: "Phone Sell",
  },
  "Gadget Purchase": {
    icon: ShoppingBag,
    tile: "bg-violet-500/10 text-violet-600",
    label: "Gadget Buy",
  },
  "Gadget Sale": {
    icon: CircleDollarSign,
    tile: "bg-teal-500/10 text-teal-600",
    label: "Gadget Sell",
  },
  "Shop Expense": {
    icon: ReceiptText,
    tile: "bg-amber-500/10 text-amber-600",
    label: "Expense",
  },
};

export function BusinessLedgerTable({ entries }: BusinessLedgerTableProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>(() => monthKey(new Date().toISOString()));
  const [currentPage, setCurrentPage] = useState(1);

  const availableMonths = useMemo(() => {
    return Array.from(new Set(entries.map((entry) => monthKey(entry.date)))).filter(Boolean);
  }, [entries]);

  useEffect(() => {
    if (availableMonths.length === 0) return;

    setSelectedMonth((currentMonth) =>
      availableMonths.includes(currentMonth) ? currentMonth : availableMonths[0],
    );
  }, [availableMonths]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth]);

  const monthlyEntries = useMemo(() => {
    return entries.filter((entry) => monthKey(entry.date) === selectedMonth);
  }, [entries, selectedMonth]);

  const monthlySummary = useMemo<MonthlyLedgerSummary>(() => {
    return monthlyEntries.reduce(
      (summary, entry) => ({
        cashIn: summary.cashIn + entry.cashIn,
        cashOut: summary.cashOut + entry.cashOut,
        profitIn: summary.profitIn + entry.profitIn,
        profitUsed: summary.profitUsed + entry.profitUsed,
        capitalUsed: summary.capitalUsed + entry.capitalUsed,
      }),
      { cashIn: 0, cashOut: 0, profitIn: 0, profitUsed: 0, capitalUsed: 0 },
    );
  }, [monthlyEntries]);

  const totalPages = Math.ceil(monthlyEntries.length / PAGE_SIZE);
  const paginatedEntries = monthlyEntries.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="px-4 pb-3 pt-4 sm:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="flex items-center gap-2 font-bold text-foreground">
              <History className="size-4.5 text-primary" />
              Recent Transaction
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Month-wise business ledger with cash, product, profit, expense, and partner flow
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="relative w-full sm:w-[180px]">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="h-9 w-full rounded-md border bg-background pl-9 pr-3 text-xs font-bold text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                aria-label="Select ledger month"
              />
            </label>
            <span className="inline-flex h-9 w-fit items-center rounded-md border bg-background px-3 text-xs font-semibold text-muted-foreground">
              {monthlyEntries.length} entries
            </span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 border-t pt-3 text-xs">
          <InlineSummary label="Cash In" value={monthlySummary.cashIn} tone="in" />
          <InlineSummary label="Cash Out" value={monthlySummary.cashOut} tone="out" />
          <InlineSummary label="Profit" value={monthlySummary.profitIn} tone="in" />
          <InlineSummary
            label="Expense Fund"
            value={monthlySummary.profitUsed + monthlySummary.capitalUsed}
            tone="out"
          />
        </div>
      </div>

      <div className="hidden md:block">
        <table className="w-full text-sm">
          <thead className="border-y bg-background text-[10px] uppercase text-muted-foreground">
            <tr>
              <th className="px-5 py-3 text-left font-bold">Date</th>
              <th className="px-5 py-3 text-left font-bold">Transaction</th>
              <th className="px-5 py-3 text-left font-bold">Paid By</th>
              <th className="px-5 py-3 text-right font-bold">Amount</th>
              <th className="px-5 py-3 text-right font-bold">Balance</th>
              <th className="w-14 px-5 py-3 text-right font-bold" aria-label="Status" />
            </tr>
          </thead>
          <tbody>
            {paginatedEntries.length === 0 && <EmptyRow />}
            {paginatedEntries.map((entry) => (
              <tr key={entry.id} className="border-b transition-colors last:border-b-0 hover:bg-muted/20">
                <td className="whitespace-nowrap px-5 py-4 text-xs font-medium text-muted-foreground">
                  {formatDate(entry.date)}
                </td>
                <td className="px-5 py-4">
                  <TransactionCell entry={entry} />
                </td>
                <td className="px-5 py-4">
                  <div className="text-xs font-bold text-foreground">{entry.source || "Business"}</div>
                  <div className="mt-0.5 text-[10px] text-muted-foreground">{entry.type}</div>
                </td>
                <td className="px-5 py-4 text-right">
                  <SignedAmount entry={entry} />
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="text-xs font-extrabold text-foreground">{fmt(entry.runningCash)}</div>
                  <div className="mt-0.5 text-[10px] text-muted-foreground">
                    P {fmt(entry.runningProfit)} / C {fmt(entry.runningCapital)}
                  </div>
                </td>
                <td className="px-5 py-4 text-right">
                  <StatusIcon tone={entry.cashIn > 0 || entry.profitIn > 0 ? "in" : entry.cashOut > 0 ? "out" : "neutral"} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y md:hidden">
        {paginatedEntries.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            No business ledger entries for this month.
          </div>
        )}
        {paginatedEntries.map((entry) => (
          <div key={entry.id} className="space-y-3 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <TransactionCell entry={entry} />
              <SignedAmount entry={entry} />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/15 px-3 py-2 text-xs">
              <span className="font-semibold text-muted-foreground">{formatDate(entry.date)}</span>
              <span className="font-bold text-foreground">{entry.source || "Business"}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <SmallBalance label="Cash" value={entry.runningCash} />
              <SmallBalance label="Profit" value={entry.runningProfit} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 border-t bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <span className="text-xs text-muted-foreground">
          {monthlyEntries.length > 0
            ? `Showing ${(currentPage - 1) * PAGE_SIZE + 1} to ${Math.min(
                currentPage * PAGE_SIZE,
                monthlyEntries.length,
              )} of ${monthlyEntries.length}`
            : "No entries to show"}
        </span>
        {totalPages > 1 && (
          <AppPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        )}
      </div>
    </section>
  );
}

function TransactionCell({ entry }: { entry: BusinessLedgerRecord }) {
  const meta = typeMeta[entry.type];
  const Icon = meta.icon;

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className={`flex size-8 shrink-0 items-center justify-center rounded-md ${meta.tile}`}>
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-foreground" title={entry.description}>
          {entry.description}
        </div>
        <div className="mt-0.5 text-[11px] font-medium text-muted-foreground">{meta.label}</div>
      </div>
    </div>
  );
}

function SignedAmount({ entry }: { entry: BusinessLedgerRecord }) {
  const rawAmount = entry.cashIn > 0 ? entry.cashIn : entry.cashOut;
  const isPositive = entry.cashIn > 0;
  const amount = rawAmount || entry.profitIn;
  const toneClass = isPositive || entry.profitIn > 0 ? "text-success" : amount > 0 ? "text-destructive" : "text-muted-foreground";
  const sign = isPositive || entry.profitIn > 0 ? "+" : amount > 0 ? "-" : "";

  return (
    <div>
      <div className={`whitespace-nowrap text-sm font-extrabold ${toneClass}`}>
        {amount > 0 ? `${sign} ${fmt(amount)}` : "-"}
      </div>
      <div className="mt-0.5 text-[10px] text-muted-foreground">
        {entry.profitIn > 0
          ? `Profit ${fmt(entry.profitIn)}`
          : entry.capitalUsed > 0
            ? `Capital ${fmt(entry.capitalUsed)}`
            : entry.profitUsed > 0
              ? `Profit used ${fmt(entry.profitUsed)}`
              : "Cash movement"}
      </div>
    </div>
  );
}

function InlineSummary({ label, value, tone }: { label: string; value: number; tone: MoneyTone }) {
  const colorClass = tone === "in" ? "text-success" : tone === "out" ? "text-destructive" : "text-foreground";
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span className="font-semibold">{label}</span>
      <span className={`font-extrabold ${value > 0 ? colorClass : "text-muted-foreground"}`}>
        {fmt(value)}
      </span>
    </span>
  );
}

function StatusIcon({ tone }: { tone: MoneyTone }) {
  const Icon = tone === "in" ? ArrowDownLeft : tone === "out" ? ArrowUpRight : FileText;
  const toneClass =
    tone === "in"
      ? "bg-emerald-500/10 text-emerald-600"
      : tone === "out"
        ? "bg-red-500/10 text-red-600"
        : "bg-muted text-muted-foreground";

  return (
    <span className={`inline-flex size-7 items-center justify-center rounded-md ${toneClass}`}>
      <Icon className="size-3.5" />
    </span>
  );
}

function SmallBalance({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-background px-3 py-2">
      <div className="text-[10px] font-bold uppercase text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-extrabold text-foreground">{fmt(value)}</div>
    </div>
  );
}

function EmptyRow() {
  return (
    <tr>
      <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
        No business ledger entries for this month.
      </td>
    </tr>
  );
}

function monthKey(date: string): string {
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "";
  return `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, "0")}`;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
