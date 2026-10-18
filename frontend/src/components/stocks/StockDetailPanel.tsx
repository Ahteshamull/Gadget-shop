import React, { useState } from "react";
import { Smartphone, X, Info, User, Shield, Printer } from "lucide-react";
import { warrantyStatus, type Sale } from "@/lib/phone-store";
import { CustomerMemoModal } from "@/lib/phone-ui";
import {
  useModalBackdrop,
  DetailField,
  DetailPricingCards,
} from "@/components/ui/DetailModalCommon";

export interface StockDetailPanelProps {
  sale: Sale;
  onClose: () => void;
}

export function StockDetailPanel({ sale: s, onClose }: StockDetailPanelProps) {
  const sold = !!s.customerName;
  const w = warrantyStatus(s);
  const profitAmt = (s.finalPrice || s.sellingPrice) - s.purchasePrice;
  const effectiveSellPrice = s.finalPrice || s.sellingPrice;
  const margin =
    effectiveSellPrice > 0
      ? ((profitAmt / effectiveSellPrice) * 100).toFixed(1)
      : "0.0";

  const [showMemo, setShowMemo] = useState(false);
  const { handleBackdropMouseDown, handleBackdropClick } = useModalBackdrop(onClose);

  return (
    <>
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
                  sold ? "bg-success/15 text-success" : "bg-primary/15 text-primary"
                }`}
              >
                {sold ? "Sold" : "Available in Stock"}
              </span>
            </div>

            {/* Specifications */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b pb-1.5">
                <Info className="size-3.5 text-primary" /> Specifications
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <DetailField label="Brand" value={s.brand} />
                <DetailField label="Model" value={s.model} />
                <DetailField label="IMEI" value={s.imei} isMono />
                <DetailField
                  label="Variant / Color"
                  value={`${s.variant || "—"} · ${s.color || "—"}`}
                />
                <DetailField
                  label="RAM / Storage"
                  value={`${s.ram || "—"} / ${s.storage || "—"}`}
                />
                <DetailField label="Added On" value={new Date(s.saleDate).toLocaleDateString()} />
                {sold && s.invoiceNumber && (
                  <DetailField label="Invoice No" value={s.invoiceNumber} isMono />
                )}
                {s.sellerNID && (
                  <DetailField label="Seller NID" value={s.sellerNID} isMono />
                )}
              </div>
            </div>

            {/* Customer Details if sold */}
            {sold && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b pb-1.5">
                  <User className="size-3.5 text-primary" /> Customer Details
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <DetailField label="Customer Name" value={s.customerName} />
                  <DetailField label="Phone" value={s.customerPhone || "—"} />
                  {s.altPhone && <DetailField label="Alt Phone" value={s.altPhone} />}
                  {s.email && <DetailField label="Email" value={s.email} />}
                  {s.address && <DetailField label="Address" value={s.address} />}
                </div>
              </div>
            )}

            {/* Seller / Supplier Details if available */}
            {!sold && (s.supplierName || s.supplierPhone) && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b pb-1.5">
                  <User className="size-3.5 text-primary" /> Seller Details
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <DetailField label="Seller Name" value={s.supplierName || "—"} />
                  <DetailField label="Seller Contact" value={s.supplierPhone || "—"} />
                </div>
              </div>
            )}

            {/* Warranty Details if sold */}
            {sold && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b pb-1.5">
                  <Shield className="size-3.5 text-primary" /> Warranty
                </h4>
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border text-xs">
                  <span className="font-semibold text-foreground">
                    {w.active ? `Active (${w.days} days remaining)` : "Warranty Expired"}
                  </span>
                  <span className="text-muted-foreground">
                    Until {new Date(s.warrantyExpiry).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}

            {/* Pricing & Profit */}
            <DetailPricingCards
              purchasePrice={s.purchasePrice}
              sellingPrice={effectiveSellPrice}
              profit={profitAmt}
              margin={margin}
              purchaseLabel="Purchase Cost"
              sellingLabel={sold ? "Final Sale Price" : "Estimated Sell"}
              profitLabel={sold ? "Actual Profit" : "Estimated Profit"}
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
            {sold && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMemo(true);
                }}
                className="px-5 py-2 text-sm rounded-full bg-gradient-to-r from-sky-500 via-primary to-indigo-600 text-white border border-white/25 shadow-sm hover:brightness-110 active:scale-[0.98] font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Printer className="size-4" /> Print Customer Memo
              </button>
            )}
          </div>
        </div>
      </div>

      {showMemo && (
        <CustomerMemoModal sale={s} onClose={() => setShowMemo(false)} />
      )}
    </>
  );
}
