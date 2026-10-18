import React from "react";
import {
  Sparkles,
  X,
  Search as SearchIcon,
  Smartphone,
  Cpu,
  HardDrive,
  Palette,
  ChevronRight,
  User,
  BadgeDollarSign,
  ArrowLeft,
  Check,
  CheckCircle2,
  Printer,
} from "lucide-react";
import type { Sale } from "@/lib/phone-store";
import { fmt } from "@/lib/phone-ui";

export type WizardStep = "pick" | "customer";

export function blankCustomer(_phone?: Sale | null) {
  return {
    customerName: "",
    customerPhone: "",
    altPhone: "",
    email: "",
    nid: "",
    address: "",
    saleDate: new Date().toISOString(),
    quantity: 1,
    discount: 0,
    finalPrice: 0,
    paymentMethod: "Cash",
    salesPerson: "",
    warrantyDays: 365 as number | undefined,
    warrantyExpiry: new Date(Date.now() + 365 * 86400000).toISOString(),
    notes: "",
  };
}

export function StepDot({
  n,
  label,
  active,
  done,
}: {
  n: number;
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`size-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
          done
            ? "bg-primary text-primary-foreground"
            : active
              ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
              : "bg-muted text-muted-foreground"
        }`}
      >
        {done ? <Check className="size-3.5" /> : n}
      </div>
      <span
        className={`text-xs font-medium transition-colors ${active || done ? "text-foreground" : "text-muted-foreground"}`}
      >
        {label}
      </span>
    </div>
  );
}

export function WFormSection({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3 pb-2 border-b">
        <Icon className="size-3.5 text-primary" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

export function WField({
  label,
  children,
  wide,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${wide ? "sm:col-span-2" : ""}`}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export function WInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary caret-primary hover:border-slate-400 dark:hover:border-slate-600 transition-all placeholder:text-muted-foreground/60 cursor-text ${props.className || ""}`}
    />
  );
}

export interface NewSaleWizardProps {
  step: WizardStep;
  available: Sale[];
  wizardQ: string;
  setWizardQ: (v: string) => void;
  pickedPhone: Sale | null;
  customerForm: ReturnType<typeof blankCustomer> | null;
  setCustomer: <K extends keyof ReturnType<typeof blankCustomer>>(
    k: K,
    v: ReturnType<typeof blankCustomer>[K],
  ) => void;
  onPickPhone: (p: Sale) => void;
  onBack: () => void;
  onConfirm: () => void;
  onClose: () => void;
  successId: string | null;
  totalAvailable: number;
  onPrintMemo: () => void;
}

export function NewSaleWizard({
  step,
  available,
  wizardQ,
  setWizardQ,
  pickedPhone,
  customerForm,
  setCustomer,
  onPickPhone,
  onBack,
  onConfirm,
  onClose,
  successId,
  totalAvailable,
  onPrintMemo,
}: NewSaleWizardProps) {
  const actualSellPrice = Math.max(0, customerForm?.finalPrice ?? 0);
  const manualDiscount = Math.max(0, customerForm?.discount ?? 0);
  const totalSellPrice = Math.max(0, actualSellPrice - manualDiscount);
  const saleProfitLoss = pickedPhone ? totalSellPrice - pickedPhone.purchasePrice : 0;
  const profitLossLabel =
    saleProfitLoss > 0 ? "Profit" : saleProfitLoss < 0 ? "Loss" : "No profit/loss";
  const profitLossClass =
    saleProfitLoss > 0
      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
      : saleProfitLoss < 0
        ? "bg-red-500/10 text-red-700 border-red-500/20"
        : "bg-muted text-muted-foreground border-border";

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 pointer-events-none sm:p-4">
        <div
          className="bg-card w-full max-w-2xl max-h-[92dvh] sm:max-h-[88dvh] rounded-2xl shadow-2xl border overflow-hidden flex flex-col pointer-events-auto animate-in zoom-in-95 fade-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal header */}
          <div className="flex flex-col gap-3 px-4 py-4 border-b bg-gradient-to-r from-primary/5 to-transparent sm:flex-row sm:items-center sm:justify-between sm:px-6 shrink-0">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="size-4.5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-foreground">New Sale</h2>
                <p className="text-xs text-muted-foreground">
                  {successId
                    ? "Sale completed successfully"
                    : step === "pick"
                      ? `Select a phone from ${totalAvailable} available`
                      : "Enter customer details"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="size-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Step indicator */}
          {!successId && (
            <div className="flex items-center gap-0 px-4 sm:px-6 pt-4 pb-0 shrink-0">
              <StepDot
                n={1}
                label="Select Phone"
                active={step === "pick"}
                done={step === "customer"}
              />
              <div
                className={`flex-1 h-px mx-2 transition-colors ${step === "customer" ? "bg-primary" : "bg-muted"}`}
              />
              <StepDot n={2} label="Customer Info" active={step === "customer"} done={false} />
            </div>
          )}

          {/* ── Success state ───────────────────────── */}
          {successId && (
            <div className="flex-1 flex flex-col items-center justify-center py-14 px-8 text-center gap-4">
              <div className="size-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="size-10 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Sale Confirmed!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  The phone has been sold and the record has been updated.
                </p>
              </div>
              <div className="flex gap-2.5 mt-2 flex-wrap justify-center">
                <button
                  onClick={onPrintMemo}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all cursor-pointer shadow-md shadow-primary/20"
                >
                  <Printer className="size-4" /> Print Customer Memo
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl border font-semibold text-sm hover:bg-muted transition-all cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* ── Step 1: Pick Phone ──────────────────── */}
          {!successId && step === "pick" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-4 sm:px-6 pt-3 sm:pt-4 pb-3">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    id="wizard-search"
                    autoFocus
                    type="text"
                    value={wizardQ}
                    onChange={(e) => setWizardQ(e.target.value)}
                    placeholder="Search by IMEI, brand, model, color, storage…"
                    className="w-full pl-10 pr-9 py-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                  {wizardQ && (
                    <button
                      onClick={() => setWizardQ("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 pb-4 sm:px-6 sm:pb-6 space-y-2">
                {available.length === 0 && (
                  <div className="py-16 text-center text-muted-foreground">
                    <Smartphone className="size-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">No available phones found</p>
                    <p className="text-xs opacity-60 mt-1">Try a different search term</p>
                  </div>
                )}
                {available.map((phone) => (
                  <button
                    key={phone.id}
                    onClick={() => onPickPhone(phone)}
                    className="w-full text-left group flex items-center gap-4 p-4 rounded-xl border bg-card hover:border-primary/40 hover:bg-primary/3 hover:shadow-sm transition-all duration-150"
                  >
                    <div className="size-11 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                      <Smartphone className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground truncate">
                        {phone.brand} {phone.model}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                        {phone.ram && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Cpu className="size-2.5" />
                            {phone.ram}
                          </span>
                        )}
                        {phone.storage && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <HardDrive className="size-2.5" />
                            {phone.storage}
                          </span>
                        )}
                        {phone.color && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Palette className="size-2.5" />
                            {phone.color}
                          </span>
                        )}
                      </div>
                      {phone.imei && (
                        <div className="text-[10px] font-mono text-muted-foreground/60 mt-1 flex items-center gap-1">
                          <Smartphone className="size-2.5" />
                          {phone.imei}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs text-muted-foreground">Estimate</div>
                      <div className="font-bold text-primary">{fmt(phone.sellingPrice)}</div>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 2: Customer Info ───────────────── */}
          {!successId && step === "customer" && pickedPhone && customerForm && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Selected phone summary */}
              <div className="mx-3 sm:mx-6 mt-3 sm:mt-4 mb-3 flex items-center gap-3 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl bg-primary/5 border border-primary/15 shrink-0">
                <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Smartphone className="size-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-foreground truncate">
                    {pickedPhone.brand} {pickedPhone.model}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {[pickedPhone.color, pickedPhone.ram, pickedPhone.storage]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] text-muted-foreground">Purchase</div>
                  <div className="font-bold text-foreground">{fmt(pickedPhone.purchasePrice)}</div>
                  <div className="mt-0.5 text-[10px] text-muted-foreground">
                    Estimate {fmt(pickedPhone.sellingPrice)}
                  </div>
                  <button
                    onClick={onBack}
                    className="text-[10px] text-muted-foreground hover:text-primary underline transition-colors"
                  >
                    Change
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 pb-2 sm:px-6 space-y-4 sm:space-y-5">
                {/* Customer section */}
                <WFormSection icon={User} label="Customer Information">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <WField label="Customer Name *">
                      <WInput
                        autoFocus
                        value={customerForm.customerName}
                        onChange={(e) => setCustomer("customerName", e.target.value)}
                        placeholder="Full name"
                      />
                    </WField>
                    <WField label="Phone Number *">
                      <WInput
                        value={customerForm.customerPhone}
                        onChange={(e) => setCustomer("customerPhone", e.target.value)}
                        placeholder="+880..."
                      />
                    </WField>
                    <WField label="NID (optional)">
                      <WInput
                        value={customerForm.nid}
                        onChange={(e) => setCustomer("nid", e.target.value)}
                        placeholder="National ID number"
                      />
                    </WField>
                    <WField label="Address">
                      <WInput
                        value={customerForm.address}
                        onChange={(e) => setCustomer("address", e.target.value)}
                        placeholder="City, district"
                      />
                    </WField>
                  </div>
                </WFormSection>

                {/* Sale section */}
                <WFormSection icon={BadgeDollarSign} label="Sale Details">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <WField label="Sale Date (auto)">
                      <div className="px-3 py-2 rounded-lg border bg-muted/40 text-sm font-medium text-muted-foreground flex items-center justify-between h-[38px]">
                        <span>
                          {new Date(customerForm.saleDate || Date.now()).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                          Auto
                        </span>
                      </div>
                    </WField>
                    <WField label="Payment Method">
                      <select
                        className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                        value={customerForm.paymentMethod}
                        onChange={(e) => setCustomer("paymentMethod", e.target.value)}
                      >
                        {["Cash", "Card", "Mobile Banking", "Bank Transfer", "Installment"].map(
                          (p) => (
                            <option key={p}>{p}</option>
                          ),
                        )}
                      </select>
                    </WField>
                    <WField label="Actual Sell Price (Tk) *">
                      <WInput
                        type="number"
                        min="0"
                        value={customerForm.finalPrice || ""}
                        onChange={(e) => {
                          const price = Math.max(0, +e.target.value);
                          setCustomer("finalPrice", price);
                        }}
                        placeholder="Price before discount"
                        className="font-semibold"
                      />
                      <span className="text-[10px] text-muted-foreground">
                        Estimate {fmt(pickedPhone.sellingPrice)} is only a guide. Sell lower or
                        higher anytime.
                      </span>
                    </WField>
                    <WField label="Customer Discount (Tk)">
                      <WInput
                        type="number"
                        min="0"
                        value={customerForm.discount || ""}
                        onChange={(e) => setCustomer("discount", Math.max(0, +e.target.value))}
                        placeholder="Manual discount amount"
                        className="font-semibold"
                      />
                      <span className="text-[10px] text-muted-foreground">
                        Total sell price: {fmt(totalSellPrice)}
                      </span>
                    </WField>
                    <WField label="Sales Person">
                      <WInput
                        value={customerForm.salesPerson}
                        onChange={(e) => setCustomer("salesPerson", e.target.value)}
                        placeholder="Staff name"
                      />
                    </WField>
                    <WField label="Warranty (days)">
                      <div className="flex flex-col gap-1">
                        <WInput
                          type="number"
                          min="0"
                          value={customerForm.warrantyDays ?? ""}
                          onChange={(e) => {
                            const d =
                              e.target.value === "" ? undefined : Math.max(0, +e.target.value);
                            const expiry = new Date(
                              Date.now() + (d ?? 365) * 86400000,
                            ).toISOString();
                            setCustomer("warrantyDays", d);
                            setCustomer("warrantyExpiry", expiry);
                          }}
                          placeholder="e.g. 365"
                        />
                        <span className="text-[10px] text-muted-foreground pl-1">
                          Expires:{" "}
                          {new Date(
                            Date.now() + (customerForm.warrantyDays ?? 365) * 86400000,
                          ).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </WField>
                    <WField label="Notes" wide>
                      <WInput
                        value={customerForm.notes}
                        onChange={(e) => setCustomer("notes", e.target.value)}
                        placeholder="Any remarks (optional)"
                      />
                    </WField>
                  </div>
                </WFormSection>
              </div>

              {/* Confirm footer */}
              <div className="px-4 py-4 border-t bg-muted/10 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 shrink-0">
                <div className="text-sm">
                  <span className="text-muted-foreground">Total: </span>
                  <span className="font-bold text-lg text-foreground">{fmt(totalSellPrice)}</span>
                  <span
                    className={`ml-2 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${profitLossClass}`}
                  >
                    {profitLossLabel}
                    {saleProfitLoss !== 0 ? ` ${fmt(Math.abs(saleProfitLoss))}` : ""}
                  </span>
                  {manualDiscount > 0 && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {fmt(actualSellPrice)} - {fmt(manualDiscount)}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={onBack}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-medium hover:bg-muted transition-all cursor-pointer"
                  >
                    <ArrowLeft className="size-4" /> Back
                  </button>
                  <button
                    id="confirm-sale-btn"
                    onClick={onConfirm}
                    className="group relative inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:opacity-95 active:scale-[0.98] transition-all overflow-hidden cursor-pointer"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    <Check className="size-4" /> Confirm Sale
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
