import React, { useMemo, useState, useEffect } from "react";
import { Receipt, Search as SearchIcon, User, Eye, Pencil, Trash2 } from "lucide-react";
import { fmt } from "@/lib/phone-ui";
import { StockSale, getAddedByAdmin } from "./salesUtils";
import { AppPagination } from "@/components/ui/pagination";

export interface StockListTableProps {
  filtered: StockSale[];
  q: string;
  setQ: (v: string) => void;
  onView: (item: StockSale) => void;
  onEdit: (item: StockSale) => void;
  onDelete: (item: StockSale) => void;
  currentUserName?: string | null;
}

export function StockListTable({
  filtered,
  q,
  setQ,
  onView,
  onEdit,
  onDelete,
  currentUserName,
}: StockListTableProps) {
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [q]);

  const paginatedList = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  return (
    <div className="mt-2 bg-card rounded-2xl border overflow-hidden flex-1 flex flex-col min-h-0 shadow-xs">
      <div className="px-4 py-3.5 border-b flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 shrink-0">
        <h3 className="font-medium flex items-center gap-2">
          <Receipt className="size-4 text-primary" /> Stock List
        </h3>
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search IMEI, model, brand, seller, added by..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50/90 dark:bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary hover:border-primary/50 dark:hover:border-primary/50 transition-all cursor-text caret-primary"
          />
        </div>
        <span className="text-xs text-muted-foreground">{filtered.length} item(s)</span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto">
        <table className="w-full min-w-[1000px] text-sm">
          <thead className="bg-muted/95 backdrop-blur-sm text-xs uppercase text-muted-foreground sticky top-0 z-10 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]">
            <tr>
              <th className="p-3 text-left">IMEI</th>
              <th className="p-3 text-left">Brand</th>
              <th className="p-3 text-left">Model</th>
              <th className="p-3 text-left">Seller</th>
              <th className="p-3 text-left">Added By</th>
              <th className="p-3 text-right">Purchase</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="p-10 text-center text-muted-foreground">
                  No stock yet. Click "Add Phone Stock" to register your first phone.
                </td>
              </tr>
            )}
            {paginatedList.map((r) => {
              return (
                <tr
                  key={r.id}
                  onClick={() => onView(r)}
                  className="border-t hover:bg-accent/20 cursor-pointer transition-colors"
                >
                  <td className="p-3 font-mono text-xs font-semibold text-foreground">
                    {r.imei}
                  </td>
                  <td className="p-3">
                    <span className="font-bold text-foreground text-sm">{r.brand}</span>
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-foreground">{r.model}</div>
                    {(r.ram || r.storage || r.color) && (
                      <div className="text-xs text-muted-foreground font-medium mt-0.5">
                        {[r.ram, r.storage, r.color].filter(Boolean).join(" · ")}
                      </div>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-foreground">{r.supplierName || "—"}</div>
                    {r.supplierPhone && (
                      <div className="text-xs text-muted-foreground font-medium mt-0.5">
                        {r.supplierPhone}
                      </div>
                    )}
                  </td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                      <User className="size-3" />
                      {getAddedByAdmin(r, currentUserName)}
                    </span>
                  </td>
                  <td className="p-3 text-right font-bold text-foreground">
                    {fmt(r.purchasePrice)}
                  </td>
                  <td className="p-3 text-center">
                    <div className="inline-flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onView(r);
                        }}
                        className="p-1.5 rounded-full border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-xs hover:border-primary/30"
                        title="View device specifications"
                      >
                        <Eye className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(r);
                        }}
                        className="p-1.5 rounded-full border border-border hover:bg-muted text-foreground transition-all cursor-pointer shadow-xs hover:border-primary/30"
                        title="Edit device"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(r);
                        }}
                        className="p-1.5 rounded-full border border-destructive/30 text-destructive hover:bg-destructive/10 transition-all cursor-pointer shadow-xs"
                        title="Delete from stock"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <div className="px-5 py-3 border-t bg-muted/20 text-xs text-muted-foreground flex flex-col sm:flex-row justify-between items-center gap-3 select-none shrink-0 mt-auto">
          <span>
            Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} items
          </span>
          {totalPages > 1 && (
            <AppPagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          )}
        </div>
      )}
    </div>
  );
}
