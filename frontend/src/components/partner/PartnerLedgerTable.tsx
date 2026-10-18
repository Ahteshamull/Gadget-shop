import { Calendar, Handshake, Trash2 } from "lucide-react";
import { fmt } from "@/lib/phone-ui";
import { AppPagination } from "@/components/ui/pagination";
import type { PartnerTransactionRecord } from "./partnerTypes";

type PartnerLedgerTableProps = {
  transactions: PartnerTransactionRecord[];
  paginatedTransactions: PartnerTransactionRecord[];
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onDelete: (id: string) => void;
  getPartnerColorClass: (partnerName: string) => string;
};

export function PartnerLedgerTable({
  transactions,
  paginatedTransactions,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onDelete,
  getPartnerColorClass,
}: PartnerLedgerTableProps) {
  return (
    <div className="bg-card rounded-xl border overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b flex flex-wrap items-center justify-between gap-4 bg-muted/20">
        <h3 className="font-semibold flex items-center gap-2">
          <Handshake className="size-4.5 text-primary" /> Capital Transactions
        </h3>
        <span className="text-xs text-muted-foreground">
          {transactions.length} entries registered
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3 text-left">Partner</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-right">Amount</th>
              <th className="p-3 text-left">
                <Calendar className="size-3.5 inline mr-1" />
                Date
              </th>
              <th className="p-3 text-left">Notes / Purpose</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {paginatedTransactions.length === 0 && (
              <tr>
                <td colSpan={6} className="p-10 text-center text-muted-foreground">
                  No partner capital transaction registered. Click "+ Add Partner Cash" to log one.
                </td>
              </tr>
            )}
            {paginatedTransactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-accent/10 transition-colors">
                <td className="p-3 font-semibold text-foreground">
                  <div className="flex items-center gap-2">
                    <span
                      className={`size-6 rounded-full flex items-center justify-center text-[10px] font-bold ${getPartnerColorClass(
                        transaction.partner,
                      )}`}
                    >
                      {transaction.partner[0]}
                    </span>
                    {transaction.partner}
                  </div>
                </td>
                <td className="p-3">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      transaction.type === "Investment"
                        ? "bg-success/15 text-success"
                        : "bg-red-500/15 text-red-600"
                    }`}
                  >
                    {transaction.type}
                  </span>
                </td>
                <td className="p-3 text-right font-bold text-foreground">
                  {transaction.type === "Withdrawal" ? "-" : "+"} {fmt(transaction.amount)}
                </td>
                <td className="p-3 text-xs text-muted-foreground">
                  {new Date(transaction.date).toLocaleDateString()}
                </td>
                <td
                  className="p-3 text-xs text-muted-foreground max-w-[250px] truncate"
                  title={transaction.notes}
                >
                  {transaction.notes || "-"}
                </td>
                <td className="p-3 text-center">
                  <button
                    type="button"
                    onClick={() => onDelete(transaction.id)}
                    className="p-1 text-destructive hover:bg-destructive/10 rounded-md transition-all cursor-pointer"
                    title="Delete record"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-4 py-4 border-t bg-muted/10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <span className="text-xs text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, transactions.length)} of {transactions.length} entries
          </span>
          <AppPagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
        </div>
      )}
    </div>
  );
}
