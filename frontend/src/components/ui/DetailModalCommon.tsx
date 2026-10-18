import React, { useRef, useEffect } from "react";
import { DollarSign } from "lucide-react";
import { fmt } from "@/lib/phone-ui";

/**
 * Custom hook for modal backdrop.
 * Backdrop clicks do not close the modal to prevent accidental data loss.
 * Modals must only be closed via their explicit Close (X) or Cancel button.
 */
export function useModalBackdrop(_onClose?: () => void) {
  const handleBackdropMouseDown = (_e: React.MouseEvent) => {};
  const handleBackdropClick = (_e: React.MouseEvent) => {};

  return {
    handleBackdropMouseDown,
    handleBackdropClick,
  };
}

/**
 * Reusable clean field display for modal specification sections
 */
export function DetailField({
  label,
  value,
  isMono,
}: {
  label: string;
  value: React.ReactNode;
  isMono?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
        {label}
      </div>
      <div
        className={`text-sm font-semibold mt-0.5 text-foreground truncate ${
          isMono ? "font-mono" : ""
        }`}
        title={typeof value === "string" ? value : undefined}
      >
        {value || "—"}
      </div>
    </div>
  );
}

/**
 * Modern, consistent 3-card gradient Pricing & Profit sheet used across all detail modals
 */
export function DetailPricingCards({
  purchasePrice,
  sellingPrice,
  profit,
  margin,
  purchaseLabel = "Purchase Cost",
  sellingLabel = "Estimated Sell",
  profitLabel = "Estimated Profit",
}: {
  purchasePrice: number;
  sellingPrice: number;
  profit: number;
  margin: string;
  purchaseLabel?: string;
  sellingLabel?: string;
  profitLabel?: string;
}) {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b pb-1.5">
        <DollarSign className="size-3.5 text-primary" /> Pricing & Profit
      </h4>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Purchase Cost */}
        <div className="group relative overflow-hidden rounded-xl border border-rose-500/20 bg-gradient-to-br from-rose-500/15 via-card to-card p-3 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-muted-foreground">
            {purchaseLabel}
          </div>
          <div className="text-base font-bold text-foreground mt-1">
            {fmt(purchasePrice)}
          </div>
          <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-muted/60">
            <div className="h-full rounded-full bg-gradient-to-r from-rose-500 to-orange-400 w-full" />
          </div>
        </div>

        {/* Selling Price */}
        <div className="group relative overflow-hidden rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/15 via-card to-card p-3 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-muted-foreground">
            {sellingLabel}
          </div>
          <div className="text-base font-bold text-foreground mt-1">
            {fmt(sellingPrice)}
          </div>
          <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-muted/60">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 w-full" />
          </div>
        </div>

        {/* Profit and Margin */}
        <div
          className={`group relative overflow-hidden rounded-xl border ${
            profit >= 0
              ? "border-emerald-500/20 bg-gradient-to-br from-emerald-500/15"
              : "border-rose-500/20 bg-gradient-to-br from-rose-500/15"
          } via-card to-card p-3 shadow-xs`}
        >
          <div className="text-[10px] uppercase font-bold text-muted-foreground">
            {profitLabel}
          </div>
          <div
            className={`text-base font-bold mt-1 ${
              profit >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-destructive"
            }`}
          >
            {fmt(profit)} ({margin}%)
          </div>
          <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-muted/60">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${
                profit >= 0
                  ? "from-emerald-500 to-teal-400"
                  : "from-rose-500 to-orange-400"
              } w-full`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
