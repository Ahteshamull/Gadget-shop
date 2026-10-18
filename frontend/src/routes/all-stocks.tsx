import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  X,
  ShoppingCart,
  Receipt,
  FileText,
  Plus,
  SlidersHorizontal,
  ChevronDown,
  Smartphone,
  NotebookTabs,
  LayoutGrid,
  List,
} from "lucide-react";
import { type Sale } from "@/lib/phone-store";
import { PageHeader, CustomerMemoModal } from "@/lib/phone-ui";
import { useAppDispatch, useAppSelector } from "../store";
import { updatePhoneStock } from "../store/phoneSalesSlice";
import { toast } from "sonner";
import { StatCard } from "@/components/ui/StatCard";
import {
  NewSaleWizard,
  blankCustomer,
  type WizardStep,
} from "@/components/sales/NewSaleWizard";
import { StockCard } from "@/components/stocks/StockCard";
import { StockDetailPanel } from "@/components/stocks/StockDetailPanel";
import { StockTableView, EmptyState } from "@/components/stocks/StockTableView";
import { PhoneSalesSection } from "@/components/stocks/PhoneSalesSection";
import { AppPagination } from "@/components/ui/pagination";

export const Route = createFileRoute("/all-stocks")({
  head: () => ({
    meta: [
      { title: "All Stocks & Sales — PhoneTrack" },
      {
        name: "description",
        content:
          "Browse all stock with brand filter, IMEI search, and detailed view.",
      },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    sellId: typeof search.sellId === "string" ? search.sellId : undefined,
  }),
  component: AllStocks,
});

function AllStocks() {
  const dispatch = useAppDispatch();
  const sales = useAppSelector((state) => state.phoneSales.items);
  const isStaff = useAppSelector((state) => state.auth.user?.role === "staff");

  const [selectedTab, setSelectedTab] = useState<"stock" | "sales">("stock");
  const [query, setQuery] = useState("");
  const [salesQ, setSalesQ] = useState("");
  const [brand, setBrand] = useState("all");
  const [selected, setSelected] = useState<Sale | null>(null);
  const [memoSale, setMemoSale] = useState<Sale | null>(null);
  const [view, setView] = useState<"grid" | "table">("grid");

  const { sellId } = useSearch({ from: "/all-stocks" });

  /* wizard state */
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState<WizardStep>("pick");
  const [wizardQ, setWizardQ] = useState("");
  const [pickedPhone, setPickedPhone] = useState<Sale | null>(null);
  const [customerForm, setCustomerForm] = useState<ReturnType<
    typeof blankCustomer
  > | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [showSuccessMemo, setShowSuccessMemo] = useState(false);

  const availablePhones = useMemo(() => {
    const wq = wizardQ.trim().toLowerCase();
    const inStock = sales.filter((r) => !r.customerName);
    if (!wq) return inStock;
    return inStock.filter(
      (r) =>
        r.imei?.toLowerCase().includes(wq) ||
        r.brand?.toLowerCase().includes(wq) ||
        r.model?.toLowerCase().includes(wq) ||
        r.color?.toLowerCase().includes(wq) ||
        r.storage?.toLowerCase().includes(wq),
    );
  }, [sales, wizardQ]);

  const updateRow = (id: string, patch: Partial<Sale>) => {
    dispatch(updatePhoneStock({ id, patch }));
  };

  /* Auto-open wizard when navigated here with ?sellId=<id> */
  useEffect(() => {
    if (isStaff) return;
    if (!sellId) return;
    const phone = sales.find((r) => r.id === sellId && !r.customerName);
    if (!phone) return;
    setPickedPhone(phone);
    setCustomerForm(blankCustomer(phone));
    setStep("customer");
    setWizardOpen(true);
    setSuccessId(null);
  }, [isStaff, sellId, sales]);

  const openWizard = () => {
    if (isStaff) return;
    setWizardOpen(true);
    setStep("pick");
    setWizardQ("");
    setPickedPhone(null);
    setCustomerForm(null);
    setSuccessId(null);
  };

  const startSale = (phone: Sale) => {
    if (isStaff) return;
    setPickedPhone(phone);
    setCustomerForm(blankCustomer(phone));
    setStep("customer");
    setWizardOpen(true);
    setSuccessId(null);
  };

  const confirmSale = () => {
    if (isStaff) return;
    if (!pickedPhone || !customerForm) return;
    if (!customerForm.customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }
    const basePrice = Math.max(0, customerForm.finalPrice || 0);
    const disc = Math.max(0, customerForm.discount || 0);
    if (basePrice <= 0) {
      toast.error("Final price must be greater than 0.");
      return;
    }
    if (disc > basePrice) {
      toast.error("Discount cannot be greater than the final price.");
      return;
    }
    const totalPrice = basePrice - disc;
    const days = Math.max(0, customerForm.warrantyDays ?? 365);
    const warrantyExpiry = new Date(Date.now() + days * 86400000).toISOString();
    const patch: Partial<Sale> = {
      ...customerForm,
      saleDate: new Date().toISOString(),
      finalPrice: totalPrice,
      discount: disc,
      warrantyExpiry,
      invoiceNumber: "INV-TEMP",
      ownership: [
        {
          owner: customerForm.customerName,
          phone: customerForm.customerPhone,
          transferDate: new Date().toISOString(),
          note: "First buyer",
        },
      ],
    };
    updateRow(pickedPhone.id, patch);
    setSuccessId(pickedPhone.id);
    setStep("pick");
  };

  const closeWizard = () => {
    setWizardOpen(false);
    setPickedPhone(null);
    setCustomerForm(null);
    setWizardQ("");
    setSuccessId(null);
  };

  const setCustomer = <K extends keyof ReturnType<typeof blankCustomer>>(
    k: K,
    v: ReturnType<typeof blankCustomer>[K],
  ) => setCustomerForm((f) => (f ? { ...f, [k]: v } : f));

  /* unique brands */
  const brands = useMemo(() => {
    const set = new Set(sales.map((s) => s.brand).filter(Boolean));
    return ["all", ...Array.from(set).sort()];
  }, [sales]);

  /* filtered in-stock list */
  const inStockPhones = useMemo(() => {
    const q = query.trim().toLowerCase();
    const inStock = sales.filter((s) => !s.customerName);
    return inStock.filter((s) => {
      if (brand !== "all" && s.brand !== brand) return false;
      if (!q) return true;
      return (
        s.imei?.toLowerCase().includes(q) ||
        s.brand?.toLowerCase().includes(q) ||
        s.model?.toLowerCase().includes(q) ||
        s.color?.toLowerCase().includes(q)
      );
    });
  }, [sales, query, brand]);

  const [stockPage, setStockPage] = useState(1);
  const STOCK_PAGE_SIZE = 10;
  const totalStockPages = Math.max(1, Math.ceil(inStockPhones.length / STOCK_PAGE_SIZE));
  const paginatedInStockPhones = useMemo(() => {
    const start = (stockPage - 1) * STOCK_PAGE_SIZE;
    return inStockPhones.slice(start, start + STOCK_PAGE_SIZE);
  }, [inStockPhones, stockPage]);

  useEffect(() => {
    setStockPage(1);
  }, [query, brand]);

  const totalInStock = sales.filter((s) => !s.customerName).length;
  const totalSold = sales.filter((s) => s.customerName).length;

  return (
    <div className="w-full px-4 md:px-6 lg:px-8 max-w-[1800px] mx-auto">
      <PageHeader
        title="All Stocks & Sales"
        subtitle="Browse, search, and manage your device inventory and availability"
      >
        {!isStaff && (
          <button
            onClick={openWizard}
            className="group relative inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#8b5cf6] via-[#7c3aed] to-[#6366f1] text-white font-semibold text-sm border border-white/25 shadow-[0_0_20px_rgba(139,92,246,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] hover:shadow-[0_0_28px_rgba(139,92,246,0.55),inset_0_1px_2px_rgba(255,255,255,0.6)] hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 overflow-hidden cursor-pointer"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/15 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <Plus className="size-4.5 transition-transform duration-300 group-hover:rotate-90" />
            Add New Sale
          </button>
        )}
      </PageHeader>

      {/* KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-4">
        <StatCard
          label="Total Stock"
          value={totalInStock}
          sub={`${totalInStock} available in inventory`}
          todaySub="In stock ready to sell"
          icon={ShoppingCart}
          variant="blue"
        />
        <StatCard
          label="Sold Devices"
          value={totalSold}
          sub="Customer completed sales"
          todaySub={`${sales.length > 0 ? ((totalSold / sales.length) * 100).toFixed(0) : 0}% of inventory`}
          icon={Receipt}
          variant="emerald"
          progress={sales.length > 0 ? (totalSold / sales.length) * 100 : 0}
        />
        <StatCard
          label="Available Devices"
          value={totalInStock}
          sub="Ready for sale"
          todaySub="In stock inventory"
          icon={FileText}
          variant="indigo"
          progress={sales.length > 0 ? (totalInStock / sales.length) * 100 : 0}
        />
      </div>

      {/* Navigation Tabs (Phone Stock & Sales Records) */}
      <div className="mb-3.5 flex flex-col gap-3 border-b border-muted sm:flex-row sm:items-center sm:justify-between">
        <div className="flex overflow-x-auto gap-2">
          <button
            onClick={() => setSelectedTab("stock")}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              selectedTab === "stock"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Smartphone className="size-4" /> Phone Stock ({totalInStock})
          </button>
          <button
            onClick={() => setSelectedTab("sales")}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              selectedTab === "sales"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <NotebookTabs className="size-4" /> Sales Records ({totalSold})
          </button>
        </div>

        {selectedTab === "stock" && (
          <div className="mb-2 flex w-fit items-center gap-1 rounded-xl border bg-card p-1 shadow-xs sm:mb-0">
            <button
              id="view-grid"
              type="button"
              onClick={() => setView("grid")}
              className={`inline-flex size-8 items-center justify-center rounded-lg transition-all cursor-pointer ${
                view === "grid"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              id="view-table"
              type="button"
              onClick={() => setView("table")}
              className={`inline-flex size-8 items-center justify-center rounded-lg transition-all cursor-pointer ${
                view === "table"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              title="Table View"
            >
              <List className="size-4" />
            </button>
          </div>
        )}
      </div>

      {/* Tab 1: Phone Stock */}
      {selectedTab === "stock" && (
        <div className="bg-card rounded-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-xs">
          {/* List Toolbar */}
          <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-4 bg-muted/20">
            <h3 className="font-bold text-sm flex items-center gap-2 text-foreground">
              <Smartphone className="size-4 text-primary" /> Active Stocks
            </h3>

            <div className="flex flex-1 items-center gap-2.5 max-w-md min-w-[260px]">
              <div className="relative flex-1">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  id="imei-search"
                  type="text"
                  placeholder="Search by IMEI, model, brand..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/90 dark:bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary hover:border-primary/50 dark:hover:border-primary/50 transition-all cursor-text caret-primary"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              <div className="relative shrink-0">
                <select
                  id="brand-filter"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="pl-3 pr-7 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/90 dark:bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 appearance-none cursor-pointer hover:border-primary/50 dark:hover:border-primary/50 transition-all"
                >
                  {brands.map((b) => (
                    <option key={b} value={b}>
                      {b === "all" ? "All Brands" : b}
                    </option>
                  ))}
                </select>
                <ChevronDown className="size-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-muted-foreground">
                {inStockPhones.length} phones listed
              </span>
              {(query || brand !== "all") && (
                <button
                  onClick={() => {
                    setQuery("");
                    setBrand("all");
                  }}
                  className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <X className="size-3" /> Clear filters
                </button>
              )}
            </div>
          </div>

          {/* Grid view */}
          {view === "grid" && (
            <div className="grid gap-5 p-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {inStockPhones.length === 0 && <EmptyState />}
              {paginatedInStockPhones.map((s) => (
                <StockCard
                  key={s.id}
                  sale={s}
                  onView={() => setSelected(s)}
                  onSell={!isStaff ? () => startSale(s) : undefined}
                />
              ))}
            </div>
          )}

          {/* Table view */}
          {view === "table" && (
            <StockTableView
              filtered={paginatedInStockPhones}
              isStaff={isStaff}
              onSelect={(s) => setSelected(s)}
              onStartSale={(s) => startSale(s)}
            />
          )}

          {inStockPhones.length > 0 && (
            <div className="border-t px-5 py-3 bg-muted/20 text-xs text-muted-foreground flex flex-col sm:flex-row justify-between items-center gap-3 select-none shrink-0 mt-auto">
              <span>
                Showing {(stockPage - 1) * STOCK_PAGE_SIZE + 1} to {Math.min(stockPage * STOCK_PAGE_SIZE, inStockPhones.length)} of {inStockPhones.length} items
              </span>
              <AppPagination
                currentPage={stockPage}
                totalPages={totalStockPages}
                onPageChange={setStockPage}
              />
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Sales Records */}
      {selectedTab === "sales" && (
        <PhoneSalesSection
          sales={sales}
          salesQ={salesQ}
          setSalesQ={setSalesQ}
          onViewMemo={(s) => setMemoSale(s)}
          onSelect={(s) => setSelected(s)}
        />
      )}

      {/* ── Detail Slide-over ─────────────────────── */}
      {selected && (
        <StockDetailPanel sale={selected} onClose={() => setSelected(null)} />
      )}

      {/* ── Add New Sale Wizard ─────────────────────── */}
      {!isStaff && wizardOpen && (
        <NewSaleWizard
          step={step}
          available={availablePhones}
          wizardQ={wizardQ}
          setWizardQ={setWizardQ}
          pickedPhone={pickedPhone}
          customerForm={customerForm}
          setCustomer={setCustomer}
          onPickPhone={startSale}
          onBack={() => setStep("pick")}
          onConfirm={confirmSale}
          onClose={closeWizard}
          successId={successId}
          totalAvailable={availablePhones.length}
          onPrintMemo={() => setShowSuccessMemo(true)}
        />
      )}

      {/* Print Customer Memo Modals */}
      {showSuccessMemo && sales.find((r) => r.id === successId) && (
        <CustomerMemoModal
          sale={sales.find((r) => r.id === successId)!}
          onClose={() => setShowSuccessMemo(false)}
        />
      )}

      {memoSale && (
        <CustomerMemoModal
          sale={memoSale}
          onClose={() => setMemoSale(null)}
        />
      )}
    </div>
  );
}
