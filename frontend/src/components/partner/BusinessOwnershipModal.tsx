import { useState, useEffect, useMemo, type FormEvent } from "react";
import { Users, User, Plus, Trash2, CheckCircle2, ShieldAlert, Sparkles, Building2, UserPlus } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import { saveBusinessProfile, type BusinessOwner, type BusinessType } from "@/store/businessProfileSlice";
import { fetchPartnerTransactions } from "@/store/partnerSlice";
import type { AccessRole } from "@/store/userManagementSlice";
import { toast } from "sonner";


interface BusinessOwnershipModalProps {
  open: boolean;
  onClose: () => void;
  canDismiss?: boolean;
  onOpenCreateUser?: (role?: AccessRole, name?: string) => void;
}

export function BusinessOwnershipModal({
  open,
  onClose,
  canDismiss = true,
  onOpenCreateUser,
}: BusinessOwnershipModalProps) {
  const dispatch = useAppDispatch();
  const currentProfile = useAppSelector((state) => state.businessProfile);
  const currentUser = useAppSelector((state) => state.auth.user);
  const isOwnerOrAdmin = currentUser?.role === "owner" || currentUser?.role === "admin";
  const managedUsers = useAppSelector((state) => state.userManagement.users);

  const adminOwnerSuggestions = useMemo<string[]>(() => {
    const set = new Set<string>();
    managedUsers
      .filter((u) => u.role === "admin" || u.role === "owner" || u.role === "partner")
      .forEach((u) => {
        if (u.name?.trim()) set.add(u.name.trim());
      });
    if (currentUser?.name?.trim()) set.add(currentUser.name.trim());
    return Array.from(set);
  }, [managedUsers, currentUser]);

  const [businessType, setBusinessType] = useState<BusinessType>("single");
  const [owners, setOwners] = useState<Array<{ name: string; share: number }>>([
    { name: "", share: 100 },
  ]);

  useEffect(() => {
    if (open) {
      if (currentProfile.owners.length > 0) {
        setBusinessType(currentProfile.businessType || (currentProfile.owners.length > 1 ? "multiple" : "single"));
        setOwners(
          currentProfile.owners.map((owner) => ({
            name: owner.name,
            share: owner.share,
          })),
        );
      } else {
        setBusinessType("single");
        setOwners([{ name: "", share: 100 }]);
      }
    }
  }, [open, currentProfile]);

  if (!open) return null;

  const handleTypeChange = (type: BusinessType) => {
    setBusinessType(type);
    if (type === "single") {
      const existingName = owners[0]?.name || "";
      setOwners([{ name: existingName, share: 100 }]);
    } else {
      if (owners.length < 2) {
        const first = owners[0]?.name || "";
        setOwners([
          { name: first, share: 50 },
          { name: "", share: 50 },
        ]);
      }
    }
  };

  const handleOwnerNameChange = (index: number, name: string) => {
    setOwners((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], name };
      return copy;
    });
  };

  const handleOwnerShareChange = (index: number, shareVal: number) => {
    setOwners((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], share: shareVal };
      return copy;
    });
  };

  const handleAddPartner = () => {
    if (owners.length >= 10) {
      toast.error("Maximum 10 partners can be added");
      return;
    }
    const currentCount = owners.length + 1;
    const equalShare = Math.floor(100 / currentCount);
    const remainder = 100 - equalShare * currentCount;

    setOwners((prev) => [
      ...prev.map((o, idx) => ({
        ...o,
        share: idx === 0 ? equalShare + remainder : equalShare,
      })),
      { name: "", share: equalShare },
    ]);
  };

  const handleRemovePartner = (index: number) => {
    if (owners.length <= 2) {
      toast.error("Partnership business must have at least 2 partners");
      return;
    }
    setOwners((prev) => {
      const filtered = prev.filter((_, idx) => idx !== index);
      const equalShare = Math.floor(100 / filtered.length);
      const remainder = 100 - equalShare * filtered.length;
      return filtered.map((o, idx) => ({
        ...o,
        share: idx === 0 ? equalShare + remainder : equalShare,
      }));
    });
  };

  const totalShare = owners.reduce((sum, o) => sum + (Number(o.share) || 0), 0);
  const isShareValid = Math.abs(totalShare - 100) < 0.01;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    for (let i = 0; i < owners.length; i++) {
      if (!owners[i].name.trim()) {
        toast.error(`Please enter name for partner / owner #${i + 1}`);
        return;
      }
    }

    if (!isShareValid) {
      toast.error(`Total equity share must be exactly 100%! Current total: ${totalShare}%`);
      return;
    }

    const payloadOwners: BusinessOwner[] = owners.map((o) => ({
      name: o.name.trim(),
      role: businessType === "single" ? "Owner" : "Partner",
      share: Number(o.share),
    }));

    const result = await dispatch(
      saveBusinessProfile({
        businessType,
        owners: payloadOwners,
      }),
    );

    if (saveBusinessProfile.fulfilled.match(result)) {
      dispatch(fetchPartnerTransactions());
      onClose();
    }
  };


  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 pointer-events-none sm:p-4">
        <div
          className="bg-card w-full max-w-lg max-h-[92vh] rounded-2xl shadow-2xl border border-border overflow-y-auto flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-5 py-4 border-b bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold shadow-xs">
                <Building2 className="size-5" />
              </div>
              <div>
                <h2 className="font-bold text-base text-foreground flex items-center gap-1.5">
                  Business Ownership Setup
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {businessType === "single" ? "Single Owner" : "Partnership"}
                  </span>
                </h2>
                <p className="text-xs text-muted-foreground">
                  Configure business ownership structure and partner equity shares
                </p>
              </div>
            </div>
            {canDismiss && (
              <button
                type="button"
                onClick={onClose}
                className="size-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                ✕
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {/* Business Structure Selection Tabs */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Select Business Structure
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleTypeChange("single")}
                  className={`p-3.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    businessType === "single"
                      ? "border-primary bg-primary/10 ring-2 ring-primary/20 shadow-xs"
                      : "border-border hover:border-border/80 hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <User className={`size-5 ${businessType === "single" ? "text-primary" : "text-muted-foreground"}`} />
                    {businessType === "single" && <CheckCircle2 className="size-4 text-primary" />}
                  </div>
                  <span className="font-bold text-sm text-foreground mt-1">Single Owner</span>
                  <span className="text-xs text-muted-foreground">Sole proprietorship (1 Owner, 100% share)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTypeChange("multiple")}
                  className={`p-3.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    businessType === "multiple"
                      ? "border-primary bg-primary/10 ring-2 ring-primary/20 shadow-xs"
                      : "border-border hover:border-border/80 hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Users className={`size-5 ${businessType === "multiple" ? "text-primary" : "text-muted-foreground"}`} />
                    {businessType === "multiple" && <CheckCircle2 className="size-4 text-primary" />}
                  </div>
                  <span className="font-bold text-sm text-foreground mt-1">Partnership</span>
                  <span className="text-xs text-muted-foreground">Multiple partners (2 or more equity holders)</span>
                </button>
              </div>
            </div>

            {/* Owner Inputs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {businessType === "single" ? "Owner Details" : "Partners & Equity Shares"}
                </label>
                {businessType === "multiple" && (
                  <button
                    type="button"
                    onClick={handleAddPartner}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors py-1 px-2.5 rounded-lg bg-primary/5 hover:bg-primary/10"
                  >
                    <Plus className="size-3.5" /> Add Partner
                  </button>
                )}
              </div>

              <div className="space-y-2.5">
                <datalist id="admin-owner-suggestions">
                  {adminOwnerSuggestions.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
                {owners.map((owner, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-xl border border-border/80 bg-muted/20 hover:bg-muted/30 transition-colors"
                  >
                    <span className="size-7 rounded-lg bg-background flex items-center justify-center font-bold text-xs text-muted-foreground shrink-0 border">
                      {idx + 1}
                    </span>

                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        list="admin-owner-suggestions"
                        placeholder={businessType === "single" ? "Enter owner name" : `Partner ${idx + 1} name`}
                        value={owner.name}
                        onChange={(e) => handleOwnerNameChange(idx, e.target.value)}
                        required
                        className="w-full h-9 px-2.5 sm:px-3 text-xs sm:text-sm rounded-lg bg-background border border-input focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground"
                      />
                    </div>

                    <div className="w-20 sm:w-24 shrink-0 flex items-center gap-1 bg-background border border-input px-2 sm:px-2.5 h-9 rounded-lg">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        disabled={businessType === "single"}
                        value={businessType === "single" ? 100 : owner.share}
                        onChange={(e) => handleOwnerShareChange(idx, Number(e.target.value))}
                        className="w-full text-xs sm:text-sm font-semibold text-right bg-transparent focus:outline-none disabled:opacity-80"
                      />
                      <span className="text-xs font-medium text-muted-foreground">%</span>
                    </div>

                    {isOwnerOrAdmin && onOpenCreateUser && owner.name.trim() && (
                      <button
                        type="button"
                        onClick={() => onOpenCreateUser("admin", owner.name.trim())}
                        className="size-9 rounded-lg hover:bg-primary/10 text-primary flex items-center justify-center transition-colors shrink-0"
                        title={`Create login account for ${owner.name}`}
                      >
                        <UserPlus className="size-4" />
                      </button>
                    )}

                    {businessType === "multiple" && owners.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePartner(idx)}
                        className="size-9 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center transition-colors shrink-0"
                        title="Delete partner"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Total Share Validation Banner (For Partnership) */}
            {businessType === "multiple" && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-colors ${
                  isShareValid
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                    : "bg-destructive/10 border-destructive/30 text-destructive"
                }`}
              >
                <div className="flex items-center gap-2">
                  {isShareValid ? (
                    <CheckCircle2 className="size-4 shrink-0" />
                  ) : (
                    <ShieldAlert className="size-4 shrink-0" />
                  )}
                  <span>
                    {isShareValid
                      ? "Equity share distribution is valid (100%)"
                      : "Total equity share must add up to exactly 100%"}
                  </span>
                </div>
                <span className="font-bold font-mono text-sm">{totalShare}%</span>
              </div>
            )}

            {/* Quick action to create login account for Staff/Owner/Partner */}
            {isOwnerOrAdmin && onOpenCreateUser && (
              <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between gap-3">
                <div className="text-xs">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <UserPlus className="size-3.5 text-primary" />
                    Need Login Account?
                  </span>
                  <p className="text-muted-foreground mt-0.5">
                    Create system login credentials directly for staff or partners.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const firstEnteredName = owners.find((o) => o.name.trim())?.name?.trim() || "";
                    onOpenCreateUser("admin", firstEnteredName);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0 flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="size-3.5" /> Create User
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              {canDismiss && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted border border-border rounded-full transition-all cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={currentProfile.saving || (businessType === "multiple" && !isShareValid)}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#8b5cf6] via-[#7c3aed] to-[#6366f1] text-white border border-white/25 shadow-[0_0_20px_rgba(139,92,246,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] hover:shadow-[0_0_28px_rgba(139,92,246,0.55),inset_0_1px_2px_rgba(255,255,255,0.6)] hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] font-semibold text-sm transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="size-4" />
                {currentProfile.saving ? "Saving..." : "Save Configuration"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
