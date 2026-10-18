import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Boxes,
  TrendingUp,
  CheckCircle2,
  Plus,
  NotebookTabs,
  LayoutGrid,
  List,
} from "lucide-react";
import {
  getGadgetAvailableQuantity,
  type Gadget,
  type GadgetSale,
} from "@/lib/gadget-store";
import { availableCashBeforePurchase } from "@/lib/business-accounting";
import { fmt, PageHeader } from "@/lib/phone-ui";
import { useAppDispatch, useAppSelector } from "../store";
import {
  addGadgetStock,
  deleteGadgetStock,
  sellGadget,
} from "../store/gadgetsSlice";
import { StatCard } from "@/components/ui/StatCard";
import { toast } from "sonner";
import type {
  AddGadgetFormData,
  SellGadgetFormData,
  CashIssueData,
  DeleteConfirmData,
} from "@/components/gadget/gadgetTypes";
import { GadgetInventorySection } from "@/components/gadget/GadgetInventorySection";
import { GadgetSalesSection } from "@/components/gadget/GadgetSalesSection";
import { AddGadgetModal } from "@/components/gadget/AddGadgetModal";
import { SellGadgetModal } from "@/components/gadget/SellGadgetModal";
import { GadgetDetailModal } from "@/components/gadget/GadgetDetailModal";
import { GadgetCashShortageModal } from "@/components/gadget/GadgetCashShortageModal";
import { DeleteGadgetModal } from "@/components/gadget/DeleteGadgetModal";
import { GadgetMemoModal } from "@/components/gadget/GadgetMemoModal";

export const Route = createFileRoute("/gadget")({
  head: () => ({ meta: [{ title: "Gadget Management — PhoneTrack" }] }),
  component: GadgetPage,
});

function GadgetPage() {
  const dispatch = useAppDispatch();
  const gadgets = useAppSelector((state) => state.gadgets.gadgets);
  const sales = useAppSelector((state) => state.gadgets.sales);
  const phoneSales = useAppSelector((state) => state.phoneSales.items);
  const partnerTransactions = useAppSelector(
    (state) => state.partner.transactions,
  );
  const expenses = useAppSelector((state) => state.partner.expenses);
  const isStaff = useAppSelector((state) => state.auth.user?.role === "staff");

  const [q, setQ] = useState("");
  const [salesQ, setSalesQ] = useState("");
  const [selectedTab, setSelectedTab] = useState<"inventory" | "sales">(
    "inventory",
  );
  const [inventoryView, setInventoryView] = useState<"grid" | "table">("grid");

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [memoSale, setMemoSale] = useState<GadgetSale | null>(null);
  const [cashIssue, setCashIssue] = useState<CashIssueData | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmData | null>(
    null,
  );

  // Focus items
  const [selectedGadget, setSelectedGadget] = useState<Gadget | null>(null);

  // Forms state
  const [addForm, setAddForm] = useState<AddGadgetFormData>({
    supplierName: "",
    productName: "",
    quantity: 1,
    purchasePrice: 0,
    minSellingPrice: 0,
    supplierPhone: "",
    color: "",
    details: "",
  });

  const [sellForm, setSellForm] = useState<SellGadgetFormData>({
    customerName: "",
    customerPhone: "",
    quantity: 1,
    sellingPrice: 0,
    paymentMethod: "Cash",
    notes: "",
    warrantyDays: 0,
  });

  // Dynamic statistics
  const stats = useMemo(() => {
    const totalStock = gadgets.reduce((sum, g) => sum + g.quantity, 0);
    const totalSold = sales.reduce((sum, s) => sum + s.quantity, 0);
    const totalAvailable = Math.max(0, totalStock - totalSold);
    return { totalStock, totalSold, totalAvailable };
  }, [gadgets, sales]);

  // Filtered lists
  const filteredGadgets = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return gadgets;
    return gadgets.filter(
      (g) =>
        g.productName.toLowerCase().includes(s) ||
        g.supplierName.toLowerCase().includes(s) ||
        g.color.toLowerCase().includes(s) ||
        g.supplierPhone.includes(s),
    );
  }, [gadgets, q]);

  const filteredSales = useMemo(() => {
    const s = salesQ.trim().toLowerCase();
    if (!s) return sales;
    return sales.filter(
      (sl) =>
        sl.productName.toLowerCase().includes(s) ||
        sl.customerName.toLowerCase().includes(s) ||
        sl.invoiceNumber.toLowerCase().includes(s) ||
        sl.customerPhone.includes(s),
    );
  }, [sales, salesQ]);

  // Handlers
  const handleAddGadgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isStaff || addLoading) return;
    if (
      !addForm.productName ||
      !addForm.supplierName ||
      !addForm.supplierPhone ||
      !addForm.color
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (addForm.quantity < 1) {
      toast.error("Quantity must be at least 1.");
      return;
    }
    if (addForm.purchasePrice < 0 || addForm.minSellingPrice < 0) {
      toast.error("Prices cannot be negative.");
      return;
    }
    const purchaseCost =
      Number(addForm.quantity) * Number(addForm.purchasePrice);
    const availableCash = availableCashBeforePurchase({
      partnerTransactions,
      phoneSales,
      gadgets,
      gadgetSales: sales,
      expenses,
    });
    if (purchaseCost > availableCash) {
      setCashIssue({
        availableCash,
        purchaseCost,
        shortage: purchaseCost - availableCash,
        quantity: Number(addForm.quantity),
        unitPrice: Number(addForm.purchasePrice),
        productName: addForm.productName,
      });
      return;
    }

    const newGadget = {
      productName: addForm.productName,
      supplierName: addForm.supplierName,
      quantity: Number(addForm.quantity),
      purchasePrice: Number(addForm.purchasePrice),
      minSellingPrice: Number(addForm.minSellingPrice),
      supplierPhone: addForm.supplierPhone,
      color: addForm.color,
      details: addForm.details || undefined,
    };

    try {
      setAddLoading(true);
      await dispatch(addGadgetStock(newGadget)).unwrap();
      setAddModalOpen(false);
      setAddForm({
        supplierName: "",
        productName: "",
        quantity: 1,
        purchasePrice: 0,
        minSellingPrice: 0,
        supplierPhone: "",
        color: "",
        details: "",
      });
    } catch {
      // Error is already alerted via toast in the thunk
    } finally {
      setAddLoading(false);
    }
  };

  const handleSellGadgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isStaff || !selectedGadget) return;
    const available = getGadgetAvailableQuantity(selectedGadget, sales);

    if (!sellForm.customerName || !sellForm.customerPhone) {
      toast.error("Please fill in customer details.");
      return;
    }
    if (sellForm.quantity < 1) {
      toast.error("Sell quantity must be at least 1.");
      return;
    }
    if (sellForm.quantity > available) {
      toast.error(
        `Cannot sell more than available stock (${available} units).`,
      );
      return;
    }
    if (sellForm.sellingPrice < selectedGadget.minSellingPrice) {
      toast.error(
        `Selling price cannot be lower than the minimum selling price (${fmt(selectedGadget.minSellingPrice)}).`,
      );
      return;
    }

    const price = Number(sellForm.sellingPrice);
    const qty = Number(sellForm.quantity);
    const warrantyExpiry =
      sellForm.warrantyDays > 0
        ? new Date(Date.now() + sellForm.warrantyDays * 86400000).toISOString()
        : undefined;

    const newSale = {
      gadgetId: selectedGadget.id,
      productName: selectedGadget.productName,
      customerName: sellForm.customerName,
      customerPhone: sellForm.customerPhone,
      saleDate: new Date().toISOString(),
      quantity: qty,
      sellingPrice: price,
      totalPrice: qty * price,
      paymentMethod: sellForm.paymentMethod,
      invoiceNumber: "",
      notes: sellForm.notes || undefined,
      salesPerson: "Admin",
      warrantyDays:
        sellForm.warrantyDays > 0 ? Number(sellForm.warrantyDays) : undefined,
      warrantyExpiry,
    };

    dispatch(sellGadget(newSale))
      .unwrap()
      .then((createdSale) => setMemoSale(createdSale))
      .catch(() => undefined);

    setSellModalOpen(false);
    setSellForm({
      customerName: "",
      customerPhone: "",
      quantity: 1,
      sellingPrice: 0,
      paymentMethod: "Cash",
      notes: "",
      warrantyDays: 0,
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (isStaff) return;
    setDeleteConfirm({ id, name });
  };

  const confirmDeleteGadget = () => {
    if (!deleteConfirm) return;
    dispatch(deleteGadgetStock(deleteConfirm.id));
    setDeleteConfirm(null);
  };

  const openSellModal = (gadget: Gadget) => {
    if (isStaff) return;
    setSelectedGadget(gadget);
    setSellForm((f) => ({
      ...f,
      sellingPrice: gadget.minSellingPrice,
      quantity: 1,
      warrantyDays: 0,
    }));
    setSellModalOpen(true);
  };

  const openDetailModal = (gadget: Gadget) => {
    setSelectedGadget(gadget);
    setDetailModalOpen(true);
  };

  return (
    <div className="w-full px-4 md:px-6 lg:px-8 max-w-[1800px] mx-auto">
      {/* Page Header */}
      <PageHeader
        title="Gadget Manager"
        subtitle="Track and manage electronic accessory inventories and sales"
      >
        {!isStaff && (
          <button
            onClick={() => setAddModalOpen(true)}
            className="group relative inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#8b5cf6] via-[#7c3aed] to-[#6366f1] text-white font-semibold text-sm border border-white/25 shadow-[0_0_20px_rgba(139,92,246,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] hover:shadow-[0_0_28px_rgba(139,92,246,0.55),inset_0_1px_2px_rgba(255,255,255,0.6)] hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 overflow-hidden cursor-pointer"
          >
            <Plus className="size-4.5 transition-transform duration-300 group-hover:rotate-90" />
            Add Gadget
          </button>
        )}
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-4">
        <StatCard
          label="Total Stock"
          value={stats.totalAvailable.toLocaleString()}
          sub={`${stats.totalAvailable} available in inventory`}
          todaySub="In stock ready to sell"
          icon={Boxes}
          variant="blue"
        />
        <StatCard
          label="Sold Units"
          value={stats.totalSold.toLocaleString()}
          sub="Total gadget sales"
          todaySub={`${stats.totalStock > 0 ? ((stats.totalSold / stats.totalStock) * 100).toFixed(0) : 0}% turnover rate`}
          icon={TrendingUp}
          variant="emerald"
          progress={
            stats.totalStock > 0
              ? (stats.totalSold / stats.totalStock) * 100
              : 0
          }
        />
        <StatCard
          label="Available Units"
          value={stats.totalAvailable.toLocaleString()}
          sub="In stock units"
          todaySub="Ready for sale"
          icon={CheckCircle2}
          variant="indigo"
          progress={
            stats.totalStock > 0
              ? (stats.totalAvailable / stats.totalStock) * 100
              : 0
          }
        />
      </div>

      {/* Navigation Tabs */}
      <div className="mb-3.5 flex flex-col gap-3 border-b border-muted sm:flex-row sm:items-center sm:justify-between">
        <div className="flex overflow-x-auto gap-2">
          <button
            onClick={() => setSelectedTab("inventory")}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              selectedTab === "inventory"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Boxes className="size-4" /> Gadget Stock
          </button>
          <button
            onClick={() => setSelectedTab("sales")}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              selectedTab === "sales"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <NotebookTabs className="size-4" /> Sales Records ({sales.length})
          </button>
        </div>
        {selectedTab === "inventory" && (
          <div className="mb-2 flex w-fit items-center gap-1 rounded-xl border bg-card p-1 shadow-sm sm:mb-0">
            <button
              type="button"
              onClick={() => setInventoryView("grid")}
              className={`inline-flex size-8 items-center justify-center rounded-lg transition-all cursor-pointer ${
                inventoryView === "grid"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setInventoryView("table")}
              className={`inline-flex size-8 items-center justify-center rounded-lg transition-all cursor-pointer ${
                inventoryView === "table"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              title="List View"
            >
              <List className="size-4" />
            </button>
          </div>
        )}
      </div>

      {/* Tab 1: Gadget Inventory */}
      {selectedTab === "inventory" && (
        <GadgetInventorySection
          filteredGadgets={filteredGadgets}
          sales={sales}
          q={q}
          setQ={setQ}
          inventoryView={inventoryView}
          isStaff={isStaff}
          onOpenDetail={openDetailModal}
          onOpenSell={openSellModal}
          onDelete={handleDelete}
        />
      )}

      {/* Tab 2: Sales History */}
      {selectedTab === "sales" && (
        <GadgetSalesSection
          filteredSales={filteredSales}
          salesQ={salesQ}
          setSalesQ={setSalesQ}
          onViewMemo={(s) => setMemoSale(s)}
        />
      )}

      {/* ── MODALS ───────────────────────────────────────── */}
      {!isStaff && (
        <AddGadgetModal
          open={addModalOpen}
          loading={addLoading}
          form={addForm}
          setForm={setAddForm}
          onClose={() => setAddModalOpen(false)}
          onSubmit={handleAddGadgetSubmit}
        />
      )}

      {!isStaff && (
        <SellGadgetModal
          open={sellModalOpen}
          gadget={selectedGadget}
          sales={sales}
          form={sellForm}
          setForm={setSellForm}
          onClose={() => setSellModalOpen(false)}
          onSubmit={handleSellGadgetSubmit}
        />
      )}

      <GadgetDetailModal
        open={detailModalOpen}
        gadget={selectedGadget}
        sales={sales}
        isStaff={isStaff}
        onClose={() => setDetailModalOpen(false)}
        onSell={(g) => openSellModal(g)}
      />

      <GadgetCashShortageModal
        cashIssue={cashIssue}
        onClose={() => setCashIssue(null)}
      />

      <DeleteGadgetModal
        deleteConfirm={deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={confirmDeleteGadget}
      />

      <GadgetMemoModal sale={memoSale} onClose={() => setMemoSale(null)} />
    </div>
  );
}
