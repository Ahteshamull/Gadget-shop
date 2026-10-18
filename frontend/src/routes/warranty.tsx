import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Sale, warrantyStatus } from "@/lib/phone-store";
import type { Gadget, GadgetSale } from "@/lib/gadget-store";
import { PageHeader, fmt } from "@/lib/phone-ui";
import { Package, Search, Shield, ShieldAlert, ShieldCheck, Smartphone, X } from "lucide-react";
import { useAppSelector } from "../store";
import { StatCard } from "@/components/ui/StatCard";
import { AppPagination } from "@/components/ui/pagination";

export const Route = createFileRoute("/warranty")({
  head: () => ({ meta: [{ title: "Warranty — PhoneTrack" }] }),
  component: Warranty,
});

type WarrantyItem = {
  id: string;
  type: "Phone" | "Gadget";
  title: string;
  brand: string;
  model: string;
  identifier: string;
  customerName: string;
  customerPhone: string;
  saleDate: string;
  finalPrice: number;
  warranty: { active: boolean; days: number; expiry: string };
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

function normalizePhoneWarrantyItem(sale: Sale): WarrantyItem {
  const warranty = warrantyStatus(sale);
  return {
    id: sale.id,
    type: "Phone",
    brand: sale.brand || "—",
    model: sale.model || "—",
    title: `${sale.brand} ${sale.model}`.trim(),
    identifier: sale.imei || "-",
    customerName: sale.customerName,
    customerPhone: sale.customerPhone,
    saleDate: sale.saleDate,
    finalPrice: sale.finalPrice,
    warranty: { ...warranty, expiry: sale.warrantyExpiry },
  };
}

function normalizeGadgetWarrantyItem(sale: GadgetSale, gadgets: Gadget[]): WarrantyItem {
  const gadget = gadgets.find((item) => item.id === sale.gadgetId);
  const expiry = sale.warrantyExpiry || sale.saleDate;
  const days = Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000);
  const { brand, model } = extractGadgetBrandModel(sale.productName);

  return {
    id: `gadget-${sale.id}`,
    type: "Gadget",
    brand,
    model,
    title: sale.productName,
    identifier: sale.invoiceNumber || gadget?.id || "-",
    customerName: sale.customerName,
    customerPhone: sale.customerPhone,
    saleDate: sale.saleDate,
    finalPrice: sale.totalPrice,
    warranty: { active: days >= 0, days, expiry },
  };
}

function Warranty() {
  const sales = useAppSelector((state) => state.phoneSales.items);
  const gadgets = useAppSelector((state) => state.gadgets.gadgets);
  const gadgetSales = useAppSelector((state) => state.gadgets.sales);
  const [filter, setFilter] = useState<"all" | "active" | "expiring" | "expired">("all");
  const [selected, setSelected] = useState<WarrantyItem | null>(null);
  const [q, setQ] = useState("");

  const data = useMemo<WarrantyItem[]>(() => {
    return [
      ...sales
        .filter((sale) => sale.customerName.trim() !== "")
        .map(normalizePhoneWarrantyItem),
      ...gadgetSales
        .filter((sale) => sale.customerName.trim() !== "" && sale.warrantyExpiry)
        .map((sale) => normalizeGadgetWarrantyItem(sale, gadgets)),
    ];
  }, [sales, gadgetSales, gadgets]);

  const activeCount = useMemo(() => data.filter((d) => d.warranty.active).length, [data]);
  const expiringCount = useMemo(() => data.filter((d) => d.warranty.active && d.warranty.days < 7).length, [data]);
  const expiredCount = useMemo(() => data.filter((d) => !d.warranty.active).length, [data]);

  // Filter by 3 specific fields: IMEI, PRODUCT, CUSTOMER
  const filtered = useMemo<WarrantyItem[]>(() => {
    let result = data;
    const term = q.trim().toLowerCase();

    if (term) {
      result = result.filter((item) => {
        const matchImei = item.identifier ? item.identifier.toLowerCase().includes(term) : false;
        const matchProduct =
          (item.brand && item.brand.toLowerCase().includes(term)) ||
          (item.model && item.model.toLowerCase().includes(term)) ||
          (item.title ? item.title.toLowerCase().includes(term) : false);
        const matchCustomer =
          (item.customerName ? item.customerName.toLowerCase().includes(term) : false) ||
          (item.customerPhone ? item.customerPhone.toLowerCase().includes(term) : false);
        return matchImei || matchProduct || matchCustomer;
      });
    }

    if (filter === "active") return result.filter((d) => d.warranty.active);
    if (filter === "expiring") return result.filter((d) => d.warranty.active && d.warranty.days < 7);
    if (filter === "expired") return result.filter((d) => !d.warranty.active);
    return result;
  }, [data, q, filter]);

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [q, filter]);

  return (
    <div className="w-full px-4 md:px-6 lg:px-8 max-w-[1800px] mx-auto pb-8">
      <PageHeader title="Warranty Tracking" subtitle="Monitor active coverage and expirations" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
        <StatCard
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label="All Devices"
          value={data.length}
          sub="Full device database"
          todaySub="Total warranties"
          icon={Shield}
          variant="blue"
        />
        <StatCard
          active={filter === "active"}
          onClick={() => setFilter("active")}
          label="Active Coverage"
          value={activeCount}
          sub="Currently valid warranty"
          todaySub="In coverage"
          icon={ShieldCheck}
          variant="emerald"
        />
        <StatCard
          active={filter === "expiring"}
          onClick={() => setFilter("expiring")}
          label="Expiring Soon (<7d)"
          value={expiringCount}
          sub="Ends within 7 days"
          todaySub="Attention needed"
          icon={ShieldAlert}
          variant="amber"
        />
        <StatCard
          active={filter === "expired"}
          onClick={() => setFilter("expired")}
          label="Expired Coverage"
          value={expiredCount}
          sub="Past warranty deadline"
          todaySub="Terminated"
          icon={ShieldAlert}
          variant="rose"
        />
      </div>

      <div className="bg-card rounded-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-xs">
        {/* List Toolbar */}
        <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-4 bg-muted/20">
          <h3 className="font-bold text-sm flex items-center gap-2 text-foreground">
            <Shield className="size-4 text-primary" /> Warranty List
          </h3>
          <div className="relative flex-1 max-w-sm">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by IMEI, Product, Customer..."
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
            <span className="text-xs font-semibold text-muted-foreground">
              {filtered.length} warranties listed
            </span>
            {q && (
              <button
                onClick={() => setQ("")}
                className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <X className="size-3" /> Clear
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="text-left p-3">IMEI</th>
              <th className="text-left p-3">Product</th>
              <th className="text-left p-3">Customer</th>
              <th className="text-left p-3">Expiry</th>
              <th className="text-left p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((item) => (
              <tr key={item.id} onClick={() => setSelected(item)} className="border-t hover:bg-accent/30 cursor-pointer">
                <td className="p-3 font-mono text-xs">{item.identifier}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2.5">
                    {item.type === "Phone" ? (
                      <Smartphone className="size-4 shrink-0 text-primary" />
                    ) : (
                      <Package className="size-4 shrink-0 text-primary" />
                    )}
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Brand:
                        </span>
                        <span className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-bold text-primary">
                          {item.brand}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Model:
                        </span>
                        <span className="text-xs font-semibold text-foreground">
                          {item.model}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-3">{item.customerName}</td>
                <td className="p-3 text-xs">{new Date(item.warranty.expiry).toLocaleDateString()}</td>
                <td className="p-3">
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                    !item.warranty.active || item.warranty.days < 7
                      ? "bg-destructive/15 text-destructive"
                      : "bg-success/15 text-success"
                  }`}>
                    {item.warranty.active ? `${item.warranty.days} days left` : "Expired"}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-muted-foreground">No items.</td></tr>}
          </tbody>
        </table>
        </div>
        {filtered.length > 0 && (
          <div className="border-t px-5 py-3 bg-muted/20 text-xs text-muted-foreground flex flex-col sm:flex-row justify-between items-center gap-3 select-none shrink-0 mt-auto">
            <span>
              Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} items
            </span>
            <AppPagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
      {selected && <WarrantyDetailModal item={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function WarrantyDetailModal({ item, onClose }: { item: WarrantyItem; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border bg-card p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              {item.type === "Phone" ? <Smartphone className="size-5" /> : <Package className="size-5" />}
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{item.type} Warranty</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs font-bold uppercase text-muted-foreground">Brand:</span>
                <span className="inline-flex rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">{item.brand}</span>
              </div>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="text-xs font-bold uppercase text-muted-foreground">Model:</span>
                <span className="text-base font-extrabold text-foreground">{item.model}</span>
              </div>
              <p className="mt-1 font-mono text-xs text-muted-foreground">{item.identifier}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <WarrantyInfo label="Customer" value={item.customerName || "-"} />
          <WarrantyInfo label="Phone" value={item.customerPhone || "-"} />
          <WarrantyInfo label="Sale Date" value={new Date(item.saleDate).toLocaleDateString("en-GB")} />
          <WarrantyInfo label="Sold Price" value={fmt(item.finalPrice)} />
        </div>

        <div className="mt-4 rounded-2xl border bg-muted/20 p-4">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Warranty Status</div>
          <div className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-bold ${
            !item.warranty.active || item.warranty.days < 7
              ? "bg-destructive/15 text-destructive"
              : "bg-success/15 text-success"
          }`}>
            {item.warranty.active ? `${item.warranty.days} days left` : "Expired"}
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            Expires on {new Date(item.warranty.expiry).toLocaleDateString("en-GB")}
          </div>
        </div>
      </div>
    </div>
  );
}

function WarrantyInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-background p-3">
      <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-semibold text-foreground">{value}</div>
    </div>
  );
}
