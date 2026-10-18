import React, { useMemo, useState, useEffect } from "react";
import {
  Boxes,
  Search,
  X,
  Eye,
  ShoppingCart,
  Trash2,
  TrendingUp,
  User,
} from "lucide-react";
import {
  getGadgetSoldQuantity,
  getGadgetAvailableQuantity,
  type Gadget,
  type GadgetSale,
} from "@/lib/gadget-store";
import { fmt } from "@/lib/phone-ui";
import { AppPagination } from "@/components/ui/pagination";

export interface GadgetInventorySectionProps {
  filteredGadgets: Gadget[];
  sales: GadgetSale[];
  q: string;
  setQ: (v: string) => void;
  inventoryView: "grid" | "table";
  isStaff: boolean;
  onOpenDetail: (gadget: Gadget) => void;
  onOpenSell: (gadget: Gadget) => void;
  onDelete: (id: string, name: string) => void;
}

export function GadgetInventorySection({
  filteredGadgets,
  sales,
  q,
  setQ,
  inventoryView,
  isStaff,
  onOpenDetail,
  onOpenSell,
  onDelete,
}: GadgetInventorySectionProps) {
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(filteredGadgets.length / PAGE_SIZE));
  const paginatedGadgets = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredGadgets.slice(start, start + PAGE_SIZE);
  }, [filteredGadgets, page]);

  useEffect(() => {
    setPage(1);
  }, [q]);

  return (
    <div className="bg-card rounded-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-xs">
      {/* List Toolbar */}
      <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-4 bg-muted/20">
        <h3 className="font-bold text-sm flex items-center gap-2 text-foreground">
          <Boxes className="size-4 text-primary" /> Active Stocks
        </h3>
        <div className="relative flex-1 max-w-sm">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, supplier, color..."
            className="w-full pl-9 pr-8 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/90 dark:bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary hover:border-primary/50 dark:hover:border-primary/50 transition-all cursor-text caret-primary"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <span className="text-xs font-semibold text-muted-foreground">
          {filteredGadgets.length} gadgets listed
        </span>
      </div>

      {inventoryView === "grid" && (
        <div className="grid gap-5 p-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredGadgets.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed bg-muted/10 p-12 text-center text-sm text-muted-foreground">
              {isStaff
                ? "No gadgets found in stock."
                : 'No gadgets found in stock. Click "+ Add Gadget" to insert one.'}
            </div>
          )}
          {paginatedGadgets.map((gadget) => {
            const sold = getGadgetSoldQuantity(gadget.id, sales);
            const available = getGadgetAvailableQuantity(gadget, sales);
            const margin = gadget.minSellingPrice - gadget.purchasePrice;
            const marginPercent =
              gadget.purchasePrice > 0
                ? Math.round((margin / gadget.purchasePrice) * 100)
                : 0;

            return (
              <div
                key={gadget.id}
                onClick={() => onOpenDetail(gadget)}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/90 to-indigo-50/30 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 backdrop-blur-xl cursor-pointer dark:border-slate-800/90 dark:from-slate-900/95 dark:via-slate-900/80 dark:to-indigo-950/40 dark:hover:border-indigo-500/50"
              >
                {/* Top radiant gradient accent line */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 opacity-80 transition-opacity duration-300 group-hover:opacity-100" />

                {/* Ambient glowing gradient blur */}
                <div className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-gradient-to-br from-indigo-500/15 to-violet-500/15 blur-xl transition-transform duration-500 group-hover:scale-125" />

                <div>
                  {/* Top Header: Title on Left, Price on Right (Reference Style) */}
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 text-white shadow-md shadow-indigo-500/20 ring-1 ring-white/20 transition-transform duration-300 group-hover:scale-105 mt-0.5">
                        <Boxes className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-extrabold tracking-tight text-foreground leading-snug">
                            {gadget.productName}
                          </h3>
                          <span
                            className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                              available === 0
                                ? "bg-destructive/10 text-destructive ring-1 ring-destructive/20"
                                : available <= 2
                                ? "bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20 dark:text-amber-400"
                                : "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400"
                            }`}
                          >
                            <span
                              className={`size-1.5 rounded-full ${
                                available === 0
                                  ? "bg-destructive"
                                  : available <= 2
                                  ? "bg-amber-500 animate-pulse"
                                  : "bg-emerald-500 animate-pulse"
                              }`}
                            />
                            {available > 0 ? `${available} Left` : "Out of stock"}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-muted-foreground mt-0.5 break-words line-clamp-1">
                          {gadget.color || "Standard Accessory"}
                        </p>
                      </div>
                    </div>

                    {/* Top-Right Price & Profit Indicator (Like $129.00 in reference) */}
                    <div className="text-right shrink-0 pl-2">
                      <div className="text-lg font-black tracking-tight text-foreground">
                        {fmt(gadget.minSellingPrice)}
                      </div>
                      <div className="flex items-center justify-end gap-1 text-[11px] font-bold mt-0.5">
                        <span
                          className={
                            margin >= 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-destructive"
                          }
                        >
                          {margin >= 0 ? `+${fmt(margin)}` : fmt(margin)}
                        </span>
                        <span className="text-muted-foreground/60 font-medium">
                          ({marginPercent}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Minimal Metadata Strip */}
                  <div className="relative mt-2.5 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1 font-medium text-foreground truncate min-w-0">
                      <User className="size-3 text-indigo-500 shrink-0" />
                      <span className="truncate">{gadget.supplierName}</span>
                    </div>
                    <div className="flex items-center gap-1 font-semibold text-muted-foreground shrink-0 text-[11px]">
                      <span>Stock: <strong className="text-foreground">{gadget.quantity}</strong></span>
                      <span className="opacity-40">•</span>
                      <span>Sold: <strong className="text-foreground">{sold}</strong></span>
                    </div>
                  </div>

                  {/* Cost & Available Row */}
                  <div className="relative mt-2 flex items-center justify-between gap-2 border-t border-slate-200/60 pt-2 dark:border-slate-800/60 text-xs text-muted-foreground">
                    <span className="text-[11px] font-medium text-muted-foreground">
                      Available: <strong className="text-foreground">{available} units</strong>
                    </span>
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      Cost: <span className="text-foreground">{fmt(gadget.purchasePrice)}</span>
                    </span>
                  </div>
                </div>

                {/* Bottom Action Area (Matching "Buy Now" on bottom right) */}
                <div
                  className="relative mt-3 pt-2 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between gap-2"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenDetail(gadget)}
                      className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200/70 bg-white/70 dark:border-slate-800 dark:bg-slate-900/60 text-muted-foreground hover:text-foreground hover:border-indigo-500/40 transition-colors"
                      title="View Details"
                    >
                      <Eye className="size-3.5" />
                    </button>
                    {!isStaff && (
                      <button
                        onClick={() => onDelete(gadget.id, gadget.productName)}
                        className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>

                  {!isStaff && (
                    <button
                      onClick={() => onOpenSell(gadget)}
                      disabled={available === 0}
                      className={`group/btn relative inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer overflow-hidden ${
                        available === 0
                          ? "cursor-not-allowed bg-muted text-muted-foreground opacity-50 border"
                          : "bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:brightness-105 active:scale-95"
                      }`}
                    >
                      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 transition-transform duration-700 group-hover/btn:translate-x-full" />
                      <ShoppingCart className="size-3.5 shrink-0" />
                      <span>Sell Gadget</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table */}
      {inventoryView === "table" && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Product Name</th>
                <th className="p-3 text-left">Color</th>
                <th className="p-3 text-left">Supplier Info</th>
                <th className="p-3 text-right">Purchase Price</th>
                <th className="p-3 text-right">Min Selling Price</th>
                <th className="p-3 text-center">Stock Details</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredGadgets.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-10 text-center text-muted-foreground"
                  >
                    {isStaff
                      ? "No gadgets found in stock."
                      : 'No gadgets found in stock. Click "+ Add Gadget" to insert one.'}
                  </td>
                </tr>
              )}
              {paginatedGadgets.map((gadget) => {
                const sold = getGadgetSoldQuantity(gadget.id, sales);
                const available = getGadgetAvailableQuantity(gadget, sales);

                return (
                  <tr
                    key={gadget.id}
                    onClick={() => onOpenDetail(gadget)}
                    className="hover:bg-accent/20 cursor-pointer transition-colors"
                  >
                    <td className="p-3 font-semibold text-foreground">
                      {gadget.productName}
                    </td>
                    <td className="p-3">{gadget.color}</td>
                    <td className="p-3">
                      <div className="font-medium text-foreground">
                        {gadget.supplierName}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <User className="size-3 text-muted-foreground/60" />{" "}
                        {gadget.supplierPhone}
                      </div>
                    </td>
                    <td className="p-3 text-right font-medium text-muted-foreground">
                      {fmt(gadget.purchasePrice)}
                    </td>
                    <td className="p-3 text-right font-semibold text-foreground">
                      {fmt(gadget.minSellingPrice)}
                    </td>
                    <td className="p-3 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1 ${
                            available === 0
                              ? "bg-destructive/15 text-destructive"
                              : available <= 2
                              ? "bg-warning/15 text-warning"
                              : "bg-success/15 text-success"
                          }`}
                        >
                          {available} / {gadget.quantity} Available
                        </span>
                        {sold > 0 && (
                          <span className="text-[10px] text-muted-foreground mt-1">
                            {sold} sold
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div
                        className="inline-flex gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => onOpenDetail(gadget)}
                          className="p-1.5 rounded-md border hover:bg-accent transition-all cursor-pointer shadow-sm hover:border-primary/30"
                          title="View Details"
                        >
                          <Eye className="size-4 text-muted-foreground" />
                        </button>
                        {!isStaff && (
                          <>
                            <button
                              onClick={() => onOpenSell(gadget)}
                              disabled={available === 0}
                              className={`p-1.5 rounded-md border transition-all cursor-pointer shadow-sm ${
                                available === 0
                                  ? "opacity-40 cursor-not-allowed bg-muted text-muted-foreground"
                                  : "hover:bg-accent hover:border-primary/30 text-primary"
                              }`}
                              title="Sell Gadget"
                            >
                              <ShoppingCart className="size-4" />
                            </button>
                            <button
                              onClick={() =>
                                onDelete(gadget.id, gadget.productName)
                              }
                              className="p-1.5 rounded-md text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {filteredGadgets.length > 0 && (
        <div className="border-t px-5 py-3 bg-muted/20 text-xs text-muted-foreground flex flex-col sm:flex-row justify-between items-center gap-3 select-none shrink-0 mt-auto">
          <span>
            Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filteredGadgets.length)} of {filteredGadgets.length} items
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
