import React, { useRef, useEffect, useMemo } from "react";
import { Smartphone, X, ScanLine, RefreshCw, Plus } from "lucide-react";
import { fmt } from "@/lib/phone-ui";
import { StockSale, Field, Input } from "./salesUtils";
import { resolveNextAvailableImei, lookupDeviceFromInventory } from "@/lib/device-scanner-helper";

export interface AddStockModalProps {
  open: boolean;
  onClose: () => void;
  form: StockSale;
  setForm: React.Dispatch<React.SetStateAction<StockSale>>;
  onSubmit: (e: React.FormEvent) => void;
  addLoading: boolean;
  onOpenScanner: () => void;
  existingStocks?: StockSale[];
}

export function AddStockModal({
  open,
  onClose,
  form,
  setForm,
  onSubmit,
  addLoading,
  onOpenScanner,
  existingStocks,
}: AddStockModalProps) {
  const mountedAtRef = useRef(Date.now());
  const isBackdropMouseDownRef = useRef(false);

  useEffect(() => {
    if (open) {
      mountedAtRef.current = Date.now();
    }
  }, [open]);

  const repeatInfo = useMemo(() => {
    if (!open || !existingStocks || !form?.imei) return null;
    const imeiStr = typeof form.imei === "string" ? form.imei.trim() : "";
    if (!imeiStr) return null;
    const existingImeis = Array.isArray(existingStocks)
      ? existingStocks.map((s) => s?.imei || "").filter(Boolean)
      : [];
    return resolveNextAvailableImei(imeiStr, existingImeis);
  }, [open, form?.imei, existingStocks]);

  const set = <K extends keyof StockSale>(k: K, v: StockSale[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleImeiChange = (val: string) => {
    set("imei", val);
    const cleanDigits = val.replace(/[^0-9]/g, "");
    if (cleanDigits.length === 15 && !val.includes("(") && existingStocks) {
      const existingImeis = Array.isArray(existingStocks)
        ? existingStocks.map((s) => s?.imei || "").filter(Boolean)
        : [];
      const resolved = resolveNextAvailableImei(cleanDigits, existingImeis);
      if (resolved.isRepeated) {
        setForm((prev) => {
          const next = { ...prev, imei: resolved.finalImei };
          const match = lookupDeviceFromInventory(resolved.baseImei, existingStocks);
          if (match) {
            if (!prev.brand && match.brand) next.brand = match.brand;
            if (!prev.model && match.model) next.model = match.model;
            if (!prev.variant && match.variant) next.variant = match.variant;
            if (!prev.ram && match.ram) next.ram = match.ram;
            if (!prev.storage && match.storage) next.storage = match.storage;
            if (!prev.color && match.color) next.color = match.color;
          }
          return next;
        });
      }
    }
  };

  const handleImeiBlur = () => {
    if (!existingStocks || !form?.imei) return;
    const imeiStr = typeof form.imei === "string" ? form.imei.trim() : "";
    if (!imeiStr) return;
    const existingImeis = Array.isArray(existingStocks)
      ? existingStocks.map((s) => s?.imei || "").filter(Boolean)
      : [];
    const resolved = resolveNextAvailableImei(imeiStr, existingImeis);
    if (resolved.isRepeated && resolved.finalImei !== form.imei) {
      setForm((prev) => {
        const next = { ...prev, imei: resolved.finalImei };
        const match = lookupDeviceFromInventory(resolved.baseImei, existingStocks);
        if (match) {
          if (!prev.brand && match.brand) next.brand = match.brand;
          if (!prev.model && match.model) next.model = match.model;
          if (!prev.variant && match.variant) next.variant = match.variant;
          if (!prev.ram && match.ram) next.ram = match.ram;
          if (!prev.storage && match.storage) next.storage = match.storage;
          if (!prev.color && match.color) next.color = match.color;
        }
        return next;
      });
    }
  };

  const handleBackdropMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      isBackdropMouseDownRef.current = true;
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (addLoading) return;
    if (Date.now() - mountedAtRef.current < 250) return;
    if (e.target === e.currentTarget && isBackdropMouseDownRef.current) {
      onClose();
    }
    isBackdropMouseDownRef.current = false;
  };

  if (!open) return null;

  const profitAmt = (form?.sellingPrice || 0) - (form?.purchasePrice || 0);

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2.5 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="bg-card rounded-2xl max-w-3xl w-full max-h-[92dvh] overflow-hidden shadow-2xl border flex flex-col transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={onSubmit} className="flex flex-col max-h-[92dvh] overflow-hidden">
          {/* Form Header */}
          <div className="px-4 py-4 border-b flex items-center justify-between bg-muted/20 sm:px-6 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Smartphone className="size-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-foreground">Register New Phone</h3>
                <p className="text-xs text-muted-foreground">
                  Enter phone specs, purchase price, and supplier info
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => !addLoading && onClose()}
              disabled={addLoading}
              className="p-1.5 hover:bg-muted rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Form Fields Grid */}
          <div className="p-4 sm:p-6 max-h-[62dvh] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 flex-1 min-h-0">
            <Field label="IMEI Number *">
              <div className="relative flex items-center">
                <Input
                  value={form.imei}
                  onChange={(e) => handleImeiChange(e.target.value)}
                  onBlur={handleImeiBlur}
                  placeholder="Enter 15-digit IMEI"
                  required
                  className="pr-24 font-mono font-medium"
                />
                <button
                  type="button"
                  onClick={onOpenScanner}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-[#8b5cf6] via-[#7c3aed] to-[#6366f1] text-white text-xs font-bold inline-flex items-center gap-1.5 border border-white/20 shadow-sm shadow-purple-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group"
                  title="Scan barcode with camera"
                >
                  <ScanLine className="size-3.5 transition-transform duration-300 group-hover:rotate-12" />
                  <span>Scan</span>
                </button>
              </div>
              {repeatInfo?.isRepeated && (
                <div className="mt-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                  <RefreshCw className="size-3 shrink-0 animate-spin-slow" />
                  <span>
                    Previously registered phone (Restock: <strong>({repeatInfo.repeatIndex})</strong>)
                  </span>
                </div>
              )}
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
                    ].includes(form.brand)
                      ? form.brand
                      : form.brand
                        ? "Add New Brand"
                        : ""
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "Add New Brand") {
                      set("brand", "Add New Brand");
                    } else {
                      set("brand", val);
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
                ].includes(form.brand) &&
                  form.brand !== "" && (
                    <Input
                      value={form.brand === "Add New Brand" ? "" : form.brand}
                      onChange={(e) => set("brand", e.target.value)}
                      placeholder="Type custom brand name..."
                      required
                    />
                  )}
              </div>
            </Field>
            <Field label="Phone Model *">
              <Input
                value={form.model}
                onChange={(e) => set("model", e.target.value)}
                placeholder="e.g. iPhone 15 Pro, Galaxy S24"
                required
              />
            </Field>
            <Field label="Variant">
              <Input
                value={form.variant}
                onChange={(e) => set("variant", e.target.value)}
                placeholder="e.g. USA, Global, LLA"
              />
            </Field>
            <Field label="Color">
              <Input
                value={form.color}
                onChange={(e) => set("color", e.target.value)}
                placeholder="e.g. Titanium Gray, Onyx Black"
              />
            </Field>
            <Field label="RAM">
              <Input
                value={form.ram}
                onChange={(e) => set("ram", e.target.value)}
                placeholder="e.g. 8GB, 12GB"
              />
            </Field>
            <Field label="Storage">
              <Input
                value={form.storage}
                onChange={(e) => set("storage", e.target.value)}
                placeholder="e.g. 128GB, 256GB"
              />
            </Field>
            <Field label="Purchase Price *">
              <Input
                type="number"
                value={form.purchasePrice || ""}
                onChange={(e) => set("purchasePrice", +e.target.value)}
                placeholder="Cost price"
                required
              />
            </Field>
            <Field label="Estimated Sell Price *">
              <Input
                type="number"
                value={form.sellingPrice || ""}
                onChange={(e) => set("sellingPrice", +e.target.value)}
                placeholder="Estimate only"
                required
              />
            </Field>
            <Field label="Seller NID">
              <Input
                value={form.sellerNID}
                onChange={(e) => set("sellerNID", e.target.value)}
                placeholder="Seller NID number"
              />
            </Field>
            <Field label="Seller Name">
              <Input
                value={form.supplierName}
                onChange={(e) => set("supplierName", e.target.value)}
                placeholder="Whom did you buy from"
              />
            </Field>
            <Field label="Seller Phone">
              <Input
                value={form.supplierPhone}
                onChange={(e) => set("supplierPhone", e.target.value)}
                placeholder="Seller contact number"
              />
            </Field>
          </div>

          {/* Unified Action Footer */}
          <div className="px-5 py-4 bg-muted/30 border-t flex flex-wrap gap-4 items-center justify-between shrink-0">
            <div className="flex gap-6">
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                  Estimated Profit
                </span>
                <span
                  className={`text-lg font-bold ${profitAmt >= 0 ? "text-success" : "text-destructive"}`}
                >
                  {fmt(profitAmt)}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                  Estimated Margin
                </span>
                <span className="text-lg font-bold text-foreground">
                  {form.sellingPrice > 0 ? ((profitAmt / form.sellingPrice) * 100).toFixed(1) : "0.0"}
                  %
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => !addLoading && onClose()}
                disabled={addLoading}
                className="px-5 py-2.5 text-sm rounded-full border border-border hover:bg-muted font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addLoading}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#8b5cf6] via-[#7c3aed] to-[#6366f1] text-white font-semibold text-sm inline-flex items-center gap-2 border border-white/25 shadow-[0_0_20px_rgba(139,92,246,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] hover:shadow-[0_0_28px_rgba(139,92,246,0.55),inset_0_1px_2px_rgba(255,255,255,0.6)] hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group"
              >
                {addLoading ? (
                  <>
                    <RefreshCw className="size-4 animate-spin" />
                    <span>Adding to Stock...</span>
                  </>
                ) : (
                  <>
                    <Plus className="size-4.5 transition-transform duration-300 group-hover:rotate-90" />
                    <span>Add Device to Stock</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
