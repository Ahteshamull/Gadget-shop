import React, { useMemo, useState, useEffect } from "react";
import { FileText, Search, Printer, Eye, Smartphone, TrendingUp } from "lucide-react";
import type { Sale } from "@/lib/phone-store";
import { fmt } from "@/lib/phone-ui";
import { AppPagination } from "@/components/ui/pagination";

export interface PhoneSalesSectionProps {
  sales: Sale[];
  salesQ: string;
  setSalesQ: (v: string) => void;
  onViewMemo: (sale: Sale) => void;
  onSelect: (sale: Sale) => void;
}

export function PhoneSalesSection({
  sales,
  salesQ,
  setSalesQ,
  onViewMemo,
  onSelect,
}: PhoneSalesSectionProps) {
  const filteredSales = useMemo(() => {
    const q = salesQ.trim().toLowerCase();
    const sold = sales.filter((s) => !!s.customerName);
    if (!q) return sold;
    return sold.filter(
      (s) =>
        s.invoiceNumber?.toLowerCase().includes(q) ||
        s.customerName?.toLowerCase().includes(q) ||
        s.customerPhone?.toLowerCase().includes(q) ||
        s.imei?.toLowerCase().includes(q) ||
        s.brand?.toLowerCase().includes(q) ||
        s.model?.toLowerCase().includes(q) ||
        s.color?.toLowerCase().includes(q),
    );
  }, [sales, salesQ]);

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(filteredSales.length / PAGE_SIZE));
  const paginatedSales = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredSales.slice(start, start + PAGE_SIZE);
  }, [filteredSales, page]);

  useEffect(() => {
    setPage(1);
  }, [salesQ]);

  return (
    <div className="bg-card rounded-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-xs">
      {/* List Toolbar */}
      <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-4 bg-muted/20">
        <h3 className="font-bold text-sm flex items-center gap-2 text-foreground">
          <FileText className="size-4 text-primary" /> Phone Sales Records
        </h3>
        <div className="relative flex-1 max-w-sm">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={salesQ}
            onChange={(e) => setSalesQ(e.target.value)}
            placeholder="Search invoice, customer, IMEI, model..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/90 dark:bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary hover:border-primary/50 dark:hover:border-primary/50 transition-all placeholder:text-muted-foreground/60 cursor-text caret-primary"
          />
        </div>
        <span className="text-xs font-semibold text-muted-foreground">
          {filteredSales.length} sales found
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1020px] text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3 text-left font-bold">Invoice No</th>
              <th className="p-3 text-left font-bold">Brand</th>
              <th className="p-3 text-left font-bold">Model & IMEI</th>
              <th className="p-3 text-left font-bold">Customer Details</th>
              <th className="p-3 text-left font-bold">Sale Date</th>
              <th className="p-3 text-right font-bold">Purchase</th>
              <th className="p-3 text-right font-bold">Sold For</th>
              <th className="p-3 text-right font-bold">Profit</th>
              <th className="p-3 text-center font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
            {filteredSales.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="p-12 text-center text-sm text-muted-foreground"
                >
                  No phone sales records found.
                </td>
              </tr>
            )}
            {paginatedSales.map((s) => {
              const profit = s.finalPrice - s.purchasePrice;

              return (
                <tr
                  key={s.id}
                  onClick={() => onSelect(s)}
                  className="hover:bg-accent/30 cursor-pointer transition-colors"
                >
                  {/* Invoice No */}
                  <td className="p-3 font-mono text-xs font-extrabold text-primary">
                    {s.invoiceNumber || "INV-TEMP"}
                  </td>

                  {/* Brand */}
                  <td className="p-3 font-extrabold text-foreground">
                    {s.brand || "—"}
                  </td>

                  {/* Model & IMEI */}
                  <td className="p-3">
                    <div className="font-bold text-foreground">
                      {s.model || "—"}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-[11px] bg-muted/60 px-1.5 py-0.5 rounded">
                        {s.imei || "—"}
                      </span>
                      {s.color && <span>• {s.color}</span>}
                    </div>
                  </td>

                  {/* Customer */}
                  <td className="p-3">
                    <div className="font-bold text-foreground">
                      {s.customerName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {s.customerPhone || "—"}
                    </div>
                  </td>

                  {/* Sale Date */}
                  <td className="p-3 text-xs text-muted-foreground">
                    {new Date(s.saleDate).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>

                  {/* Purchase */}
                  <td className="p-3 text-right font-medium text-muted-foreground text-xs">
                    {fmt(s.purchasePrice)}
                  </td>

                  {/* Sold For */}
                  <td className="p-3 text-right font-black text-foreground">
                    {fmt(s.finalPrice)}
                  </td>

                  {/* Profit */}
                  <td className="p-3 text-right">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-black ${
                        profit >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-destructive"
                      }`}
                    >
                      <TrendingUp className="size-3" />
                      {profit >= 0 ? `+${fmt(profit)}` : fmt(profit)}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="p-3 text-center">
                    <div
                      className="inline-flex items-center gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => onViewMemo(s)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-primary/25 rounded-lg hover:bg-accent font-semibold transition-all text-primary cursor-pointer shadow-2xs"
                        title="Print Customer Memo"
                      >
                        <Printer className="size-3.5" /> Memo
                      </button>
                      <button
                        onClick={() => onSelect(s)}
                        className="p-1 rounded-lg border hover:bg-accent text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                        title="View Details"
                      >
                        <Eye className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {filteredSales.length > 0 && (
        <div className="border-t px-5 py-3 bg-muted/20 text-xs text-muted-foreground flex flex-col sm:flex-row justify-between items-center gap-3 select-none shrink-0 mt-auto">
          <span>
            Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filteredSales.length)} of {filteredSales.length} items
          </span>
          <AppPagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
