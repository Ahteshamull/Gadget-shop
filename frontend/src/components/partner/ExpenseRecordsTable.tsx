import { Calendar, FileText, Trash2 } from "lucide-react";
import { fmt } from "@/lib/phone-ui";
import { AppPagination } from "@/components/ui/pagination";
import type { ShopExpenseRecord } from "./partnerTypes";

type ExpenseRecordsTableProps = {
  expenses: ShopExpenseRecord[];
  paginatedExpenses: ShopExpenseRecord[];
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onDelete: (id: string) => void;
};

export function ExpenseRecordsTable({
  expenses,
  paginatedExpenses,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onDelete,
}: ExpenseRecordsTableProps) {
  return (
    <div className="bg-card rounded-xl border overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b flex flex-wrap items-center justify-between gap-4 bg-muted/20">
        <h3 className="font-semibold flex items-center gap-2">
          <FileText className="size-4.5 text-primary" /> Shop Operating Expenses
        </h3>
        <span className="text-xs text-muted-foreground">
          {expenses.length} expense entries registered
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-right">Amount</th>
              <th className="p-3 text-left">
                <Calendar className="size-3.5 inline mr-1" />
                Date
              </th>
              <th className="p-3 text-left">Description / Notes</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {paginatedExpenses.length === 0 && (
              <tr>
                <td colSpan={5} className="p-10 text-center text-muted-foreground">
                  No expenses logged. Click "+ Add Shop Expense" to log one.
                </td>
              </tr>
            )}
            {paginatedExpenses.map((expense) => (
              <tr key={expense.id} className="hover:bg-accent/10 transition-colors">
                <td className="p-3">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${categoryClass(
                      expense.category,
                    )}`}
                  >
                    {expense.category}
                  </span>
                </td>
                <td className="p-3 text-right font-bold text-destructive">{fmt(expense.amount)}</td>
                <td className="p-3 text-xs text-muted-foreground">
                  {new Date(expense.date).toLocaleDateString()}
                </td>
                <td
                  className="p-3 text-xs text-muted-foreground max-w-[280px] truncate"
                  title={expense.notes}
                >
                  {expense.notes || "-"}
                </td>
                <td className="p-3 text-center">
                  <button
                    type="button"
                    onClick={() => onDelete(expense.id)}
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
            {Math.min(currentPage * pageSize, expenses.length)} of {expenses.length} entries
          </span>
          <AppPagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
        </div>
      )}
    </div>
  );
}

function categoryClass(category: string): string {
  if (category === "Rent") return "bg-blue-500/10 text-blue-600";
  if (category === "Salary") return "bg-emerald-500/10 text-emerald-600";
  if (category === "Internet") return "bg-violet-500/10 text-violet-600";
  if (category === "Electricity") return "bg-warning/15 text-warning";
  return "bg-muted text-muted-foreground";
}
