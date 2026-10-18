import { useState } from "react";
import { ArrowDownRight, BadgeDollarSign, TrendingUp, Wallet } from "lucide-react";
import { fmt } from "@/lib/phone-ui";
import { StatCard, StatCardSkeleton } from "@/components/ui/StatCard";
import type { BusinessSummary, PartnerBalances } from "./partnerTypes";

type PartnerKpiCardsProps = {
  partnerBalances: PartnerBalances;
  businessSummary: BusinessSummary;
  loading?: boolean;
};

export function PartnerKpiCards({
  partnerBalances,
  businessSummary,
  loading = false,
}: PartnerKpiCardsProps) {
  const [showCapital, setShowCapital] = useState(false);
  const partnerNames = Object.keys(partnerBalances.partners);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
        <StatCardSkeleton variant="indigo" />
        <StatCardSkeleton variant="emerald" />
        <StatCardSkeleton variant="teal" />
        <StatCardSkeleton variant="rose" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
      <StatCard
        label="Total Invested (Capital)"
        value={fmt(partnerBalances.total)}
        sub={
          partnerNames.length > 0
            ? partnerNames
                .map(
                  (name) =>
                    `${name.charAt(0).toUpperCase()}: ${partnerBalances.partners[name].share.toFixed(0)}%`,
                )
                .join(" / ")
            : "No partners capital"
        }
        todaySub="Partner + owner capital"
        icon={Wallet}
        variant="indigo"
        isBlurred={!showCapital}
        onToggleBlur={() => setShowCapital((prev) => !prev)}
      />
      <StatCard
        label="Available Profit"
        value={fmt(businessSummary.availableProfit)}
        sub={`Gross earned: ${fmt(businessSummary.grossProfit)}`}
        todaySub="Net business earnings"
        icon={TrendingUp}
        variant={businessSummary.availableProfit >= 0 ? "emerald" : "rose"}
      />
      <StatCard
        label="Business Cash"
        value={fmt(businessSummary.totalCash)}
        sub={`Sales: ${fmt(businessSummary.salesRevenue)}`}
        todaySub={`Stock buy: ${fmt(businessSummary.productPurchaseCost)}`}
        icon={ArrowDownRight}
        variant="teal"
      />
      <StatCard
        label="Expense Funding"
        value={fmt(businessSummary.totalExpenses)}
        sub={`Profit: ${fmt(businessSummary.expenseFromProfit)}`}
        todaySub={`Capital: ${fmt(businessSummary.expenseFromCapital)}`}
        icon={BadgeDollarSign}
        variant="rose"
      />
    </div>
  );
}
