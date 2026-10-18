import React, { useRef, useEffect } from "react";
import { AlertTriangle, Smartphone, Trash2, X } from "lucide-react";
import type { StockSale } from "./salesUtils";

export function DeleteStockModal({
  item,
  onClose,
  onConfirm,
}: {
  item: StockSale;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const mountedAtRef = useRef(Date.now());
  const isBackdropMouseDownRef = useRef(false);

  useEffect(() => {
    mountedAtRef.current = Date.now();
  }, []);

  const handleBackdropMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      isBackdropMouseDownRef.current = true;
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (Date.now() - mountedAtRef.current < 250) return;
    if (e.target === e.currentTarget && isBackdropMouseDownRef.current) {
      onClose();
    }
    isBackdropMouseDownRef.current = false;
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 backdrop-blur-sm animate-in fade-in duration-200 sm:p-4"
    >
      <div
        className="bg-card rounded-xl max-w-md w-full overflow-hidden shadow-2xl border transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b bg-destructive/5 flex items-start gap-3">
          <div className="size-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
            <AlertTriangle className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-lg text-foreground">Delete stock item?</h3>
            <p className="text-sm text-muted-foreground mt-1">
              This phone will be removed from your inventory records.
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="size-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="rounded-xl border bg-muted/20 p-4">
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Smartphone className="size-5" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-foreground truncate">
                  {item.brand} {item.model}
                </div>
                <div className="text-xs text-muted-foreground mt-1 font-mono">
                  IMEI: {item.imei}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Supplier: {item.supplierName || "Not added"}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            Deleting this stock cannot be undone from the app.
          </div>
        </div>

        <div className="p-5 border-t bg-muted/10 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="px-4 py-2 rounded-lg border text-sm font-semibold hover:bg-muted transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onConfirm();
            }}
            className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-semibold inline-flex items-center justify-center gap-2 hover:opacity-90 transition-all cursor-pointer"
          >
            <Trash2 className="size-4" /> Delete Stock
          </button>
        </div>
      </div>
    </div>
  );
}
