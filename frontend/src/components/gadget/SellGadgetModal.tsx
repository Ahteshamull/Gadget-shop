import React from "react";
import { ShoppingCart, X, BadgeAlert, Check } from "lucide-react";
import {
  getGadgetAvailableQuantity,
  type Gadget,
  type GadgetSale,
} from "@/lib/gadget-store";
import { fmt } from "@/lib/phone-ui";
import type { SellGadgetFormData } from "./gadgetTypes";

export interface SellGadgetModalProps {
  open: boolean;
  gadget: Gadget | null;
  sales: GadgetSale[];
  form: SellGadgetFormData;
  setForm: React.Dispatch<React.SetStateAction<SellGadgetFormData>>;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function SellGadgetModal({
  open,
  gadget,
  sales,
  form,
  setForm,
  onClose,
  onSubmit,
}: SellGadgetModalProps) {
  if (!open || !gadget) return null;

  const available = getGadgetAvailableQuantity(gadget, sales);

  return (
    <>
      <div
        className="fixed inset-0 bg-black/55 backdrop-blur-sm z-40"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 pointer-events-none sm:p-4">
        <div
          className="bg-card w-full max-w-lg max-h-[92dvh] rounded-2xl shadow-2xl border overflow-hidden flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex flex-col gap-3 px-4 py-4 border-b bg-gradient-to-r from-success/5 to-transparent sm:flex-row sm:items-center sm:justify-between sm:px-6 shrink-0">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-success/10 flex items-center justify-center">
                <ShoppingCart className="size-5 text-success" />
              </div>
              <div>
                <h2 className="font-bold text-foreground">Sell Gadget</h2>
                <p className="text-xs text-muted-foreground">
                  Register customer purchase transaction
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="size-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Product Info Summary */}
          <div className="bg-primary/5 border border-primary/15 mx-4 mt-4 p-3 rounded-xl flex flex-col gap-2 sm:mx-6 sm:flex-row sm:items-center sm:justify-between shrink-0">
            <div>
              <h4 className="text-sm font-bold text-foreground">
                {gadget.productName}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Color: {gadget.color} · Min Price: {fmt(gadget.minSellingPrice)}
              </p>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-muted-foreground uppercase font-bold">
                Available Stock
              </div>
              <div className="text-sm font-extrabold text-primary">
                {available} units
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  Customer Name *
                </span>
                <input
                  type="text"
                  required
                  value={form.customerName}
                  onChange={(e) =>
                    setForm({ ...form, customerName: e.target.value })
                  }
                  placeholder="Customer name"
                  className="input"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-muted-foreground">
                  Customer Phone *
                </span>
                <input
                  type="text"
                  required
                  value={form.customerPhone}
                  onChange={(e) =>
                    setForm({ ...form, customerPhone: e.target.value })
                  }
                  placeholder="+880..."
                  className="input"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-muted-foreground">
                  Quantity to Sell *
                </span>
                <input
                  type="number"
                  required
                  min="1"
                  max={available}
                  value={form.quantity}
                  onChange={(e) => {
                    const val = Math.max(1, Number(e.target.value));
                    setForm({ ...form, quantity: Math.min(val, available) });
                  }}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="input"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-muted-foreground">
                  Selling Price (Tk / Unit) *
                </span>
                <input
                  type="number"
                  required
                  min={gadget.minSellingPrice}
                  value={form.sellingPrice || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      sellingPrice: Math.max(0, Number(e.target.value)),
                    })
                  }
                  onWheel={(e) => e.currentTarget.blur()}
                  placeholder={String(gadget.minSellingPrice)}
                  className="input"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-muted-foreground">
                  Payment Method
                </span>
                <select
                  value={form.paymentMethod}
                  onChange={(e) =>
                    setForm({ ...form, paymentMethod: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer h-[38px]"
                >
                  {["Cash", "Card", "Mobile Banking", "Bank Transfer"].map(
                    (p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  Warranty (days)
                </span>
                <input
                  type="number"
                  min="0"
                  value={form.warrantyDays || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      warrantyDays: Math.max(0, Number(e.target.value)),
                    })
                  }
                  onWheel={(e) => e.currentTarget.blur()}
                  placeholder="e.g. 365 days (0 for no warranty)"
                  className="input"
                />
                <span className="text-[10px] text-muted-foreground mt-0.5 pl-0.5">
                  {form.warrantyDays > 0 ? (
                    <span className="text-success font-medium">
                      Expires:{" "}
                      {new Date(
                        Date.now() + form.warrantyDays * 86400000,
                      ).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  ) : (
                    <span>No warranty cover applicable for accessories</span>
                  )}
                </span>
              </label>

              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  Remarks / Notes
                </span>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) =>
                    setForm({ ...form, notes: e.target.value })
                  }
                  placeholder="Optional remarks"
                  className="input"
                />
              </label>
            </div>

            {/* Validation Warnings */}
            {form.sellingPrice < gadget.minSellingPrice &&
              form.sellingPrice > 0 && (
                <div className="bg-destructive/15 text-destructive p-3 rounded-lg border border-destructive/20 text-xs flex items-center gap-2">
                  <BadgeAlert className="size-4 shrink-0" />
                  <span>
                    Selling price is below the Minimum Selling Price of{" "}
                    {fmt(gadget.minSellingPrice)}!
                  </span>
                </div>
              )}

            {/* Total Invoice Estimate Summary */}
            <div className="bg-muted/30 p-4 rounded-xl border flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="text-xs text-muted-foreground">
                  Total Sale Price
                </span>
                <div className="text-xl font-bold text-foreground">
                  {fmt(Number(form.quantity) * Number(form.sellingPrice))}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground">
                  Unit profit
                </span>
                <div className="text-sm font-semibold text-success">
                  {fmt(Number(form.sellingPrice) - gadget.purchasePrice)}
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2 pt-3 border-t shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded-lg hover:bg-muted text-sm font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={form.sellingPrice < gadget.minSellingPrice}
                className={`px-5 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-1.5 cursor-pointer ${
                  form.sellingPrice < gadget.minSellingPrice
                    ? "bg-muted text-muted-foreground cursor-not-allowed opacity-50 border"
                    : "bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98]"
                }`}
              >
                <Check className="size-4" /> Confirm Sale
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
