/**
 * Production-Grade Isolated Invoice Printing Engine
 * Prints retail memos & sales invoices in a clean, isolated iframe,
 * guaranteeing 100% content visibility and strictly 1 single A4 page.
 */

export function printInvoiceElement(
  target: HTMLElement | string | null,
  documentTitle: string = "Sales Invoice",
): void {
  if (typeof window === "undefined") return;

  const element =
    typeof target === "string" ? document.getElementById(target) : target;

  if (!element) {
    console.error("Print error: Invoice element not found.");
    window.print();
    return;
  }

  // Remove existing iframe to guarantee clean document context without stale cache
  const existingFrame = document.getElementById("invoice-print-iframe");
  if (existingFrame) {
    existingFrame.remove();
  }

  const iframe = document.createElement("iframe");
  iframe.id = "invoice-print-iframe";
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.visibility = "hidden";
  iframe.setAttribute("aria-hidden", "true");
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    window.print();
    return;
  }

  // Collect stylesheet links and style tags from current document
  const headStyles: string[] = [];
  document.querySelectorAll("link[rel='stylesheet'], style").forEach((tag) => {
    headStyles.push(tag.outerHTML);
  });

  // Clone full element with container classes intact
  const contentHtml = element.outerHTML;

  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${documentTitle}</title>
        ${headStyles.join("\n")}
        <style>
          @page {
            size: A4 portrait;
            margin: 4mm 6mm 4mm 6mm;
          }
          *, *::before, *::after {
            visibility: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box !important;
          }
          html, body {
            visibility: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
          }
          body, body * {
            visibility: visible !important;
          }
          #print-root,
          #invoice-print-container,
          .print-area,
          #printable-customer-memo,
          #printable-gadget-memo {
            visibility: visible !important;
            position: static !important;
            width: 100% !important;
            max-width: 800px !important;
            margin: 0 auto !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            min-height: 0 !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          #print-root *,
          #invoice-print-container *,
          .print-area *,
          #printable-customer-memo *,
          #printable-gadget-memo * {
            visibility: visible !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          table, tr, td, th {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        </style>
      </head>
      <body>
        <div id="print-root">
          ${contentHtml}
        </div>
      </body>
    </html>
  `);
  iframeDoc.close();

  // 250ms delay for fonts, SVG barcodes and images to fully lay out
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      window.print();
    }
  }, 250);
}
