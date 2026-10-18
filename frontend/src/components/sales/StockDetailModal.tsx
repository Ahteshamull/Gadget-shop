import React from "react";
import { Smartphone, X, Info, User, Pencil } from "lucide-react";
import { useAppSelector } from "@/store";
import { StockSale, getAddedByAdmin } from "./salesUtils";
import {
  useModalBackdrop,
  DetailField,
  DetailPricingCards,
} from "@/components/ui/DetailModalCommon";

export function StockDetailModal({
  item,
  onClose,
  onEdit,
}: {
  item: StockSale;
  onClose: () => void;
  onEdit: () => void;
}) {
  const currentUser = useAppSelector((state) => state.auth.user);
  const isSold = !!item.customerName;
  const profitAmt = item.sellingPrice - item.purchasePrice;
  const margin = item.sellingPrice > 0 ? ((profitAmt / item.sellingPrice) * 100).toFixed(1) : "0.0";

  const { handleBackdropMouseDown, handleBackdropClick } = useModalBackdrop(onClose);

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 backdrop-blur-sm animate-in fade-in duration-200 sm:p-4"
      onMouseDown={handleBackdropMouseDown}
      onClick={handleBackdropClick}
    >
      <div
        className="bg-card rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border transition-all animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col m-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-col gap-3 p-4 border-b bg-muted/20 sm:flex-row sm:items-center sm:justify-between sm:p-5 shrink-0">
          <h3 className="font-semibold text-lg flex items-center gap-2.5 text-foreground">
            <Smartphone className="size-5 text-primary" />
            Device Details
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
                isSold ? "bg-success/15 text-success" : "bg-primary/15 text-primary"
              }`}
            >
              {isSold ? "Sold" : "Available in Stock"}
            </span>
          </div>

          {/* Specifications */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b pb-1.5">
              <Info className="size-3.5 text-primary" /> Specifications
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <DetailField label="Brand" value={item.brand} />
              <DetailField label="Model" value={item.model} />
              <DetailField label="IMEI" value={item.imei} isMono />
              <DetailField
                label="Variant / Color"
                value={`${item.variant || "—"} · ${item.color || "—"}`}
              />
              <DetailField
                label="RAM / Storage"
                value={`${item.ram || "—"} / ${item.storage || "—"}`}
              />
              <DetailField label="Seller NID" value={item.sellerNID || "—"} isMono />
              <DetailField label="Added By" value={getAddedByAdmin(item, currentUser?.name)} />
              <DetailField label="Added On" value={new Date(item.saleDate).toLocaleDateString()} />
            </div>
          </div>

          {/* Supplier Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b pb-1.5">
              <User className="size-3.5 text-primary" /> Seller Details
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <DetailField label="Seller Name" value={item.supplierName || "—"} />
              <DetailField label="Seller Contact" value={item.supplierPhone || "—"} />
            </div>
          </div>

          {/* Pricing & Profit */}
          <DetailPricingCards
            purchasePrice={item.purchasePrice}
            sellingPrice={item.sellingPrice}
            profit={profitAmt}
            margin={margin}
            purchaseLabel="Purchase Cost"
            sellingLabel="Estimated Sell"
            profitLabel="Estimated Profit"
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
          {!isSold && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="px-5 py-2 text-sm rounded-full bg-gradient-to-r from-[#8b5cf6] via-[#7c3aed] to-[#6366f1] text-white border border-white/25 shadow-sm hover:brightness-110 active:scale-[0.98] font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Pencil className="size-4" /> Edit Specs
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
