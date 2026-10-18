import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { ShopExpense } from "@/lib/phone-store";
import { profit } from "@/lib/phone-store";
import { buildBusinessAccounting } from "@/lib/business-accounting";
import { fmt, PageHeader } from "@/lib/phone-ui";
import { ExpenseRecordsTable } from "@/components/partner/ExpenseRecordsTable";
import { PartnerKpiCards } from "@/components/partner/PartnerKpiCards";
import { PartnerLedgerTable } from "@/components/partner/PartnerLedgerTable";
import { PartnerOverview } from "@/components/partner/PartnerOverview";
import { PartnerTabs } from "@/components/partner/PartnerTabs";
import { PartnerTransactionModal } from "@/components/partner/PartnerTransactionModal";
import { ShopExpenseModal } from "@/components/partner/ShopExpenseModal";
import type {
  ChartDatum,
  ExpenseCategory,
  ExpenseMetrics,
  ExpenseRows,
  MonthlyExpenseGroup,
  PartnerBalances,
  PartnerTab,
  PartnerTransactionForm,
  ProfitSplitMode,
  SalesMetrics,
} from "@/components/partner/partnerTypes";
import { useAppDispatch, useAppSelector } from "../store";
import {
  addPartnerTransaction,
  addShopExpense,
  deletePartnerTransaction,
  deleteShopExpense,
} from "../store/partnerSlice";
import { BusinessOwnershipModal } from "@/components/partner/BusinessOwnershipModal";
import { CreateUserModal } from "@/components/partner/CreateUserModal";
import { fetchManagedUsers, type AccessRole } from "../store/userManagementSlice";
import { fetchBusinessProfile } from "../store/businessProfileSlice";
import { AlertTriangle, Building2, Plus, Settings, UserPlus, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/partner")({
  head: () => ({ meta: [{ title: "Partner Ledger - PhoneTrack" }] }),
  component: PartnerLedger,
});


const PAGE_SIZE = 10;

const initialTransactionForm = (): PartnerTransactionForm => ({
  partner: "",
  amount: 0,
  type: "Investment",
  date: new Date().toISOString().slice(0, 10),
  notes: "",
});

const initialExpenseRows = (): ExpenseRows => ({
  Rent: { amount: 0, notes: "" },
  Salary: { amount: 0, notes: "" },
  Internet: { amount: 0, notes: "" },
  Electricity: { amount: 0, notes: "" },
  Others: { amount: 0, notes: "" },
});

function PartnerLedger() {
  const dispatch = useAppDispatch();
  const sales = useAppSelector((state) => state.phoneSales.items);
  const gadgets = useAppSelector((state) => state.gadgets.gadgets);
  const gadgetSales = useAppSelector((state) => state.gadgets.sales);
  const transactions = useAppSelector((state) => state.partner.transactions);
  const expenses = useAppSelector((state) => state.partner.expenses);
  const partnerLoading = useAppSelector((state) => state.partner.loading);
  const configuredOwners = useAppSelector((state) => state.businessProfile.owners);
  const businessType = useAppSelector((state) => state.businessProfile.businessType);
  const currentUser = useAppSelector((state) => state.auth.user);
  const isOwnerOrAdmin = currentUser?.role === "owner" || currentUser?.role === "admin";
  const managedUsers = useAppSelector((state) => state.userManagement.users);

  useEffect(() => {
    dispatch(fetchManagedUsers());
    dispatch(fetchBusinessProfile());
  }, [dispatch]);

  const [activeTab, setActiveTab] = useState<PartnerTab>("overview");
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [ownershipModalOpen, setOwnershipModalOpen] = useState(false);
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [createUserInitialRole, setCreateUserInitialRole] = useState<AccessRole>("admin");
  const [createUserInitialName, setCreateUserInitialName] = useState("");
  const [partnerDropdownOpen, setPartnerDropdownOpen] = useState(false);

  const [ledgerPage, setLedgerPage] = useState(1);
  const [expensePage, setExpensePage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "transaction" | "expense";
    id: string;
    title: string;
    description: string;
  } | null>(null);
  const [profitSplitMode, setProfitSplitMode] = useState<ProfitSplitMode>("equal");
  const [selectedExpenseMonth, setSelectedExpenseMonth] = useState<string>(
    new Date().toISOString().slice(0, 7),
  );
  const [transactionForm, setTransactionForm] = useState<PartnerTransactionForm>(
    initialTransactionForm,
  );
  const [expenseDate, setExpenseDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [expenseRows, setExpenseRows] = useState<ExpenseRows>(initialExpenseRows);

  const partnerBalances = useMemo<PartnerBalances>(() => {
    const partners: PartnerBalances["partners"] = {};
    let total = 0;

    configuredOwners.forEach((owner) => {
      partners[owner.name] = { invest: 0, withdraw: 0, net: 0, share: owner.share };
    });

    // Valid active partner names set
    const activePartnerNameMap = new Map<string, string>();
    configuredOwners.forEach((o) => activePartnerNameMap.set(o.name.trim().toLowerCase(), o.name));
    managedUsers
      .filter((u) => (u.role === "admin" || u.role === "owner" || u.role === "partner") && u.accessStatus === "active")
      .forEach((u) => activePartnerNameMap.set(u.name.trim().toLowerCase(), u.name));

    transactions.forEach((transaction) => {
      const trimmed = (transaction.partner || "").trim();
      const lower = trimmed.toLowerCase();
      // If activePartnerNameMap exists, ignore transactions of deleted/unknown partners
      if (activePartnerNameMap.size > 0 && !activePartnerNameMap.has(lower)) {
        return;
      }
      const canonicalName = activePartnerNameMap.get(lower) || trimmed || "Unknown";
      partners[canonicalName] ??= { invest: 0, withdraw: 0, net: 0, share: 0 };
      if (transaction.type === "Investment") {
        partners[canonicalName].invest += transaction.amount;
      } else {
        partners[canonicalName].withdraw += transaction.amount;
      }
    });

    Object.keys(partners).forEach((name) => {
      partners[name].net = partners[name].invest - partners[name].withdraw;
      total += partners[name].net;
    });

    if (configuredOwners.length === 0) {
      Object.keys(partners).forEach((name) => {
        partners[name].share = total > 0 ? (partners[name].net / total) * 100 : 0;
      });
    }

    return { partners, total };
  }, [configuredOwners, managedUsers, transactions]);

  const salesMetrics = useMemo<SalesMetrics>(() => {
    const soldPhones = sales.filter((sale) => sale.customerName.trim() !== "");
    const phoneRevenue = soldPhones.reduce((sum, sale) => sum + sale.finalPrice, 0);
    const phoneProfit = soldPhones.reduce((sum, sale) => sum + profit(sale), 0);
    const gadgetRevenue = gadgetSales.reduce((sum, sale) => sum + sale.totalPrice, 0);
    const gadgetProfit = gadgetSales.reduce((sum, sale) => {
      const gadget = gadgets.find((item) => item.id === sale.gadgetId);
      const purchaseCost = gadget ? gadget.purchasePrice * sale.quantity : 0;
      return sum + sale.totalPrice - purchaseCost;
    }, 0);

    return {
      revenue: phoneRevenue + gadgetRevenue,
      grossProfit: phoneProfit + gadgetProfit,
      phoneSales: soldPhones.length,
      gadgetSales: gadgetSales.reduce((sum, sale) => sum + sale.quantity, 0),
    };
  }, [sales, gadgets, gadgetSales]);

  const expenseMetrics = useMemo<ExpenseMetrics>(() => {
    const totals: ExpenseMetrics = {
      rent: 0,
      salary: 0,
      internet: 0,
      electricity: 0,
      others: 0,
      total: 0,
    };

    expenses.forEach((expense) => {
      if (expense.category === "Rent") totals.rent += expense.amount;
      else if (expense.category === "Salary") totals.salary += expense.amount;
      else if (expense.category === "Internet") totals.internet += expense.amount;
      else if (expense.category === "Electricity") totals.electricity += expense.amount;
      else totals.others += expense.amount;
    });

    totals.total =
      totals.rent + totals.salary + totals.internet + totals.electricity + totals.others;
    return totals;
  }, [expenses]);

  const businessAccounting = useMemo(() => {
    return buildBusinessAccounting({
      partnerTransactions: transactions,
      phoneSales: sales,
      gadgets,
      gadgetSales,
      expenses,
    });
  }, [transactions, sales, gadgets, gadgetSales, expenses]);

  const netProfit = businessAccounting.summary.availableProfit;

  const partnerProfitSplit = useMemo<Record<string, number>>(() => {
    const splits: Record<string, number> = {};
    const partnerNames = Object.keys(partnerBalances.partners);
    const equalShare = partnerNames.length > 0 ? netProfit / partnerNames.length : 0;

    partnerNames.forEach((name) => {
      splits[name] =
        profitSplitMode === "equal"
          ? equalShare
          : netProfit * (partnerBalances.partners[name].share / 100);
    });

    return splits;
  }, [netProfit, profitSplitMode, partnerBalances]);

  const partnerOptions = useMemo(() => {
    // 1. All Active Admin / Owner / Partner accounts from user database
    const adminOwnerUsers = managedUsers.filter(
      (u) =>
        (u.role === "admin" || u.role === "owner" || u.role === "partner") &&
        u.accessStatus === "active" &&
        u.name?.trim(),
    );

    if (adminOwnerUsers.length > 0) {
      return Array.from(new Set(adminOwnerUsers.map((u) => u.name.trim())));
    }

    // 2. Fallback while managedUsers is loading
    const fallback = new Set<string>();
    configuredOwners.forEach((owner) => {
      if (owner.name?.trim()) fallback.add(owner.name.trim());
    });
    return Array.from(fallback);
  }, [managedUsers, configuredOwners]);

  const capitalChartData = useMemo<ChartDatum[]>(() => {
    return Object.keys(partnerBalances.partners)
      .map((name) => ({
        name,
        value: Math.max(0, partnerBalances.partners[name].net),
      }))
      .filter((item) => item.value > 0);
  }, [partnerBalances]);

  const expenseChartData = useMemo<ChartDatum[]>(() => {
    return [
      { name: "Shop Rent", value: expenseMetrics.rent },
      { name: "Salaries", value: expenseMetrics.salary },
      { name: "Internet", value: expenseMetrics.internet },
      { name: "Electricity", value: expenseMetrics.electricity },
      { name: "Others", value: expenseMetrics.others },
    ].filter((item) => item.value > 0);
  }, [expenseMetrics]);

  const monthlyExpenseGroups = useMemo<MonthlyExpenseGroup[]>(() => {
    const groups = new Map<string, MonthlyExpenseGroup>();

    expenses.forEach((expense) => {
      const parsedDate = new Date(expense.date);
      const expenseDate = Number.isNaN(parsedDate.getTime()) ? new Date(0) : parsedDate;
      const key = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, "0")}`;
      const group =
        groups.get(key) ??
        ({
          key,
          label: expenseDate.toLocaleDateString("en-BD", {
            month: "long",
            year: "numeric",
          }),
          total: 0,
          sortTime: new Date(expenseDate.getFullYear(), expenseDate.getMonth(), 1).getTime(),
          items: [],
        } satisfies MonthlyExpenseGroup);

      group.total += expense.amount;
      group.items.push({ ...expense, timestamp: expenseDate.getTime() });
      groups.set(key, group);
    });

    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        items: [...group.items].sort((a, b) => b.timestamp - a.timestamp),
      }))
      .sort((a, b) => b.sortTime - a.sortTime);
  }, [expenses]);

  useEffect(() => {
    if (monthlyExpenseGroups.length === 0) return;

    setSelectedExpenseMonth((currentMonth) =>
      monthlyExpenseGroups.some((group) => group.key === currentMonth)
        ? currentMonth
        : monthlyExpenseGroups[0].key,
    );
  }, [monthlyExpenseGroups]);

  const selectedMonthlyExpenseGroups = useMemo<MonthlyExpenseGroup[]>(() => {
    return monthlyExpenseGroups.filter((group) => group.key === selectedExpenseMonth);
  }, [monthlyExpenseGroups, selectedExpenseMonth]);

  const selectedExpenseMonthTotal = selectedMonthlyExpenseGroups.reduce(
    (sum, group) => sum + group.total,
    0,
  );

  const paginatedTransactions = useMemo(() => {
    const start = (ledgerPage - 1) * PAGE_SIZE;
    return transactions.slice(start, start + PAGE_SIZE);
  }, [transactions, ledgerPage]);

  const paginatedExpenses = useMemo(() => {
    const start = (expensePage - 1) * PAGE_SIZE;
    return expenses.slice(start, start + PAGE_SIZE);
  }, [expenses, expensePage]);

  const totalLedgerPages = Math.ceil(transactions.length / PAGE_SIZE);
  const totalExpensePages = Math.ceil(expenses.length / PAGE_SIZE);

  const handleTransactionSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!transactionForm.partner) {
      toast.error("Please select an owner or partner name");
      return;
    }
    if (transactionForm.amount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }
    if (
      transactionForm.type === "Withdrawal" &&
      transactionForm.amount > businessAccounting.summary.totalCash
    ) {
      toast.error(`Not enough business cash to withdraw. Available cash: ${fmt(businessAccounting.summary.totalCash)}.`);
      return;
    }

    dispatch(
      addPartnerTransaction({
        partner: transactionForm.partner,
        amount: Number(transactionForm.amount),
        type: transactionForm.type,
        date: new Date(transactionForm.date).toISOString(),
        notes: transactionForm.notes,
      }),
    );
    setTransactionModalOpen(false);
    setPartnerDropdownOpen(false);
    setTransactionForm(initialTransactionForm());
  };

  const handleExpenseSubmit = (event: FormEvent) => {
    event.preventDefault();
    const date = new Date(expenseDate).toISOString();
    const labels: Record<ExpenseCategory, string> = {
      Rent: "Shop Rent",
      Salary: "Staff Salary",
      Internet: "Net Bill",
      Electricity: "Current Bill",
      Others: "Others",
    };

    const newExpenses = (Object.keys(expenseRows) as ExpenseCategory[])
      .filter((category) => expenseRows[category].amount > 0)
      .map<Omit<ShopExpense, "id">>((category) => ({
        category,
        amount: Number(expenseRows[category].amount),
        date,
        notes: expenseRows[category].notes.trim() || labels[category],
      }));

    if (newExpenses.length === 0) {
      toast.error("Please enter at least one expense amount greater than 0");
      return;
    }
    const totalNewExpense = newExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    if (totalNewExpense > businessAccounting.summary.totalCash) {
      toast.error(`Not enough business cash to pay this expense. Available cash: ${fmt(businessAccounting.summary.totalCash)}.`);
      return;
    }

    Promise.all(newExpenses.map((expense) => dispatch(addShopExpense(expense)))).then(() => {
      setExpenseModalOpen(false);
    });
    setExpenseRows(initialExpenseRows());
  };

  const deleteTransaction = (id: string) => {
    setDeleteConfirm({
      type: "transaction",
      id,
      title: "Delete transaction?",
      description: "This partner cash entry will be removed from the ledger.",
    });
  };

  const deleteExpense = (id: string) => {
    setDeleteConfirm({
      type: "expense",
      id,
      title: "Delete expense record?",
      description: "This shop expense entry will be removed from the expense history.",
    });
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === "transaction") {
      dispatch(deletePartnerTransaction(deleteConfirm.id));
    } else {
      dispatch(deleteShopExpense(deleteConfirm.id));
    }
    setDeleteConfirm(null);
  };

  return (
    <div className="w-full px-4 md:px-6 lg:px-8 max-w-[1800px] mx-auto pb-8">
      <PageHeader
        title={businessType === "single" ? "Owner Equity & Expenses" : "Partner Ledger & Expenses"}
        subtitle={
          businessType === "single"
            ? "Manage sole owner capital contributions, shop expenses, and net profit"
            : "Manage capital contributions, shop expenses, and track net profits"
        }
      >
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          {isOwnerOrAdmin && (
            <button
              type="button"
              onClick={() => {
                setCreateUserInitialRole("admin");
                setCreateUserInitialName("");
                setCreateUserModalOpen(true);
              }}
              className="px-5 py-2 text-xs md:text-sm font-semibold rounded-full bg-gradient-to-r from-[#8b5cf6] via-[#7c3aed] to-[#6366f1] text-white border border-white/25 shadow-[0_0_20px_rgba(139,92,246,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] hover:shadow-[0_0_28px_rgba(139,92,246,0.55),inset_0_1px_2px_rgba(255,255,255,0.6)] hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              title="Add a new Staff, Owner, or Admin User Account"
            >
              <UserPlus className="size-4" />
              <span>Add Staff / Admin</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setOwnershipModalOpen(true)}
            className="px-5 py-2 text-xs md:text-sm font-semibold rounded-full border border-primary/30 bg-background/80 hover:bg-primary/10 hover:border-primary/60 text-foreground transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs hover:scale-[1.02] active:scale-[0.98]"
            title="Configure Single Owner or Multiple Partners"
          >
            <Building2 className="size-4 text-primary" />
            <span>{businessType === "single" ? "Owner Setup" : "Manage Partners"}</span>
          </button>
          <button
            type="button"
            onClick={() => setTransactionModalOpen(true)}
            className="px-5 py-2 text-xs md:text-sm font-semibold rounded-full bg-gradient-to-r from-[#8b5cf6] via-[#7c3aed] to-[#6366f1] text-white border border-white/25 shadow-[0_0_20px_rgba(139,92,246,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] hover:shadow-[0_0_28px_rgba(139,92,246,0.55),inset_0_1px_2px_rgba(255,255,255,0.6)] hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="size-4" /> {businessType === "single" ? "Add Owner Cash" : "Add Partner Cash"}
          </button>
          <button
            type="button"
            onClick={() => setExpenseModalOpen(true)}
            className="px-5 py-2 text-xs md:text-sm font-semibold rounded-full bg-gradient-to-r from-[#8b5cf6] via-[#7c3aed] to-[#6366f1] text-white border border-white/25 shadow-[0_0_20px_rgba(139,92,246,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] hover:shadow-[0_0_28px_rgba(139,92,246,0.55),inset_0_1px_2px_rgba(255,255,255,0.6)] hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="size-4" /> Add Shop Expense
          </button>
        </div>
      </PageHeader>


      <PartnerKpiCards
        partnerBalances={partnerBalances}
        businessSummary={businessAccounting.summary}
        loading={partnerLoading && transactions.length === 0}
      />

      <PartnerTabs
        activeTab={activeTab}
        onChange={setActiveTab}
        transactionsCount={transactions.length}
        expensesCount={expenses.length}
      />

      {activeTab === "overview" && (
        <PartnerOverview
          partnerBalances={partnerBalances}
          partnerProfitSplit={partnerProfitSplit}
          profitSplitMode={profitSplitMode}
          onProfitSplitModeChange={setProfitSplitMode}
          monthlyExpenseGroups={selectedMonthlyExpenseGroups}
          allMonthlyExpenseGroups={monthlyExpenseGroups}
          expenseMonthValue={selectedExpenseMonth}
          onExpenseMonthChange={setSelectedExpenseMonth}
          selectedExpenseTotal={selectedExpenseMonthTotal}
          expenseMetrics={expenseMetrics}
          expenseChartData={expenseChartData}
        />
      )}

      {activeTab === "ledger" && (
        <PartnerLedgerTable
          transactions={transactions}
          paginatedTransactions={paginatedTransactions}
          currentPage={ledgerPage}
          totalPages={totalLedgerPages}
          pageSize={PAGE_SIZE}
          onPageChange={setLedgerPage}
          onDelete={deleteTransaction}
          getPartnerColorClass={getPartnerColorClass}
        />
      )}

      {activeTab === "expenses" && (
        <ExpenseRecordsTable
          expenses={expenses}
          paginatedExpenses={paginatedExpenses}
          currentPage={expensePage}
          totalPages={totalExpensePages}
          pageSize={PAGE_SIZE}
          onPageChange={setExpensePage}
          onDelete={deleteExpense}
        />
      )}

      <PartnerTransactionModal
        open={transactionModalOpen}
        form={transactionForm}
        partnerOptions={partnerOptions}
        dropdownOpen={partnerDropdownOpen}
        onDropdownOpenChange={setPartnerDropdownOpen}
        onFormChange={setTransactionForm}
        onClose={() => {
          setTransactionModalOpen(false);
          setPartnerDropdownOpen(false);
        }}
        onSubmit={handleTransactionSubmit}
      />

      <ShopExpenseModal
        open={expenseModalOpen}
        expenseDate={expenseDate}
        expenseRows={expenseRows}
        onExpenseDateChange={setExpenseDate}
        onExpenseRowsChange={setExpenseRows}
        onClose={() => setExpenseModalOpen(false)}
        onSubmit={handleExpenseSubmit}
      />

      <BusinessOwnershipModal
        open={ownershipModalOpen}
        onClose={() => setOwnershipModalOpen(false)}
        canDismiss={true}
        onOpenCreateUser={(role, name) => {
          setCreateUserInitialRole(role === "staff" ? "staff" : "admin");
          setCreateUserInitialName(name || "");
          setCreateUserModalOpen(true);
        }}
      />

      <CreateUserModal
        open={createUserModalOpen}
        onClose={() => setCreateUserModalOpen(false)}
        initialRole={createUserInitialRole}
        initialName={createUserInitialName}
        onUserCreated={() => {
          dispatch(fetchManagedUsers());
        }}
      />


      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
        >
          <div
            className="w-full max-w-md rounded-xl border bg-card p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                  <AlertTriangle className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">{deleteConfirm.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{deleteConfirm.description}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:opacity-90"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getPartnerColorClass(partnerName: string): string {
  const hash = partnerName.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const colors = [
    "bg-primary/10 text-primary",
    "bg-violet-500/10 text-violet-600",
    "bg-amber-500/10 text-amber-600",
    "bg-pink-500/10 text-pink-600",
    "bg-cyan-500/10 text-cyan-600",
    "bg-emerald-500/10 text-emerald-600",
  ];
  return colors[hash % colors.length];
}
