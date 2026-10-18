import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Sale, warrantyStatus } from "@/lib/phone-store";
import type { Gadget, GadgetSale } from "@/lib/gadget-store";
import { useAppSelector } from "../store";
import { fmt, PageHeader, CustomerMemoModal } from "@/lib/phone-ui";
import { GadgetMemoModal } from "@/components/gadget/GadgetMemoModal";
import { AppPagination } from "@/components/ui/pagination";
import { StatCard } from "@/components/ui/StatCard";
import {
  User, LayoutGrid, List, Search, Calendar,
  CreditCard, Smartphone, Shield, Eye, UserCheck, Package, X, Receipt, Printer, Info, type LucideIcon
} from "lucide-react";
import {
  useModalBackdrop,
  DetailField,
  DetailPricingCards,
} from "@/components/ui/DetailModalCommon";

export const Route = createFileRoute("/customers")({
  head: () => ({ meta: [{ title: "Customers — PhoneTrack" }] }),
  component: Customers,
});

type CustomerSale = {
  id: string;
  type: "Phone" | "Gadget";
  title: string;
  brand: string;
  model: string;
  specs: string;
  identifier: string;
  customerName: string;
  customerPhone: string;
  email?: string;
  address?: string;
  invoiceNumber: string;
  saleDate: string;
  finalPrice: number;
  purchasePrice: number;
  paymentMethod: string;
  salesPerson?: string;
  warranty: { active: boolean; days: number; expiry?: string };
  rawPhoneSale?: Sale;
  rawGadgetSale?: GadgetSale;
};

function extractGadgetBrandModel(productName: string): { brand: string; model: string } {
  const lower = productName.toLowerCase();
  if (lower.includes("apple") || lower.includes("airpod") || lower.includes("iphone") || lower.includes("ipad")) {
    return {
      brand: "Apple",
      model: productName.replace(/apple/i, "").trim() || productName,
    };
  }
  if (lower.includes("samsung")) {
    return {
      brand: "Samsung",
      model: productName.replace(/samsung/i, "").trim() || productName,
    };
  }
  if (lower.includes("xiaomi") || lower.includes("redmi")) {
    return {
      brand: "Xiaomi",
      model: productName.replace(/xiaomi|redmi/i, "").trim() || productName,
    };
  }
  if (lower.includes("realme")) {
    return {
      brand: "Realme",
      model: productName.replace(/realme/i, "").trim() || productName,
    };
  }
  if (lower.includes("oppo")) {
    return {
      brand: "Oppo",
      model: productName.replace(/oppo/i, "").trim() || productName,
    };
  }
  if (lower.includes("vivo")) {
    return {
      brand: "Vivo",
      model: productName.replace(/vivo/i, "").trim() || productName,
    };
  }
  if (lower.includes("oneplus")) {
    return {
      brand: "OnePlus",
      model: productName.replace(/oneplus/i, "").trim() || productName,
    };
  }
  const parts = productName.trim().split(" ");
  if (parts.length > 1) {
    return {
      brand: parts[0],
      model: parts.slice(1).join(" "),
    };
  }
  return {
    brand: "Gadget",
    model: productName,
  };
}

function normalizePhoneSale(sale: Sale): CustomerSale {
  const warranty = warrantyStatus(sale);
  return {
    id: sale.id,
    type: "Phone",
    brand: sale.brand || "—",
    model: sale.model || "—",
    title: `${sale.brand} ${sale.model}`.trim(),
    specs: [sale.ram, sale.storage, sale.color].filter(Boolean).join(" / ") || "Phone",
    identifier: sale.imei || "-",
    customerName: sale.customerName,
    customerPhone: sale.customerPhone,
    email: sale.email,
    address: sale.address,
    invoiceNumber: sale.invoiceNumber,
    saleDate: sale.saleDate,
    finalPrice: sale.finalPrice,
    purchasePrice: sale.purchasePrice,
    paymentMethod: sale.paymentMethod,
    salesPerson: sale.salesPerson,
    warranty: { ...warranty, expiry: sale.warrantyExpiry },
    rawPhoneSale: sale,
  };
}

function normalizeGadgetSale(sale: GadgetSale, gadgets: Gadget[]): CustomerSale {
  const gadget = gadgets.find((item) => item.id === sale.gadgetId);
  const expiry = sale.warrantyExpiry;
  const days = expiry ? Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000) : -1;
  const { brand, model } = extractGadgetBrandModel(sale.productName);

  return {
    id: `gadget-${sale.id}`,
    type: "Gadget",
    brand,
    model,
    title: sale.productName,
    specs: [gadget?.color, gadget?.details].filter(Boolean).join(" / ") || "Accessory / gadget",
    identifier: sale.invoiceNumber || sale.gadgetId,
    customerName: sale.customerName,
    customerPhone: sale.customerPhone,
    invoiceNumber: sale.invoiceNumber,
    saleDate: sale.saleDate,
    finalPrice: sale.totalPrice,
    purchasePrice: (gadget?.purchasePrice ?? 0) * sale.quantity,
    paymentMethod: sale.paymentMethod,
    salesPerson: sale.salesPerson,
    warranty: { active: days >= 0, days, expiry },
    rawGadgetSale: sale,
  };
}

function Customers() {
  const sales = useAppSelector((state) => state.phoneSales.items);
  const gadgets = useAppSelector((state) => state.gadgets.gadgets);
  const gadgetSales = useAppSelector((state) => state.gadgets.sales);
  const [selected, setSelected] = useState<CustomerSale | null>(null);
  const [memoSale, setMemoSale] = useState<
    | { type: "Phone"; sale: Sale }
    | { type: "Gadget"; sale: GadgetSale }
    | null
  >(null);
  const [q, setQ] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [page, setPage] = useState(1);

  // Reset pagination on filter or view mode change
  useEffect(() => {
    setPage(1);
  }, [q, viewMode]);

  // Only consider items that have actually been sold
  const soldSales = useMemo<CustomerSale[]>(() => {
    return [
      ...sales
        .filter((s) => s.customerName && s.customerName.trim() !== "")
        .map(normalizePhoneSale),
      ...gadgetSales
        .filter((s) => s.customerName && s.customerName.trim() !== "")
        .map((sale) => normalizeGadgetSale(sale, gadgets)),
    ];
  }, [sales, gadgetSales, gadgets]);

  // Grouped by customer (for Grid View)
  const groups = useMemo(() => {
    const map = new Map<string, CustomerSale[]>();
    soldSales.forEach((s) => {
      const key = s.customerPhone?.trim() || s.customerName.trim();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    });

    let arr = Array.from(map.values());
    if (q.trim()) {
      const t = q.toLowerCase();
      arr = arr.filter((g) =>
        g[0].customerName.toLowerCase().includes(t) ||
        g[0].customerPhone.toLowerCase().includes(t) ||
        g[0].email?.toLowerCase().includes(t) ||
        g.some((s) =>
          s.brand.toLowerCase().includes(t) ||
          s.model.toLowerCase().includes(t) ||
          s.title.toLowerCase().includes(t) ||
          s.identifier.toLowerCase().includes(t) ||
          s.type.toLowerCase().includes(t)
        )
      );
    }

    // Sort by latest purchase date
    return arr.sort((a, b) => {
      const dateA = new Date(a[0].saleDate).getTime();
      const dateB = new Date(b[0].saleDate).getTime();
      return dateB - dateA;
    });
  }, [soldSales, q]);

  // Flat list of sales (for Table View)
  const flatSales = useMemo(() => {
    let arr = [...soldSales];
    if (q.trim()) {
      const t = q.toLowerCase();
      arr = arr.filter((s) =>
        s.customerName.toLowerCase().includes(t) ||
        s.customerPhone.toLowerCase().includes(t) ||
        s.email?.toLowerCase().includes(t) ||
        s.brand.toLowerCase().includes(t) ||
        s.model.toLowerCase().includes(t) ||
        s.title.toLowerCase().includes(t) ||
        s.identifier.toLowerCase().includes(t) ||
        s.type.toLowerCase().includes(t) ||
        s.invoiceNumber.toLowerCase().includes(t) ||
        (s.salesPerson && s.salesPerson.toLowerCase().includes(t))
      );
    }
    // Sort by date descending
    return arr.sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());
  }, [soldSales, q]);

  // Pagination calculations
  const pageSize = 10;
  const totalItems = viewMode === "grid" ? groups.length : flatSales.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const paginatedGroups = useMemo(() => {
    const start = (page - 1) * pageSize;
    return groups.slice(start, start + pageSize);
  }, [groups, page, pageSize]);

  const paginatedFlatSales = useMemo(() => {
    const start = (page - 1) * pageSize;
    return flatSales.slice(start, start + pageSize);
  }, [flatSales, page, pageSize]);

  const totalRevenue = useMemo(() => {
    return soldSales.reduce((sum, sale) => sum + sale.finalPrice, 0);
  }, [soldSales]);

  const activeWarrantyCount = useMemo(() => {
    return soldSales.filter((sale) => sale.warranty.active).length;
  }, [soldSales]);

  const latestSaleDate = soldSales.length
    ? new Date(Math.max(...soldSales.map((sale) => new Date(sale.saleDate).getTime())))
    : null;

  return (
    <div className="w-full px-4 md:px-6 lg:px-8 max-w-[1800px] mx-auto pb-8 space-y-6">
      <PageHeader
        title="Customers & Sales Info"
        subtitle={`${soldSales.length} total transactions · ${groups.length} customers tracked`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 mb-4">
        <StatCard
          icon={User}
          label="Total Customers"
          value={String(groups.length)}
          sub="Unique buyers list"
          todaySub={`${groups.length} accounts`}
          variant="blue"
        />
        <StatCard
          icon={Smartphone}
          label="Sold Devices"
          value={String(soldSales.length)}
          sub="Customer completed orders"
          todaySub="Units delivered"
          variant="emerald"
        />
        <StatCard
          icon={CreditCard}
          label="Total Sales Value"
          value={fmt(totalRevenue)}
          sub="Lifetime customer spend"
          todaySub="Gross turnover"
          variant="indigo"
        />
        <StatCard
          icon={Shield}
          label="Active Warranty"
          value={String(activeWarrantyCount)}
          sub={latestSaleDate ? `Latest: ${latestSaleDate.toLocaleDateString()}` : "No sales yet"}
          todaySub="Active protection units"
          variant="teal"
        />
      </div>

      {/* Customer Directory Card Container */}
      <div className="bg-card rounded-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-xs">
        {/* List Toolbar */}
        <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-4 bg-muted/20">
          <h3 className="font-bold text-sm flex items-center gap-2 text-foreground">
            <User className="size-4 text-primary" /> Customer Directory
          </h3>

          <div className="relative flex-1 max-w-sm">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by client, number, email, device, imei..."
              className="w-full pl-9 pr-8 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/90 dark:bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary hover:border-primary/50 dark:hover:border-primary/50 transition-all cursor-text caret-primary"
            />
            {q && (
              <button
                onClick={() => setQ("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-muted-foreground hidden sm:inline">
              {viewMode === "grid" ? groups.length : flatSales.length} {viewMode === "grid" ? "customers" : "records"} listed
            </span>
            {/* Grid/Table Toggle Button */}
            <div className="flex items-center gap-1 border rounded-xl p-1 bg-background shadow-xs">
              <button
                onClick={() => setViewMode("grid")}
                className={`inline-flex size-7 items-center justify-center rounded-lg transition-all cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                title="Grid View"
              >
                <LayoutGrid className="size-3.5" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`inline-flex size-7 items-center justify-center rounded-lg transition-all cursor-pointer ${
                  viewMode === "table"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                title="Table View"
              >
                <List className="size-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Grid View rendering */}
        {viewMode === "grid" && (
          <div className="p-4 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {paginatedGroups.map((g) => {
                const c = g[0];
                const spent = g.reduce((a, s) => a + s.finalPrice, 0);
                return (
                  <div
                    key={c.customerPhone + c.customerName}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/90 to-sky-50/30 p-3.5 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-500/50 hover:shadow-md dark:border-slate-800/90 dark:from-slate-900/95 dark:via-slate-900/80 dark:to-sky-950/30"
                  >
                    {/* Top radiant accent line */}
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-[2.5px] bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-500 opacity-80 transition-opacity duration-300 group-hover:opacity-100" />

                    {/* Header: Avatar, Name & Phone on left; Total Spent & Units on right */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="size-9 shrink-0 rounded-xl bg-gradient-to-br from-sky-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-xs ring-1 ring-white/40 dark:ring-white/10">
                          <User className="size-4.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-foreground text-sm leading-snug truncate">
                            {c.customerName}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono truncate">
                            {c.customerPhone}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-extrabold text-sm text-foreground leading-snug">
                          {fmt(spent)}
                        </div>
                        <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                          {g.length} {g.length > 1 ? "units" : "unit"}
                        </span>
                      </div>
                    </div>

                    {/* Compact Purchased Devices strip */}
                    <div className="mt-2.5 pt-2 border-t border-slate-200/70 dark:border-slate-800/70 space-y-1.5">
                      {g.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => setSelected(s)}
                          className="w-full flex items-center justify-between gap-2 text-xs bg-slate-100/70 hover:bg-slate-200/70 dark:bg-slate-800/60 dark:hover:bg-slate-800/90 rounded-lg px-2.5 py-1.5 text-left border border-slate-200/60 dark:border-slate-700/60 transition-all cursor-pointer group/item"
                        >
                          <div className="min-w-0 flex-1 flex items-center gap-2">
                            {s.type === "Phone" ? (
                              <Smartphone className="size-3.5 shrink-0 text-primary" />
                            ) : (
                              <Package className="size-3.5 shrink-0 text-primary" />
                            )}
                            <div className="min-w-0 flex items-center gap-1.5 truncate">
                              <span className="font-bold text-primary shrink-0">{s.brand}</span>
                              <span className="font-semibold text-foreground truncate">{s.model}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground font-mono truncate hidden sm:inline">
                              ({s.identifier})
                            </span>
                          </div>

                          <div className="shrink-0 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                                s.warranty.active && s.warranty.days >= 7
                                  ? "bg-success/15 text-success"
                                  : "bg-destructive/15 text-destructive"
                              }`}
                            >
                              {s.warranty.active ? `${s.warranty.days}d left` : "Expired"}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (s.type === "Phone" && s.rawPhoneSale) {
                                  setMemoSale({ type: "Phone", sale: s.rawPhoneSale });
                                } else if (s.type === "Gadget" && s.rawGadgetSale) {
                                  setMemoSale({ type: "Gadget", sale: s.rawGadgetSale });
                                }
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 text-[10px] font-bold border border-sky-500/25 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                              title="View & Print Customer Memo / Invoice"
                            >
                              <Receipt className="size-3" /> Memo
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelected(s)}
                              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="size-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {groups.length === 0 && (
              <div className="text-muted-foreground text-sm text-center py-16 border rounded-xl bg-card border-dashed">
                No customers found. Try a different search query.
              </div>
            )}
          </div>
        )}

        {/* Table View rendering */}
        {viewMode === "table" && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-sm">
              <thead className="bg-slate-50 dark:bg-muted/40 text-xs uppercase text-muted-foreground border-b">
                <tr>
                  <th className="p-3.5 text-left font-bold">Invoice</th>
                  <th className="p-3.5 text-left font-bold">Client / Contact</th>
                  <th className="p-3.5 text-left font-bold">Device specs</th>
                  <th className="p-3.5 text-left font-bold">IMEI</th>
                  <th className="p-3.5 text-left font-bold flex items-center gap-1"><Calendar className="size-3.5" /> Date</th>
                  <th className="p-3.5 text-right font-bold">Price</th>
                  <th className="p-3.5 text-left font-bold"><UserCheck className="size-3.5 inline mr-1" />Salesperson</th>
                  <th className="p-3.5 text-center font-bold"><Shield className="size-3.5 inline mr-1" />Warranty</th>
                  <th className="p-3.5 text-center font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginatedFlatSales.map((s) => {
                  return (
                    <tr
                      key={s.id}
                      onClick={() => setSelected(s)}
                      className="hover:bg-sky-50/70 dark:hover:bg-accent/30 cursor-pointer transition-colors"
                    >
                      <td className="p-3.5 font-mono text-xs font-bold text-primary">
                        {s.invoiceNumber}
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-foreground">{s.customerName}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{s.customerPhone}</div>
                        {s.email && (
                          <div className="text-[10px] text-muted-foreground/80 truncate max-w-[160px] mt-0.5">{s.email}</div>
                        )}
                      </td>
                      <td className="p-3.5">
                        <div className="space-y-1">
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
                          {s.specs && (
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              {s.specs}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-xs text-foreground">
                        {s.identifier}
                      </td>
                      <td className="p-3.5 text-xs text-muted-foreground">
                        {new Date(s.saleDate).toLocaleDateString()}
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="font-bold text-foreground">{fmt(s.finalPrice)}</div>
                        <div className="text-[10px] text-muted-foreground font-semibold mt-0.5">{s.paymentMethod}</div>
                      </td>
                      <td className="p-3.5 text-sm text-muted-foreground">
                        {s.salesPerson || "—"}
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold inline-block ${
                            s.warranty.active && s.warranty.days >= 7
                              ? "bg-success/15 text-success"
                              : "bg-destructive/15 text-destructive"
                          }`}
                        >
                          {s.warranty.active ? `${s.warranty.days}d` : "Expired"}
                        </span>
                      </td>
                      <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              if (s.type === "Phone" && s.rawPhoneSale) {
                                setMemoSale({ type: "Phone", sale: s.rawPhoneSale });
                              } else if (s.type === "Gadget" && s.rawGadgetSale) {
                                setMemoSale({ type: "Gadget", sale: s.rawGadgetSale });
                              }
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-primary/30 rounded-lg hover:bg-primary/10 text-primary font-semibold transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                            title="View & Print Customer Memo / Invoice"
                          >
                            <Receipt className="size-3.5" /> Memo
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelected(s)}
                            className="p-1.5 rounded-md border hover:bg-accent hover:text-foreground text-muted-foreground transition-all cursor-pointer shadow-sm"
                            title="View Details"
                          >
                            <Eye className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {flatSales.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-16 text-center text-muted-foreground">
                      No sales found matching search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalItems > 0 && (
        <div className="mt-6 border-t pt-4 flex flex-col sm:flex-row justify-between items-center gap-3 select-none">
          <div className="text-xs text-muted-foreground">
            Showing {(page - 1) * pageSize + 1} to{" "}
            {Math.min(page * pageSize, totalItems)} of {totalItems} items
          </div>
          <AppPagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      )}

      {selected && (
        <CustomerSaleModal
          sale={selected}
          onClose={() => setSelected(null)}
          onOpenMemo={() => {
            if (selected.type === "Phone" && selected.rawPhoneSale) {
              setMemoSale({ type: "Phone", sale: selected.rawPhoneSale });
            } else if (selected.type === "Gadget" && selected.rawGadgetSale) {
              setMemoSale({ type: "Gadget", sale: selected.rawGadgetSale });
            }
          }}
        />
      )}

      {/* Print Customer Memo Modals */}
      {memoSale?.type === "Phone" && (
        <CustomerMemoModal
          sale={memoSale.sale}
          onClose={() => setMemoSale(null)}
        />
      )}

      {memoSale?.type === "Gadget" && (
        <GadgetMemoModal
          sale={memoSale.sale}
          onClose={() => setMemoSale(null)}
        />
      )}
    </div>
  );
}



function CustomerSaleModal({
  sale,
  onClose,
  onOpenMemo,
}: {
  sale: CustomerSale;
  onClose: () => void;
  onOpenMemo: () => void;
}) {
  const { handleBackdropMouseDown, handleBackdropClick } = useModalBackdrop(onClose);

  const saleProfit = sale.finalPrice - sale.purchasePrice;
  const margin =
    sale.finalPrice > 0
      ? ((saleProfit / sale.finalPrice) * 100).toFixed(1)
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
            {sale.type === "Phone" ? (
              <Smartphone className="size-5 text-primary" />
            ) : (
              <Package className="size-5 text-primary" />
            )}
            Customer Sale Details
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
              Warranty Status
            </span>
            <span
              className={`text-xs px-3 py-1 rounded-full font-bold ${
                sale.warranty.active && sale.warranty.days >= 7
                  ? "bg-success/15 text-success"
                  : "bg-destructive/15 text-destructive"
              }`}
            >
              {sale.warranty.active ? `${sale.warranty.days} Days Left` : "Expired"}
            </span>
          </div>

          {/* Specifications */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b pb-1.5">
              <Info className="size-3.5 text-primary" /> Specifications
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <DetailField label="Item Type" value={sale.type} />
              <DetailField label="Invoice No" value={sale.invoiceNumber || "—"} isMono />
              <DetailField label="Brand" value={sale.brand} />
              <DetailField label="Model" value={sale.model} />
              <DetailField label="Specs" value={sale.specs || "—"} />
              <DetailField
                label={sale.type === "Phone" ? "IMEI" : "Identifier"}
                value={sale.identifier || "—"}
                isMono
              />
              <DetailField
                label="Sale Date"
                value={new Date(sale.saleDate).toLocaleDateString()}
              />
              <DetailField label="Sales Person" value={sale.salesPerson || "—"} />
              <DetailField label="Payment Method" value={sale.paymentMethod || "—"} />
              <DetailField
                label="Warranty Expiry"
                value={
                  sale.warranty.expiry
                    ? new Date(sale.warranty.expiry).toLocaleDateString()
                    : "No warranty date"
                }
              />
            </div>
          </div>

          {/* Customer Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b pb-1.5">
              <User className="size-3.5 text-primary" /> Customer Details
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <DetailField label="Customer Name" value={sale.customerName || "—"} />
              <DetailField label="Customer Contact" value={sale.customerPhone || "—"} />
              <DetailField label="Email" value={sale.email || "—"} />
              <DetailField label="Address" value={sale.address || "—"} />
            </div>
          </div>

          {/* Pricing & Profit */}
          <DetailPricingCards
            purchasePrice={sale.purchasePrice}
            sellingPrice={sale.finalPrice}
            profit={saleProfit}
            margin={margin}
            purchaseLabel="Purchase Cost"
            sellingLabel="Final Sale Price"
            profitLabel="Profit / Loss"
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
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
              onOpenMemo();
            }}
            className="px-5 py-2 text-sm rounded-full bg-gradient-to-r from-sky-500 via-primary to-indigo-600 text-white border border-white/25 shadow-sm hover:brightness-110 active:scale-[0.98] font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Printer className="size-4" /> Print Memo
          </button>
        </div>
      </div>
    </div>
  );
}
