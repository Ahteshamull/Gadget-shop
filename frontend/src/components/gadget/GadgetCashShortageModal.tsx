import React from "react";
import { AlertTriangle, X } from "lucide-react";
import { fmt } from "@/lib/phone-ui";
import type { CashIssueData } from "./gadgetTypes";

export interface GadgetCashShortageModalProps {
  cashIssue: CashIssueData | null;
  onClose: () => void;
}

export function GadgetCashShortageModal({
  cashIssue,
  onClose,
}: GadgetCashShortageModalProps) {
  if (!cashIssue) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
    >
      <div
        className="w-full max-w-lg rounded-2xl border bg-card p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                Not enough business cash
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                This gadget stock purchase needs more cash than your current
                business balance.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-5 rounded-xl border bg-muted/30 p-4">
          <div className="font-semibold text-foreground">
            {cashIssue.productName || "Gadget stock"}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border bg-background p-3">
              <div className="text-[11px] font-bold uppercase text-muted-foreground">
                Quantity
              </div>
              <div className="mt-1 text-lg font-black">
                {cashIssue.quantity}
              </div>
            </div>
            <div className="rounded-lg border bg-background p-3">
              <div className="text-[11px] font-bold uppercase text-muted-foreground">
                Unit Purchase Price
              </div>
              <div className="mt-1 text-lg font-black">
                {fmt(cashIssue.unitPrice)}
              </div>
            </div>
            <div className="rounded-lg border bg-background p-3">
              <div className="text-[11px] font-bold uppercase text-muted-foreground">
                Available Cash
              </div>
              <div className="mt-1 text-lg font-black text-emerald-600">
                {fmt(cashIssue.availableCash)}
              </div>
            </div>
            <div className="rounded-lg border bg-background p-3">
              <div className="text-[11px] font-bold uppercase text-muted-foreground">
                Purchase Cost
              </div>
              <div className="mt-1 text-lg font-black text-destructive">
                {fmt(cashIssue.purchaseCost)}
              </div>
            </div>
          </div>
          <div className="mt-3 rounded-lg border border-destructive/20 bg-destructive/10 p-3">
            <div className="text-[11px] font-bold uppercase text-destructive">
              Shortage
            </div>
            <div className="mt-1 text-xl font-black text-destructive">
              {fmt(cashIssue.shortage)}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-sky-500/20 bg-sky-500/10 p-4 text-sm text-muted-foreground">
          Partner page theke cash investment add korle ei stock buy korte
          parba. Otherwise quantity ba purchase price komiye try koro.
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
