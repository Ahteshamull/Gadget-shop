import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import type { Gadget, GadgetSale } from "@/lib/gadget-store";
import { PageHeader, fmt } from "@/lib/phone-ui";
import { Search, Shield, ShieldAlert, ShieldCheck, Boxes, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../store";
import { fetchGadgets, fetchGadgetSales } from "../store/gadgetsSlice";
import { StatCard } from "@/components/ui/StatCard";
import { AppPagination } from "@/components/ui/pagination";

export const Route = createFileRoute("/warranty")({
  head: () => ({ meta: [{ title: "Warranty Tracking — Gadget POS" }] }),
  component: Warranty,
});

type GadgetWarrantyItem = {
  id: string;
  title: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  saleDate: string;
  finalPrice: number;
  warranty: { active: boolean; days: number; expiry: string };
};

function normalizeGadgetWarrantyItem(sale: GadgetSale, gadgets: Gadget[]): GadgetWarrantyItem {
  const gadget = gadgets.find((item) => item.id === sale.gadgetId);
  const expiry = sale.warrantyExpiry || sale.saleDate;
  const days = Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000);

  return {
    id: sale.id,
    title: sale.productName,
    invoiceNumber: sale.invoiceNumber,
    customerName: sale.customerName,
    customerPhone: sale.customerPhone,
    saleDate: sale.saleDate,
    finalPrice: sale.totalPrice,
    warranty: { active: days >= 0, days, expiry },
  };
}

function Warranty() {
  const dispatch = useAppDispatch();
  const gadgets = useAppSelector((state) => state.gadgets.gadgets);
  const gadgetSales = useAppSelector((state) => state.gadgets.sales);
  const [filter, setFilter] = useState<"all" | "active" | "expiring" | "expired">("all");
  const [selected, setSelected] = useState<GadgetWarrantyItem | null>(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  useEffect(() => {
    dispatch(fetchGadgets());
    dispatch(fetchGadgetSales());
  }, [dispatch]);

  const data = useMemo<GadgetWarrantyItem[]>(() => {
    return gadgetSales
      .filter((sale) => sale.customerName && sale.customerName.trim() !== "" && sale.warrantyExpiry)
      .map((sale) => normalizeGadgetWarrantyItem(sale, gadgets));
  }, [gadgetSales, gadgets]);

  const filtered = useMemo(() => {
    let list = data;
    if (filter === "active") list = list.filter((i) => i.warranty.active && i.warranty.days > 7);
    if (filter === "expiring") list = list.filter((i) => i.warranty.active && i.warranty.days <= 7);
    if (filter === "expired") list = list.filter((i) => !i.warranty.active);
    if (q) {
      const term = q.toLowerCase();
      list = list.filter((i) =>
        [
          i.title,
          i.invoiceNumber,
          i.customerName,
          i.customerPhone,
        ].some((v) => v && v.toLowerCase().includes(term))
      );
    }
    return list;
  }, [data, filter, q]);

  const activeCount = data.filter((i) => i.warranty.active && i.warranty.days > 7).length;
  const expiringCount = data.filter((i) => i.warranty.active && i.warranty.days <= 7).length;
  const expiredCount = data.filter((i) => !i.warranty.active).length;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  return (
    <div className="w-full px-4 md:px-6 lg:px-8 max-w-[1800px] mx-auto pb-10 space-y-6">
      <PageHeader
        title="Gadget Warranty Tracking"
        subtitle="Live warranty period monitoring for sold accessories and smart gadgets"
      />

      {/* Warranty KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Warranties Issued"
          value={data.length.toLocaleString()}
          sub="Items with active/past warranty"
          icon={Shield}
          variant="blue"
        />
        <StatCard
          label="Active Warranties"
          value={activeCount.toLocaleString()}
          sub="Covered products in warranty"
          icon={ShieldCheck}
          variant="emerald"
        />
        <StatCard
          label="Expiring Soon (≤ 7 Days)"
          value={expiringCount.toLocaleString()}
          sub="Expiring within this week"
          icon={ShieldAlert}
          variant="amber"
        />
        <StatCard
          label="Expired Warranties"
          value={expiredCount.toLocaleString()}
          sub="Warranty lifecycle completed"
          icon={Boxes}
          variant="rose"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-card border rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-muted w-full sm:w-auto">
          {[
            { id: "all", label: `All (${data.length})` },
            { id: "active", label: `Active (${activeCount})` },
            { id: "expiring", label: `Expiring Soon (${expiringCount})` },
            { id: "expired", label: `Expired (${expiredCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setFilter(tab.id as any);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filter === tab.id
                  ? "bg-background text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search invoice, customer, product..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border bg-muted/30 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      {/* Warranty Table */}
      <div className="bg-card border rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Invoice</th>
                <th className="p-3 text-left">Product</th>
                <th className="p-3 text-left">Customer</th>
                <th className="p-3 text-left">Sale Date</th>
                <th className="p-3 text-left">Warranty Expiry</th>
                <th className="p-3 text-left">Remaining</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-muted-foreground">
                    No warranty records found for this filter.
                  </td>
                </tr>
              ) : (
                paginated.map((item) => {
                  const isExpired = !item.warranty.active;
                  const isExpiringSoon = item.warranty.active && item.warranty.days <= 7;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelected(item)}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <td className="p-3 font-mono text-xs font-bold text-primary">
                        {item.invoiceNumber}
                      </td>
                      <td className="p-3 font-medium text-foreground">{item.title}</td>
                      <td className="p-3">
                        <div className="font-semibold text-foreground">{item.customerName}</div>
                        <div className="text-xs text-muted-foreground">{item.customerPhone}</div>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {new Date(item.saleDate).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="p-3 text-xs font-medium">
                        {new Date(item.warranty.expiry).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="p-3 text-xs">
                        {isExpired ? (
                          <span className="text-destructive font-medium">Expired</span>
                        ) : (
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {item.warranty.days} day(s) left
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isExpired
                              ? "bg-destructive/15 text-destructive"
                              : isExpiringSoon
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                              : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {isExpired ? "Expired" : isExpiringSoon ? "Expiring Soon" : "Active"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {filtered.length > PAGE_SIZE && (
        <div className="pt-2">
          <AppPagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Details Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-card border rounded-2xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-primary px-2 py-0.5 rounded-md bg-primary/10">
                  {selected.invoiceNumber}
                </span>
                <h4 className="font-bold text-foreground mt-1">Warranty Information</h4>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Product</span>
                <span className="font-semibold text-foreground">{selected.title}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Customer</span>
                <span className="font-semibold text-foreground">{selected.customerName}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Phone</span>
                <span className="font-semibold text-foreground">{selected.customerPhone}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Sale Date</span>
                <span className="font-semibold text-foreground">
                  {new Date(selected.saleDate).toLocaleDateString("en-GB", { dateStyle: "medium" })}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Warranty Expiry</span>
                <span className="font-semibold text-foreground">
                  {new Date(selected.warranty.expiry).toLocaleDateString("en-GB", {
                    dateStyle: "medium",
                  })}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Status</span>
                <span className="font-bold">
                  {selected.warranty.active
                    ? `${selected.warranty.days} days remaining`
                    : "Expired"}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelected(null)}
              className="w-full py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
