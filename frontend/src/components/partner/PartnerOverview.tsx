import { useState, useMemo } from "react";
import {
  Calendar,
  FileText,
  Settings,
  TrendingUp,
  BarChart3,
  CalendarRange,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmt } from "@/lib/phone-ui";
import type {
  ChartDatum,
  ExpenseMetrics,
  MonthlyExpenseGroup,
  PartnerBalances,
  ProfitSplitMode,
} from "./partnerTypes";

const COLORS = [
  "oklch(0.5 0.18 260)",
  "oklch(0.62 0.17 155)",
  "oklch(0.75 0.16 75)",
  "oklch(0.58 0.22 25)",
  "oklch(0.55 0.15 200)",
];

const partnerColors = [
  "bg-primary/10 text-primary",
  "bg-violet-500/10 text-violet-600",
  "bg-amber-500/10 text-amber-600",
  "bg-pink-500/10 text-pink-600",
  "bg-cyan-500/10 text-cyan-600",
  "bg-emerald-500/10 text-emerald-600",
];

const expenseCategoryTone: Record<string, { dot: string; badge: string }> = {
  Rent: { dot: "bg-blue-500", badge: "bg-blue-500/10 text-blue-700 border-blue-200" },
  Salary: {
    dot: "bg-emerald-500",
    badge: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  },
  Internet: {
    dot: "bg-violet-500",
    badge: "bg-violet-500/10 text-violet-700 border-violet-200",
  },
  Electricity: {
    dot: "bg-amber-500",
    badge: "bg-amber-500/10 text-amber-700 border-amber-200",
  },
  Others: { dot: "bg-slate-500", badge: "bg-slate-500/10 text-slate-700 border-slate-200" },
};

type PartnerOverviewProps = {
  partnerBalances: PartnerBalances;
  partnerProfitSplit: Record<string, number>;
  profitSplitMode: ProfitSplitMode;
  onProfitSplitModeChange: (mode: ProfitSplitMode) => void;
  monthlyExpenseGroups: MonthlyExpenseGroup[];
  allMonthlyExpenseGroups?: MonthlyExpenseGroup[];
  expenseMonthValue: string;
  onExpenseMonthChange: (month: string) => void;
  selectedExpenseTotal: number;
  expenseMetrics: ExpenseMetrics;
  capitalChartData?: ChartDatum[];
  expenseChartData: ChartDatum[];
};

export function PartnerOverview({
  partnerBalances,
  partnerProfitSplit,
  profitSplitMode,
  onProfitSplitModeChange,
  monthlyExpenseGroups,
  allMonthlyExpenseGroups,
  expenseMonthValue,
  onExpenseMonthChange,
  selectedExpenseTotal,
  expenseMetrics,
  expenseChartData,
}: PartnerOverviewProps) {
  const allGroups = allMonthlyExpenseGroups && allMonthlyExpenseGroups.length > 0
    ? allMonthlyExpenseGroups
    : monthlyExpenseGroups;

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Left 2 columns: Monthly Expense Graph & Calendar Wise Expense List */}
      <div className="lg:col-span-2 space-y-6">
        <MonthlyExpenseGraph
          groups={allGroups}
          selectedMonth={expenseMonthValue}
          onSelectMonth={onExpenseMonthChange}
        />
        <MonthlyExpenseList
          monthlyExpenseGroups={monthlyExpenseGroups}
          expenseTotal={selectedExpenseTotal}
          expenseMonthValue={expenseMonthValue}
          onExpenseMonthChange={onExpenseMonthChange}
        />
      </div>

      {/* Right 1 column: Dividend Profit Share (replacing Contribution), Expense Distribution & Info */}
      <div className="lg:col-span-1 space-y-6">
        <ProfitSharePanel
          partnerBalances={partnerBalances}
          partnerProfitSplit={partnerProfitSplit}
          profitSplitMode={profitSplitMode}
          onProfitSplitModeChange={onProfitSplitModeChange}
        />
        <ChartCard
          title="Expense Distribution"
          data={expenseChartData}
          centerLabel="Total Cost"
          centerValue={fmt(expenseMetrics.total)}
          empty="No expense transactions yet"
          colorOffset={2}
          valueClass="text-destructive"
        />
        <div className="rounded-xl border bg-muted/10 p-4 text-xs text-muted-foreground shadow-sm">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <Settings className="size-4 text-primary" />
            Profit model
          </div>
          <p className="mt-2 leading-relaxed">
            Profit share updates automatically from partner capital, sales gross margins, and operational shop expenses.
          </p>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Custom 3D Isometric Green Bar Component
// ----------------------------------------------------------------------

function Custom3DBar(props: any) {
  const { x, y, width, height, payload } = props;
  if (!height || height <= 0 || !width || width <= 0) return null;

  const isSelected = payload?.isSelected;
  // Isometric depth offset for 3D extrusion effect
  const depth = Math.min(Math.max(width * 0.24, 4), 10);

  return (
    <g className="cursor-pointer transition-all duration-200">
      {/* Front Face of 3D Column */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={isSelected ? "url(#greenBarFrontActive)" : "url(#greenBarFront)"}
        stroke={isSelected ? "#15803d" : "#16a34a"}
        strokeWidth={1}
        rx={1}
      />
      {/* Top Face (Cap) of 3D Column */}
      <polygon
        points={`${x},${y} ${x + depth},${y - depth} ${x + width + depth},${y - depth} ${x + width},${y}`}
        fill={isSelected ? "url(#greenBarTopActive)" : "url(#greenBarTop)"}
        stroke={isSelected ? "#15803d" : "#4ade80"}
        strokeWidth={0.75}
      />
      {/* Right Side (Shadow) of 3D Column */}
      <polygon
        points={`${x + width},${y} ${x + width + depth},${y - depth} ${x + width + depth},${y + height - depth} ${x + width},${y + height}`}
        fill={isSelected ? "url(#greenBarSideActive)" : "url(#greenBarSide)"}
        stroke={isSelected ? "#064e3b" : "#14532d"}
        strokeWidth={0.75}
      />
    </g>
  );
}

// ----------------------------------------------------------------------
// Monthly Expense Graph (3D Green Bars with Upward Trend Arrow)
// ----------------------------------------------------------------------

function MonthlyExpenseGraph({
  groups,
  selectedMonth,
  onSelectMonth,
}: {
  groups: MonthlyExpenseGroup[];
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
}) {
  const [viewMode, setViewMode] = useState<"monthly" | "daily">("monthly");

  // Chronologically sorted groups (earliest to latest)
  const sortedGroups = useMemo(() => {
    return [...groups].sort((a, b) => a.sortTime - b.sortTime);
  }, [groups]);

  // Aggregate stats
  const totalAllExpenses = useMemo(() => {
    return sortedGroups.reduce((acc, g) => acc + g.total, 0);
  }, [sortedGroups]);

  const avgMonthlyExpense = useMemo(() => {
    if (sortedGroups.length === 0) return 0;
    return Math.round(totalAllExpenses / sortedGroups.length);
  }, [sortedGroups, totalAllExpenses]);

  // Calculate smooth trend line for growth curve
  const trendValues = useMemo(() => {
    if (sortedGroups.length <= 1) {
      return sortedGroups.map((g) => g.total);
    }
    const n = sortedGroups.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    sortedGroups.forEach((g, i) => {
      sumX += i;
      sumY += g.total;
      sumXY += i * g.total;
      sumXX += i * i;
    });
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return sortedGroups.map((g, i) => {
      const linear = intercept + slope * i;
      const blended = Math.round(g.total * 0.55 + linear * 0.45);
      return Math.max(blended, 0);
    });
  }, [sortedGroups]);

  // Monthly Bar Chart data with trendline
  const barChartData = useMemo(() => {
    return sortedGroups.map((g, idx) => {
      const parts = g.key.split("-");
      let shortLabel = g.label;
      if (parts.length === 2) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
        if (!isNaN(d.getTime())) {
          shortLabel = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        }
      }
      return {
        key: g.key,
        name: shortLabel,
        fullName: g.label,
        total: g.total,
        trend: trendValues[idx] ?? g.total,
        count: g.items.length,
        isSelected: g.key === selectedMonth,
      };
    });
  }, [sortedGroups, selectedMonth, trendValues]);

  // Daily Area Chart data for the selected (or latest) month
  const dailyChartData = useMemo(() => {
    const targetGroup =
      sortedGroups.find((g) => g.key === selectedMonth) ||
      sortedGroups[sortedGroups.length - 1];

    if (!targetGroup || targetGroup.items.length === 0) return [];

    const dayMap = new Map<string, { dayLabel: string; total: number; count: number; dateStr: string }>();

    const sortedItems = [...targetGroup.items].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    sortedItems.forEach((item) => {
      const d = new Date(item.date);
      const dayKey = isNaN(d.getTime())
        ? item.date
        : d.toLocaleDateString("en-US", { day: "2-digit", month: "short" });

      const existing = dayMap.get(dayKey) || {
        dayLabel: dayKey,
        total: 0,
        count: 0,
        dateStr: item.date,
      };
      existing.total += item.amount;
      existing.count += 1;
      dayMap.set(dayKey, existing);
    });

    return Array.from(dayMap.values());
  }, [sortedGroups, selectedMonth]);

  const activeGroup = sortedGroups.find((g) => g.key === selectedMonth) || sortedGroups[sortedGroups.length - 1];

  return (
    <div className="bg-card rounded-xl border p-5 space-y-4 shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <TrendingUp className="size-5" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm sm:text-base">
              Monthly Expense Graph
            </h3>
            <p className="text-xs text-muted-foreground">
              3D green expense growth bars with upward trend trajectory
            </p>
          </div>
        </div>

        {/* Controls & Mode Switch */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border rounded-lg p-0.5 bg-muted">
            <button
              type="button"
              onClick={() => setViewMode("monthly")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                viewMode === "monthly"
                  ? "bg-background text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BarChart3 className="size-3.5" />
              3D Growth Trend
            </button>
            <button
              type="button"
              onClick={() => setViewMode("daily")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                viewMode === "daily"
                  ? "bg-background text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CalendarRange className="size-3.5" />
              Daily Breakdown
            </button>
          </div>
        </div>
      </div>

      {/* Metrics mini-bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
        <div className="rounded-lg border bg-muted/20 px-3 py-2">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">
            Total Recorded Months
          </span>
          <span className="text-sm font-extrabold text-foreground">
            {sortedGroups.length} Months
          </span>
        </div>
        <div className="rounded-lg border bg-muted/20 px-3 py-2">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">
            Avg Monthly Expense
          </span>
          <span className="text-sm font-extrabold text-foreground">
            {fmt(avgMonthlyExpense)}
          </span>
        </div>
        <div className="col-span-2 sm:col-span-1 rounded-lg border bg-muted/20 px-3 py-2">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">
            {viewMode === "monthly" ? "All Time Total" : `${activeGroup?.label || "Selected"} Total`}
          </span>
          <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
            {fmt(viewMode === "monthly" ? totalAllExpenses : (activeGroup?.total ?? 0))}
          </span>
        </div>
      </div>

      {/* Graph rendering */}
      {sortedGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground bg-muted/5 rounded-xl border border-dashed">
          <FileText className="size-8 text-muted-foreground/60 mb-2" />
          <p className="text-sm font-semibold">No expense records found to plot</p>
          <p className="text-xs text-muted-foreground mt-0.5">Add expenses to visualize monthly graphs here.</p>
        </div>
      ) : viewMode === "monthly" ? (
        <div className="h-[270px] w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={barChartData} margin={{ top: 28, right: 20, left: -10, bottom: 0 }}>
              <defs>
                {/* Green 3D Bar Front */}
                <linearGradient id="greenBarFront" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#16a34a" />
                </linearGradient>
                {/* Green 3D Bar Top (Light highlight) */}
                <linearGradient id="greenBarTop" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0%" stopColor="#86efac" />
                  <stop offset="100%" stopColor="#4ade80" />
                </linearGradient>
                {/* Green 3D Bar Side (Dark shadow) */}
                <linearGradient id="greenBarSide" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#15803d" />
                  <stop offset="100%" stopColor="#14532d" />
                </linearGradient>

                {/* Selected Active Bar Front */}
                <linearGradient id="greenBarFrontActive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                {/* Selected Active Bar Top */}
                <linearGradient id="greenBarTopActive" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0%" stopColor="#a7f3d0" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
                {/* Selected Active Bar Side */}
                <linearGradient id="greenBarSideActive" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#047857" />
                  <stop offset="100%" stopColor="#064e3b" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.25} />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "currentColor", opacity: 0.65, fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)}
                tick={{ fill: "currentColor", opacity: 0.65, fontSize: 11 }}
              />
              <Tooltip
                cursor={{ fill: "currentColor", opacity: 0.04 }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-xl border bg-popover/95 backdrop-blur-sm px-3.5 py-2.5 text-xs shadow-lg space-y-1.5">
                        <div className="font-bold text-foreground flex items-center justify-between gap-3">
                          <span>{d.fullName}</span>
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-1.5 py-0.5 rounded font-semibold">
                            {d.count} entries
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-5 pt-1 border-t">
                          <span className="text-muted-foreground">Monthly Expense:</span>
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                            {fmt(d.total)}
                          </span>
                        </div>
                        {d.trend !== undefined && (
                          <div className="flex items-center justify-between gap-5 text-[11px] text-muted-foreground">
                            <span>Trend Trajectory:</span>
                            <span className="font-semibold text-emerald-600">{fmt(d.trend)}</span>
                          </div>
                        )}
                        <div className="text-[10px] text-primary/80 font-medium pt-0.5">
                          Click bar to filter list below
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {/* 3D Green Bars */}
              <Bar
                dataKey="total"
                shape={<Custom3DBar />}
                onClick={(entry) => {
                  if (entry?.key) {
                    onSelectMonth(entry.key);
                  }
                }}
              />
              {/* Upward Sweeping Green Trend Line with Arrow Tip */}
              <Line
                type="monotone"
                dataKey="trend"
                stroke="#15803d"
                strokeWidth={3}
                strokeLinecap="round"
                isAnimationActive={true}
                dot={(dotProps: any) => {
                  const { cx, cy, index } = dotProps;
                  if (index === barChartData.length - 1) {
                    return (
                      <g key="arrow-tip" transform={`translate(${cx}, ${cy})`}>
                        {/* Upward Green Arrow Head pointing ↗ matching user's photo */}
                        <path
                          d="M -4,6 L 4,6 L 4,-3 L 9,-3 L 0,-14 L -9,-3 L -4,-3 Z"
                          transform="rotate(38)"
                          fill="#16a34a"
                          stroke="#ffffff"
                          strokeWidth={1.5}
                          className="filter drop-shadow-md"
                        />
                      </g>
                    );
                  }
                  return (
                    <circle
                      key={index}
                      cx={cx}
                      cy={cy}
                      r={3.5}
                      fill="#22c55e"
                      stroke="#ffffff"
                      strokeWidth={1.5}
                    />
                  );
                }}
                activeDot={{ r: 5, fill: "#15803d", stroke: "#ffffff", strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-[270px] w-full pt-1">
          {dailyChartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              No daily entries for {activeGroup?.label || "selected month"}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="dailyAreaGradGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.25} />
                <XAxis
                  dataKey="dayLabel"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "currentColor", opacity: 0.65, fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)}
                  tick={{ fill: "currentColor", opacity: 0.65, fontSize: 11 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
                          <div className="font-bold text-foreground">{d.dayLabel}</div>
                          <div className="mt-1 flex items-center justify-between gap-4">
                            <span className="text-muted-foreground">Expense:</span>
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{fmt(d.total)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-[11px] text-muted-foreground">
                            <span>Entries:</span>
                            <span className="font-semibold">{d.count} items</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#16a34a"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#dailyAreaGradGreen)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  );
}


// ----------------------------------------------------------------------
// Profit Share Panel (Moved to Right Column)
// ----------------------------------------------------------------------

function ProfitSharePanel({
  partnerBalances,
  partnerProfitSplit,
  profitSplitMode,
  onProfitSplitModeChange,
}: Pick<
  PartnerOverviewProps,
  "partnerBalances" | "partnerProfitSplit" | "profitSplitMode" | "onProfitSplitModeChange"
>) {
  const partnerNames = Object.keys(partnerBalances.partners);

  return (
    <div className="bg-card rounded-xl border p-5 space-y-4 shadow-sm">
      <div className="flex flex-col gap-2.5 border-b pb-3.5">
        <div>
          <h3 className="font-bold text-foreground text-sm sm:text-base">Dividend Profit Share</h3>
          <p className="text-xs text-muted-foreground">
            Estimated profit distribution shares for partners
          </p>
        </div>
        <div className="grid grid-cols-2 gap-1 border rounded-lg p-0.5 bg-muted">
          <SplitButton
            active={profitSplitMode === "equal"}
            onClick={() => onProfitSplitModeChange("equal")}
          >
            Equal (50/50)
          </SplitButton>
          <SplitButton
            active={profitSplitMode === "proportional"}
            onClick={() => onProfitSplitModeChange("proportional")}
          >
            Capital Ratio
          </SplitButton>
        </div>
      </div>

      <div className="space-y-3">
        {partnerNames.map((name, index) => {
          const data = partnerBalances.partners[name];
          const profitVal = partnerProfitSplit[name] ?? 0;
          const colorClass = partnerColors[index % partnerColors.length];

          return (
            <div key={name} className="border rounded-xl p-3.5 bg-muted/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`size-8 rounded-full ${colorClass} flex items-center justify-center font-bold text-xs shrink-0`}
                  >
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground text-sm leading-tight">{name}</h4>
                    <p className="text-[10px] text-muted-foreground">
                      Share ratio: {data.share.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground block">
                    Profit Share
                  </span>
                  <span
                    className={`text-sm font-extrabold ${
                      profitVal >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
                    }`}
                  >
                    {fmt(profitVal)}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs border-t pt-2 bg-background/50 rounded-lg px-2.5 py-1.5">
                <Metric label="Net Capital" value={fmt(data.net)} strong />
                <Metric label="Total Invest" value={fmt(data.invest)} />
              </div>
            </div>
          );
        })}
        {partnerNames.length === 0 && (
          <div className="text-center py-6 text-muted-foreground bg-muted/5 rounded-xl border border-dashed text-xs">
            No partner capital transactions recorded yet.
          </div>
        )}
      </div>
    </div>
  );
}

function SplitButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all text-center ${
        active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Metric({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <span className="text-muted-foreground text-[11px]">{label}:</span>
      <div className={`${strong ? "font-bold text-foreground" : "font-semibold text-foreground/80"} mt-0.5`}>
        {value}
      </div>
    </div>
  );
}

function MonthlyExpenseList({
  monthlyExpenseGroups,
  expenseTotal,
  expenseMonthValue,
  onExpenseMonthChange,
}: {
  monthlyExpenseGroups: MonthlyExpenseGroup[];
  expenseTotal: number;
  expenseMonthValue: string;
  onExpenseMonthChange: (month: string) => void;
}) {
  return (
    <div className="bg-card rounded-xl border p-5 space-y-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="font-bold text-foreground">Calendar Wise Expense List</h3>
          <p className="text-xs text-muted-foreground">Month-wise list of what was spent and why</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="relative w-full sm:w-[180px]">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="month"
              value={expenseMonthValue}
              onChange={(event) => onExpenseMonthChange(event.target.value)}
              className="h-9 w-full rounded-lg border bg-background pl-9 pr-3 text-xs font-bold text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              aria-label="Select expense month"
            />
          </label>
          <span className="inline-flex w-fit items-center rounded-md border bg-muted/30 px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
            Total {fmt(expenseTotal)}
          </span>
        </div>
      </div>

      {monthlyExpenseGroups.length > 0 ? (
        <div className="space-y-3">
          {monthlyExpenseGroups.map((group) => (
            <div key={group.key} className="overflow-hidden rounded-xl border bg-background">
              <div className="flex flex-col gap-2 border-b bg-muted/25 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Calendar className="size-4" />
                  </div>
                  <div>
                    <div className="font-bold text-foreground">{group.label}</div>
                    <div className="text-[11px] font-medium text-muted-foreground">
                      {group.items.length} expense item{group.items.length === 1 ? "" : "s"}
                    </div>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Monthly Total
                  </div>
                  <div className="text-lg font-extrabold text-destructive">{fmt(group.total)}</div>
                </div>
              </div>
              <div className="divide-y">
                {group.items.map((expense) => {
                  const tone = expenseCategoryTone[expense.category] ?? expenseCategoryTone.Others;
                  return (
                    <div
                      key={expense.id}
                      className="grid grid-cols-1 gap-3 px-4 py-3 transition-colors hover:bg-muted/20 md:grid-cols-[130px_150px_minmax(0,1fr)_120px]"
                    >
                      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                        <span className={`size-2 rounded-full ${tone.dot}`} />
                        {new Date(expense.date).toLocaleDateString("en-BD", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                      <div>
                        <span
                          className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-bold ${tone.badge}`}
                        >
                          {expense.category}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-foreground">
                          {expense.notes || expense.category}
                        </div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">Purpose / reason</div>
                      </div>
                      <div className="text-left text-sm font-extrabold text-destructive md:text-right">
                        {fmt(expense.amount)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed bg-muted/10 px-4 py-10 text-center">
          <FileText className="mx-auto size-8 text-muted-foreground/60" />
          <div className="mt-3 text-sm font-semibold text-foreground">
            No expense records for this month
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Choose another month or add shop expenses to see spending here.
          </p>
        </div>
      )}
    </div>
  );
}

function ChartCard({
  title,
  data,
  centerLabel,
  centerValue,
  empty,
  colorOffset = 0,
  valueClass = "text-foreground",
}: {
  title: string;
  data: ChartDatum[];
  centerLabel: string;
  centerValue: string;
  empty: string;
  colorOffset?: number;
  valueClass?: string;
}) {
  return (
    <div className="bg-card rounded-xl border p-5 flex flex-col justify-between h-[250px] shadow-sm">
      <h4 className="font-semibold text-foreground text-sm mb-1">{title}</h4>
      {data.length > 0 ? (
        <div className="flex-grow relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={65}
                paddingAngle={3}
              >
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[(index + colorOffset) % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => fmt(value)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute text-center select-none pointer-events-none">
            <div className="text-[10px] font-bold text-muted-foreground uppercase">
              {centerLabel}
            </div>
            <div className={`text-lg font-extrabold ${valueClass}`}>{centerValue}</div>
          </div>
        </div>
      ) : (
        <div className="flex-grow flex items-center justify-center text-xs text-muted-foreground">
          {empty}
        </div>
      )}
    </div>
  );
}
