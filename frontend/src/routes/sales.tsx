import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ShoppingCart,
  Receipt,
  Search,
  Boxes,
  CheckCircle2,
  Printer,
  ShieldCheck,
  Tag,
  CreditCard,
  User,
  Phone,
  FileText,
  BadgeAlert,
} from "lucide-react";
import {
  getGadgetAvailableQuantity,
  type Gadget,
  type GadgetSale,
} from "@/lib/gadget-store";
import { fmt, PageHeader } from "@/lib/phone-ui";
import { useAppDispatch, useAppSelector } from "../store";
import {
  fetchGadgets,
  fetchGadgetSales,
  sellGadget,
} from "../store/gadgetsSlice";
import { toast } from "sonner";
import { StatCard } from "@/components/ui/StatCard";
import { GadgetMemoModal } from "@/components/gadget/GadgetMemoModal";
import { AppPagination } from "@/components/ui/pagination";

export const Route = createFileRoute("/sales")({
  head: () => ({ meta: [{ title: "Gadget Sales & POS — Gadget POS" }] }),
  component: GadgetSalesPosPage,
});

function GadgetSalesPosPage() {
  const dispatch = useAppDispatch();
  const gadgets = useAppSelector((state) => state.gadgets.gadgets);
  const sales = useAppSelector((state) => state.gadgets.sales);
  const currentUser = useAppSelector((state) => state.auth.user);

  const [selectedGadgetId, setSelectedGadgetId] = useState<string>("");
  const [productSearch, setProductSearch] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("Cash");
  const [warrantyDays, setWarrantyDays] = useState<number>(30);
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Recent sales filter
  const [salesSearch, setSalesSearch] = useState<string>("");
  const [salesPage, setSalesPage] = useState<number>(1);
  const PAGE_SIZE = 10;

  // Selected sale for viewing memo
  const [viewMemoSale, setViewMemoSale] = useState<GadgetSale | null>(null);

  useEffect(() => {
    dispatch(fetchGadgets());
    dispatch(fetchGadgetSales());
  }, [dispatch]);

  // Selected Gadget object
  const selectedGadget = useMemo(() => {
    return gadgets.find((g) => g.id === selectedGadgetId) || null;
  }, [gadgets, selectedGadgetId]);

  // Available quantity of selected gadget
  const availableQty = useMemo(() => {
    if (!selectedGadget) return 0;
    return getGadgetAvailableQuantity(selectedGadget, sales);
  }, [selectedGadget, sales]);

  // When gadget is selected, initialize price and warranty
  const handleSelectGadget = (gadget: Gadget) => {
    setSelectedGadgetId(gadget.id);
    setSellingPrice(gadget.minSellingPrice);
    setQuantity(1);
    setWarrantyDays((gadget as any).warrantyDays || 30);
  };

  // Filter gadgets for quick picker
  const filteredGadgets = useMemo(() => {
    return gadgets.filter((g) => {
      const q = productSearch.toLowerCase().trim();
      if (!q) return true;
      return (
        g.productName.toLowerCase().includes(q) ||
        g.color.toLowerCase().includes(q) ||
        (g.supplierName && g.supplierName.toLowerCase().includes(q))
      );
    });
  }, [gadgets, productSearch]);

  // POS Calculations
  const totalPrice = useMemo(() => {
    return Math.max(0, quantity * sellingPrice);
  }, [quantity, sellingPrice]);

  const canSubmit =
    Boolean(selectedGadget) &&
    quantity > 0 &&
    quantity <= availableQty &&
    sellingPrice >= (selectedGadget?.minSellingPrice ?? 0) &&
    customerName.trim().length > 0 &&
    customerPhone.trim().length > 0 &&
    !submitting;

  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGadget) {
      toast.error("Please select a gadget to sell");
      return;
    }
    if (quantity > availableQty) {
      toast.error(`Only ${availableQty} units available in stock`);
      return;
    }
    if (sellingPrice < selectedGadget.minSellingPrice) {
      toast.error(`Selling price cannot be below minimum price of ${fmt(selectedGadget.minSellingPrice)}`);
      return;
    }
    if (!customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }
    if (!customerPhone.trim()) {
      toast.error("Customer phone is required");
      return;
    }

    try {
      setSubmitting(true);
      const saleDate = new Date().toISOString();
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + Number(warrantyDays || 0));

      const payload = {
        gadgetId: selectedGadget.id,
        productName: selectedGadget.productName,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        saleDate,
        quantity: Number(quantity),
        sellingPrice: Number(sellingPrice),
        totalPrice,
        paymentMethod,
        invoiceNumber: "", // auto-generated by backend
        notes: notes.trim(),
        salesPerson: currentUser?.name || "Admin",
        warrantyDays: Number(warrantyDays || 0),
        warrantyExpiry: Number(warrantyDays || 0) > 0 ? expiry.toISOString() : undefined,
      };

      const resultAction = await dispatch(sellGadget(payload));
      if (sellGadget.fulfilled.match(resultAction)) {
        const createdSale = resultAction.payload;
        setViewMemoSale(createdSale);

        // Reset form
        setSelectedGadgetId("");
        setProductSearch("");
        setCustomerName("");
        setCustomerPhone("");
        setNotes("");
        setQuantity(1);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Recent Sales Table filtered
  const filteredSales = useMemo(() => {
    const q = salesSearch.toLowerCase().trim();
    if (!q) return sales;
    return sales.filter(
      (s) =>
        s.customerName.toLowerCase().includes(q) ||
        s.customerPhone.toLowerCase().includes(q) ||
        s.productName.toLowerCase().includes(q) ||
        s.invoiceNumber.toLowerCase().includes(q)
    );
  }, [sales, salesSearch]);

  const paginatedSales = useMemo(() => {
    const start = (salesPage - 1) * PAGE_SIZE;
    return filteredSales.slice(start, start + PAGE_SIZE);
  }, [filteredSales, salesPage]);

  // Today's statistics
  const today = new Date().toISOString().slice(0, 10);
  const todaySales = sales.filter((s) => s.saleDate.slice(0, 10) === today);
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.totalPrice, 0);
  const todayItemsSold = todaySales.reduce((sum, s) => sum + s.quantity, 0);

  return (
    <div className="w-full px-4 md:px-6 lg:px-8 max-w-[1800px] mx-auto pb-10 space-y-6">
      <PageHeader
        title="Gadget Sales & POS Terminal"
        subtitle="Quick sales checkout, customer memo billing, and instant inventory deduction"
      />

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Today's Sales Revenue"
          value={fmt(todayRevenue)}
          sub={`${todayItemsSold} item(s) sold today`}
          icon={Receipt}
          variant="emerald"
        />
        <StatCard
          label="Total Gadget Items in Stock"
          value={gadgets.reduce((acc, g) => acc + getGadgetAvailableQuantity(g, sales), 0).toLocaleString()}
          sub={`${gadgets.length} unique gadget models`}
          icon={Boxes}
          variant="blue"
        />
        <StatCard
          label="Today's Transactions"
          value={todaySales.length.toLocaleString()}
          sub="Recorded customer invoices"
          icon={ShoppingCart}
          variant="indigo"
        />
      </div>

      {/* Main POS Section: 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Product Picker (5 cols) */}
        <div className="lg:col-span-5 bg-card border rounded-2xl p-5 shadow-xs flex flex-col h-full max-h-[700px]">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <Boxes className="size-5 text-primary" />
              <span>Select In-Stock Gadget</span>
            </div>
            <span className="text-xs text-muted-foreground font-semibold">
              {filteredGadgets.length} available
            </span>
          </div>

          {/* Product Search */}
          <div className="relative mb-3">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Search product by name or color..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Product List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredGadgets.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No gadgets found in stock matching "{productSearch}".
              </div>
            ) : (
              filteredGadgets.map((gadget) => {
                const stockLeft = getGadgetAvailableQuantity(gadget, sales);
                const isSelected = selectedGadgetId === gadget.id;
                const isOutOfStock = stockLeft <= 0;

                return (
                  <div
                    key={gadget.id}
                    onClick={() => {
                      if (!isOutOfStock) handleSelectGadget(gadget);
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-xs"
                        : isOutOfStock
                        ? "opacity-50 cursor-not-allowed bg-muted/20 border-dashed"
                        : "hover:border-primary/40 hover:bg-muted/30"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate text-foreground">
                        {gadget.productName}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                        <span>Color: {gadget.color}</span>
                        <span>·</span>
                        <span className="font-medium text-foreground">
                          Min: {fmt(gadget.minSellingPrice)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-bold rounded-md ${
                          stockLeft > 5
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : stockLeft > 0
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                            : "bg-destructive/15 text-destructive"
                        }`}
                      >
                        {stockLeft > 0 ? `${stockLeft} in stock` : "Out of Stock"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: POS Billing Form (7 cols) */}
        <div className="lg:col-span-7 bg-card border rounded-2xl p-5 shadow-xs">
          <form onSubmit={handleSaleSubmit} className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <ShoppingCart className="size-5 text-emerald-600" />
                <span>POS Checkout & Invoice</span>
              </div>
              {selectedGadget && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold">
                  {selectedGadget.productName}
                </span>
              )}
            </div>

            {!selectedGadget ? (
              <div className="py-16 text-center border-2 border-dashed rounded-xl">
                <Boxes className="size-10 mx-auto text-muted-foreground/50 mb-2" />
                <p className="font-semibold text-foreground">No Gadget Selected</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Please pick an available gadget from the left column to begin sales billing.
                </p>
              </div>
            ) : (
              <>
                {/* Quantity & Unit Price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                      Quantity (Max: {availableQty}) <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={availableQty}
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border bg-background font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                      Selling Price / Unit (Min: {fmt(selectedGadget.minSellingPrice)}) <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="number"
                      min={selectedGadget.minSellingPrice}
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border bg-background font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      required
                    />
                  </div>
                </div>

                {/* Customer Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5 flex items-center gap-1.5">
                      <User className="size-3.5" /> Customer Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Tanvir Hasan"
                      className="w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5 flex items-center gap-1.5">
                      <Phone className="size-3.5" /> Customer Phone <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="017XXXXXXXX"
                      className="w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      required
                    />
                  </div>
                </div>

                {/* Payment Method & Warranty */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5 flex items-center gap-1.5">
                      <CreditCard className="size-3.5" /> Payment Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="Cash">Cash</option>
                      <option value="bKash">bKash</option>
                      <option value="Nagad">Nagad</option>
                      <option value="Card">Card</option>
                      <option value="Bank">Bank Transfer</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5 flex items-center gap-1.5">
                      <ShieldCheck className="size-3.5" /> Warranty Days
                    </label>
                    <select
                      value={warrantyDays}
                      onChange={(e) => setWarrantyDays(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <option value={0}>No Warranty (0 Days)</option>
                      <option value={7}>7 Days Replacement</option>
                      <option value={10}>10 Days Replacement</option>
                      <option value={30}>1 Month (30 Days)</option>
                      <option value={90}>3 Months (90 Days)</option>
                      <option value={180}>6 Months (180 Days)</option>
                      <option value={365}>1 Year (365 Days)</option>
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                    Memo Notes / Remarks (Optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Serial # or special discount remark"
                    className="w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                {/* Total Billing Box & Submit Button */}
                <div className="bg-muted/30 border rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                      Total Payable Amount
                    </span>
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      {fmt(totalPrice)}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Printer className="size-4" />
                    <span>{submitting ? "Processing..." : "Complete Sale & Print Memo"}</span>
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>

      {/* Bottom Section: Recent Gadget Sales Ledger */}
      <div className="bg-card border rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <FileText className="size-5 text-primary" />
              Recent Gadget Sales
            </h3>
            <p className="text-xs text-muted-foreground">
              History of all customer purchases and printed cash memos
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={salesSearch}
              onChange={(e) => {
                setSalesSearch(e.target.value);
                setSalesPage(1);
              }}
              placeholder="Search customer, invoice, product..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border bg-muted/30 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {/* Sales Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Invoice</th>
                <th className="p-3 text-left">Product Name</th>
                <th className="p-3 text-left">Customer</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-center">Qty</th>
                <th className="p-3 text-right">Unit Price</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-sm text-muted-foreground">
                    No gadget sales found.
                  </td>
                </tr>
              ) : (
                paginatedSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-mono text-xs font-bold text-primary">
                      {sale.invoiceNumber}
                    </td>
                    <td className="p-3 font-medium text-foreground">{sale.productName}</td>
                    <td className="p-3">
                      <div className="font-semibold text-foreground">{sale.customerName}</div>
                      <div className="text-xs text-muted-foreground">{sale.customerPhone}</div>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {new Date(sale.saleDate).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="p-3 text-center font-bold">{sale.quantity}</td>
                    <td className="p-3 text-right">{fmt(sale.sellingPrice)}</td>
                    <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {fmt(sale.totalPrice)}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => setViewMemoSale(sale)}
                        className="px-2.5 py-1 rounded-lg border bg-background hover:bg-muted text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="View & Print Cash Memo"
                      >
                        <Printer className="size-3.5 text-primary" />
                        <span>Print Memo</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredSales.length > PAGE_SIZE && (
          <div className="pt-2">
            <AppPagination
              currentPage={salesPage}
              totalPages={Math.ceil(filteredSales.length / PAGE_SIZE)}
              onPageChange={setSalesPage}
            />
          </div>
        )}
      </div>

      {/* Customer Memo Modal */}
      {viewMemoSale && (
        <GadgetMemoModal
          sale={viewMemoSale}
          onClose={() => setViewMemoSale(null)}
        />
      )}
    </div>
  );
}
