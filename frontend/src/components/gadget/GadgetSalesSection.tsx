import React, { useMemo, useState, useEffect } from "react";
import { FileText, Search, Printer } from "lucide-react";
import type { GadgetSale } from "@/lib/gadget-store";
import { fmt } from "@/lib/phone-ui";
import { AppPagination } from "@/components/ui/pagination";

export interface GadgetSalesSectionProps {
  filteredSales: GadgetSale[];
  salesQ: string;
  setSalesQ: (q: string) => void;
  onViewMemo: (sale: GadgetSale) => void;
}

export function GadgetSalesSection({
  filteredSales,
  salesQ,
  setSalesQ,
  onViewMemo,
}: GadgetSalesSectionProps) {
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
    <div className="bg-card rounded-xl border overflow-hidden shadow-sm">
      {/* List Toolbar */}
      <div className="px-5 py-4 border-b flex flex-wrap items-center justify-between gap-4 bg-muted/20">
        <h3 className="font-semibold flex items-center gap-2">
          <FileText className="size-4 text-primary" /> Sales Transactions
        </h3>
        <div className="relative flex-1 max-w-sm">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={salesQ}
            onChange={(e) => setSalesQ(e.target.value)}
            placeholder="Search customer, invoice, product..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50/90 dark:bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary hover:border-primary/50 dark:hover:border-primary/50 transition-all cursor-text caret-primary"
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {filteredSales.length} sales found
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[940px] text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3 text-left">Invoice No</th>
              <th className="p-3 text-left">Product Name</th>
              <th className="p-3 text-left">Customer</th>
              <th className="p-3 text-left">Sale Date</th>
              <th className="p-3 text-center">Qty Sold</th>
              <th className="p-3 text-right">Unit Price</th>
              <th className="p-3 text-right">Total Price</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredSales.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="p-10 text-center text-muted-foreground"
                >
                  No sales records match this query.
                </td>
              </tr>
            )}
            {paginatedSales.map((sale) => (
              <tr
                key={sale.id}
                onClick={() => onViewMemo(sale)}
                className="hover:bg-accent/20 cursor-pointer transition-colors"
              >
                <td className="p-3 font-mono font-semibold text-primary">
                  {sale.invoiceNumber}
                </td>
                <td className="p-3 font-medium text-foreground">
                  {sale.productName}
                </td>
                <td className="p-3">
                  <div className="font-semibold text-foreground">
                    {sale.customerName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {sale.customerPhone}
                  </div>
                </td>
                <td className="p-3 text-xs">
                  {new Date(sale.saleDate).toLocaleDateString()}
                </td>
                <td className="p-3 text-center font-bold text-foreground">
                  {sale.quantity}
                </td>
                <td className="p-3 text-right font-medium text-muted-foreground">
                  {fmt(sale.sellingPrice)}
                </td>
                <td className="p-3 text-right font-bold text-foreground">
                  {fmt(sale.totalPrice)}
                </td>
                <td className="p-3 text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewMemo(sale);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border rounded-md hover:bg-accent font-semibold transition-all text-primary border-primary/25 cursor-pointer"
                  >
                    <Printer className="size-3.5" /> Memo
                  </button>
                </td>
              </tr>
            ))}
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
