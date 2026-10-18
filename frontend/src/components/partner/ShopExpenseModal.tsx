import type { Dispatch, FormEvent, SetStateAction } from "react";
import { FileText, Trash2 } from "lucide-react";
import type { ExpenseCategory, ExpenseRows } from "./partnerTypes";

const expenseRowConfig: Array<{
  key: ExpenseCategory;
  label: string;
  dotClass: string;
  placeholder: string;
}> = [
  { key: "Rent", label: "Shop Rent", dotClass: "bg-blue-500", placeholder: "e.g. Shop Rent for June" },
  {
    key: "Salary",
    label: "Staff Salary",
    dotClass: "bg-emerald-500",
    placeholder: "e.g. Sales Assistant salary",
  },
  {
    key: "Internet",
    label: "Net Bill",
    dotClass: "bg-violet-500",
    placeholder: "e.g. Broadband internet bill",
  },
  {
    key: "Electricity",
    label: "Current Bill",
    dotClass: "bg-amber-500",
    placeholder: "e.g. PDB Electricity bill",
  },
  {
    key: "Others",
    label: "Others",
    dotClass: "bg-muted-foreground/60",
    placeholder: "e.g. Tea & snacks, cleaner wage",
  },
];

type ShopExpenseModalProps = {
  open: boolean;
  expenseDate: string;
  expenseRows: ExpenseRows;
  onExpenseDateChange: (date: string) => void;
  onExpenseRowsChange: Dispatch<SetStateAction<ExpenseRows>>;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
};

export function ShopExpenseModal({
  open,
  expenseDate,
  expenseRows,
  onExpenseDateChange,
  onExpenseRowsChange,
  onClose,
  onSubmit,
}: ShopExpenseModalProps) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-40" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 pointer-events-none sm:p-4">
        <div
          className="bg-card w-full max-w-3xl rounded-2xl shadow-2xl border overflow-hidden flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200 max-h-[calc(100vh-1.5rem)]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex flex-col gap-3 px-4 py-4 border-b bg-gradient-to-r from-primary/5 to-transparent shrink-0 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="size-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-foreground">Add Shop Expenses</h2>
                <p className="text-xs text-muted-foreground">
                  Register shop bills or operating expenses
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="size-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors cursor-pointer"
            >
              <Trash2 className="size-4 rotate-45 text-muted-foreground" />
            </button>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col min-h-0">
            <div className="px-4 py-3.5 border-b bg-muted/20 flex flex-col gap-3 shrink-0 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Expense Date *
              </span>
              <input
                type="date"
                required
                value={expenseDate}
                onChange={(event) => onExpenseDateChange(event.target.value)}
                className="input w-full cursor-pointer sm:max-w-[180px]"
              />
            </div>

            <div className="px-6 py-2.5 border-b bg-muted/30 grid grid-cols-12 gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider select-none hidden md:grid shrink-0">
              <div className="col-span-3">Expense Category</div>
              <div className="col-span-3">Amount (Tk)</div>
              <div className="col-span-6">Description / Notes</div>
            </div>

            <div className="px-4 py-4 overflow-y-auto space-y-4 divide-y divide-muted/50 md:divide-none sm:px-6">
              {expenseRowConfig.map((row) => (
                <div
                  key={row.key}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center pt-3 first:pt-0"
                >
                  <div className="col-span-3 font-semibold text-sm text-foreground flex items-center gap-2">
                    <span className={`size-2 rounded-full ${row.dotClass}`} />
                    {row.label}
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      min="0"
                      placeholder="Enter amount"
                      value={expenseRows[row.key].amount || ""}
                      onChange={(event) =>
                        onExpenseRowsChange((current) => ({
                          ...current,
                          [row.key]: {
                            ...current[row.key],
                            amount: Math.max(0, Number(event.target.value)),
                          },
                        }))
                      }
                      className="input text-sm font-semibold text-destructive"
                    />
                  </div>
                  <div className="col-span-6">
                    <input
                      type="text"
                      placeholder={row.placeholder}
                      value={expenseRows[row.key].notes}
                      onChange={(event) =>
                        onExpenseRowsChange((current) => ({
                          ...current,
                          [row.key]: { ...current[row.key], notes: event.target.value },
                        }))
                      }
                      className="input text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col-reverse gap-2 p-4 border-t border-muted/50 bg-muted/10 shrink-0 sm:flex-row sm:justify-end sm:p-6">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 border rounded-full hover:bg-muted text-sm font-semibold cursor-pointer transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-full bg-gradient-to-r from-[#8b5cf6] via-[#7c3aed] to-[#6366f1] text-white border border-white/25 shadow-[0_0_20px_rgba(139,92,246,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] hover:shadow-[0_0_28px_rgba(139,92,246,0.55),inset_0_1px_2px_rgba(255,255,255,0.6)] hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] font-semibold text-sm transition-all cursor-pointer"
              >
                Add Expense
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
