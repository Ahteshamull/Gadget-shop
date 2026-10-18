import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Smartphone,
  Lock,
  Mail,
  Eye,
  EyeOff,
  User,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Loader2,
  Info,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../store";
import { loginUser, clearAuthError } from "../store/authSlice";
import api from "../store/api";
import { toast } from "sonner";
import { apiErrorMessage } from "../store/apiTypes";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — PhoneTrack" },
      { name: "description", content: "Sign in to your PhoneTrack admin panel." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading, error: authError } = useAppSelector((state) => state.auth);

  // Normal login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Dynamic custom banner & branding states
  const [customBanner, setCustomBanner] = useState<string>("");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [shopName, setShopName] = useState<string>("Phone Bazar");
  const [shopTagline, setShopTagline] = useState<string>("SALES CONSOLE");
  const [shopLogoUrl, setShopLogoUrl] = useState<string>("");
  const [loginHeadline, setLoginHeadline] = useState<string>("Track every phone.\nOwn every customer.");
  const [loginDescription, setLoginDescription] = useState<string>("Manage stock, sales, warranties, and customer history by IMEI.");
  const [loginFooterText, setLoginFooterText] = useState<string>("PhoneTrack admin panel");

  // First-time admin setup state
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false);
  const [setupName, setSetupName] = useState("");
  const [setupEmail, setSetupEmail] = useState("");
  const [setupPassword, setSetupPassword] = useState("");
  const [setupConfirmPassword, setSetupConfirmPassword] = useState("");
  const [setupShowPassword, setSetupShowPassword] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      window.location.replace("/dashboard");
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (typeof document !== "undefined" && shopName) {
      document.title = `Login — ${shopName}`;
    }
  }, [shopName]);

  // Check if initial admin setup is required and fetch custom banner
  useEffect(() => {
    let isMounted = true;
    async function checkSetupStatus() {
      try {
        const response = await api.get<{
          success: boolean;
          data?: {
            needsSetup: boolean;
            hasAdmin: boolean;
            shopName?: string;
            shopTagline?: string;
            shopLogoUrl?: string;
            loginHeadline?: string;
            loginDescription?: string;
            loginFooterText?: string;
            loginBannerUrl?: string;
          };
        }>("/auth/get-setup-status");

        if (isMounted) {
          const d = response.data?.data;
          if (d?.loginBannerUrl) setCustomBanner(d.loginBannerUrl);
          if (d?.shopName) setShopName(d.shopName);
          if (d?.shopTagline) setShopTagline(d.shopTagline);
          if (d?.shopLogoUrl) setShopLogoUrl(d.shopLogoUrl);
          if (d?.loginHeadline) setLoginHeadline(d.loginHeadline);
          if (d?.loginDescription) setLoginDescription(d.loginDescription);
          if (d?.loginFooterText) setLoginFooterText(d.loginFooterText);
          if (d?.needsSetup) setIsFirstTimeSetup(true);
        }
      } catch {
        // Silently fallback to standard login on network error
      } finally {
        if (isMounted) setCheckingSetup(false);
      }
    }
    checkSetupStatus();
    return () => {
      isMounted = false;
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!email.trim() || password.length < 4) {
      setError("Enter a valid email and a password of at least 4 characters.");
      return;
    }
    try {
      await dispatch(loginUser({ email, password, remember })).unwrap();
      setSuccess("Login successful. Opening dashboard...");
      window.location.replace("/dashboard");
    } catch (err) {
      setError(typeof err === "string" ? err : "Login failed. Check connection or credentials.");
    }
  }

  async function handleInitialSetupSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!setupName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!setupEmail.trim() || !setupEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (setupPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (setupPassword !== setupConfirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSetupLoading(true);
    try {
      const response = await api.post<{
        success: boolean;
        message: string;
        data: {
          id: string;
          name: string;
          email: string;
          role: string;
          token: string;
        };
      }>("/auth/create-initial-admin", {
        name: setupName.trim(),
        email: setupEmail.trim().toLowerCase(),
        password: setupPassword,
      });

      const { token, id, name, email: userEmail, role } = response.data.data;

      // Store credentials in browser storage
      if (typeof window !== "undefined") {
        const targetStorage = remember ? localStorage : sessionStorage;
        targetStorage.setItem("pt_auth", "1");
        targetStorage.setItem("pt_token", token);
        targetStorage.setItem("pt_user", JSON.stringify({ id, name, email: userEmail, role }));
        targetStorage.setItem("pt_session", remember ? "persistent" : "session");
        targetStorage.setItem("pt_auth_expires_at", String(Date.now() + 30 * 24 * 60 * 60 * 1000));
      }

      toast.success(`Welcome ${name}! Initial admin setup complete.`);
      window.location.replace("/dashboard");
    } catch (err: unknown) {
      setError(apiErrorMessage(err, "Failed to create initial admin account."));
    } finally {
      setSetupLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-background">
      {/* Brand panel */}
      <div className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-10 flex-col justify-between">
        {/* Ambient background glows */}
        <div className="absolute -top-32 -left-32 size-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 size-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

        {/* Skeleton & Shimmer loading state while checking backend banner */}
        {checkingSetup && (
          <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center z-20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-950/30 via-slate-900 to-slate-950 animate-pulse" />
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className="size-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md shadow-lg">
                <Loader2 className="size-6 text-cyan-400 animate-spin" />
              </div>
              <span className="text-xs font-mono text-slate-400">Loading banner...</span>
            </div>
          </div>
        )}

        {/* Render custom banner image only if configured */}
        {customBanner && !checkingSetup && (
          <>
            <img
              src={customBanner}
              alt=""
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(false)}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
            />
            <div className="absolute inset-0 bg-slate-950/45" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/45" />
          </>
        )}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {shopLogoUrl ? (
              <div className="size-12 sm:size-14 rounded-2xl bg-white shadow-xl shadow-black/20 ring-1 ring-white/40 p-1.5 flex items-center justify-center overflow-hidden shrink-0">
                <img src={shopLogoUrl} alt="Logo" className="size-full object-contain object-center" />
              </div>
            ) : (
              <div className="size-11 sm:size-12 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center overflow-hidden border border-white/20 shrink-0 text-white">
                <Smartphone className="size-6" />
              </div>
            )}
            <div>
              <div className="font-bold text-white text-base sm:text-lg leading-tight">{shopName || "Phone Bazar"}</div>
              <div className="text-xs text-white/80 font-semibold uppercase tracking-wider">{shopTagline || "SALES CONSOLE"}</div>
            </div>
          </div>
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl xl:text-4xl font-bold leading-tight whitespace-pre-line text-white">
            {loginHeadline || "Track every phone.\nOwn every customer."}
          </h1>
          <p className="mt-3 text-sm opacity-90 max-w-md leading-relaxed text-white/90">
            {loginDescription || "Manage stock, sales, warranties, and customer history by IMEI."}
          </p>
        </div>
        <div className="relative z-10 text-xs opacity-80">{loginFooterText || "PhoneTrack admin panel"}</div>
      </div>

      {/* Form panel */}
      <div className="flex min-h-screen items-center justify-center p-5 sm:p-8 lg:min-h-0">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-6">
            {shopLogoUrl ? (
              <div className="size-11 rounded-xl bg-white shadow-sm ring-1 ring-border p-1 flex items-center justify-center overflow-hidden shrink-0">
                <img src={shopLogoUrl} alt="Logo" className="size-full object-contain object-center" />
              </div>
            ) : (
              <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground overflow-hidden shrink-0">
                <Smartphone className="size-5 text-primary-foreground" />
              </div>
            )}
            <div>
              <div className="font-bold text-base leading-tight">{shopName || "Phone Bazar"}</div>
              <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{shopTagline || "SALES CONSOLE"}</div>
            </div>
          </div>

          {/* FIRST-TIME ADMIN SETUP VIEW */}
          {isFirstTimeSetup ? (
            <div className="animate-in fade-in-50 duration-300">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-3 border border-emerald-500/20">
                <Sparkles className="size-3.5" /> First-Time Setup
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Create Admin Account
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                No admin account exists in database. Create your master owner account to get full
                system access.
              </p>

              <form onSubmit={handleInitialSetupSubmit} className="mt-6 space-y-3.5">
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={setupName}
                      onChange={(e) => setSetupName(e.target.value)}
                      required
                      placeholder="e.g. Master Admin"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">
                    Admin Email *
                  </label>
                  <div className="relative">
                    <Mail className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="email"
                      value={setupEmail}
                      onChange={(e) => setSetupEmail(e.target.value)}
                      required
                      placeholder="admin@yourshop.com"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">
                    Password (min 6 chars) *
                  </label>
                  <div className="relative">
                    <Lock className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type={setupShowPassword ? "text" : "password"}
                      value={setupPassword}
                      onChange={(e) => setSetupPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="********"
                      className="w-full pl-9 pr-10 py-2 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <button
                      type="button"
                      onClick={() => setSetupShowPassword(!setupShowPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                    >
                      {setupShowPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type={setupShowPassword ? "text" : "password"}
                      value={setupConfirmPassword}
                      onChange={(e) => setSetupConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="********"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                {error && (
                  <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={setupLoading}
                  className="w-full py-2.5 rounded-full bg-gradient-to-r from-[#8b5cf6] via-[#7c3aed] to-[#6366f1] text-white border border-white/25 shadow-[0_0_20px_rgba(139,92,246,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] hover:shadow-[0_0_28px_rgba(139,92,246,0.55),inset_0_1px_2px_rgba(255,255,255,0.6)] hover:brightness-110 hover:scale-[1.01] active:scale-[0.98] text-sm font-semibold disabled:opacity-60 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <ShieldCheck className="size-4" />
                  {setupLoading ? "Creating Master Admin..." : "Create Admin & Access System"}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setIsFirstTimeSetup(false)}
                    className="text-xs text-muted-foreground hover:underline cursor-pointer"
                  >
                    Already have an account? Back to Sign in
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* STANDARD LOGIN VIEW */
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Sign in to manage your phone sales.
              </p>

              <form onSubmit={submit} className="mt-6 space-y-4">
                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2.5 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="you@company.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5 text-foreground">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type={show ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-9 pr-10 py-2.5 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="********"
                    />
                    <button
                      type="button"
                      onClick={() => setShow((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground"
                    >
                      {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="size-3.5 rounded border"
                  />
                  Remember me for 30 days
                </label>

                {(authError || error) && (
                  <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                    {authError || error}
                  </div>
                )}

                {success && (
                  <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
                    {success}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-full bg-gradient-to-r from-[#8b5cf6] via-[#7c3aed] to-[#6366f1] text-white border border-white/25 shadow-[0_0_20px_rgba(139,92,246,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] hover:shadow-[0_0_28px_rgba(139,92,246,0.55),inset_0_1px_2px_rgba(255,255,255,0.6)] hover:brightness-110 hover:scale-[1.01] active:scale-[0.98] text-sm font-semibold disabled:opacity-60 transition-all cursor-pointer"
                >
                  {loading ? "Signing in..." : "Sign in"}
                </button>
              </form>
            </div>
          )}

          {/* Important Developer Contact Notice */}
          <div className="mt-6 p-3.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5 transition-all text-left">
            <Info className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold block text-amber-800 dark:text-amber-300">
                Important Notice:
              </span>
              For any new feature updates, functionality changes, or technical assistance, please contact directly via{" "}
              <a
                href="https://wa.me/8801761109515"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-bold text-amber-700 dark:text-amber-200"
              >
                WhatsApp: +880 1761-109515
              </a>.
            </div>
          </div>

          {/* Form Panel Footer Developer Credit */}
          <div className="mt-6 text-center text-xs text-muted-foreground border-t border-border/50 pt-4">
            Developed with ❤️ by Hasan
          </div>
        </div>
      </div>
    </div>
  );
}
