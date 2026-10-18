import { useState, useEffect, type FormEvent } from "react";
import { UserPlus, Lock, Mail, User, Shield, X, Eye, EyeOff } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import { createManagedUser, type AccessRole } from "@/store/userManagementSlice";
import { fetchBusinessProfile } from "@/store/businessProfileSlice";
import { toast } from "sonner";

interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
  initialRole?: AccessRole;
  initialName?: string;
  onUserCreated?: () => void;
}

export function CreateUserModal({
  open,
  onClose,
  initialRole = "staff",
  initialName = "",
  onUserCreated,
}: CreateUserModalProps) {
  const dispatch = useAppDispatch();
  const createLoading = useAppSelector((state) => state.userManagement.createLoading);
  const currentUserRole = useAppSelector((state) => state.auth.user?.role);

  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AccessRole>(initialRole);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (open) {
      setRole(initialRole);
      setName(initialName || "");
    }
  }, [open, initialRole, initialName]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter user name");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    const result = await dispatch(
      createManagedUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
      }),
    );

    if (createManagedUser.fulfilled.match(result)) {
      if (role === "partner" || role === "owner" || role === "admin") {
        dispatch(fetchBusinessProfile());
      }
      onUserCreated?.();
      setName("");
      setEmail("");
      setPassword("");
      setRole(initialRole);
      onClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 pointer-events-none sm:p-4">
        <div
          className="bg-card w-full max-w-md max-h-[92vh] rounded-2xl shadow-2xl border border-border overflow-y-auto flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-5 py-4 border-b bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold shadow-xs">
                <UserPlus className="size-5" />
              </div>
              <div>
                <h2 className="font-bold text-base text-foreground">Create User / Partner</h2>
                <p className="text-xs text-muted-foreground">
                  Directly create an owner, partner, or staff account in the database
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="size-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Name */}
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Full Name *</span>
              <div className="relative">
                <User className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 text-sm rounded-lg bg-background border border-input focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </label>

            {/* Email */}
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Login Email Address *</span>
              <div className="relative">
                <Mail className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  required
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 text-sm rounded-lg bg-background border border-input focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </label>

            {/* Password */}
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Login Password (min 6 characters) *</span>
              <div className="relative">
                <Lock className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-10 pl-9 pr-10 text-sm rounded-lg bg-background border border-input focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </label>

            {/* Role selection */}
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Select Role *</span>
              <div className="relative">
                <Shield className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <select
                  value={role === "owner" || role === "partner" ? "admin" : role}
                  onChange={(e) => setRole(e.target.value as AccessRole)}
                  className="w-full h-10 pl-9 pr-3 text-sm rounded-lg bg-background border border-input focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground cursor-pointer"
                >
                  <option value="staff">Staff (Stock & Sales operations)</option>
                  <option value="admin">Admin / Owner (Full access management)</option>
                </select>
              </div>
            </label>

            <div className="p-3 rounded-xl border bg-muted/30 text-xs text-muted-foreground">
              💡 <span className="font-semibold text-foreground">Note:</span> After creating the account, the user can immediately log in using these credentials.
            </div>

            {/* Actions */}
            <div className="pt-3 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted border border-border rounded-full transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createLoading}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#8b5cf6] via-[#7c3aed] to-[#6366f1] text-white border border-white/25 shadow-[0_0_20px_rgba(139,92,246,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] hover:shadow-[0_0_28px_rgba(139,92,246,0.55),inset_0_1px_2px_rgba(255,255,255,0.6)] hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] font-semibold text-sm transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                <UserPlus className="size-4" />
                {createLoading ? "Creating..." : "Create Account"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
