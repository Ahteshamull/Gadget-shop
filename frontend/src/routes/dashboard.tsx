import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from "recharts";
import {
  TrendingUp, Plus, Receipt,
  Boxes, ShoppingCart, Briefcase,
  Eye, EyeOff, Wallet, Building2, Users, Printer,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../store";
import { fmt, PageHeader } from "@/lib/phone-ui";
import {
  saveBusinessProfile,
  type BusinessOwner,
  type BusinessOwnerRole,
} from "../store/businessProfileSlice";
import { fetchGadgets, fetchGadgetSales } from "../store/gadgetsSlice";
import { BusinessOwnershipModal } from "@/components/partner/BusinessOwnershipModal";
import { StatCardSkeleton } from "@/components/ui/StatCard";
import { getGadgetAvailableQuantity, type GadgetSale } from "@/lib/gadget-store";
import { GadgetMemoModal } from "@/components/gadget/GadgetMemoModal";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Gadget POS" },
      { name: "description", content: "Gadget sales overview, profit, inventory and financial KPIs." },
    ],
  }),
  component: Dashboard,
});

const CHART_COLORS = ["oklch(0.5 0.18 260)", "oklch(0.62 0.17 155)", "oklch(0.75 0.16 75)", "oklch(0.58 0.22 25)", "oklch(0.55 0.15 200)"];

const MONTHS = [
  { label: "January", value: 0 },
  { label: "February", value: 1 },
  { label: "March", value: 2 },
  { label: "April", value: 3 },
  { label: "May", value: 4 },
  { label: "June", value: 5 },
  { label: "July", value: 6 },
  { label: "August", value: 7 },
  { label: "September", value: 8 },
  { label: "October", value: 9 },
  { label: "November", value: 10 },
  { label: "December", value: 11 }
];

const defaultOwnerNames = ["Owner 1", "Owner 2", "Owner 3"];

function buildDefaultOwners(count: number): BusinessOwner[] {
  const share = Number((100 / count).toFixed(2));
  return Array.from({ length: count }, (_, index) => ({
    name: defaultOwnerNames[index],
    role: index === 0 ? "Owner" : "Partner",
    share: index === count - 1 ? Number((100 - share * (count - 1)).toFixed(2)) : share,
  }));
}

function Dashboard() {
  const dispatch = useAppDispatch();
  const gadgets = useAppSelector((state) => state.gadgets.gadgets);
  const gadgetSales = useAppSelector((state) => state.gadgets.sales);
  const partnerTransactions = useAppSelector((state) => state.partner.transactions);
  const shopExpenses = useAppSelector((state) => state.partner.expenses);
  const gadgetsLoading = useAppSelector((state) => state.gadgets.loading);
  const partnerLoading = useAppSelector((state) => state.partner.loading);
  const isDashboardLoading = (gadgetsLoading || partnerLoading) && gadgets.length === 0;

  const businessProfile = useAppSelector((state) => state.businessProfile);
  const role = useAppSelector((state) => state.auth.user?.role);
  const isStaff = role === "staff";

  const [showInvested, setShowInvested] = useState(false);
  const [viewMode, setViewMode] = useState<"yearly" | "monthly">("monthly");
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [ownershipModalOpen, setOwnershipModalOpen] = useState(false);
  const [viewMemoSale, setViewMemoSale] = useState<GadgetSale | null>(null);

  useEffect(() => {
    dispatch(fetchGadgets());
    dispatch(fetchGadgetSales());
  }, [dispatch]);

  // Fast map from gadgetId to purchase price
  const gadgetMap = useMemo(() => {
    const map = new Map<string, number>();
    gadgets.forEach((g) => {
      map.set(g.id, g.purchasePrice);
    });
    return map;
  }, [gadgets]);

  const saleProfit = (sale: GadgetSale): number => {
    const cost = (gadgetMap.get(sale.gadgetId) ?? 0) * sale.quantity;
    return Math.max(0, sale.totalPrice - cost);
  };

  const years = useMemo(() => {
    const allYears = gadgetSales.map((s) => new Date(s.saleDate).getFullYear());
    const uniqueYears = Array.from(new Set(allYears));
    const currentYear = new Date().getFullYear();
    if (!uniqueYears.includes(currentYear)) {
      uniqueYears.push(currentYear);
    }
    return uniqueYears.sort((a, b) => b - a);
  }, [gadgetSales]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Monthly logic
  const monthStart = new Date(selectedYear, selectedMonth, 1);
  const monthEnd = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);
  const lastMonthStart = new Date(selectedYear, selectedMonth - 1, 1);
  const lastMonthEnd = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);

  const monthlySales = gadgetSales.filter((s) => {
    const d = new Date(s.saleDate);
    return d >= monthStart && d <= monthEnd;
  });
  const lastMonthSales = gadgetSales.filter((s) => {
    const d = new Date(s.saleDate);
    return d >= lastMonthStart && d <= lastMonthEnd;
  });

  const monthlyRev = monthlySales.reduce((a, s) => a + s.totalPrice, 0);
  const lastRev = lastMonthSales.reduce((a, s) => a + s.totalPrice, 0);
  const revChange = lastRev > 0 ? ((monthlyRev - lastRev) / lastRev) * 100 : 0;
  const selectedMonthProfit = monthlySales.reduce((a, s) => a + saleProfit(s), 0);

  // Yearly logic
  const yearStart = new Date(selectedYear, 0, 1);
  const yearEnd = new Date(selectedYear, 11, 31, 23, 59, 59, 999);
  const lastYearStart = new Date(selectedYear - 1, 0, 1);
  const lastYearEnd = new Date(selectedYear - 1, 11, 31, 23, 59, 59, 999);

  const yearlySales = gadgetSales.filter((s) => {
    const d = new Date(s.saleDate);
    return d >= yearStart && d <= yearEnd;
  });
  const lastYearSales = gadgetSales.filter((s) => {
    const d = new Date(s.saleDate);
    return d >= lastYearStart && d <= lastYearEnd;
  });

  const yearlyRev = yearlySales.reduce((a, s) => a + s.totalPrice, 0);
  const lastYearRev = lastYearSales.reduce((a, s) => a + s.totalPrice, 0);
  const yoyRevChange = lastYearRev > 0 ? ((yearlyRev - lastYearRev) / lastYearRev) * 100 : 0;
  const yearlyProfit = yearlySales.reduce((a, s) => a + saleProfit(s), 0);

  const todaysSales = gadgetSales.filter((s) => new Date(s.saleDate) >= today);
  const todayProfit = todaysSales.reduce((a, s) => a + saleProfit(s), 0);

  // Inventory & Accounting
  const totalAvailableStockUnits = gadgets.reduce(
    (acc, g) => acc + getGadgetAvailableQuantity(g, gadgetSales),
    0
  );
  const totalSoldUnits = gadgetSales.reduce((acc, s) => acc + s.quantity, 0);

  const totalRevenue = gadgetSales.reduce((a, s) => a + s.totalPrice, 0);
  const gadgetStockCost = gadgets.reduce((a, g) => a + g.purchasePrice * g.quantity, 0);
  const operatingExpense = shopExpenses.reduce((a, e) => a + e.amount, 0);
  const totalSpentVal = gadgetStockCost + operatingExpense;
  const totalInvestVal = partnerTransactions.reduce(
    (a, t) => a + (t.type === "Investment" ? t.amount : -t.amount),
    0
  );
  const liquidCashVal = totalInvestVal + totalRevenue - totalSpentVal;

  // Trend data
  const trend = useMemo(() => {
    if (viewMode === "yearly") {
      return MONTHS.map((m) => {
        const mSales = gadgetSales.filter((s) => {
          const d = new Date(s.saleDate);
          return d.getFullYear() === selectedYear && d.getMonth() === m.value;
        });
        const revenue = mSales.reduce((a, s) => a + s.totalPrice, 0);
        const profit = mSales.reduce((a, s) => a + saleProfit(s), 0);
        return { name: m.label.slice(0, 3), revenue, profit };
      });
    }

    // Monthly view (daily breakdown)
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      const daySales = gadgetSales.filter((s) => {
        const d = new Date(s.saleDate);
        return (
          d.getFullYear() === selectedYear &&
          d.getMonth() === selectedMonth &&
          d.getDate() === day
        );
      });
      const revenue = daySales.reduce((a, s) => a + s.totalPrice, 0);
      const profit = daySales.reduce((a, s) => a + saleProfit(s), 0);
      return { name: String(day), revenue, profit };
    });
  }, [viewMode, selectedYear, selectedMonth, gadgetSales, gadgetMap]);

  // Top Products breakdown
  const topProducts = useMemo(() => {
    const map = new Map<string, number>();
    gadgetSales.forEach((s) => {
      map.set(s.productName, (map.get(s.productName) || 0) + s.quantity);
    });
    return Array.from(map, ([productName, count]) => ({
      brand: productName,
      count,
    }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [gadgetSales]);

  const periodProfit = viewMode === "yearly" ? yearlyProfit : selectedMonthProfit;
  const periodSalesCount = viewMode === "yearly" ? yearlySales.length : monthlySales.length;
  const cashSource = totalInvestVal + totalRevenue;
  const cashHealth = cashSource > 0
    ? Math.max(0, Math.min(100, Math.round((liquidCashVal / cashSource) * 100)))
    : 0;

  return (
    <div className="w-full px-4 md:px-6 lg:px-8 max-w-[1800px] mx-auto pb-10 space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your gadget sales, revenue, profit, and live inventory"
      >
        <div className="flex items-center gap-2">
          {!isStaff && (
            <button
              type="button"
              onClick={() => setOwnershipModalOpen(true)}
              className="px-4 py-2 rounded-full border border-primary/30 bg-background/80 hover:bg-primary/10 hover:border-primary/60 text-foreground text-sm font-semibold inline-flex items-center gap-1.5 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-xs group"
            >
              <Building2 className="size-4 text-primary transition-transform duration-300 group-hover:rotate-6" />
              <span>{businessProfile.businessType === "single" ? "Owner Setup" : "Partners Setup"}</span>
            </button>
          )}
          <Link
            to="/sales"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold inline-flex items-center gap-1.5 shadow-md transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Plus className="size-4" /> Quick POS Sale
          </Link>
        </div>
      </PageHeader>

      <BusinessOwnershipModal
        open={ownershipModalOpen}
        onClose={() => setOwnershipModalOpen(false)}
        canDismiss={true}
      />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {isDashboardLoading ? (
          <>
            <StatCardSkeleton variant="blue" />
            <StatCardSkeleton variant="emerald" />
            <StatCardSkeleton variant="teal" />
            <StatCardSkeleton variant="amber" />
            {!isStaff && (
              <>
                <StatCardSkeleton variant="rose" />
                <StatCardSkeleton variant="indigo" />
              </>
            )}
          </>
        ) : (
          [
            {
              label: "Available Gadget Stock",
              value: totalAvailableStockUnits.toLocaleString(),
              sub: `${gadgets.length} unique gadget models`,
              todaySub: `${totalAvailableStockUnits} units in stock`,
              icon: Boxes,
              color: "bg-blue-500/10 text-blue-600",
              accent: "from-blue-500/20",
              bar: "from-blue-500 to-cyan-400",
            },
            {
              label: viewMode === "yearly" ? "Yearly Sales" : "Monthly Sales",
              value: periodSalesCount.toLocaleString(),
              sub: viewMode === "yearly" ? "Yearly transactions" : "Monthly transactions",
              todaySub: todaysSales.length > 0 ? `${todaysSales.length} sold today` : "No sales today",
              icon: ShoppingCart,
              color: "bg-emerald-500/10 text-emerald-600",
              accent: "from-emerald-500/20",
              bar: "from-emerald-500 to-teal-400",
              trend: viewMode === "yearly" ? yoyRevChange : revChange,
            },
            ...(!isStaff
              ? [
                  {
                    label: viewMode === "yearly" ? "Yearly Profit" : "Monthly Profit",
                    value: fmt(periodProfit),
                    sub: "Net gross margin",
                    todaySub: todayProfit > 0 ? `Today: ${fmt(todayProfit)}` : "No profit today",
                    icon: TrendingUp,
                    color: "bg-pink-500/10 text-pink-600",
                    accent: "from-pink-500/20",
                    bar: "from-pink-500 to-fuchsia-400",
                  },
                  {
                    label: "Liquid Cash",
                    value: fmt(liquidCashVal),
                    sub: "Available after expenses",
                    todaySub: "Cash = invested + revenue - spent",
                    icon: Wallet,
                    color: "bg-teal-500/10 text-teal-600",
                    accent: "from-teal-500/20",
                    bar: "from-teal-500 to-cyan-400",
                  },
                  {
                    label: "Total Spent",
                    value: fmt(totalSpentVal),
                    sub: "Stock purchase + expenses",
                    todaySub: "Capital utilized",
                    icon: Receipt,
                    color: "bg-rose-500/10 text-rose-600",
                    accent: "from-rose-500/20",
                    bar: "from-rose-500 to-orange-400",
                  },
                  {
                    label: "Total Invested",
                    value: fmt(totalInvestVal),
                    sub: "Partner + owner capital",
                    todaySub: "Active capital ledger",
                    icon: Briefcase,
                    color: "bg-blue-500/10 text-blue-600",
                    accent: "from-blue-500/20",
                    bar: "from-blue-500 to-indigo-400",
                  },
                ]
              : []),
          ].map((stat) => {
            const Icon = stat.icon;
            const isInvested = stat.label === "Total Invested";
            return (
              <div
                key={stat.label}
                className={`group relative overflow-hidden rounded-xl border bg-gradient-to-br ${stat.accent} via-card to-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-cyan-500/30 dark:border-white/5`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className={`size-10 rounded-lg ${stat.color} flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                    <Icon className="size-5" />
                  </div>
                  {isInvested ? (
                    <button
                      type="button"
                      onClick={() => setShowInvested(!showInvested)}
                      className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      title={showInvested ? "Hide Amount" : "Show Amount"}
                    >
                      {showInvested ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  ) : "trend" in stat && stat.trend !== undefined && (
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${stat.trend >= 0 ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-destructive/15 text-destructive"}`}>
                      {stat.trend >= 0 ? "+" : ""}
                      {stat.trend.toFixed(0)}%
                    </span>
                  )}
                </div>
                <div className="mt-4">
                  <div className="text-sm font-semibold text-muted-foreground">{stat.label}</div>
                  <div className={`mt-1 text-2xl font-bold tracking-tight text-foreground ${isInvested && !showInvested ? "blur-[5px] select-none" : ""}`}>{stat.value}</div>
                  <div className="mt-2 flex min-h-8 flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>{stat.sub}</span>
                    <span>{stat.todaySub}</span>
                  </div>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className={`h-full rounded-full bg-gradient-to-r ${stat.bar}`} style={{ width: isInvested ? "100%" : `${Math.min(100, Math.max(8, cashHealth))}%` }} />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 mb-4 lg:grid-cols-3">
        <section className="rounded-xl border bg-gradient-to-br from-card via-card to-blue-500/[0.06] p-5 shadow-sm dark:border-white/5 lg:col-span-2">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold text-foreground">{isStaff ? "Revenue" : "Revenue & Profit"} ({viewMode === "yearly" ? "Yearly" : "Monthly"})</h3>
              <p className="text-xs text-muted-foreground">{viewMode === "yearly" ? "Monthly sales breakdown" : "Daily sales trend"}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-md border bg-muted p-0.5">
                <button onClick={() => setViewMode("yearly")} className={`rounded-sm px-3 py-1 text-xs font-semibold transition ${viewMode === "yearly" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>Yearly</button>
                <button onClick={() => setViewMode("monthly")} className={`rounded-sm px-3 py-1 text-xs font-semibold transition ${viewMode === "monthly" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>Monthly</button>
              </div>
              <select className="rounded-md border bg-background px-2 py-1 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              {viewMode === "monthly" && (
                <select className="rounded-md border bg-background px-2 py-1 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring" value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
                  {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              )}
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.0} />
                  </linearGradient>
                  {!isStaff && (
                    <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.62 0.17 155)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="oklch(0.62 0.17 155)" stopOpacity={0.0} />
                    </linearGradient>
                  )}
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" fontSize={11} stroke="currentColor" opacity={0.5} />
                <YAxis fontSize={11} stroke="currentColor" opacity={0.5} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="rounded-lg border bg-popover p-2 shadow-md text-xs">
                        <div className="font-semibold text-popover-foreground">{payload[0]?.payload?.name}</div>
                        <div className="text-primary mt-1">Revenue: {fmt(Number(payload[0]?.value || 0))}</div>
                        {!isStaff && payload[1] && (
                          <div className="text-emerald-500">Profit: {fmt(Number(payload[1]?.value || 0))}</div>
                        )}
                      </div>
                    );
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="var(--primary)" fill="url(#gradRev)" strokeWidth={2} />
                {!isStaff && (
                  <Area type="monotone" dataKey="profit" stroke="oklch(0.62 0.17 155)" fill="url(#gradProfit)" strokeWidth={2} />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Top Selling Gadgets */}
        <section className="rounded-xl border bg-card p-5 shadow-sm dark:border-white/5">
          <div className="mb-4">
            <h3 className="font-semibold text-foreground">Top Selling Gadgets</h3>
            <p className="text-xs text-muted-foreground">Most popular items by quantity sold</p>
          </div>
          {topProducts.length > 0 ? (
            <>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topProducts}
                      dataKey="count"
                      nameKey="brand"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                    >
                      {topProducts.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const data = payload[0];
                        return (
                          <div className="rounded-lg border bg-popover p-2 shadow-md text-xs">
                            <span className="font-semibold text-popover-foreground">{data.name}: </span>
                            <span className="text-primary font-bold">{data.value} sold</span>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 space-y-2">
                {topProducts.map((b, i) => (
                  <div key={b.brand} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <div className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="truncate font-medium text-foreground">{b.brand}</span>
                    </div>
                    <span className="font-bold text-muted-foreground shrink-0">{b.count} sold</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex min-h-[220px] items-center justify-center text-sm text-muted-foreground">
              No gadget sales recorded yet.
            </div>
          )}
        </section>
      </div>

      {/* Recent Sales Table */}
      <section className="rounded-xl border bg-card p-5 shadow-sm dark:border-white/5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="font-semibold text-foreground">Recent Customer Sales</h3>
            <p className="text-xs text-muted-foreground">Latest gadget sales transactions</p>
          </div>
          <Link to="/sales" className="text-xs text-primary font-semibold hover:underline">
            View All Sales -&gt;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Invoice</th>
                <th className="p-3 text-left">Gadget</th>
                <th className="p-3 text-left">Customer</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-center">Qty</th>
                <th className="p-3 text-right">Total Price</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {gadgetSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-sm text-muted-foreground">
                    No sales recorded yet. Make a sale from the POS terminal.
                  </td>
                </tr>
              ) : (
                gadgetSales.slice(0, 5).map((s) => (
                  <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-mono text-xs font-bold text-primary">{s.invoiceNumber}</td>
                    <td className="p-3 font-medium text-foreground">{s.productName}</td>
                    <td className="p-3 text-foreground font-semibold">{s.customerName}</td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {new Date(s.saleDate).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="p-3 text-center font-bold">{s.quantity}</td>
                    <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {fmt(s.totalPrice)}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => setViewMemoSale(s)}
                        className="px-2.5 py-1 rounded-lg border bg-background hover:bg-muted text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Printer className="size-3 text-primary" />
                        <span>Memo</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {viewMemoSale && (
        <GadgetMemoModal
          sale={viewMemoSale}
          onClose={() => setViewMemoSale(null)}
        />
      )}
    </div>
  );
}
