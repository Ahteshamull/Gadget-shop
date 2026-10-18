import type { Dispatch, FormEvent, SetStateAction } from "react";
import { ChevronDown, Handshake, Trash2 } from "lucide-react";
import type { PartnerTransactionForm, PartnerTransactionType } from "./partnerTypes";

type PartnerTransactionModalProps = {
  open: boolean;
  form: PartnerTransactionForm;
  partnerOptions: string[];
  dropdownOpen: boolean;
  onDropdownOpenChange: (open: boolean | ((open: boolean) => boolean)) => void;
  onFormChange: Dispatch<SetStateAction<PartnerTransactionForm>>;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
};

export function PartnerTransactionModal({
  open,
  form,
  partnerOptions,
  dropdownOpen,
  onDropdownOpenChange,
  onFormChange,
  onClose,
  onSubmit,
}: PartnerTransactionModalProps) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-40" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 pointer-events-none sm:p-4">
        <div
          className="bg-card w-full max-w-md max-h-[calc(100vh-1.5rem)] rounded-2xl shadow-2xl border overflow-y-auto flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex flex-col gap-3 px-4 py-4 border-b bg-gradient-to-r from-emerald-500/5 to-transparent sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Handshake className="size-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="font-bold text-foreground">Log Partner Transaction</h2>
                <p className="text-xs text-muted-foreground">
                  Log cash investment or capital withdrawal
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

          <form onSubmit={onSubmit} className="p-4 space-y-4 sm:p-6">
            <div className="relative flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Owner / Partner Name *</span>
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={dropdownOpen}
                onClick={() => onDropdownOpenChange((current) => !current)}
                onBlur={() => window.setTimeout(() => onDropdownOpenChange(false), 120)}
                className={`input flex h-10 w-full items-center justify-between gap-3 text-left transition-all ${
                  dropdownOpen ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/50"
                }`}
              >
                <span className={form.partner ? "font-medium text-foreground" : "text-muted-foreground"}>
                  {form.partner || "Select owner or partner"}
                </span>
                <ChevronDown
                  className={`size-4 shrink-0 text-muted-foreground transition-transform ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {dropdownOpen && (
                <div
                  role="listbox"
                  className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-xl shadow-black/10"
                >
                  {partnerOptions.map((name) => {
                    const selected = form.partner === name;
                    return (
                      <button
                        key={name}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          onFormChange((current) => ({ ...current, partner: name }));
                          onDropdownOpenChange(false);
                        }}
                        className={`flex h-10 w-full items-center rounded-lg px-3 text-left text-sm font-semibold transition-colors ${
                          selected ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        }`}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground">Transaction Type *</span>
                <select
                  value={form.type}
                  onChange={(event) =>
                    onFormChange((current) => ({
                      ...current,
                      type: event.target.value as PartnerTransactionType,
                    }))
                  }
                  className="input cursor-pointer"
                >
                  <option value="Investment">Investment</option>
                  <option value="Withdrawal">Withdrawal</option>
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground">Date *</span>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(event) =>
                    onFormChange((current) => ({ ...current, date: event.target.value }))
                  }
                  className="input cursor-pointer"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Amount (Tk) *</span>
              <input
                type="number"
                min="1"
                required
                value={form.amount || ""}
                onChange={(event) =>
                  onFormChange((current) => ({
                    ...current,
                    amount: Math.max(0, Number(event.target.value)),
                  }))
                }
                placeholder="Enter amount"
                className="input font-bold"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Notes / Remarks</span>
              <textarea
                value={form.notes}
                onChange={(event) =>
                  onFormChange((current) => ({ ...current, notes: event.target.value }))
                }
                placeholder="Purpose of transaction..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
              />
            </label>

            <div className="flex flex-col-reverse gap-2 pt-3 border-t border-muted/50 sm:flex-row sm:justify-end">
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
                Confirm Record
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
