import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { store, useAppDispatch, useAppSelector } from "../store";
import { hydrateAuthFromStorage, logoutUser } from "../store/authSlice";
import { fetchPhoneSales } from "../store/phoneSalesSlice";
import { fetchGadgets, fetchGadgetSales } from "../store/gadgetsSlice";
import { fetchPartnerTransactions, fetchShopExpenses } from "../store/partnerSlice";
import { fetchBusinessProfile } from "../store/businessProfileSlice";
import api from "../store/api";
import { BusinessOwnershipModal } from "@/components/partner/BusinessOwnershipModal";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        {error?.message && (
          <div className="mt-3 text-left p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive font-mono text-xs overflow-auto max-h-24">
            {error.message}
          </div>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "POS & Inventory Management" },
      { name: "description", content: "Fast, secure, and modern point of sale and inventory management console." },
      { name: "author", content: "PhoneTrack POS" },
      { property: "og:title", content: "POS & Inventory Management" },
      { property: "og:description", content: "Fast, secure, and modern point of sale and inventory management console." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "POS & Inventory Management" },
      { name: "twitter:description", content: "Fast, secure, and modern point of sale and inventory management console." },
    ],
    links: [
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/favicon.svg",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponentWrapper,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
try {
  const saved = localStorage.getItem("phone-bazar-theme");
  const dark = saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.toggle("dark", dark);
} catch {}
})();`,
          }}
        />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Calendar, Clock, LogOut, Moon, Sun } from "lucide-react";
import { useRouterState, useNavigate } from "@tanstack/react-router";

import { Toaster } from "../components/ui/sonner";

const staffAllowedRoutes = new Set(["/dashboard", "/all-stocks", "/gadget"]);

function RootComponentWrapper() {
  return (
    <Provider store={store}>
      <RootComponent />
      <Toaster />
    </Provider>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isAuthPage = path === "/login";
  const isPublicPage = isAuthPage;
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const role = user?.role;
  const [authReady, setAuthReady] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Prevent number input values from changing on mouse scroll
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      if (
        document.activeElement === target &&
        target.tagName === "INPUT" &&
        (target as HTMLInputElement).type === "number"
      ) {
        target.blur();
      }
    };
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, []);

  const formattedDate = currentTime.toLocaleDateString("en-US", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const formattedTime = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .filter(Boolean)
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "AD";

  const pageTitle =
    path === "/" || path === "/dashboard"
      ? "Main Dashboard"
      : path
          .split("/")
          .filter(Boolean)
          .map((part) => part.replace(/-/g, " "))
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" / ");

  useEffect(() => {
    dispatch(hydrateAuthFromStorage());
    setAuthReady(true);
  }, [dispatch]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("phone-bazar-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme = saved === "dark" || (!saved && prefersDark) ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");

    // Early non-blocking background ping to wake up Render instances if asleep
    try {
      api.get("/health").catch(() => {});
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!authReady) return;
    if (!isAuthenticated && !isPublicPage) {
      navigate({ to: "/login" });
      return;
    }
    if (isAuthenticated && path === "/") {
      navigate({ to: "/dashboard" });
      return;
    }
    if (isAuthenticated && role === "staff" && !isPublicPage && !staffAllowedRoutes.has(path)) {
      navigate({ to: "/dashboard" });
    }
  }, [authReady, isAuthenticated, isPublicPage, navigate, path, role]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchPhoneSales());
      dispatch(fetchGadgets());
      dispatch(fetchGadgetSales());
      dispatch(fetchBusinessProfile());
      if (role === "admin" || role === "owner" || role === "partner") {
        dispatch(fetchPartnerTransactions());
        dispatch(fetchShopExpenses());
      }
    }
  }, [isAuthenticated, dispatch, role]);

  if (isPublicPage) {
    return (
      <QueryClientProvider client={queryClient}>
        <Outlet />
      </QueryClientProvider>
    );
  }

  const logout = () => {
    dispatch(logoutUser());
    navigate({ to: "/login" });
  };

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    window.localStorage.setItem("phone-bazar-theme", nextTheme);
  };

  const businessProfile = useAppSelector((state) => state.businessProfile);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);

  useEffect(() => {
    if (typeof document !== "undefined" && businessProfile?.shopName) {
      document.title = `${businessProfile.shopName} - Sales & Inventory`;
    }
  }, [businessProfile?.shopName]);

  const showOnboardingModal =
    isAuthenticated &&
    (role === "admin" || role === "owner") &&
    !businessProfile.loading &&
    !businessProfile.isConfigured &&
    !onboardingDismissed;

  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <div className="min-h-screen flex w-full overflow-x-hidden bg-background">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0 [--app-header-left:0px] md:[--app-header-left:var(--sidebar-width)] peer-data-[collapsible=icon]:md:[--app-header-left:calc(var(--sidebar-width-icon)+1rem)]">
            {/* Top Shield: guarantees content never peeks above floating header on scroll without overlapping sidebar or header border */}
            <div className="fixed top-0 left-[var(--app-header-left)] right-0 h-3 bg-background/95 backdrop-blur-md z-20 pointer-events-none transition-[left] duration-200 ease-linear" />

            <header className="fixed left-[calc(var(--app-header-left)+0.75rem)] right-3 top-3 z-30 h-16 shrink-0 rounded-2xl border border-slate-300/90 dark:border-slate-700/80 bg-sidebar/95 text-sidebar-foreground shadow-md shadow-black/5 dark:shadow-black/30 backdrop-blur-xl ring-1 ring-black/[0.05] dark:ring-white/[0.08] flex items-center justify-between gap-3 px-3 sm:px-5 transition-[left] duration-200 ease-linear">
              {/* Left: Sidebar trigger & breadcrumb page title */}
              <div className="flex items-center gap-3 min-w-0">
                <SidebarTrigger className="text-sidebar-foreground/75 hover:bg-cyan-500/10 hover:text-cyan-600 hover:scale-105 active:scale-95 rounded-xl transition-all duration-200 cursor-pointer" />
                <div className="min-w-0">
                  <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/50">
                    <span>Pages</span>
                    <span>/</span>
                    <span className="text-cyan-500 font-bold">{pageTitle}</span>
                  </div>
                  <div className="truncate text-base sm:text-lg font-bold leading-tight text-sidebar-foreground">
                    {pageTitle}
                  </div>
                </div>
              </div>

              {/* Right: Live Time & Date + Theme + Logout + User Profile */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                {/* Live Date & Digital Clock Pill (visible on md+) */}
                <div className="hidden md:flex items-center gap-2 sm:gap-3 px-3 py-1.5 rounded-xl bg-background/60 border border-sidebar-border shadow-xs backdrop-blur-md">
                  {/* Date (visible on lg+) */}
                  <div className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-sidebar-foreground/75">
                    <Calendar className="size-3.5 text-cyan-500 shrink-0" />
                    <span className="whitespace-nowrap">{formattedDate}</span>
                  </div>

                  {/* Subtle divider */}
                  <div className="hidden lg:block h-3.5 w-px bg-sidebar-border" />

                  {/* Live Clock with pulsing dot */}
                  <div className="flex items-center gap-1.5 text-xs font-bold font-mono text-sidebar-foreground">
                    <span className="relative flex size-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
                    </span>
                    <Clock className="size-3.5 text-emerald-400 shrink-0" />
                    <span className="tabular-nums tracking-wide">{formattedTime}</span>
                  </div>
                </div>

                {/* Vertical divider */}
                <div className="h-6 w-px bg-sidebar-border hidden md:block" />

                {/* Theme toggle */}
                <button
                  onClick={toggleTheme}
                  title={theme === "dark" ? "Switch to day mode" : "Switch to dark mode"}
                  className="rounded-xl p-2 text-sidebar-foreground/70 transition-all duration-300 hover:bg-cyan-500/10 hover:text-cyan-600 hover:scale-110 active:scale-95 cursor-pointer shadow-xs"
                >
                  {theme === "dark" ? (
                    <Sun className="size-4 transition-transform duration-500 hover:rotate-90" />
                  ) : (
                    <Moon className="size-4 transition-transform duration-500 hover:-rotate-45" />
                  )}
                </button>

                {/* Logout */}
                <button
                  onClick={logout}
                  title="Sign out"
                  className="rounded-xl p-2 text-sidebar-foreground/70 transition-all duration-300 hover:bg-red-500/15 hover:text-red-500 hover:scale-110 active:scale-95 cursor-pointer shadow-xs"
                >
                  <LogOut className="size-4 transition-transform duration-300 hover:translate-x-0.5" />
                </button>

                {/* User Profile Chip */}
                <div className="flex items-center gap-2 pl-1 sm:pl-1.5 border-l border-sidebar-border group/user">
                  <div className="size-8 rounded-full bg-gradient-to-br from-cyan-400 via-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-md shadow-cyan-500/25 ring-2 ring-background transition-transform duration-300 group-hover/user:scale-105">
                    {userInitials}
                  </div>
                  <div className="hidden md:flex flex-col text-left leading-none">
                    <span className="text-xs font-bold text-sidebar-foreground max-w-[110px] truncate group-hover/user:text-cyan-500 transition-colors">
                      {user?.name || "Admin"}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-cyan-500 tracking-wider mt-0.5">
                      {role || "User"}
                    </span>
                  </div>
                </div>
              </div>
            </header>
            <main className="flex-1 overflow-auto min-w-0 pt-20">
              <Outlet />
            </main>
          </div>
        </div>

        {/* First-time Onboarding Modal for Admin */}
        <BusinessOwnershipModal
          open={showOnboardingModal}
          onClose={() => setOnboardingDismissed(true)}
          canDismiss={true}
        />
      </SidebarProvider>
    </QueryClientProvider>
  );
}


