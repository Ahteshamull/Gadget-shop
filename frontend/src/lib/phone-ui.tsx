import { Sale, profit, warrantyStatus } from "./phone-store";
import React from "react";
import { Receipt, Wallet, Shield, X, Printer, type LucideIcon } from "lucide-react";
import { useAppSelector } from "../store";
import { printInvoiceElement } from "./invoice-printer";
import {
  SvgBarcode,
  PaidStampSvg,
  numberToWords,
} from "@/components/settings/InvoiceSettingsModal";

export function fmt(n: number) {
  return "Tk " + new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
}
export function download(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5 mb-3.5 sm:mb-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {children && <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">{children}</div>}
    </div>
  );
}

export function SalesTable({ sales, onSelect, compact }: { sales: Sale[]; onSelect?: (s: Sale) => void; compact?: boolean }) {
  if (sales.length === 0) return <div className="p-10 text-center text-sm text-muted-foreground">No sales found.</div>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
          <tr>
            <th className="text-left p-3">Invoice</th>
            {!compact && <th className="text-left p-3">IMEI</th>}
            <th className="text-left p-3">Phone</th>
            <th className="text-left p-3">Customer</th>
            <th className="text-left p-3">Date</th>
            <th className="text-right p-3">Price</th>
            {!compact && <th className="text-right p-3">Profit</th>}
            <th className="text-left p-3">Warranty</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((s) => {
            const w = warrantyStatus(s);
            return (
              <tr key={s.id} onClick={() => onSelect?.(s)}
                className={`border-t hover:bg-accent/40 ${onSelect ? "cursor-pointer" : ""}`}>
                <td className="p-3 font-mono text-xs">{s.invoiceNumber}</td>
                {!compact && <td className="p-3 font-mono text-xs">{s.imei}</td>}
                <td className="p-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Brand:
                      </span>
                      <span className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-bold text-primary">
                        {s.brand}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Model:
                      </span>
                      <span className="text-xs font-semibold text-foreground">
                        {s.model}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="p-3"><div className="font-medium">{s.customerName}</div><div className="text-xs text-muted-foreground">{s.customerPhone}</div></td>
                <td className="p-3 text-xs">{new Date(s.saleDate).toLocaleDateString()}</td>
                <td className="p-3 text-right font-medium">{fmt(s.finalPrice)}</td>
                {!compact && <td className="p-3 text-right text-success">{fmt(profit(s))}</td>}
                <td className="p-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${w.active ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                    {w.active ? `${w.days}d` : "Expired"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function DetailModal({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  const w = warrantyStatus(sale);
  const saleProfit = profit(sale);
  const saleDate = new Date(sale.saleDate);
  const warrantyDate = new Date(sale.warrantyExpiry).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-card rounded-2xl max-w-3xl w-full max-h-[calc(100vh-2rem)] overflow-auto shadow-2xl border" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 overflow-hidden border-b bg-card">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-primary to-emerald-500" />
          <div className="flex items-start justify-between gap-4 p-5">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 to-emerald-500 text-white shadow-sm">
                <Receipt className="size-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Sales Record</div>
                <h3 className="truncate text-lg font-extrabold text-foreground">{sale.invoiceNumber || "Invoice"}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {saleDate.toLocaleString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-2xl border bg-gradient-to-br from-sky-50 via-card to-emerald-50 p-4 shadow-sm dark:from-slate-900 dark:via-slate-950 dark:to-emerald-950/60">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Device</div>
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase text-muted-foreground">Brand:</span>
                      <span className="inline-flex rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                        {sale.brand}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase text-muted-foreground">Model:</span>
                      <span className="text-base font-extrabold text-foreground">
                        {sale.model}
                      </span>
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {[sale.variant, sale.color, sale.ram, sale.storage].filter(Boolean).join(" | ") || "Device details"}
                  </div>
                </div>
                <div className="rounded-xl bg-white/75 px-3 py-1.5 text-right shadow-sm border border-white/80 dark:border-slate-700 dark:bg-slate-900/90">
                  <div className="text-[10px] uppercase text-muted-foreground font-bold">IMEI</div>
                  <div className="font-mono text-xs font-semibold text-foreground">{sale.imei || "-"}</div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Customer</div>
              <div className="mt-2 text-lg font-extrabold text-foreground">{sale.customerName || "-"}</div>
              <div className="mt-1 space-y-1 text-sm text-muted-foreground">
                <div>{sale.customerPhone || "-"}</div>
                <div>{sale.email || "-"}</div>
                <div>{sale.address || "-"}</div>
              </div>
            </section>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Purchase</div>
              <div className="mt-1 text-xl font-extrabold text-foreground">{fmt(sale.purchasePrice)}</div>
            </div>
            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Final Price</div>
              <div className="mt-1 text-xl font-extrabold text-foreground">{fmt(sale.finalPrice)}</div>
            </div>
            <div className={`rounded-2xl border p-4 shadow-sm ${saleProfit >= 0 ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/45 dark:border-emerald-800/70" : "bg-red-50 border-red-200 dark:bg-red-950/45 dark:border-red-800/70"}`}>
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Profit</div>
              <div className={`mt-1 text-xl font-extrabold ${saleProfit >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>
                {fmt(saleProfit)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border bg-card p-4 shadow-sm">
              <Divider icon={Wallet} label="Sale Details" />
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoRow label="Payment Method" value={sale.paymentMethod || "-"} />
                <InfoRow label="Sales Person" value={sale.salesPerson || "-"} />
                <InfoRow label="Sale Date" value={saleDate.toLocaleDateString()} />
                <InfoRow label="Invoice" value={sale.invoiceNumber || "-"} mono />
              </div>
            </section>

            <section className="rounded-2xl border bg-card p-4 shadow-sm">
              <Divider icon={Shield} label="Warranty" />
              <div className={`mt-4 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${w.active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300" : "bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-300"}`}>
                {w.active ? `Active - ${w.days} days remaining` : "Warranty Expired"}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">Warranty until {warrantyDate}</div>
            </section>
          </div>

          <section className="rounded-2xl border bg-card p-4 shadow-sm">
            <h4 className="text-xs uppercase text-muted-foreground mb-3 font-bold tracking-wider">Ownership History</h4>
            <div className="space-y-3">
              {sale.ownership.map((o, i) => (
                <div key={i} className="relative flex gap-3 rounded-xl bg-muted/35 p-3 dark:bg-slate-900/80">
                  <div className="mt-1 size-2.5 rounded-full bg-primary ring-4 ring-primary/10" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-foreground">{o.owner} <span className="text-xs font-medium text-muted-foreground">({o.note})</span></div>
                    <div className="text-xs text-muted-foreground">{o.phone}</div>
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0">{new Date(o.transferDate).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Divider({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex items-center gap-2 pt-2 border-t">
      <Icon className="size-3.5 text-primary" />
      <span className="text-xs uppercase text-muted-foreground font-medium">{label}</span>
    </div>
  );
}
export function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-sm ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}

export function CustomerMemoModal({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  const businessProfile = useAppSelector((state) => state.businessProfile);
  const shopName = businessProfile?.shopName || "";
  const shopTagline = businessProfile?.shopTagline || "";
  const shopLogoUrl = businessProfile?.shopLogoUrl || "";
  const shopAddress = businessProfile?.shopAddress || "";
  const shopPhone = businessProfile?.shopPhone || "";
  const shopEmail = businessProfile?.shopEmail || "";
  const invoiceTitle = businessProfile?.invoiceTitle || "SALES INVOICE";
  const invoiceTerms =
    businessProfile?.invoiceTerms && businessProfile.invoiceTerms.length > 0
      ? businessProfile.invoiceTerms
      : [
          "No warranty will be given if the product does not have a warranty bill, sticker, box or accessories.",
          "Warranty will be void if there are scratches or water damage or display damage on the product.",
          "If there is a problem with the phone within 7 days, it must be reported.",
          "Customer ID must be shown when claiming warranty.",
          "No claim will be accepted without original cash memo.",
          "Sold goods are non-refundable.",
        ];
  const invoiceFooterNote =
    businessProfile?.invoiceFooterNote ||
    (shopName ? `${shopName} © ${new Date().getFullYear()}` : `© ${new Date().getFullYear()}`);
  const showWatermark = businessProfile?.showWatermark ?? true;
  const showPaidStamp = businessProfile?.showPaidStamp ?? true;
  const showBarcode = businessProfile?.showBarcode ?? true;
  const showQrCode = businessProfile?.showQrCode ?? true;
  const showSignatures = businessProfile?.showSignatures ?? true;
  const showAmountInWords = businessProfile?.showAmountInWords ?? true;

  const shopInitials =
    shopName
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "AB";

  const totalPrice = sale.finalPrice || sale.sellingPrice;
  const discount = Math.max(0, sale.discount || 0);
  const subtotal = totalPrice + discount;
  const warrantyText = sale.warrantyExpiry
    ? new Date(sale.warrantyExpiry).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Standard";
  const saleDate = new Date(sale.saleDate);
  const formattedDate = saleDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const formattedTime = saleDate.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const invoiceNumber = sale.invoiceNumber || `SEL-${sale.id ? sale.id.slice(-8).toUpperCase() : "1001"}`;

  const memoScrollRef = React.useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    printInvoiceElement("printable-customer-memo", `Invoice-${invoiceNumber}`);
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-xs print:p-0 print:bg-transparent print:static print:block"
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @media print {
            @page {
              size: A4 portrait;
              margin: 4mm 6mm 4mm 6mm;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #0f172a !important;
              height: auto !important;
              overflow: visible !important;
            }
            body * {
              visibility: hidden !important;
            }
            #printable-customer-memo,
            #printable-customer-memo * {
              visibility: visible !important;
            }
            #printable-customer-memo {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              max-width: 800px !important;
              margin: 0 auto !important;
              padding: 0 !important;
              border: none !important;
              box-shadow: none !important;
              background: #ffffff !important;
              page-break-after: avoid !important;
              break-after: avoid !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          }
        `,
        }}
      />

      <div
        ref={memoScrollRef}
        className="bg-white text-slate-950 rounded-2xl max-w-4xl w-full max-h-[calc(100vh-1.5rem)] overflow-y-auto shadow-2xl border border-slate-200 print:border-none print:shadow-none print:max-w-none print:w-full print:max-h-none print:static print:overflow-visible"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toolbar - hidden during print */}
        <div className="flex flex-col gap-3 p-4 border-b border-slate-200 sticky top-0 bg-white/95 backdrop-blur-sm z-10 print:hidden sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-cyan-600/10 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-300">
              <Receipt className="size-4.5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 leading-tight">Customer Sales Invoice</h3>
              <p className="text-[11px] text-slate-500">Official retail print-ready customer memo</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:via-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Printer className="size-4" /> Print Invoice
            </button>
            <button
              type="button"
              onClick={onClose}
              className="size-8 flex items-center justify-center hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              title="Close memo"
            >
              <X className="size-4.5" />
            </button>
          </div>
        </div>

        {/* Printable Memo Area matching the physical photo */}
        <div
          id="printable-customer-memo"
          className="print-area relative mx-auto min-h-[850px] print:min-h-0 print:h-auto max-w-[800px] bg-white p-6 sm:p-9 print:p-0 font-sans text-slate-900 select-text"
        >
          {/* Subtle Watermark */}
          {showWatermark && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.03] select-none">
              <span className="text-7xl sm:text-8xl font-black uppercase -rotate-25 tracking-widest text-slate-950">
                {shopName || "ORIGINAL"}
              </span>
            </div>
          )}

          {/* Header Row: Left Shop Info | Right Barcode & Meta */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pb-4 border-b-2 border-slate-300">
            {/* Shop branding */}
            <div className="flex items-start gap-3.5 max-w-sm">
              {shopLogoUrl ? (
                <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-white p-1 border border-slate-300 shadow-2xs overflow-hidden">
                  <img src={shopLogoUrl} alt={shopName} className="size-full object-contain object-center" />
                </div>
              ) : (
                <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white font-black text-lg shadow-2xs">
                  {shopInitials}
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-lg font-black uppercase tracking-tight text-slate-950">
                  {shopName}
                </h2>
                {shopTagline && (
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                    {shopTagline}
                  </div>
                )}
                {shopAddress && (
                  <div className="text-[11px] text-slate-600 mt-1 leading-tight">
                    {shopAddress}
                  </div>
                )}
                {shopPhone && (
                  <div className="text-[11px] text-slate-700 mt-1 font-semibold">
                    Mobile: {shopPhone}
                  </div>
                )}
                {shopEmail && (
                  <div className="text-[11px] text-slate-600">
                    Email: {shopEmail}
                  </div>
                )}
              </div>
            </div>

            {/* Barcode & Invoice Meta */}
            <div className="text-left sm:text-right shrink-0">
              {showBarcode && (
                <div className="flex sm:justify-end mb-1">
                  <SvgBarcode value={invoiceNumber} />
                </div>
              )}
              <div className="text-[11px] space-y-0.5 text-slate-600 font-mono">
                <div>Invoice N°: <span className="font-bold text-slate-950">{invoiceNumber}</span></div>
                <div>InvSL: <span className="font-bold">#{sale.id ? sale.id.slice(-4) : "001"}</span></div>
                <div>User: <span className="font-semibold text-slate-800">{sale.salesPerson || sale.addedBy || "Admin"}</span></div>
                <div>Date: {formattedDate} {formattedTime}</div>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="py-3 text-center">
            <h3 className="text-base font-black tracking-widest uppercase text-slate-900 border-b border-t border-slate-300 inline-block px-8 py-0.5">
              {invoiceTitle}
            </h3>
          </div>

          {/* Customer & Address Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3 border-b border-slate-300 text-[11.5px]">
            <div>
              <span className="font-bold uppercase text-slate-500 text-[10px] tracking-wider">Customer:</span>
              <div className="font-black text-slate-950 text-sm mt-0.5 uppercase">
                {sale.customerName || "WALK-IN CUSTOMER"}
              </div>
              <div className="text-slate-700 font-medium">Contact: {sale.customerPhone || "-"}</div>
              {sale.altPhone && <div className="text-slate-600">Alt Contact: {sale.altPhone}</div>}
              <div className="text-slate-600">Client ID: {sale.nid ? `NID: ${sale.nid}` : `CU/${sale.id ? sale.id.slice(-4) : "001"}`}</div>
            </div>
            <div>
              <span className="font-bold uppercase text-slate-500 text-[10px] tracking-wider">Address:</span>
              <div className="text-slate-800 font-semibold mt-0.5 uppercase">
                {sale.address || "N/A"}
              </div>
              {sale.email && <div className="text-slate-600 mt-1">Email: {sale.email}</div>}
              <div className="text-slate-600 mt-1">Payment Method: <span className="font-semibold text-slate-800">{sale.paymentMethod || "Cash"}</span></div>
            </div>
          </div>

          {/* Items Table matching retail format */}
          <div className="overflow-x-auto print:overflow-visible w-full my-3">
            <table className="w-full min-w-[500px] print:min-w-0 text-[11.5px] border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-400 text-slate-800 font-black text-[10.5px] uppercase">
                  <th className="py-1.5 text-left w-8">N°</th>
                  <th className="py-1.5 text-left">Description(Code)</th>
                  <th className="py-1.5 text-right w-24">Price</th>
                  <th className="py-1.5 text-center w-16">Qty</th>
                  <th className="py-1.5 text-right w-16">Dis</th>
                  <th className="py-1.5 text-right w-24">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-2.5 align-top font-semibold">1</td>
                  <td className="py-2.5">
                    <div className="font-bold text-slate-950 text-xs">
                      {sale.brand} {sale.model} {[sale.variant, sale.color, sale.ram, sale.storage].filter(Boolean).join(" ")}
                    </div>
                    <div className="text-[11px] font-mono text-slate-700 font-semibold mt-0.5">
                      IMEI# {sale.imei || "N/A"}
                    </div>
                    {sale.warrantyExpiry && (
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Warranty: Until {warrantyText}
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 text-right font-mono font-medium text-slate-800">
                    {new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(subtotal)}
                  </td>
                  <td className="py-2.5 text-center font-medium">
                    {(sale.quantity || 1).toFixed(2)} Pcs
                  </td>
                  <td className="py-2.5 text-right font-mono text-slate-600">
                    {discount > 0
                      ? new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(discount)
                      : "0.00"}
                  </td>
                  <td className="py-2.5 text-right font-mono font-bold text-slate-950">
                    {new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalPrice)}
                  </td>
                </tr>
                {/* Authentic printed invoice extra blank rows (hidden during print to save space) */}
                <tr className="h-6 border-b border-slate-100 print:hidden"><td colSpan={6} /></tr>
              </tbody>
            </table>
          </div>

          {/* Sub Total & Paid Stamp Section */}
          <div className="flex flex-col sm:flex-row items-start justify-between border-t-2 border-slate-400 pt-2.5 gap-4">
            <div className="flex-1 pr-2">
              {showAmountInWords && (
                <div className="text-[11px] font-bold uppercase text-slate-800 leading-snug">
                  Amount in words: <span className="font-extrabold text-slate-950">{numberToWords(totalPrice)}</span>
                </div>
              )}
              {sale.notes && (
                <div className="mt-2 text-[10.5px] text-slate-600">
                  <span className="font-bold text-slate-700 uppercase">Notes: </span>
                  {sale.notes}
                </div>
              )}
            </div>

            <div className="w-44 space-y-1 text-right text-[11.5px] self-end sm:self-start shrink-0">
              <div className="flex justify-between">
                <span className="text-slate-600">Sub Total:</span>
                <span className="font-mono font-bold text-slate-800">
                  {new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(subtotal)}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount:</span>
                  <span className="font-mono font-bold">
                    - {new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(discount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-600">Gross Total:</span>
                <span className="font-mono font-bold text-slate-950">
                  {new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalPrice)}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-300 pt-1 font-bold text-slate-950">
                <span>Paid Amount:</span>
                <span className="font-mono">
                  {new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalPrice)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Outstanding:</span>
                <span className="font-mono">0.00</span>
              </div>
            </div>
          </div>

          {/* Terms & Conditions Box matching the physical printed photo */}
          {invoiceTerms.length > 0 && (
            <div className="mt-4 print:mt-2.5 pt-2 border-t border-slate-300">
              <div className="font-extrabold text-[10px] print:text-[9.5px] uppercase text-slate-900 mb-1">
                Terms & Conditions:
              </div>
              <ul className="space-y-0.5 print:space-y-0 text-[9.5px] print:text-[8.5px] text-slate-700 leading-tight">
                {invoiceTerms.map((term, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="font-bold text-slate-900">•</span>
                    <span>{term}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Signatures */}
          {showSignatures && (
            <div className="mt-8 print:mt-4 pt-3 print:pt-2 flex items-end justify-between gap-4">
              <div className="w-36 sm:w-44 text-center border-t border-slate-500 pt-1 text-[10.5px] print:text-[9.5px] font-semibold text-slate-800">
                Customer Signature
              </div>

              <div className="w-36 sm:w-44 text-center border-t border-slate-500 pt-1 text-[10.5px] print:text-[9.5px] font-semibold text-slate-800">
                Authorized Signature
              </div>
            </div>
          )}

          {/* Footer copyright note */}
          <div className="mt-5 print:mt-2 pt-2 print:pt-1 text-center text-[9.5px] print:text-[8px] text-slate-500 font-mono tracking-wider border-t border-slate-200">
            {invoiceFooterNote}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Metric({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-lg font-semibold ${positive === false ? "text-destructive" : positive ? "text-success" : ""}`}>{value}</div>
    </div>
  );
}
