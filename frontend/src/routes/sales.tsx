import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Smartphone,
  Receipt,
  Plus,
  Trash2,
  Pencil,
  Eye,
  User,
  ShoppingCart,
  CheckCircle2,
  ChevronDown,
  Search as SearchIcon,
  X,
} from "lucide-react";
import { nextInvoiceNumber, Sale } from "@/lib/phone-store";
import { availableCashBeforePurchase } from "@/lib/business-accounting";
import { fmt, PageHeader, CustomerMemoModal } from "@/lib/phone-ui";
import { useAppDispatch, useAppSelector } from "../store";
import {
  registerPhoneStock,
  updatePhoneStock,
  deletePhoneStock,
  type PhoneStockCreatePayload,
} from "../store/phoneSalesSlice";
import { toast } from "sonner";
import { BarcodeScannerModal } from "@/components/scanner/BarcodeScannerModal";
import {
  parseScannedCode,
  lookupDeviceFromInventory,
  resolveNextAvailableImei,
} from "@/lib/device-scanner-helper";
import { StatCard } from "@/components/ui/StatCard";
import {
  StockSale,
  blankForm,
  getAddedByAdmin,
} from "@/components/sales/salesUtils";
import { AddStockModal } from "@/components/sales/AddStockModal";
import { StockDetailModal } from "@/components/sales/StockDetailModal";
import { DeleteStockModal } from "@/components/sales/DeleteStockModal";
import { EditStockModal } from "@/components/sales/EditStockModal";
import {
  NewSaleWizard,
  WizardStep,
  blankCustomer,
} from "@/components/sales/NewSaleWizard";
import { StockListTable } from "@/components/sales/StockListTable";

export const Route = createFileRoute("/sales")({
  head: () => ({ meta: [{ title: "Add Stock — PhoneTrack" }] }),
  component: StockPage,
});

function StockPage() {
  const dispatch = useAppDispatch();
  const [form, setForm] = useState<StockSale>(blankForm);
  const rows = useAppSelector((state) => state.phoneSales.items) as StockSale[];
  const currentUser = useAppSelector((state) => state.auth.user);
  const gadgets = useAppSelector((state) => state.gadgets.gadgets);
  const gadgetSales = useAppSelector((state) => state.gadgets.sales);
  const partnerTransactions = useAppSelector((state) => state.partner.transactions);
  const expenses = useAppSelector((state) => state.partner.expenses);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<StockSale | null>(null);
  const [q, setQ] = useState("");
  const [viewItem, setViewItem] = useState<StockSale | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StockSale | null>(null);

  /* add phone modal state */
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);

  /* barcode scanner modal state */
  const [scannerOpen, setScannerOpen] = useState(false);

  const handleBarcodeScanned = useCallback(
    (scannedText: string) => {
      const parsed = parseScannedCode(scannedText);
      const rawImei = parsed.imei || scannedText.trim();
      const resolved = resolveNextAvailableImei(rawImei, rows.map((r) => r.imei));
      const targetImei = resolved.finalImei;
      const historyMatch = lookupDeviceFromInventory(resolved.baseImei, rows);

      setForm((prev) => {
        const next = { ...prev, imei: targetImei };
        if (parsed.brand) next.brand = parsed.brand;
        else if (historyMatch?.brand && !prev.brand) next.brand = historyMatch.brand;

        if (parsed.model) next.model = parsed.model;
        else if (historyMatch?.model && !prev.model) next.model = historyMatch.model;

        if (parsed.variant) next.variant = parsed.variant;
        else if (historyMatch?.variant && !prev.variant) next.variant = historyMatch.variant;

        if (parsed.ram) next.ram = parsed.ram;
        else if (historyMatch?.ram && !prev.ram) next.ram = historyMatch.ram;

        if (parsed.storage) next.storage = parsed.storage;
        else if (historyMatch?.storage && !prev.storage) next.storage = historyMatch.storage;

        if (parsed.color) next.color = parsed.color;
        else if (historyMatch?.color && !prev.color) next.color = historyMatch.color;
        return next;
      });

      if (resolved.isRepeated) {
        toast.success(
          `IMEI ${resolved.baseImei} previously registered. Assigned ${targetImei} for restock.`,
        );
      } else if (historyMatch?.model) {
        toast.success(
          `IMEI ${targetImei} scanned! Matched from inventory specs: ${historyMatch.brand} ${historyMatch.model}`,
        );
      } else {
        toast.success(`IMEI ${targetImei} scanned successfully!`);
      }
    },
    [rows],
  );

  // Hardware barcode scanner gun listener (rapid keypresses ending in Enter)
  useEffect(() => {
    let buffer = "";
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      ) {
        return;
      }

      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 120) {
        buffer = "";
      }
      lastKeyTime = currentTime;

      if (e.key === "Enter") {
        if (buffer.length >= 8) {
          handleBarcodeScanned(buffer);
          buffer = "";
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleBarcodeScanned]);

  /* wizard state */
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState<"pick" | "customer">("pick");
  const [wizardQ, setWizardQ] = useState("");
  const [pickedPhone, setPickedPhone] = useState<Sale | null>(null);
  const [customerForm, setCustomerForm] = useState<ReturnType<typeof blankCustomer> | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [showSuccessMemo, setShowSuccessMemo] = useState(false);
  const [memoSale, setMemoSale] = useState<Sale | null>(null);

  const availablePhones = useMemo(() => {
    const wq = wizardQ.trim().toLowerCase();
    const inStock = rows.filter((r) => !r.customerName);
    if (!wq) return inStock;
    return inStock.filter(
      (r) =>
        r.imei?.toLowerCase().includes(wq) ||
        r.brand?.toLowerCase().includes(wq) ||
        r.model?.toLowerCase().includes(wq) ||
        r.color?.toLowerCase().includes(wq) ||
        r.storage?.toLowerCase().includes(wq),
    );
  }, [rows, wizardQ]);

  const updateRow = (id: string, patch: Partial<Sale>) => {
    dispatch(updatePhoneStock({ id, patch }));
  };

  const openWizard = () => {
    setWizardOpen(true);
    setStep("pick");
    setWizardQ("");
    setPickedPhone(null);
    setCustomerForm(null);
    setSuccessId(null);
  };

  const startSale = (phone: Sale) => {
    setPickedPhone(phone);
    setCustomerForm(blankCustomer(phone));
    setStep("customer");
    setWizardOpen(true);
    setSuccessId(null);
  };

  const confirmSale = () => {
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
      toast.error("Discount cannot be greater than the actual sell price.");
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
      invoiceNumber: nextInvoiceNumber(),
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
    setStep("pick"); // reset to show success
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

  const set = <K extends keyof StockSale>(k: K, v: StockSale[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const finalPrice = useMemo(
    () => Math.max(0, (form.sellingPrice || 0) - (form.discount || 0)),
    [form.sellingPrice, form.discount],
  );
  const profitAmt = finalPrice - (form.purchasePrice || 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addLoading) return;
    if (!form.imei) {
      toast.error("IMEI is required");
      return;
    }
    const availableCash = availableCashBeforePurchase({
      partnerTransactions,
      phoneSales: rows,
      gadgets,
      gadgetSales,
      expenses,
    });
    if (form.purchasePrice > availableCash) {
      toast.error(
        `Not enough business cash to buy this phone. Available cash: ${fmt(availableCash)}.`,
      );
      return;
    }
    const resolvedImei = resolveNextAvailableImei(form.imei, rows.map((r) => r.imei)).finalImei;

    const record: PhoneStockCreatePayload = {
      imei: resolvedImei || form.imei,
      brand: form.brand,
      model: form.model,
      variant: form.variant,
      color: form.color,
      ram: form.ram,
      storage: form.storage,
      purchasePrice: form.purchasePrice,
      sellingPrice: form.sellingPrice,
      sellerNID: form.sellerNID,
      supplierName: form.supplierName,
      supplierPhone: form.supplierPhone,
      buyerName: form.supplierName,
      buyerPhone: form.supplierPhone,
      warrantyExpiry: form.warrantyExpiry,
      salesPerson: currentUser?.name || "Mehedi",
      addedBy: currentUser?.name || "Mehedi",
    };
    try {
      setAddLoading(true);
      await dispatch(registerPhoneStock(record)).unwrap();
      setForm(blankForm());
      setAddModalOpen(false);
    } catch {
      // Error toast is already handled in thunk
    } finally {
      setAddLoading(false);
    }
  };

  const requestDelete = (item: StockSale) => {
    setDeleteTarget(item);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    dispatch(deletePhoneStock(deleteTarget.id));
    if (viewItem?.id === deleteTarget.id) setViewItem(null);
    if (editId === deleteTarget.id) cancelEdit();
    setDeleteTarget(null);
  };

  const startEdit = (r: StockSale) => {
    setEditId(r.id);
    setDraft({ ...r });
  };
  const cancelEdit = () => {
    setEditId(null);
    setDraft(null);
  };
  const saveEdit = () => {
    if (!draft) return;
    dispatch(updatePhoneStock({ id: draft.id, patch: draft }));
    cancelEdit();
  };

  const availableOnlyRows = useMemo(() => rows.filter((r) => !r.customerName), [rows]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return availableOnlyRows;
    return availableOnlyRows.filter(
      (r) =>
        r.imei.toLowerCase().includes(s) ||
        r.brand.toLowerCase().includes(s) ||
        r.model.toLowerCase().includes(s) ||
        (r.supplierName || "").toLowerCase().includes(s) ||
        (r.supplierPhone || "").toLowerCase().includes(s) ||
        getAddedByAdmin(r, currentUser?.name).toLowerCase().includes(s),
    );
  }, [availableOnlyRows, q]);

  return (
    <div className="w-full px-4 md:px-6 lg:px-8 max-w-[1800px] mx-auto min-h-[calc(100dvh-5.5rem)] flex flex-col pb-4">
      <PageHeader
        title="Add Stock"
        subtitle="Register, edit, sell, and delete devices in inventory"
      >
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setAddModalOpen(true)}
            className="group relative inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#8b5cf6] via-[#7c3aed] to-[#6366f1] text-white font-semibold text-sm border border-white/25 shadow-[0_0_20px_rgba(139,92,246,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] hover:shadow-[0_0_28px_rgba(139,92,246,0.55),inset_0_1px_2px_rgba(255,255,255,0.6)] hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 overflow-hidden cursor-pointer"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/15 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <Plus className="size-4.5 transition-transform duration-300 group-hover:rotate-90" />
            Add Phone Stock
          </button>
          <button
            onClick={openWizard}
            className="group relative inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white font-semibold text-sm border border-white/25 shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 overflow-hidden cursor-pointer"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/15 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <ShoppingCart className="size-4.5 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6" />
            Add New Sale
          </button>
        </div>
      </PageHeader>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3 sm:mb-4">
        <StatCard
          label="Total Stock"
          value={availableOnlyRows.length}
          sub={`${availableOnlyRows.length} available in inventory`}
          todaySub="In stock ready to sell"
          icon={Smartphone}
          variant="blue"
        />
        <StatCard
          label="Available in Inventory"
          value={rows.filter((r) => !r.customerName).length}
          sub="Ready to sell"
          todaySub="In stock"
          icon={CheckCircle2}
          variant="indigo"
          progress={rows.length > 0 ? (rows.filter((r) => !r.customerName).length / rows.length) * 100 : 0}
        />
        <StatCard
          label="Sold Devices"
          value={rows.filter((r) => !!r.customerName).length}
          sub="Customer completed orders"
          todaySub={`${rows.length > 0 ? ((rows.filter((r) => !!r.customerName).length / rows.length) * 100).toFixed(0) : 0}% clearance`}
          icon={ShoppingCart}
          variant="emerald"
          progress={rows.length > 0 ? (rows.filter((r) => !!r.customerName).length / rows.length) * 100 : 0}
        />
      </div>

      {/* ── MODAL: ADD PHONE STOCK ──────────────────────── */}
      <AddStockModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        form={form}
        setForm={setForm}
        onSubmit={submit}
        addLoading={addLoading}
        onOpenScanner={() => setScannerOpen(true)}
        existingStocks={rows}
      />

      <StockListTable
        filtered={filtered}
        q={q}
        setQ={setQ}
        onView={setViewItem}
        onEdit={startEdit}
        onDelete={requestDelete}
        currentUserName={currentUser?.name}
      />

      {viewItem && (
        <StockDetailModal
          item={viewItem}
          onClose={() => setViewItem(null)}
          onEdit={() => {
            const currentItem = viewItem;
            setViewItem(null);
            setTimeout(() => {
              startEdit(currentItem);
            }, 60);
          }}
        />
      )}

      {editId && draft && (
        <EditStockModal draft={draft} onChange={setDraft} onSave={saveEdit} onClose={cancelEdit} />
      )}

      {/* ── Add New Sale Wizard ─────────────────────── */}
      {deleteTarget && (
        <DeleteStockModal
          item={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}

      {wizardOpen && (
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

      {showSuccessMemo && rows.find((r) => r.id === successId) && (
        <CustomerMemoModal
          sale={rows.find((r) => r.id === successId)!}
          onClose={() => setShowSuccessMemo(false)}
        />
      )}

      {memoSale && <CustomerMemoModal sale={memoSale} onClose={() => setMemoSale(null)} />}

      <BarcodeScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleBarcodeScanned}
        title="Scan Phone Box Barcode / IMEI"
      />
    </div>
  );
}


