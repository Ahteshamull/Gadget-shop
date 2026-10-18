import React from "react";
import type { Sale } from "@/lib/phone-store";

export type StockSale = Sale;

export const blankForm = (): StockSale => ({
  id: crypto.randomUUID(),
  imei: "",
  brand: "",
  model: "",
  variant: "",
  color: "",
  ram: "",
  storage: "",
  purchasePrice: 0,
  sellingPrice: 0,
  sellerNID: "",
  supplierName: "",
  supplierPhone: "",
  customerName: "",
  customerPhone: "",
  altPhone: "",
  email: "",
  nid: "",
  address: "",
  invoiceNumber: "",
  saleDate: new Date().toISOString(),
  quantity: 1,
  discount: 0,
  finalPrice: 0,
  paymentMethod: "Cash",
  salesPerson: "",
  warrantyExpiry: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
  notes: "",
  ownership: [],
  buyerName: "",
  buyerPhone: "",
});

export function formatAdminName(name?: string | null): string {
  if (!name) return "";
  const trimmed = name.trim();
  if (!trimmed) return "";
  return trimmed
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function getAddedByAdmin(item?: StockSale | null, fallbackName?: string | null): string {
  const fallback = formatAdminName(fallbackName) || "Mehedi";
  if (!item) return fallback;
  if (item.addedBy && item.addedBy.trim().toLowerCase() !== "admin") {
    return formatAdminName(item.addedBy);
  }
  const seller = (item.supplierName || item.buyerName || "").trim().toLowerCase();
  const person = (item.salesPerson || "").trim();
  if (person && (!seller || person.toLowerCase() !== seller) && person.toLowerCase() !== "admin") {
    return formatAdminName(person);
  }
  return fallback;
}

export function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card rounded-xl border">
      <div className="px-5 py-3.5 border-b flex items-center gap-2">
        <Icon className="size-4 text-primary" />
        <h3 className="font-medium">{title}</h3>
      </div>
      <div className="p-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>
    </div>
  );
}

export function Field({
  label,
  children,
  wide,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${wide ? "sm:col-span-2 lg:col-span-3" : ""}`}>
      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide">{label}</span>
      {children}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`input cursor-text caret-primary ${props.className || ""}`}
      onWheel={(e) => {
        if (e.currentTarget.type === "number") {
          e.currentTarget.blur();
        }
        props.onWheel?.(e);
      }}
    />
  );
}

export { DetailField } from "@/components/ui/DetailModalCommon";

