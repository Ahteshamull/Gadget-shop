import React from "react";
import { Boxes, X, Info, User, ShoppingCart } from "lucide-react";
import {
  getGadgetAvailableQuantity,
  type Gadget,
  type GadgetSale,
} from "@/lib/gadget-store";
import {
  useModalBackdrop,
  DetailField,
  DetailPricingCards,
} from "@/components/ui/DetailModalCommon";

export interface GadgetDetailModalProps {
  open: boolean;
  gadget: Gadget | null;
  sales: GadgetSale[];
  isStaff: boolean;
  onClose: () => void;
  onSell: (gadget: Gadget) => void;
}

export function GadgetDetailModal({
  open,
  gadget,
  sales,
  isStaff,
  onClose,
  onSell,
}: GadgetDetailModalProps) {
  const { handleBackdropMouseDown, handleBackdropClick } = useModalBackdrop(onClose);

  if (!open || !gadget) return null;

  const available = getGadgetAvailableQuantity(gadget, sales);
  const profitAmt = gadget.minSellingPrice - gadget.purchasePrice;
  const margin =
    gadget.minSellingPrice > 0
      ? ((profitAmt / gadget.minSellingPrice) * 100).toFixed(1)
      : "0.0";

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 backdrop-blur-sm animate-in fade-in duration-200 sm:p-4"
      onMouseDown={handleBackdropMouseDown}
      onClick={handleBackdropClick}
    >
      <div
        className="bg-card rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border transition-all animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-col gap-3 p-4 border-b bg-muted/20 sm:flex-row sm:items-center sm:justify-between sm:p-5 shrink-0">
          <h3 className="font-semibold text-lg flex items-center gap-2.5 text-foreground">
            <Boxes className="size-5 text-primary" />
            Gadget Details
          </h3>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1.5 hover:bg-muted rounded-lg transition-all cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Status Badge */}
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Status
            </span>
            <span
              className={`text-xs px-3 py-1 rounded-full font-bold ${
                available > 0
                  ? "bg-success/15 text-success"
                  : "bg-destructive/15 text-destructive"
              }`}
            >
              {available > 0
                ? `${available} Available in Stock`
                : "Out of Stock"}
            </span>
          </div>

          {/* Specifications */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b pb-1.5">
              <Info className="size-3.5 text-primary" /> Specifications
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <DetailField label="Product Name" value={gadget.productName} />
              <DetailField label="Color" value={gadget.color} />
              <DetailField
                label="Available Stock"
                value={`${available} units (${gadget.quantity} initial)`}
              />
              <DetailField
                label="Registered On"
                value={new Date(gadget.createdAt).toLocaleDateString()}
              />
            </div>

            {/* Details text area */}
            {gadget.details && (
              <div className="mt-2.5">
                <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
                  Product Details
                </div>
                <div className="text-xs p-3 rounded-xl border bg-muted/20 text-foreground leading-relaxed">
                  {gadget.details}
                </div>
              </div>
            )}
          </div>

          {/* Supplier Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b pb-1.5">
              <User className="size-3.5 text-primary" /> Supplier Details
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <DetailField label="Seller Name" value={gadget.supplierName || "—"} />
              <DetailField
                label="Supplier Contact"
                value={gadget.supplierPhone || "—"}
              />
            </div>
          </div>

          {/* Pricing & Profit */}
          <DetailPricingCards
            purchasePrice={gadget.purchasePrice}
            sellingPrice={gadget.minSellingPrice}
            profit={profitAmt}
            margin={margin}
            purchaseLabel="Purchase Cost"
            sellingLabel="Min Selling Price"
            profitLabel="Profit / Unit"
          />
        </div>

        {/* Footer */}
        <div className="p-5 border-t bg-muted/10 flex justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="px-5 py-2 text-sm rounded-full border hover:bg-muted font-semibold transition-all cursor-pointer"
          >
            Close
          </button>
          {!isStaff && available > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
                onSell(gadget);
              }}
              className="px-5 py-2 text-sm rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white border border-white/25 shadow-sm hover:brightness-110 active:scale-[0.98] font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ShoppingCart className="size-4" /> Sell Gadget
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
