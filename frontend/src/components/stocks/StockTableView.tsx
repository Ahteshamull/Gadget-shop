import React from "react";
import { Eye, ShoppingBag, Package } from "lucide-react";
import type { Sale } from "@/lib/phone-store";
import { fmt } from "@/lib/phone-ui";

export function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <div className="size-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
        <Package className="size-7 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">No stock found</p>
      <p className="text-xs text-muted-foreground/60 mt-1">
        Try adjusting your filters or search query
      </p>
    </div>
  );
}

export interface StockTableViewProps {
  filtered: Sale[];
  isStaff: boolean;
  onSelect: (sale: Sale) => void;
  onStartSale: (sale: Sale) => void;
}

export function StockTableView({
  filtered,
  isStaff,
  onSelect,
  onStartSale,
}: StockTableViewProps) {
  return (
    <div className="overflow-x-auto">
      {filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <table className="w-full min-w-[1040px] text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">IMEI</th>
              <th className="text-left p-3">Brand / Model</th>
              <th className="text-left p-3">Color · RAM · Storage</th>
              <th className="text-right p-3">Purchase</th>
              <th className="text-right p-3">Selling</th>
              <th className="text-left p-3">Customer</th>
              <th className="text-left p-3">Date Added</th>
              <th className="text-center p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => {
              const sold = !!s.customerName;
              return (
                <tr
                  key={s.id}
                  className="border-t hover:bg-accent/30 transition-colors"
                >
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        sold
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-blue-500/10 text-blue-600"
                      }`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${
                          sold ? "bg-emerald-400" : "bg-blue-400"
                        }`}
                      />
                      {sold ? "Sold" : "In Stock"}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">
                    {s.imei || "—"}
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{s.brand}</div>
                    <div className="text-xs text-muted-foreground">{s.model}</div>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {[s.color, s.ram, s.storage].filter(Boolean).join(" · ") ||
                      "—"}
                  </td>
                  <td className="p-3 text-right text-sm">
                    {fmt(s.purchasePrice)}
                  </td>
                  <td className="p-3 text-right text-sm font-medium">
                    {fmt(s.sellingPrice)}
                  </td>
                  <td className="p-3">
                    {sold ? (
                      <>
                        <div className="text-sm font-medium">
                          {s.customerName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {s.customerPhone}
                        </div>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {new Date(s.saleDate).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-center">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => onSelect(s)}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                      >
                        <Eye className="size-3.5" /> View
                      </button>
                      {!isStaff && !sold && (
                        <button
                          onClick={() => onStartSale(s)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 text-xs font-semibold hover:bg-emerald-500/20 transition-all cursor-pointer"
                        >
                          <ShoppingBag className="size-3" /> Sell
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
