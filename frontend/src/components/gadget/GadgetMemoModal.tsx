import React from "react";
import { Receipt, Printer, X } from "lucide-react";
import type { GadgetSale } from "@/lib/gadget-store";
import { useAppSelector } from "@/store";
import { printInvoiceElement } from "@/lib/invoice-printer";
import {
  SvgBarcode,
  PaidStampSvg,
  numberToWords,
} from "@/components/settings/InvoiceSettingsModal";

export interface GadgetMemoModalProps {
  sale: GadgetSale | null;
  onClose: () => void;
}

export function GadgetMemoModal({ sale, onClose }: GadgetMemoModalProps) {
  if (!sale) return null;

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
          "If there is any issue with the product within 7 days, it must be reported.",
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

  const invoiceNumber =
    sale.invoiceNumber ||
    `GAD-${sale.id ? sale.id.slice(-8).toUpperCase() : "1001"}`;

  const warrantyText =
    sale.warrantyDays && sale.warrantyDays > 0 && sale.warrantyExpiry
      ? `Until ${new Date(sale.warrantyExpiry).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })} (${sale.warrantyDays}d)`
      : "No warranty applicable";

  const itemTotal = sale.totalPrice || sale.sellingPrice * sale.quantity;

  const memoScrollRef = React.useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    printInvoiceElement("printable-gadget-memo", `Invoice-${invoiceNumber}`);
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
            #printable-gadget-memo,
            #printable-gadget-memo * {
              visibility: visible !important;
            }
            #printable-gadget-memo {
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
              <h3 className="font-bold text-sm text-slate-900 leading-tight">Gadget Sales Invoice</h3>
              <p className="text-[11px] text-slate-500">Official retail print-ready gadget memo</p>
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
          id="printable-gadget-memo"
          className="print-area relative mx-auto min-h-[850px] print:min-h-0 print:h-auto max-w-[800px] bg-white p-6 sm:p-9 print:p-0 font-sans text-slate-900 select-text"
        >
          {/* Watermark */}
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
                <div>User: <span className="font-semibold text-slate-800">{sale.salesPerson || "Admin"}</span></div>
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

          {/* Customer & Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3 border-b border-slate-300 text-[11.5px]">
            <div>
              <span className="font-bold uppercase text-slate-500 text-[10px] tracking-wider">Customer:</span>
              <div className="font-black text-slate-950 text-sm mt-0.5 uppercase">
                {sale.customerName || "WALK-IN CUSTOMER"}
              </div>
              <div className="text-slate-700 font-medium">Contact: {sale.customerPhone || "-"}</div>
              <div className="text-slate-600">Client ID: CU/${sale.id ? sale.id.slice(-4) : "001"}</div>
            </div>
            <div>
              <span className="font-bold uppercase text-slate-500 text-[10px] tracking-wider">Payment & Warranty:</span>
              <div className="text-slate-800 font-semibold mt-0.5">
                Payment Method: {sale.paymentMethod || "Cash"}
              </div>
              <div className="text-slate-600 mt-1">
                Warranty: <span className="font-medium text-slate-800">{warrantyText}</span>
              </div>
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
                      {sale.productName}
                    </div>
                    <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                      Original Smart Accessory & Gadget
                    </div>
                    {sale.warrantyDays && sale.warrantyDays > 0 ? (
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Warranty: {warrantyText}
                      </div>
                    ) : null}
                  </td>
                  <td className="py-2.5 text-right font-mono font-medium text-slate-800">
                    {new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(sale.sellingPrice)}
                  </td>
                  <td className="py-2.5 text-center font-medium">
                    {sale.quantity.toFixed(2)} Pcs
                  </td>
                  <td className="py-2.5 text-right font-mono text-slate-600">
                    0.00
                  </td>
                  <td className="py-2.5 text-right font-mono font-bold text-slate-950">
                    {new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(itemTotal)}
                  </td>
                </tr>
                {/* Authentic blank rows (hidden during print to save page space) */}
                <tr className="h-6 border-b border-slate-100 print:hidden"><td colSpan={6} /></tr>
              </tbody>
            </table>
          </div>

          {/* Sub Total & Paid Stamp Section */}
          <div className="flex flex-col sm:flex-row items-start justify-between border-t-2 border-slate-400 pt-2.5 gap-4">
            <div className="flex-1 pr-2">
              {showAmountInWords && (
                <div className="text-[11px] font-bold uppercase text-slate-800 leading-snug">
                  Amount in words: <span className="font-extrabold text-slate-950">{numberToWords(itemTotal)}</span>
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
                  {new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(itemTotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Gross Total:</span>
                <span className="font-mono font-bold text-slate-950">
                  {new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(itemTotal)}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-300 pt-1 font-bold text-slate-950">
                <span>Paid Amount:</span>
                <span className="font-mono">
                  {new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(itemTotal)}
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
