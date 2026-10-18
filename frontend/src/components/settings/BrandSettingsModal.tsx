import { useState, useEffect, useRef, type ChangeEvent } from "react";
import {
  Store,
  Image as ImageIcon,
  Upload,
  RefreshCw,
  X,
  Check,
  Smartphone,
  Type,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import { updateBrandingProfileThunk } from "@/store/businessProfileSlice";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface BrandSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

function getEffectiveMimeType(file: File): string {
  if (file.type && file.type.startsWith("image/")) {
    return file.type;
  }
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  switch (ext) {
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "svg":
      return "image/svg+xml";
    case "gif":
      return "image/gif";
    case "avif":
      return "image/avif";
    case "bmp":
      return "image/bmp";
    case "ico":
      return "image/x-icon";
    case "jpg":
    case "jpeg":
    case "jfif":
    default:
      return "image/jpeg";
  }
}

function compressImage(file: File, maxWidth = 1600, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const mime = getEffectiveMimeType(file);
    const typedBlob = file.type === mime ? file : file.slice(0, file.size, mime);

    if (mime === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(typedBlob);
      return;
    }

    const objectUrl = URL.createObjectURL(typedBlob);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(typedBlob);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const outputMime = mime === "image/png" ? "image/png" : "image/jpeg";
      const dataUrl = canvas.toDataURL(outputMime, quality);
      resolve(dataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(typedBlob);
    };

    img.src = objectUrl;
  });
}

export function BrandSettingsModal({ open, onClose }: BrandSettingsModalProps) {
  const dispatch = useAppDispatch();
  const profile = useAppSelector((state) => state.businessProfile);
  const saving = profile.brandingSaving;

  const [activeTab, setActiveTab] = useState<"identity" | "texts" | "banner">("identity");
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  // Form states
  const [shopName, setShopName] = useState("");
  const [shopTagline, setShopTagline] = useState("");
  const [shopLogoUrl, setShopLogoUrl] = useState("");
  const [loginHeadline, setLoginHeadline] = useState("");
  const [loginDescription, setLoginDescription] = useState("");
  const [loginFooterText, setLoginFooterText] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setShopName(profile.shopName || "Phone Bazar");
      setShopTagline(profile.shopTagline || "SALES CONSOLE");
      setShopLogoUrl(profile.shopLogoUrl || "");
      setLoginHeadline(profile.loginHeadline || "Track every phone.\nOwn every customer.");
      setLoginDescription(
        profile.loginDescription ||
          "Manage stock, sales, warranties, and customer history by IMEI.",
      );
      setLoginFooterText(profile.loginFooterText || "PhoneTrack admin panel");
      setBannerUrl(profile.loginBannerUrl || "");
    }
  }, [open, profile]);

  if (!open) return null;

  const handleLogoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && !/\.(jpe?g|png|webp|svg|gif|avif)$/i.test(file.name)) {
      toast.error("Please select a valid image file (PNG, JPG, WEBP, SVG)");
      return;
    }

    try {
      const compressed = await compressImage(file, 400, 0.9);
      setShopLogoUrl(compressed);
      toast.success("Logo image loaded successfully");
    } catch {
      toast.error("Failed to process logo image");
    }
  };

  const handleBannerUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && !/\.(jpe?g|png|webp|svg|gif|avif)$/i.test(file.name)) {
      toast.error("Please select a valid image file");
      return;
    }

    try {
      const compressed = await compressImage(file, 1600, 0.85);
      setBannerUrl(compressed);
      toast.success("Banner image loaded successfully");
    } catch {
      toast.error("Failed to process banner image");
    }
  };

  const handleSave = async () => {
    try {
      await dispatch(
        updateBrandingProfileThunk({
          shopName: shopName.trim() || "Phone Bazar",
          shopTagline: shopTagline.trim() || "SALES CONSOLE",
          shopLogoUrl,
          loginHeadline: loginHeadline.trim() || "Track every phone.\nOwn every customer.",
          loginDescription:
            loginDescription.trim() ||
            "Manage stock, sales, warranties, and customer history by IMEI.",
          loginFooterText: loginFooterText.trim() || "PhoneTrack admin panel",
          loginBannerUrl: bannerUrl,
        }),
      ).unwrap();
      onClose();
    } catch (err: unknown) {
      // Handled in thunk with toast
    }
  };

  const handleResetDefaults = () => {
    setShopName("Phone Bazar");
    setShopTagline("SALES CONSOLE");
    setShopLogoUrl("");
    setLoginHeadline("Track every phone.\nOwn every customer.");
    setLoginDescription("Manage stock, sales, warranties, and customer history by IMEI.");
    setLoginFooterText("PhoneTrack admin panel");
    setBannerUrl("");
    toast.info("Reset to default info. Click 'Save Changes' to apply.");
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-sm z-50 transition-opacity"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 pointer-events-none">
        <div className="bg-card text-card-foreground border border-border w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95dvh] pointer-events-auto animate-in fade-in-50 zoom-in-95 duration-200">
          {/* Header */}
          <div className="px-3.5 sm:px-6 py-3 sm:py-4 border-b border-border/60 flex items-center justify-between bg-muted/20 shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2">
              <div className="size-8 sm:size-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-cyan-500/20 shrink-0">
                <Store className="size-4 sm:size-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm sm:text-base md:text-lg text-foreground flex items-center gap-1.5 truncate">
                  <span>Shop Profile & Branding</span>
                  <span className="hidden sm:inline-block text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 shrink-0">
                    Live Sync
                  </span>
                </h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                  Configure shop name, logo, taglines and login banner text
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setShowMobilePreview(!showMobilePreview)}
                className="lg:hidden p-1.5 rounded-lg text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 transition text-xs font-semibold flex items-center gap-1 cursor-pointer"
                title="Toggle live preview"
              >
                {showMobilePreview ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                <span className="text-[11px] hidden sm:inline">{showMobilePreview ? "Form" : "Preview"}</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition cursor-pointer"
              >
                <X className="size-4 sm:size-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs (Fully horizontally scrollable on mobile) */}
          <div className="flex items-center gap-1 border-b border-border/60 px-3 sm:px-6 bg-muted/10 overflow-x-auto scrollbar-none whitespace-nowrap shrink-0">
            <button
              type="button"
              onClick={() => {
                setActiveTab("identity");
                setShowMobilePreview(false);
              }}
              className={`py-2.5 sm:py-3 px-2.5 sm:px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === "identity" && !showMobilePreview
                  ? "border-cyan-500 text-cyan-600 dark:text-cyan-400"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Store className="size-3.5" />
              <span>1. Identity & Logo</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("texts");
                setShowMobilePreview(false);
              }}
              className={`py-2.5 sm:py-3 px-2.5 sm:px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === "texts" && !showMobilePreview
                  ? "border-cyan-500 text-cyan-600 dark:text-cyan-400"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Type className="size-3.5" />
              <span>2. Banner Texts</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("banner");
                setShowMobilePreview(false);
              }}
              className={`py-2.5 sm:py-3 px-2.5 sm:px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === "banner" && !showMobilePreview
                  ? "border-cyan-500 text-cyan-600 dark:text-cyan-400"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <ImageIcon className="size-3.5" />
              <span>3. Background Banner</span>
            </button>
          </div>

          {/* Body Content with Responsive Grid */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 md:p-6 grid lg:grid-cols-12 gap-5 sm:gap-6">
            {/* Form Section (shown if not in mobile-only preview mode) */}
            <div className={`space-y-4 ${showMobilePreview ? "hidden lg:block" : "block"} lg:col-span-7`}>
              {activeTab === "identity" && (
                <div className="space-y-3.5 animate-in fade-in-50 duration-200">
                  <div className="p-3 sm:p-3.5 rounded-xl bg-muted/30 border border-border/60">
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      Shop / Business Name *
                    </label>
                    <input
                      type="text"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      placeholder="e.g. Phone Bazar"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1">
                      Displayed in the sidebar header and login screen.
                    </p>
                  </div>

                  <div className="p-3 sm:p-3.5 rounded-xl bg-muted/30 border border-border/60">
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      Subtitle / Tagline
                    </label>
                    <input
                      type="text"
                      value={shopTagline}
                      onChange={(e) => setShopTagline(e.target.value)}
                      placeholder="e.g. SALES CONSOLE or Retail Module"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1">
                      Shown below the shop name as an uppercase subtitle.
                    </p>
                  </div>

                  <div className="p-3 sm:p-3.5 rounded-xl bg-muted/30 border border-border/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-foreground">
                        Shop Logo
                      </label>
                      {shopLogoUrl && (
                        <button
                          type="button"
                          onClick={() => setShopLogoUrl("")}
                          className="text-[11px] text-destructive hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="size-3" /> Remove Logo
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                      <div className="size-14 sm:size-16 rounded-2xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-background shrink-0 shadow-inner">
                        {shopLogoUrl ? (
                          <img
                            src={shopLogoUrl}
                            alt="Logo preview"
                            className="size-full object-contain p-1"
                          />
                        ) : (
                          <div className="size-full rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white">
                            <Smartphone className="size-6 sm:size-7" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-1.5">
                        <input
                          type="file"
                          ref={logoInputRef}
                          onChange={handleLogoUpload}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => logoInputRef.current?.click()}
                          className="w-full sm:w-auto px-3.5 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                        >
                          <Upload className="size-3.5" />
                          {shopLogoUrl ? "Change Logo Image" : "Upload Logo (PNG/JPG/SVG)"}
                        </button>
                        <p className="text-[10px] sm:text-[11px] text-muted-foreground">
                          A square PNG or SVG with transparent background works best.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "texts" && (
                <div className="space-y-3.5 animate-in fade-in-50 duration-200">
                  <div className="p-3 sm:p-3.5 rounded-xl bg-muted/30 border border-border/60">
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      Login Headline *
                    </label>
                    <textarea
                      rows={2}
                      value={loginHeadline}
                      onChange={(e) => setLoginHeadline(e.target.value)}
                      placeholder="e.g. Track every phone.&#10;Own every customer."
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none font-medium"
                    />
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1">
                      Displayed as large headline on the login banner. Press Enter for new line.
                    </p>
                  </div>

                  <div className="p-3 sm:p-3.5 rounded-xl bg-muted/30 border border-border/60">
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      Login Description *
                    </label>
                    <textarea
                      rows={3}
                      value={loginDescription}
                      onChange={(e) => setLoginDescription(e.target.value)}
                      placeholder="e.g. Manage stock, sales, warranties, and customer history by IMEI."
                      className="w-full px-3 py-2 text-xs rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    />
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1">
                      Displayed right below the headline on the login banner.
                    </p>
                  </div>

                  <div className="p-3 sm:p-3.5 rounded-xl bg-muted/30 border border-border/60">
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      Login Footer Text
                    </label>
                    <input
                      type="text"
                      value={loginFooterText}
                      onChange={(e) => setLoginFooterText(e.target.value)}
                      placeholder="e.g. PhoneTrack Admin Console"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1">
                      Small footer text displayed at the bottom of the login banner.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "banner" && (
                <div className="space-y-3.5 animate-in fade-in-50 duration-200">
                  <div className="p-3 sm:p-3.5 rounded-xl bg-muted/30 border border-border/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-foreground">
                        Banner Background Image
                      </label>
                      {bannerUrl && (
                        <button
                          type="button"
                          onClick={() => setBannerUrl("")}
                          className="text-[11px] text-destructive hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="size-3" /> Reset to Default Glow
                        </button>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      <input
                        type="file"
                        ref={bannerInputRef}
                        onChange={handleBannerUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => bannerInputRef.current?.click()}
                        className="w-full py-3 rounded-xl border-2 border-dashed border-cyan-500/40 hover:border-cyan-500 bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Upload className="size-4" />
                        {bannerUrl ? "Change Banner Image" : "Upload Banner Image (JPG/PNG/WEBP)"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Live Visual Preview Section (responsive: full width when toggled or on desktop) */}
            <div className={`flex flex-col ${showMobilePreview ? "block lg:block" : "hidden lg:flex"} lg:col-span-5`}>
              <div className="flex items-center justify-between text-xs font-bold text-foreground mb-2">
                <div className="flex items-center gap-1.5">
                  <Eye className="size-3.5 text-cyan-500" />
                  <span>Live Preview:</span>
                </div>
                {showMobilePreview && (
                  <button
                    type="button"
                    onClick={() => setShowMobilePreview(false)}
                    className="lg:hidden text-[11px] text-cyan-600 dark:text-cyan-400 underline font-semibold"
                  >
                    Back to Form
                  </button>
                )}
              </div>

              {/* Preview Card Mockup */}
              <div className="flex-1 min-h-[240px] sm:min-h-[280px] lg:min-h-[320px] rounded-2xl overflow-hidden relative border border-white/10 bg-slate-950 text-white p-4 sm:p-5 flex flex-col justify-between shadow-xl">
                {/* Background glow or custom banner */}
                {bannerUrl ? (
                  <>
                    <img
                      src={bannerUrl}
                      alt="Banner preview"
                      className="absolute inset-0 size-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-950/50" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/55" />
                  </>
                ) : (
                  <>
                    <div className="absolute -top-20 -left-20 size-48 rounded-full bg-cyan-500/20 blur-2xl pointer-events-none" />
                    <div className="absolute -bottom-20 -right-20 size-48 rounded-full bg-blue-600/20 blur-2xl pointer-events-none" />
                  </>
                )}

                {/* Top preview: Logo & Shop Name */}
                <div className="relative z-10 flex items-center gap-3">
                  {shopLogoUrl ? (
                    <div className="size-10 sm:size-11 rounded-xl bg-white shadow-md ring-1 ring-white/30 p-1 flex items-center justify-center overflow-hidden shrink-0">
                      <img src={shopLogoUrl} alt="" className="size-full object-contain object-center" />
                    </div>
                  ) : (
                    <div className="size-8 sm:size-9 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center overflow-hidden shrink-0 border border-white/20">
                      <Smartphone className="size-4 text-cyan-300" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-bold text-xs sm:text-sm leading-tight truncate text-white">
                      {shopName || "Phone Bazar"}
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-cyan-300/80 font-semibold tracking-wide truncate uppercase">
                      {shopTagline || "SALES CONSOLE"}
                    </div>
                  </div>
                </div>

                {/* Middle preview: Headline & Description */}
                <div className="relative z-10 py-3 sm:py-4">
                  <h4 className="text-base sm:text-lg lg:text-xl font-extrabold leading-tight whitespace-pre-line text-white">
                    {loginHeadline || "Track every phone.\nOwn every customer."}
                  </h4>
                  <p className="mt-1.5 sm:mt-2 text-[11px] sm:text-xs text-white/80 leading-relaxed max-w-xs line-clamp-3">
                    {loginDescription ||
                      "Manage stock, sales, warranties, and customer history by IMEI."}
                  </p>
                </div>

                {/* Bottom preview: Footer text */}
                <div className="relative z-10 text-[9px] sm:text-[10px] text-white/60 truncate">
                  {loginFooterText || "PhoneTrack admin panel"}
                </div>
              </div>

              {/* Sidebar Header Preview Box */}
              <div className="mt-3 p-2.5 sm:p-3 rounded-xl border border-border bg-card shadow-xs">
                <div className="text-[9px] sm:text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1.5">
                  Sidebar Header Preview:
                </div>
                <div className="flex items-center gap-2.5 sm:gap-3 p-2 rounded-xl bg-sidebar border border-sidebar-border shadow-xs">
                  {shopLogoUrl ? (
                    <div className="size-8 sm:size-9 rounded-xl bg-white p-0.5 shadow-xs ring-1 ring-black/10 flex items-center justify-center overflow-hidden shrink-0 dark:bg-white">
                      <img src={shopLogoUrl} alt="" className="size-full object-contain object-center" />
                    </div>
                  ) : (
                    <div className="size-7 sm:size-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white overflow-hidden shrink-0">
                      <Smartphone className="size-3.5 sm:size-4" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-sidebar-foreground truncate">
                      {shopName || "Phone Bazar"}
                    </div>
                    <div className="text-[8px] sm:text-[9px] font-bold text-cyan-500 tracking-wider uppercase truncate">
                      {shopTagline || "SALES CONSOLE"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions (Mobile responsive wrap) */}
          <div className="px-3.5 sm:px-6 py-3 border-t border-border/60 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 bg-muted/20 shrink-0">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-xs text-muted-foreground hover:text-foreground font-semibold flex items-center justify-center sm:justify-start gap-1.5 transition cursor-pointer py-1 sm:py-0"
            >
              <RefreshCw className="size-3.5" /> Reset to Default
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button type="button" variant="outline" size="sm" onClick={onClose} className="flex-1 sm:flex-none">
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 sm:flex-none font-bold gap-1.5 cursor-pointer"
              >
                {saving ? (
                  <>
                    <RefreshCw className="size-3.5 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Check className="size-3.5" /> Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
