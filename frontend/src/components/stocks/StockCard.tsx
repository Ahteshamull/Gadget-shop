import React from "react";
import {
  Smartphone,
  Eye,
  ShoppingBag,
  Copy,
} from "lucide-react";
import type { Sale } from "@/lib/phone-store";
import { fmt } from "@/lib/phone-ui";
import { toast } from "sonner";

export interface StockCardProps {
  sale: Sale;
  onView: () => void;
  onSell?: () => void;
}

export function StockCard({ sale: s, onView, onSell }: StockCardProps) {
  const sold = !!s.customerName;
  const currentPrice = sold ? s.finalPrice : s.sellingPrice;
  const margin = currentPrice - s.purchasePrice;
  const marginPercent =
    s.purchasePrice > 0
      ? Math.round((margin / s.purchasePrice) * 100)
      : 0;

  const copyImei = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!s.imei) return;
    navigator.clipboard.writeText(s.imei);
    toast.success("IMEI copied to clipboard");
  };

  return (
    <div
      onClick={onView}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/90 to-indigo-50/30 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 backdrop-blur-xl cursor-pointer dark:border-slate-800/90 dark:from-slate-900/95 dark:via-slate-900/80 dark:to-indigo-950/40 dark:hover:border-indigo-500/50"
    >
      {/* Top radiant gradient accent line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 opacity-80 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Ambient glowing gradient blur */}
      <div className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-gradient-to-br from-indigo-500/15 to-violet-500/15 blur-xl transition-transform duration-500 group-hover:scale-125" />

      <div>
        {/* Top Header: Brand & Model on Left, Price on Right */}
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 text-white shadow-md shadow-indigo-500/20 ring-1 ring-white/20 transition-transform duration-300 group-hover:scale-105 mt-0.5">
              <Smartphone className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-extrabold tracking-tight text-foreground leading-snug">
                  {s.brand}
                </h3>
                <span
                  className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                    sold
                      ? "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400"
                      : "bg-cyan-500/10 text-cyan-600 ring-1 ring-cyan-500/20 dark:text-cyan-400"
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${
                      sold ? "bg-emerald-500" : "bg-cyan-500 animate-pulse"
                    }`}
                  />
                  {sold ? "Sold" : "In Stock"}
                </span>
              </div>
              <p className="text-xs font-semibold text-muted-foreground mt-0.5 break-words line-clamp-1">
                {s.model}
              </p>
            </div>
          </div>

          {/* Top-Right Price & Profit Indicator (Like $129.00 in reference) */}
          <div className="text-right shrink-0 pl-2">
            <div className="text-lg font-black tracking-tight text-foreground">
              {fmt(currentPrice)}
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

        {/* Specs Strip */}
        <div className="relative mt-3 flex flex-wrap items-center gap-1.5 text-xs">
          {s.color && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 font-medium text-foreground/90 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">Color:</span>
              <span className="font-semibold">{s.color}</span>
            </span>
          )}
          {s.ram && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 font-medium text-foreground/90 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">RAM:</span>
              <span className="font-semibold">{s.ram}</span>
            </span>
          )}
          {s.storage && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 font-medium text-foreground/90 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-400">Storage:</span>
              <span className="font-semibold">{s.storage}</span>
            </span>
          )}
        </div>

        {/* IMEI & Cost Row */}
        <div className="relative mt-3 flex items-center justify-between gap-2 border-t border-slate-200/60 pt-2.5 dark:border-slate-800/70 text-xs">
          {s.imei ? (
            <div
              onClick={copyImei}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/80 dark:bg-slate-800/70 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-500/40 border border-slate-200/60 dark:border-slate-700/60 text-xs font-mono font-medium text-foreground transition-all cursor-pointer"
              title="Click to copy IMEI"
            >
              <span className="text-[10px] uppercase font-bold text-muted-foreground/70">IMEI</span>
              <span className="truncate max-w-[140px]">{s.imei}</span>
              <Copy className="size-3 text-indigo-500 shrink-0" />
            </div>
          ) : (
            <span className="text-xs text-muted-foreground italic">No IMEI</span>
          )}
          <span className="text-xs font-semibold text-muted-foreground">
            Cost: <span className="font-bold text-foreground">{fmt(s.purchasePrice)}</span>
          </span>
        </div>
      </div>

      {/* Bottom Action Area (Matching "Buy Now" on bottom right) */}
      <div
        className="relative mt-3.5 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/70 flex items-center justify-between gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onView}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-cyan-500 transition-colors cursor-pointer py-1"
          title="View Details"
        >
          <Eye className="size-4" />
          <span>Details</span>
        </button>

        {sold ? (
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
            Sale Completed
          </span>
        ) : (
          onSell && (
            <button
              onClick={onSell}
              className="group/btn relative inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white text-xs font-extrabold shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer overflow-hidden"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 transition-transform duration-700 group-hover/btn:translate-x-full" />
              <ShoppingBag className="size-3.5 shrink-0" />
              <span>Sell This Phone</span>
            </button>
          )
        )}
      </div>
    </div>
  );
}
