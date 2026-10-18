import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { Gadget, GadgetSale } from "@/lib/gadget-store";
import { useAppDispatch, useAppSelector } from "../store";
import { fmt, PageHeader } from "@/lib/phone-ui";
import { GadgetMemoModal } from "@/components/gadget/GadgetMemoModal";
import { AppPagination } from "@/components/ui/pagination";
import { StatCard } from "@/components/ui/StatCard";
import { fetchGadgets, fetchGadgetSales } from "../store/gadgetsSlice";
import {
  User, LayoutGrid, List, Search,
  CreditCard, Shield, Eye, Package, X, Printer,
} from "lucide-react";
import {
  useModalBackdrop,
  DetailField,
} from "@/components/ui/DetailModalCommon";

export const Route = createFileRoute("/customers")({
  head: () => ({ meta: [{ title: "Customers — Gadget POS" }] }),
  component: Customers,
});

type CustomerGadgetSale = {
  id: string;
  title: string;
  customerName: string;
  customerPhone: string;
  invoiceNumber: string;
  saleDate: string;
  finalPrice: number;
  quantity: number;
  paymentMethod: string;
  salesPerson?: string;
  warranty: { active: boolean; days: number; expiry?: string };
  rawGadgetSale: GadgetSale;
};

function normalizeGadgetSale(sale: GadgetSale, gadgets: Gadget[]): CustomerGadgetSale {
  const gadget = gadgets.find((item) => item.id === sale.gadgetId);
  const expiry = sale.warrantyExpiry;
  const days = expiry ? Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000) : -1;

  return {
    id: sale.id,
    title: sale.productName,
    customerName: sale.customerName,
    customerPhone: sale.customerPhone,
    invoiceNumber: sale.invoiceNumber,
    saleDate: sale.saleDate,
    finalPrice: sale.totalPrice,
    quantity: sale.quantity,
    paymentMethod: sale.paymentMethod,
    salesPerson: sale.salesPerson,
    warranty: { active: days >= 0, days, expiry },
    rawGadgetSale: sale,
  };
}

function Customers() {
  const dispatch = useAppDispatch();
  const gadgets = useAppSelector((state) => state.gadgets.gadgets);
  const gadgetSales = useAppSelector((state) => state.gadgets.sales);
  const [selected, setSelected] = useState<CustomerGadgetSale | null>(null);
  const [memoSale, setMemoSale] = useState<GadgetSale | null>(null);
  const [q, setQ] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchGadgets());
    dispatch(fetchGadgetSales());
  }, [dispatch]);

  // Reset pagination on filter or view mode change
  useEffect(() => {
    setPage(1);
  }, [q, viewMode]);

  // Only consider items that have actually been sold
  const soldSales = useMemo<CustomerGadgetSale[]>(() => {
    return gadgetSales
      .filter((s) => s.customerName && s.customerName.trim() !== "")
      .map((s) => normalizeGadgetSale(s, gadgets))
      .sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());
  }, [gadgetSales, gadgets]);

  const filtered = useMemo(() => {
    const term = q.toLowerCase().trim();
    if (!term) return soldSales;
    return soldSales.filter((s) =>
      [
        s.customerName,
        s.customerPhone,
        s.title,
        s.invoiceNumber,
        s.paymentMethod,
      ].some((v) => v && v.toLowerCase().includes(term))
    );
  }, [soldSales, q]);

  // Unique customer directory metrics
  const customerSummary = useMemo(() => {
    const map = new Map<string, { totalSpent: number; orderCount: number; name: string }>();
    soldSales.forEach((s) => {
      const key = s.customerPhone || s.customerName;
      const prev = map.get(key) || { totalSpent: 0, orderCount: 0, name: s.customerName };
      map.set(key, {
        totalSpent: prev.totalSpent + s.finalPrice,
        orderCount: prev.orderCount + 1,
        name: s.customerName,
      });
    });
    const uniqueCustomers = map.size;
    const repeatCustomers = Array.from(map.values()).filter((c) => c.orderCount > 1).length;
    const totalRevenue = soldSales.reduce((acc, s) => acc + s.finalPrice, 0);

    return { uniqueCustomers, repeatCustomers, totalRevenue };
  }, [soldSales]);

  const PAGE_SIZE = 12;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  return (
    <div className="w-full px-4 md:px-6 lg:px-8 max-w-[1800px] mx-auto pb-10 space-y-6">
      <PageHeader
        title="Gadget Customers Directory"
        subtitle="Manage customer orders, invoices, and purchase records"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Gadget Customers"
          value={customerSummary.uniqueCustomers.toLocaleString()}
          sub="Unique phone / customer profiles"
          icon={User}
          variant="blue"
        />
        <StatCard
          label="Repeat Customers"
          value={customerSummary.repeatCustomers.toLocaleString()}
          sub="Purchased more than once"
          icon={CreditCard}
          variant="emerald"
        />
        <StatCard
          label="Total Orders Placed"
          value={soldSales.length.toLocaleString()}
          sub="Successful sales transactions"
          icon={Package}
          variant="indigo"
        />
        <StatCard
          label="Lifetime Revenue"
          value={fmt(customerSummary.totalRevenue)}
          sub="Aggregate sales value"
          icon={Shield}
          variant="teal"
        />
      </div>

      {/* Search & View Mode Controls */}
      <div className="bg-card border rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by customer name, phone, invoice..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border bg-muted/30 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex rounded-lg border bg-muted p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "grid" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "table" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
              }`}
              title="Table View"
            >
              <List className="size-4" />
            </button>
          </div>
          <span className="text-xs text-muted-foreground font-semibold">
            {filtered.length} order(s)
          </span>
        </div>
      </div>

      {/* Orders List View */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginated.length === 0 ? (
            <div className="col-span-full p-12 text-center text-muted-foreground border-2 border-dashed rounded-2xl">
              No customer records found.
            </div>
          ) : (
            paginated.map((item) => (
              <div
                key={item.id}
                className="bg-card border rounded-2xl p-4 shadow-xs hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-primary px-2 py-0.5 rounded-md bg-primary/10">
                      {item.invoiceNumber}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.saleDate).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <h4 className="font-bold text-foreground text-sm line-clamp-1">{item.title}</h4>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Qty: <span className="font-semibold text-foreground">{item.quantity}</span> · Payment:{" "}
                    <span className="font-semibold text-foreground">{item.paymentMethod}</span>
                  </div>

                  <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-foreground">{item.customerName}</div>
                      <div className="text-muted-foreground">{item.customerPhone}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-sm text-emerald-600 dark:text-emerald-400">
                        {fmt(item.finalPrice)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setSelected(item)}
                    className="flex-1 py-1.5 rounded-lg border bg-muted/40 hover:bg-muted text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Eye className="size-3.5" /> Details
                  </button>
                  <button
                    type="button"
                    onClick={() => setMemoSale(item.rawGadgetSale)}
                    className="px-3 py-1.5 rounded-lg border bg-background hover:bg-primary/10 hover:border-primary/50 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Printer className="size-3.5 text-primary" /> Memo
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="bg-card border rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3 text-left">Invoice</th>
                  <th className="p-3 text-left">Product</th>
                  <th className="p-3 text-left">Customer</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-right">Total Price</th>
                  <th className="p-3 text-left">Payment</th>
                  <th className="p-3 text-left">Sale Date</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-muted-foreground">
                      No customer records match this query.
                    </td>
                  </tr>
                ) : (
                  paginated.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-mono text-xs font-bold text-primary">
                        {item.invoiceNumber}
                      </td>
                      <td className="p-3 font-medium text-foreground">{item.title}</td>
                      <td className="p-3">
                        <div className="font-semibold text-foreground">{item.customerName}</div>
                        <div className="text-xs text-muted-foreground">{item.customerPhone}</div>
                      </td>
                      <td className="p-3 text-center font-bold">{item.quantity}</td>
                      <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {fmt(item.finalPrice)}
                      </td>
                      <td className="p-3">{item.paymentMethod}</td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {new Date(item.saleDate).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelected(item)}
                            className="p-1.5 rounded-lg border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setMemoSale(item.rawGadgetSale)}
                            className="p-1.5 rounded-lg border hover:bg-muted text-primary transition-colors cursor-pointer"
                            title="Print Cash Memo"
                          >
                            <Printer className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

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

      {/* Customer Order Detail Modal */}
      {selected && (
        <CustomerDetailModal
          item={selected}
          onClose={() => setSelected(null)}
          onPrintMemo={() => {
            setMemoSale(selected.rawGadgetSale);
          }}
        />
      )}

      {/* Memo Modal */}
      {memoSale && (
        <GadgetMemoModal
          sale={memoSale}
          onClose={() => setMemoSale(null)}
        />
      )}
    </div>
  );
}

function CustomerDetailModal({
  item,
  onClose,
  onPrintMemo,
}: {
  item: CustomerGadgetSale;
  onClose: () => void;
  onPrintMemo: () => void;
}) {
  const { handleBackdropMouseDown, handleBackdropClick } = useModalBackdrop(onClose);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onMouseDown={handleBackdropMouseDown}
      onClick={handleBackdropClick}
    >
      <div
        className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <span className="font-mono text-xs font-bold text-primary px-2 py-0.5 rounded-md bg-primary/10">
              {item.invoiceNumber}
            </span>
            <h3 className="text-lg font-bold text-foreground mt-1">Customer Purchase Details</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <DetailField label="Product Name" value={item.title} />
          <DetailField label="Quantity Sold" value={String(item.quantity)} />
          <DetailField label="Customer Name" value={item.customerName} />
          <DetailField label="Customer Phone" value={item.customerPhone} />
          <DetailField label="Total Paid Amount" value={fmt(item.finalPrice)} />
          <DetailField label="Payment Method" value={item.paymentMethod} />
          <DetailField
            label="Purchase Date"
            value={new Date(item.saleDate).toLocaleDateString("en-GB", {
              dateStyle: "medium",
            })}
          />
          <DetailField
            label="Warranty Expiry"
            value={
              item.warranty.expiry
                ? new Date(item.warranty.expiry).toLocaleDateString("en-GB", {
                    dateStyle: "medium",
                  })
                : "No Warranty"
            }
          />
        </div>

        <div className="flex items-center justify-end gap-2 border-t pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border bg-muted/40 hover:bg-muted text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={onPrintMemo}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold inline-flex items-center gap-1.5 shadow-xs hover:bg-primary/90 transition-colors cursor-pointer"
          >
            <Printer className="size-3.5" /> Print Cash Memo
          </button>
        </div>
      </div>
    </div>
  );
}
