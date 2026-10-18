import React from "react";
import { Boxes, X, RefreshCw } from "lucide-react";
import { fmt } from "@/lib/phone-ui";
import type { AddGadgetFormData } from "./gadgetTypes";

export interface AddGadgetModalProps {
  open: boolean;
  loading: boolean;
  form: AddGadgetFormData;
  setForm: React.Dispatch<React.SetStateAction<AddGadgetFormData>>;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function AddGadgetModal({
  open,
  loading,
  form,
  setForm,
  onClose,
  onSubmit,
}: AddGadgetModalProps) {
  if (!open) return null;

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
          <div className="flex flex-col gap-3 px-4 py-4 border-b bg-gradient-to-r from-primary/5 to-transparent sm:flex-row sm:items-center sm:justify-between sm:px-6 shrink-0">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Boxes className="size-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-foreground">Add New Gadget</h2>
                <p className="text-xs text-muted-foreground">
                  Add new gadgets and accessory stock
                </p>
              </div>
            </div>
            <button
              onClick={() => !loading && onClose()}
              disabled={loading}
              className="size-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Form */}
          <form
            onSubmit={onSubmit}
            className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  Product Name *
                </span>
                <input
                  type="text"
                  required
                  value={form.productName}
                  onChange={(e) =>
                    setForm({ ...form, productName: e.target.value })
                  }
                  placeholder="e.g. Apple AirPods Pro 2"
                  className="input"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-muted-foreground">
                  Color *
                </span>
                <input
                  type="text"
                  required
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  placeholder="e.g. White, Black"
                  className="input"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-muted-foreground">
                  Quantity *
                </span>
                <input
                  type="number"
                  min="1"
                  required
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      quantity: Math.max(1, Number(e.target.value)),
                    })
                  }
                  onWheel={(e) => e.currentTarget.blur()}
                  placeholder="Quantity"
                  className="input"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-muted-foreground">
                  Purchase Price (Tk) *
                </span>
                <input
                  type="number"
                  min="0"
                  required
                  value={form.purchasePrice || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      purchasePrice: Math.max(0, Number(e.target.value)),
                    })
                  }
                  onWheel={(e) => e.currentTarget.blur()}
                  placeholder="e.g. 22000"
                  className="input"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-muted-foreground">
                  Min Selling Price (Tk) *
                </span>
                <input
                  type="number"
                  min="0"
                  required
                  value={form.minSellingPrice || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      minSellingPrice: Math.max(0, Number(e.target.value)),
                    })
                  }
                  onWheel={(e) => e.currentTarget.blur()}
                  placeholder="e.g. 25000"
                  className="input"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-muted-foreground">
                  Seller Name *
                </span>
                <input
                  type="text"
                  required
                  value={form.supplierName}
                  onChange={(e) =>
                    setForm({ ...form, supplierName: e.target.value })
                  }
                  placeholder="Wholesale supplier"
                  className="input"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-muted-foreground">
                  Seller Phone *
                </span>
                <input
                  type="text"
                  required
                  value={form.supplierPhone}
                  onChange={(e) =>
                    setForm({ ...form, supplierPhone: e.target.value })
                  }
                  placeholder="+880..."
                  className="input"
                />
              </label>

              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  Details (optional)
                </span>
                <textarea
                  value={form.details}
                  onChange={(e) =>
                    setForm({ ...form, details: e.target.value })
                  }
                  placeholder="Additional specs or remarks..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </label>
            </div>

            {/* Profit Estimate Summary */}
            <div className="bg-muted/30 p-3 rounded-lg border border-dashed flex justify-between text-xs mt-2">
              <div>
                <span className="text-muted-foreground">
                  Target Profit margin:{" "}
                </span>
                <span
                  className={`font-bold ml-1 ${
                    form.minSellingPrice >= form.purchasePrice
                      ? "text-success"
                      : "text-destructive"
                  }`}
                >
                  {fmt(form.minSellingPrice - form.purchasePrice)} / unit
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Markup: </span>
                <span className="font-bold text-foreground ml-1">
                  {form.minSellingPrice > 0
                    ? (
                        ((form.minSellingPrice - form.purchasePrice) /
                          form.minSellingPrice) *
                        100
                      ).toFixed(1)
                    : "0.0"}
                  %
                </span>
              </div>
            </div>

            {/* Action Footer */}
            <div className="flex justify-end gap-2 pt-3 border-t border-muted/50 shrink-0">
              <button
                type="button"
                onClick={() => !loading && onClose()}
                disabled={loading}
                className="px-4 py-2 border rounded-lg hover:bg-muted text-sm font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading && <RefreshCw className="size-4 animate-spin" />}
                {loading ? "Adding to Stock..." : "Add Gadget"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
