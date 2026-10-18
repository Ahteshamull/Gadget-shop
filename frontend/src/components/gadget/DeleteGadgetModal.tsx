import React from "react";
import { AlertTriangle, X } from "lucide-react";
import type { DeleteConfirmData } from "./gadgetTypes";

export interface DeleteGadgetModalProps {
  deleteConfirm: DeleteConfirmData | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteGadgetModal({
  deleteConfirm,
  onClose,
  onConfirm,
}: DeleteGadgetModalProps) {
  if (!deleteConfirm) return null;

  return (
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
              <h3 className="text-base font-bold text-foreground">
                Delete gadget stock?
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                "{deleteConfirm.name}" and its related sales records will be
                removed.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-muted cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:opacity-90 cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
