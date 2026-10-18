import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from "recharts";
import {
  TrendingUp, Plus, Receipt,
  Smartphone, ShoppingCart, Briefcase,
  Eye, EyeOff, Wallet, Building2, Settings, Users, User,
} from "lucide-react";
import { profit } from "@/lib/phone-store";
import { useAppDispatch, useAppSelector } from "../store";
import { fmt, PageHeader, SalesTable } from "@/lib/phone-ui";
import {
  saveBusinessProfile,
  type BusinessOwner,
  type BusinessOwnerRole,
} from "../store/businessProfileSlice";
import { BusinessOwnershipModal } from "@/components/partner/BusinessOwnershipModal";
import { StatCardSkeleton } from "@/components/ui/StatCard";


export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — PhoneTrack" },
      { name: "description", content: "Sales overview, profit, inventory and warranty KPIs." },
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
  const sales = useAppSelector((state) => state.phoneSales.items);
  const gadgets = useAppSelector((state) => state.gadgets.gadgets);
  const gadgetSales = useAppSelector((state) => state.gadgets.sales);
  const partnerTransactions = useAppSelector((state) => state.partner.transactions);
  const shopExpenses = useAppSelector((state) => state.partner.expenses);
  const phoneSalesLoading = useAppSelector((state) => state.phoneSales.loading);
  const partnerLoading = useAppSelector((state) => state.partner.loading);
  const isDashboardLoading = (phoneSalesLoading || partnerLoading) && sales.length === 0;
  const businessProfile = useAppSelector((state) => state.businessProfile);
  const role = useAppSelector((state) => state.auth.user?.role);
  const isStaff = role === "staff";
  const [ownerDrafts, setOwnerDrafts] = useState<BusinessOwner[]>(() => buildDefaultOwners(2));
  const [showInvested, setShowInvested] = useState(false);
  const [viewMode, setViewMode] = useState<"yearly" | "monthly">("monthly");
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    if (businessProfile.isConfigured && businessProfile.owners.length > 0) {
      setOwnerDrafts(businessProfile.owners);
    }
  }, [businessProfile.isConfigured, businessProfile.owners]);

  const years = useMemo(() => {
    const allYears = sales.map((s) => new Date(s.saleDate).getFullYear());
    const uniqueYears = Array.from(new Set(allYears));
    const currentYear = new Date().getFullYear();
    if (!uniqueYears.includes(currentYear)) {
      uniqueYears.push(currentYear);
    }
    return uniqueYears.sort((a, b) => b - a);
  }, [sales]);

  const today = new Date(); today.setHours(0, 0, 0, 0);

  // Monthly logic
  const monthStart = new Date(selectedYear, selectedMonth, 1);
  const monthEnd = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);
  const lastMonthStart = new Date(selectedYear, selectedMonth - 1, 1);
  const lastMonthEnd = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);

  const monthly = sales.filter((s) => {
    const d = new Date(s.saleDate);
    return s.customerName && d >= monthStart && d <= monthEnd;
  });
  const lastMonth = sales.filter((s) => {
    const d = new Date(s.saleDate);
    return s.customerName && d >= lastMonthStart && d <= lastMonthEnd;
  });
  const monthlyRev = monthly.reduce((a, s) => a + s.finalPrice, 0);
  const lastRev = lastMonth.reduce((a, s) => a + s.finalPrice, 0);
  const revChange = lastRev > 0 ? ((monthlyRev - lastRev) / lastRev) * 100 : 0;
  const selectedMonthProfit = monthly.reduce((a, s) => a + profit(s), 0);

  // Yearly logic
  const yearStart = new Date(selectedYear, 0, 1);
  const yearEnd = new Date(selectedYear, 11, 31, 23, 59, 59, 999);
  const lastYearStart = new Date(selectedYear - 1, 0, 1);
  const lastYearEnd = new Date(selectedYear - 1, 11, 31, 23, 59, 59, 999);

  const yearlySales = sales.filter((s) => {
    const d = new Date(s.saleDate);
    return s.customerName && d >= yearStart && d <= yearEnd;
  });
  const lastYearSales = sales.filter((s) => {
    const d = new Date(s.saleDate);
    return s.customerName && d >= lastYearStart && d <= lastYearEnd;
  });
  const yearlyRev = yearlySales.reduce((a, s) => a + s.finalPrice, 0);
  const lastYearRev = lastYearSales.reduce((a, s) => a + s.finalPrice, 0);
  const yoyRevChange = lastYearRev > 0 ? ((yearlyRev - lastYearRev) / lastYearRev) * 100 : 0;
  const yearlyProfit = yearlySales.reduce((a, s) => a + profit(s), 0);

  const todays = sales.filter((s) => s.customerName && new Date(s.saleDate) >= today);
  const todayProfit = todays.reduce((a, s) => a + profit(s), 0);
  const totalStock = sales.length;
  const totalSold = sales.filter((s) => s.customerName).length;
  const availableStock = totalStock - totalSold;
  const phoneRevenue = sales.filter((s) => s.customerName).reduce((a, s) => a + s.finalPrice, 0);
  const gadgetRevenue = gadgetSales.reduce((a, s) => a + s.totalPrice, 0);
  const totalRevenue = phoneRevenue + gadgetRevenue;
  const phoneStockCost = sales.reduce((a, s) => a + s.purchasePrice, 0);
  const gadgetStockCost = gadgets.reduce((a, g) => a + g.purchasePrice * g.quantity, 0);
  const operatingExpense = shopExpenses.reduce((a, e) => a + e.amount, 0);
  const totalSpentVal = phoneStockCost + gadgetStockCost + operatingExpense;
  const totalInvestVal = partnerTransactions.reduce(
    (a, t) => a + (t.type === "Investment" ? t.amount : -t.amount),
    0,
  );
  const liquidCashVal = totalInvestVal + totalRevenue - totalSpentVal;

  // Trend data: dynamically switch between Yearly (monthly aggregates) and Monthly (daily aggregates)
  const trend = useMemo(() => {
    if (viewMode === "yearly") {
      return MONTHS.map((m) => {
        const monthSales = sales.filter((s) => {
          const d = new Date(s.saleDate);
          return (
            s.customerName &&
            d.getFullYear() === selectedYear &&
            d.getMonth() === m.value
          );
        });

        return {
          day: m.label,
          revenue: monthSales.reduce((a, s) => a + s.finalPrice, 0),
          profit: monthSales.reduce((a, s) => a + profit(s), 0),
        };
      });
    } else {
      const days: { day: string; revenue: number; profit: number }[] = [];
      const totalDays = new Date(selectedYear, selectedMonth + 1, 0).getDate();

      for (let i = 1; i <= totalDays; i++) {
        const d = new Date(selectedYear, selectedMonth, i);
        d.setHours(0, 0, 0, 0);
        const next = new Date(selectedYear, selectedMonth, i + 1);
        next.setHours(0, 0, 0, 0);

        const dayS = sales.filter((s) => {
          const x = new Date(s.saleDate);
          return s.customerName && x >= d && x < next;
        });

        days.push({
          day: `${i} ${d.toLocaleDateString("en", { month: "short" })}`,
          revenue: dayS.reduce((a, s) => a + s.finalPrice, 0),
          profit: dayS.reduce((a, s) => a + profit(s), 0),
        });
      }
      return days;
    }
  }, [sales, viewMode, selectedMonth, selectedYear]);

  // Top brands
  const brands = useMemo(() => {
    const map = new Map<string, number>();
    sales.filter((s) => s.customerName).forEach((s) => map.set(s.brand || "Other", (map.get(s.brand || "Other") || 0) + 1));
    return Array.from(map, ([brand, count]) => ({ brand, count })).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [sales]);

  const periodProfit = viewMode === "yearly" ? yearlyProfit : selectedMonthProfit;
  const periodSalesCount = viewMode === "yearly" ? yearlySales.length : monthly.length;
  const sellThroughRate = totalStock > 0 ? Math.round((totalSold / totalStock) * 100) : 0;
  const cashSource = totalInvestVal + totalRevenue;
  const cashHealth = cashSource > 0
    ? Math.max(0, Math.min(100, Math.round((liquidCashVal / cashSource) * 100)))
    : 0;
  const trendMax = Math.max(1, ...trend.map((item) => Math.max(item.revenue, item.profit)));
  const miniTrend = trend.slice(-12).map((item) => ({
    revenue: Math.max(8, Math.round((item.revenue / trendMax) * 42)),
    profit: Math.max(6, Math.round((item.profit / trendMax) * 34)),
  }));

  const [ownershipModalOpen, setOwnershipModalOpen] = useState(false);

  return (

    <div className="w-full px-4 md:px-6 lg:px-8 max-w-[1800px] mx-auto pb-8">
      <PageHeader title="Dashboard" subtitle="Overview of your phone sales performance">
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
          {/* {!isStaff && (
            <Link
              to="/sales"
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:via-blue-500 hover:to-indigo-500 text-white text-sm font-semibold inline-flex items-center gap-1.5 shadow-md shadow-cyan-500/20 hover:shadow-lg hover:shadow-cyan-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group"
            >
              <Plus className="size-4 transition-transform duration-300 group-hover:rotate-90" /> New Sale
            </Link>
          )} */}
        </div>
      </PageHeader>

      <BusinessOwnershipModal
        open={ownershipModalOpen}
        onClose={() => setOwnershipModalOpen(false)}
        canDismiss={true}
      />

      {/* KPI Cards */}
      <div className="grid gap-4 mb-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
            label: "Total Stock",
            value: availableStock.toLocaleString(),
            sub: `${availableStock} available in inventory`,
            todaySub: `${availableStock} in stock today`,
            icon: Smartphone,
            color: "bg-blue-500/10 text-blue-600",
            accent: "from-blue-500/20",
            bar: "from-blue-500 to-cyan-400",
          },
          {
            label: viewMode === "yearly" ? "Yearly Sales" : "Monthly Sales",
            value: periodSalesCount.toLocaleString(),
            sub: viewMode === "yearly" ? "Yearly transactions" : "Monthly transactions",
            todaySub: todays.length > 0 ? `${todays.length} sold today` : "No sales today",
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
                  sub: "Net earnings",
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
                  todaySub: "Capital used",
                  icon: Receipt,
                  color: "bg-rose-500/10 text-rose-600",
                  accent: "from-rose-500/20",
                  bar: "from-rose-500 to-orange-400",
                },
                {
                  label: "Total Invested",
                  value: fmt(totalInvestVal),
                  sub: "Partner + owner capital",
                  todaySub: "Capital entries",
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
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${stat.trend >= 0 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
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

      <div className="grid gap-4 mb-4 lg:grid-cols-3">
        <section className="rounded-xl border bg-gradient-to-br from-card via-card to-blue-500/[0.06] p-5 shadow-sm dark:border-white/5 lg:col-span-2">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold">{isStaff ? "Revenue" : "Revenue & Profit"} ({viewMode === "yearly" ? "Yearly" : "Monthly"})</h3>
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
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS[0]} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="prof" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS[1]} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={CHART_COLORS[1]} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} tickFormatter={(v) => (viewMode === "yearly" ? v.substring(0, 3) : v.split(" ")[0])} />
              <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12, backgroundColor: "var(--color-card)", color: "var(--color-foreground)" }} formatter={(v: number) => fmt(v)} />
              <Area type="monotone" dataKey="revenue" stroke={CHART_COLORS[0]} fill="url(#rev)" strokeWidth={2} />
              {!isStaff && <Area type="monotone" dataKey="profit" stroke={CHART_COLORS[1]} fill="url(#prof)" strokeWidth={2} />}
            </AreaChart>
          </ResponsiveContainer>
        </section>

        <section className="rounded-xl border bg-gradient-to-br from-card via-card to-emerald-500/[0.07] p-5 shadow-sm dark:border-white/5">
          <h3 className="font-semibold">Top Sales Brands</h3>
          <p className="mb-4 text-xs text-muted-foreground">Distribution of units sold</p>
          {brands.length > 0 ? (
            <>
              <div className="relative flex h-[160px] items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={brands} dataKey="count" nameKey="brand" cx="50%" cy="50%" innerRadius={52} outerRadius={72} paddingAngle={3} cornerRadius={3}>
                      {brands.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} className="focus:outline-none" />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12, backgroundColor: "var(--color-card)", color: "var(--color-foreground)" }} formatter={(v: number) => [`${v} sold`, "Volume"]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute text-center">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total Sold</span>
                  <div className="text-2xl font-extrabold text-foreground">{totalSold}</div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {brands.map((b, i) => {
                  const percentage = totalSold > 0 ? Math.round((b.count / totalSold) * 100) : 0;
                  return (
                    <div key={b.brand} className="flex items-center gap-2 rounded-lg border bg-muted/30 p-2">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold text-foreground">{b.brand}</div>
                        <div className="text-[10px] font-medium text-muted-foreground">{b.count} {b.count === 1 ? "unit" : "units"} ({percentage}%)</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex min-h-[220px] items-center justify-center text-sm text-muted-foreground">No data</div>
          )}
        </section>
      </div>

      <section className="rounded-xl border bg-card p-5 shadow-sm dark:border-white/5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold">Recent Sales</h3>
            <p className="text-xs text-muted-foreground">Latest 5 transactions</p>
          </div>
          {!isStaff && <Link to="/search" className="text-xs text-primary hover:underline">View all -&gt;</Link>}
        </div>
        <SalesTable sales={sales.slice(0, 5)} compact={isStaff} />
      </section>


    </div>
  );
}

function BusinessOwnerSetup({
  owners,
  isConfigured,
  saving,
  onOwnersChange,
  onSubmit,
}: {
  owners: BusinessOwner[];
  isConfigured: boolean;
  saving: boolean;
  onOwnersChange: (owners: BusinessOwner[]) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const totalShare = owners.reduce((sum, owner) => sum + Number(owner.share || 0), 0);
  const shareValid = Math.abs(totalShare - 100) < 0.001;
  const namesValid = owners.every((owner) => owner.name.trim().length > 0);
  const canSave = shareValid && namesValid && !saving;

  const updateOwner = (index: number, patch: Partial<BusinessOwner>) => {
    onOwnersChange(owners.map((owner, ownerIndex) => (ownerIndex === index ? { ...owner, ...patch } : owner)));
  };

  return (
    <section className="mb-6 rounded-xl border bg-card p-4 shadow-sm dark:border-white/5 sm:p-5">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground">Business Owner Setup</h2>
            <p className="text-xs font-medium text-muted-foreground">
              {isConfigured ? "Owner setup is active for profit and partner ledger." : "Set this once before using partner cash and profit split."}
            </p>
          </div>
          <div className="flex rounded-lg border bg-muted p-1">
            {[1, 2, 3].map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => onOwnersChange(buildDefaultOwners(count))}
                className={`h-9 min-w-12 rounded-md px-3 text-sm font-bold transition ${
                  owners.length === count ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          {owners.map((owner, index) => (
            <div key={index} className="rounded-lg border bg-muted/20 p-3">
              <div className="grid gap-3 sm:grid-cols-[1fr_120px_110px] lg:grid-cols-1">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">Name</span>
                  <input
                    value={owner.name}
                    onChange={(event) => updateOwner(index, { name: event.target.value })}
                    className="input"
                    placeholder={`Owner ${index + 1}`}
                    required
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">Type</span>
                  <select
                    value={owner.role}
                    onChange={(event) => updateOwner(index, { role: event.target.value as BusinessOwnerRole })}
                    className="input"
                  >
                    <option value="Owner">Owner</option>
                    <option value="Partner">Partner</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">Share %</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={owner.share}
                    onChange={(event) => updateOwner(index, { share: Number(event.target.value) })}
                    className="input font-bold"
                    required
                  />
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className={`text-sm font-bold ${shareValid ? "text-success" : "text-destructive"}`}>
            Total share: {totalShare.toFixed(2)}%
          </div>
          <button
            type="submit"
            disabled={!canSave}
            className="rounded-full bg-gradient-to-r from-[#8b5cf6] via-[#7c3aed] to-[#6366f1] text-white border border-white/25 shadow-[0_0_20px_rgba(139,92,246,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] hover:shadow-[0_0_28px_rgba(139,92,246,0.55),inset_0_1px_2px_rgba(255,255,255,0.6)] hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] px-6 py-2.5 text-sm font-bold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Saving..." : isConfigured ? "Update Setup" : "Save Setup"}
          </button>
        </div>
      </form>
    </section>
  );
}
