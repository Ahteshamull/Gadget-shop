import React, { useRef, useEffect } from "react";
import { Pencil, X } from "lucide-react";
import { fmt } from "@/lib/phone-ui";
import { toast } from "sonner";
import { StockSale, Field, Input } from "./salesUtils";

export function EditStockModal({
  draft,
  onSave,
  onClose,
  onChange,
}: {
  draft: StockSale;
  onSave: () => void;
  onClose: () => void;
  onChange: (d: StockSale) => void;
}) {
  const mountedAtRef = useRef(Date.now());
  const isBackdropMouseDownRef = useRef(false);

  useEffect(() => {
    mountedAtRef.current = Date.now();
  }, []);

  const handleBackdropMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      isBackdropMouseDownRef.current = true;
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Ignore trailing or ghost click events from opening action during initial mount
    if (Date.now() - mountedAtRef.current < 250) {
      return;
    }
    // Only close if mousedown was also initiated on the backdrop itself (not dragged from inside dialog)
    if (e.target === e.currentTarget && isBackdropMouseDownRef.current) {
      onClose();
    }
    isBackdropMouseDownRef.current = false;
  };

  const setDraftVal = <K extends keyof StockSale>(k: K, v: StockSale[K]) => {
    const next = { ...draft, [k]: v };
    if (k === "supplierName") next.buyerName = String(v);
    if (k === "supplierPhone") next.buyerPhone = String(v);
    onChange(next);
  };

  const handleSave = () => {
    if (!draft.imei?.trim()) {
      toast.error("IMEI number is required");
      return;
    }
    if (!draft.brand?.trim() || draft.brand === "Add New Brand") {
      toast.error("Brand name is required");
      return;
    }
    if (!draft.model?.trim()) {
      toast.error("Model name is required");
      return;
    }
    onSave();
  };

  const profitAmt = draft.sellingPrice - draft.purchasePrice;
  const margin =
    draft.sellingPrice > 0 ? ((profitAmt / draft.sellingPrice) * 100).toFixed(1) : "0.0";

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2.5 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="bg-card rounded-2xl max-w-2xl w-full max-h-[92dvh] overflow-hidden shadow-2xl border flex flex-col transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-3 p-4 border-b bg-muted/20 sm:flex-row sm:items-center sm:justify-between sm:p-5 shrink-0">
          <h3 className="font-semibold text-lg flex items-center gap-2.5 text-foreground">
            <Pencil className="size-5 text-primary" />
            Edit Phone Specifications
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

        <div className="p-4 sm:p-6 max-h-[60dvh] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 flex-1 min-h-0">
          <Field label="IMEI Number *">
            <Input
              value={draft.imei}
              onChange={(e) => setDraftVal("imei", e.target.value)}
              placeholder="Enter 15-digit IMEI"
              required
            />
          </Field>
          <Field label="Phone Brand *">
            <div className="flex flex-col gap-2">
              <select
                className="input cursor-pointer"
                value={
                  [
                    "Apple",
                    "Samsung",
                    "Google",
                    "OnePlus",
                    "Xiaomi",
                    "Vivo",
                    "Oppo",
                    "Realme",
                    "Motorola",
                    "Infinix",
                    "Tecno",
                    "Nokia",
                  ].includes(draft.brand)
                    ? draft.brand
                    : draft.brand
                      ? "Add New Brand"
                      : ""
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "Add New Brand") {
                    setDraftVal("brand", "Add New Brand");
                  } else {
                    setDraftVal("brand", val);
                  }
                }}
                required
              >
                <option value="">Select Brand</option>
                {[
                  "Apple",
                  "Samsung",
                  "Google",
                  "OnePlus",
                  "Xiaomi",
                  "Vivo",
                  "Oppo",
                  "Realme",
                  "Motorola",
                  "Infinix",
                  "Tecno",
                  "Nokia",
                ].map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
                <option value="Add New Brand">+ Add New Brand</option>
              </select>
              {![
                "Apple",
                "Samsung",
                "Google",
                "OnePlus",
                "Xiaomi",
                "Vivo",
                "Oppo",
                "Realme",
                "Motorola",
                "Infinix",
                "Tecno",
                "Nokia",
              ].includes(draft.brand) &&
                draft.brand !== "" && (
                  <Input
                    value={draft.brand === "Add New Brand" ? "" : draft.brand}
                    onChange={(e) => setDraftVal("brand", e.target.value)}
                    placeholder="Type custom brand name..."
                    required
                  />
                )}
            </div>
          </Field>
          <Field label="Phone Model *">
            <Input
              value={draft.model}
              onChange={(e) => setDraftVal("model", e.target.value)}
              placeholder="e.g. iPhone 15 Pro, Galaxy S24"
              required
            />
          </Field>
          <Field label="Variant">
            <Input
              value={draft.variant}
              onChange={(e) => setDraftVal("variant", e.target.value)}
              placeholder="e.g. USA, Global, LLA"
            />
          </Field>
          <Field label="Color">
            <Input
              value={draft.color}
              onChange={(e) => setDraftVal("color", e.target.value)}
              placeholder="e.g. Titanium Gray, Onyx Black"
            />
          </Field>
          <Field label="RAM">
            <Input
              value={draft.ram}
              onChange={(e) => setDraftVal("ram", e.target.value)}
              placeholder="e.g. 8GB, 12GB"
            />
          </Field>
          <Field label="Storage">
            <Input
              value={draft.storage}
              onChange={(e) => setDraftVal("storage", e.target.value)}
              placeholder="e.g. 128GB, 256GB"
            />
          </Field>
          <Field label="Purchase Price *">
            <Input
              type="number"
              value={draft.purchasePrice || ""}
              onChange={(e) => setDraftVal("purchasePrice", +e.target.value)}
              placeholder="Cost price"
              required
            />
          </Field>
          <Field label="Estimated Sell Price *">
            <Input
              type="number"
              value={draft.sellingPrice || ""}
              onChange={(e) => setDraftVal("sellingPrice", +e.target.value)}
              placeholder="Estimate only"
              required
            />
          </Field>
          <Field label="Seller NID">
            <Input
              value={draft.sellerNID}
              onChange={(e) => setDraftVal("sellerNID", e.target.value)}
              placeholder="Seller NID number"
            />
          </Field>
          <Field label="Seller Name">
            <Input
              value={draft.supplierName}
              onChange={(e) => setDraftVal("supplierName", e.target.value)}
              placeholder="Whom did you buy from"
            />
          </Field>
          <Field label="Supplier Phone">
            <Input
              value={draft.supplierPhone}
              onChange={(e) => setDraftVal("supplierPhone", e.target.value)}
              placeholder="Supplier contact number"
            />
          </Field>
        </div>

        <div className="p-4 border-t bg-muted/10 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between sm:p-5 shrink-0">
          <div className="flex gap-4 text-xs font-semibold text-muted-foreground">
            <div>
              Estimated Profit: <span className="text-foreground">{fmt(profitAmt)}</span>
            </div>
            <div>
              Estimated Margin: <span className="text-foreground">{margin}%</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="px-4 py-2 text-sm rounded-lg border hover:bg-muted font-semibold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSave();
              }}
              className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90 font-semibold transition-all cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
