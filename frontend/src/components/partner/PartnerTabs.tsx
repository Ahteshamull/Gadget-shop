import { FileText, Handshake, Layers } from "lucide-react";
import type { PartnerTab } from "./partnerTypes";

type PartnerTabsProps = {
  activeTab: PartnerTab;
  onChange: (tab: PartnerTab) => void;
  transactionsCount: number;
  expensesCount: number;
};

export function PartnerTabs({
  activeTab,
  onChange,
  transactionsCount,
  expensesCount,
}: PartnerTabsProps) {
  return (
    <div className="flex overflow-x-auto border-b border-muted mb-6 gap-2">
      <TabButton active={activeTab === "overview"} onClick={() => onChange("overview")}>
        <Layers className="size-4" /> Overview & Dividends
      </TabButton>
      <TabButton active={activeTab === "ledger"} onClick={() => onChange("ledger")}>
        <Handshake className="size-4" /> Capital Ledger ({transactionsCount})
      </TabButton>
      <TabButton active={activeTab === "expenses"} onClick={() => onChange("expenses")}>
        <FileText className="size-4" /> Expense Records ({expensesCount})
      </TabButton>
    </div>
  );
}

function TabButton({
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
      className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
