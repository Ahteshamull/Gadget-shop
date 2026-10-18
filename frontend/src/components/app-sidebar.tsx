import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  Handshake,
  Image as ImageIcon,
  LayoutDashboard,
  Package,
  PackagePlus,
  Shield,
  Smartphone,
  UserCog,
  Users,
  Sliders,
  Receipt,
  X,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAppSelector } from "../store";
import { BrandSettingsModal } from "./settings/BrandSettingsModal";
import { InvoiceSettingsModal } from "./settings/InvoiceSettingsModal";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Add Stock", url: "/sales", icon: PackagePlus },
  { title: "All Phone Stock", url: "/all-stocks", icon: Package },
];

const manageItems = [
  { title: "All Gadget Stock", url: "/gadget", icon: PackagePlus },
  { title: "Customers", url: "/customers", icon: Users },
  { title: "Warranty", url: "/warranty", icon: Shield },
  { title: "Partner", url: "/partner", icon: Handshake },
];

const userItems = [
  { title: "User Management", url: "/user-management", icon: UserCog },
];

type SidebarItem = {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
};

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const role = useAppSelector((state) => state.auth.user?.role);
  const shopName = useAppSelector((state) => state.businessProfile.shopName);
  const shopTagline = useAppSelector((state) => state.businessProfile.shopTagline);
  const shopLogoUrl = useAppSelector((state) => state.businessProfile.shopLogoUrl);

  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (p: string) => path === p || (p !== "/dashboard" && path.startsWith(p));
  const isPrivileged = role === "owner" || role === "admin";
  const visibleMainItems = role === "staff" ? mainItems.filter((item) => item.url !== "/sales") : mainItems;
  const visibleManageItems =
    role === "staff"
      ? manageItems.filter((item) => item.url === "/gadget")
      : manageItems;
  const visibleUserItems = isPrivileged ? userItems : [];

  const menuButtonClass =
    "h-10 rounded-xl px-3 text-sidebar-foreground/75 transition-all duration-300 hover:translate-x-1 hover:bg-gradient-to-r hover:from-cyan-500/15 hover:via-blue-500/10 hover:to-transparent hover:text-cyan-600 dark:hover:text-cyan-300 data-[active=true]:bg-gradient-to-r data-[active=true]:from-cyan-500/20 data-[active=true]:via-blue-500/15 data-[active=true]:to-transparent data-[active=true]:text-cyan-600 dark:data-[active=true]:text-cyan-300 data-[active=true]:shadow-[inset_3px_0_0_0_rgba(6,182,212,1)] dark:data-[active=true]:shadow-[inset_3px_0_0_0_rgba(34,211,238,1)] group-data-[collapsible=icon]:!mx-auto group-data-[collapsible=icon]:!size-9 group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!px-0";
  const iconClass = "size-4 text-cyan-700/75 transition-transform duration-300 group-hover:scale-110 dark:text-cyan-200/80 group-data-[collapsible=icon]:mx-auto";
  const labelClass = "font-medium group-data-[collapsible=icon]:hidden";

  const renderGroup = (label: string, items: SidebarItem[], topPadding = false) => {
    if (items.length === 0) {
      return null;
    }

    return (
      <SidebarGroup className={`px-0 ${topPadding ? "pt-3" : ""}`}>
        <SidebarGroupLabel className="h-7 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-800/45 dark:text-cyan-100/45 group-data-[collapsible=icon]:hidden">
          {label}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu className="gap-1.5">
            {items.map((item) => (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive(item.url)}
                  tooltip={item.title}
                  className={menuButtonClass}
                >
                  <Link
                    to={item.url}
                    onClick={() => {
                      if (isMobile) setOpenMobile(false);
                    }}
                  >
                    <item.icon className={iconClass} />
                    <span className={labelClass}>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  return (
    <>
      <Sidebar collapsible="icon" variant="floating" className="border-none bg-transparent">
        <SidebarHeader className="border-b border-sidebar-border px-2 py-3 group-data-[collapsible=icon]:px-1.5 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-500/[0.08] via-blue-500/[0.05] to-transparent px-2.5 py-2 ring-1 ring-cyan-700/15 hover:ring-cyan-500/30 transition-all duration-300 dark:bg-white/[0.035] dark:ring-white/5 flex-1 min-w-0 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-xl group-data-[collapsible=icon]:p-0">
              {shopLogoUrl ? (
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-xs ring-1 ring-black/10 transition-transform duration-300 hover:scale-105 dark:bg-white dark:ring-white/20 group-data-[collapsible=icon]:size-8.5">
                  <img src={shopLogoUrl} alt="Logo" className="size-full object-contain object-center" />
                </div>
              ) : (
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-md shadow-cyan-950/20 group-data-[collapsible=icon]:size-8 overflow-hidden hover:scale-105 transition-transform duration-300">
                  <Smartphone className="size-4 text-white" />
                </div>
              )}
              {!collapsed && (
                <div className="min-w-0">
                  <div className="truncate text-base font-bold tracking-wide text-sidebar-foreground">
                    {shopName || "Phone Bazar"}
                  </div>
                  <div className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-700/70 dark:text-cyan-300/70">
                    {shopTagline || "SALES CONSOLE"}
                  </div>
                </div>
              )}
            </div>

            {isMobile && (
              <button
                type="button"
                onClick={() => setOpenMobile(false)}
                className="size-9 rounded-xl flex items-center justify-center text-sidebar-foreground/70 hover:bg-cyan-500/10 hover:text-cyan-600 hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
                title="Close sidebar"
              >
                <X className="size-4.5" />
              </button>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent className="gap-1 px-2 py-3 group-data-[collapsible=icon]:px-1.5 flex-1 min-h-0 overflow-y-auto overscroll-contain">
          {renderGroup("Manage Phones", visibleMainItems)}
          {renderGroup("Manage Gadgets", visibleManageItems, true)}
          {renderGroup("Manage User", visibleUserItems, true)}

          {/* Setup Profile and Image & Invoice / Memo Setup right under MANAGE USER */}
          {isPrivileged && (
            <SidebarGroup className="px-0 pt-0.5">
              <SidebarGroupContent>
                <SidebarMenu className="gap-1.5">
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => {
                        if (isMobile) setOpenMobile(false);
                        setBrandModalOpen(true);
                      }}
                      tooltip="Setup Profile & Image"
                      className="h-10 rounded-xl px-3 text-sidebar-foreground/75 transition-all duration-300 hover:translate-x-1 hover:bg-gradient-to-r hover:from-cyan-500/15 hover:via-blue-500/10 hover:to-transparent hover:text-cyan-600 dark:hover:text-cyan-300 group-data-[collapsible=icon]:!mx-auto group-data-[collapsible=icon]:!size-9 group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!px-0 cursor-pointer group/brand"
                    >
                      <Sliders className="size-4 text-cyan-700/75 transition-transform duration-300 group-hover/brand:rotate-45 dark:text-cyan-200/80 group-data-[collapsible=icon]:mx-auto" />
                      <span className={labelClass}>Setup Profile & Image</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => {
                        if (isMobile) setOpenMobile(false);
                        setInvoiceModalOpen(true);
                      }}
                      tooltip="Invoice / Memo Setup"
                      className="h-10 rounded-xl px-3 text-sidebar-foreground/75 transition-all duration-300 hover:translate-x-1 hover:bg-gradient-to-r hover:from-cyan-500/15 hover:via-blue-500/10 hover:to-transparent hover:text-cyan-600 dark:hover:text-cyan-300 group-data-[collapsible=icon]:!mx-auto group-data-[collapsible=icon]:!size-9 group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!px-0 cursor-pointer group/invoice"
                    >
                      <Receipt className="size-4 text-cyan-700/75 transition-transform duration-300 group-hover/invoice:scale-110 dark:text-cyan-200/80 group-data-[collapsible=icon]:mx-auto" />
                      <span className={labelClass}>Invoice / Memo Setup</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border px-2 py-3 group-data-[collapsible=icon]:px-1.5 space-y-2 shrink-0 pb-safe pb-4">
          {!collapsed && (
            <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-transparent px-3 py-2 text-[10px] font-medium text-cyan-800/65 ring-1 ring-cyan-700/10 dark:bg-cyan-400/10 dark:text-cyan-100/65 dark:ring-cyan-300/10">
              <span className="truncate max-w-[120px]">{shopName || "PhoneTrack"}</span>
              <span className="font-semibold text-cyan-700 dark:text-cyan-300 shrink-0">v1.0 - Console</span>
            </div>
          )}
        </SidebarFooter>
      </Sidebar>

      <BrandSettingsModal open={brandModalOpen} onClose={() => setBrandModalOpen(false)} />
      <InvoiceSettingsModal open={invoiceModalOpen} onClose={() => setInvoiceModalOpen(false)} />
    </>
  );
}

