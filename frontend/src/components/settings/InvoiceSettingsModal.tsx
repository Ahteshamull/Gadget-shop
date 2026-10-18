import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  X,
  Upload,
  RefreshCw,
  Plus,
  Trash2,
  Check,
  Eye,
  Sliders,
  ShieldCheck,
  Building,
  Phone,
  Mail,
  MapPin,
  Globe,
  Receipt,
  QrCode,
  Barcode,
  Smartphone,
  Package,
  Info,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  updateInvoiceSettingsThunk,
  type InvoiceSettingsPayload,
} from "@/store/businessProfileSlice";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface InvoiceSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

// Helper to convert numbers to uppercase words in English for invoice
export function numberToWords(num: number): string {
  if (!num || isNaN(num)) return "ZERO TAKA ONLY";
  const a = [
    "",
    "ONE",
    "TWO",
    "THREE",
    "FOUR",
    "FIVE",
    "SIX",
    "SEVEN",
    "EIGHT",
    "NINE",
    "TEN",
    "ELEVEN",
    "TWELVE",
    "THIRTEEN",
    "FOURTEEN",
    "FIFTEEN",
    "SIXTEEN",
    "SEVENTEEN",
    "EIGHTEEN",
    "NINETEEN",
  ];
  const b = [
    "",
    "",
    "TWENTY",
    "THIRTY",
    "FORTY",
    "FIFTY",
    "SIXTY",
    "SEVENTY",
    "EIGHTY",
    "NINETY",
  ];

  const inWords = (n: number): string => {
    let str = "";
    if (n >= 10000000) {
      str += inWords(Math.floor(n / 10000000)) + " CRORE ";
      n %= 10000000;
    }
    if (n >= 100000) {
      str += inWords(Math.floor(n / 100000)) + " LAKH ";
      n %= 100000;
    }
    if (n >= 1000) {
      str += inWords(Math.floor(n / 1000)) + " THOUSAND ";
      n %= 1000;
    }
    if (n >= 100) {
      str += inWords(Math.floor(n / 100)) + " HUNDRED ";
      n %= 100;
    }
    if (n > 0) {
      if (str !== "") str += "AND ";
      if (n < 20) {
        str += a[n];
      } else {
        str += b[Math.floor(n / 10)];
        if (n % 10 > 0) str += " " + a[n % 10];
      }
    }
    return str.trim();
  };

  const words = inWords(Math.floor(num));
  return words ? `${words} TAKA ONLY` : "ZERO TAKA ONLY";
}

// Clean vector SVG barcode generator
export function SvgBarcode({ value }: { value: string }) {
  // Generate consistent bar widths based on hash of string
  const bars: number[] = [];
  for (let i = 0; i < 48; i++) {
    const charCode = value.charCodeAt(i % value.length) || 48;
    bars.push((charCode + i * 3) % 4 === 0 ? 3 : (charCode + i) % 2 === 0 ? 1 : 2);
  }

  let currentX = 0;
  return (
    <svg className="h-9 w-44" viewBox="0 0 160 36">
      {bars.map((width, idx) => {
        const x = currentX;
        currentX += width + 1.2;
        if (currentX > 158) return null;
        return (
          <rect
            key={idx}
            x={x}
            y="0"
            width={width}
            height="36"
            fill="#0f172a"
          />
        );
      })}
    </svg>
  );
}

// QR code removed as per user preference
export function SvgInvoiceQr(_props: { text?: string }) {
  return null;
}

// Paid stamp removed as per user preference (manual rubber seal used after print)
export function PaidStampSvg(_props: { shopName?: string }) {
  return null;
}

export function InvoiceSettingsModal({ open, onClose }: InvoiceSettingsModalProps) {
  const dispatch = useAppDispatch();
  const profile = useAppSelector((state) => state.businessProfile);
  const shopName = profile.shopName || "";
  const shopLogoUrl = profile.shopLogoUrl || "";
  const shopTagline = profile.shopTagline || "";
  const phoneSales = useAppSelector((state) => state.phoneSales.items);
  const gadgetSales = useAppSelector((state) => state.gadgets.sales);
  const gadgets = useAppSelector((state) => state.gadgets.gadgets);
  const saving = profile.invoiceSaving;

  const [activeTab, setActiveTab] = useState<"shop" | "layout" | "terms" | "preview">("shop");
  const [previewMode, setPreviewMode] = useState<"gadget" | "phone">("gadget");

  // Form State (Shop Name & Logo are synced from Setup Profile & Image)
  const [shopAddress, setShopAddress] = useState("");
  const [shopPhone, setShopPhone] = useState("");
  const [shopEmail, setShopEmail] = useState("");
  const [shopWebsite, setShopWebsite] = useState("");
  const [invoiceTitle, setInvoiceTitle] = useState("SALES INVOICE");
  const [invoiceTerms, setInvoiceTerms] = useState<string[]>([]);
  const [newTermInput, setNewTermInput] = useState("");
  const [invoiceFooterNote, setInvoiceFooterNote] = useState("");
  const [showWatermark, setShowWatermark] = useState(true);
  const [showBarcode, setShowBarcode] = useState(true);
  const [showQrCode, setShowQrCode] = useState(true);
  const [showSignatures, setShowSignatures] = useState(true);
  const [showAmountInWords, setShowAmountInWords] = useState(true);

  // Sync state when modal opens or profile changes
  useEffect(() => {
    if (open) {
      setShopAddress(profile.shopAddress || "");
      setShopPhone(profile.shopPhone || "");
      setShopEmail(profile.shopEmail || "");
      setShopWebsite(profile.shopWebsite || "");
      setInvoiceTitle(profile.invoiceTitle || "SALES INVOICE");
      setInvoiceTerms(
        profile.invoiceTerms && profile.invoiceTerms.length > 0
          ? profile.invoiceTerms
          : [
              "1 Year official warranty free of cost only for new devices.",
              "10 days instant replacement guarantee for hardware issues on pre-owned devices.",
              "Purchase product sell or exchange within 10 days: 25% will be reduced from recent price.",
              "Apple warranty may take around 6 to 12 weeks depending on customs & flights.",
              "Cosmetic dent, physical damage, liquid damage, electric shock, software bugs will not receive replacement or warranty.",
              "Two years service warranty without parts.",
              "No warranty if physical damage, display broken, bending, scratch, dent, burn, electric shock, liquid damage or root is found.",
              "Before leaving shop, kindly check product properly. Outside repair, scratch or waterproof issues will not be accepted.",
              "USA & CANADA region smartphones can experience blacklist or update delay. Warranty covers hardware only. No replacement for blacklisted issues.",
            ]
      );
      setInvoiceFooterNote(profile.invoiceFooterNote || "");
      setShowWatermark(profile.showWatermark !== false);
      setShowBarcode(profile.showBarcode !== false);
      setShowSignatures(profile.showSignatures !== false);
      setShowAmountInWords(profile.showAmountInWords !== false);
    }
  }, [open, profile]);

  if (!open) return null;

  // Add Term
  const handleAddTerm = () => {
    const trimmed = newTermInput.trim();
    if (!trimmed) return;
    setInvoiceTerms((prev) => [...prev, trimmed]);
    setNewTermInput("");
  };

  // Remove Term
  const handleRemoveTerm = (index: number) => {
    setInvoiceTerms((prev) => prev.filter((_, i) => i !== index));
  };

  // Reset to default terms
  const handleResetTerms = () => {
    setInvoiceTerms([
      "1 Year official warranty free of cost only for new devices.",
      "10 days instant replacement guarantee for hardware issues on pre-owned devices.",
      "Purchase product sell or exchange within 10 days: 25% will be reduced from recent price.",
      "Apple warranty may take around 6 to 12 weeks depending on customs & flights.",
      "Cosmetic dent, physical damage, liquid damage, electric shock, software bugs will not receive replacement or warranty.",
      "Two years service warranty without parts.",
      "No warranty if physical damage, display broken, bending, scratch, dent, burn, electric shock, liquid damage or root is found.",
      "Before leaving shop, kindly check product properly. Outside repair, scratch or waterproof issues will not be accepted.",
      "USA & CANADA region smartphones can experience blacklist or update delay. Warranty covers hardware only. No replacement for blacklisted issues.",
    ]);
    toast.info("Reset to default retail warranty terms");
  };

  // Save Settings
  const handleSave = async () => {
    const payload: InvoiceSettingsPayload = {
      shopName: profile.shopName || "",
      shopTagline: profile.shopTagline || "",
      shopLogoUrl: profile.shopLogoUrl || "",
      shopAddress: shopAddress.trim(),
      shopPhone: shopPhone.trim(),
      shopEmail: shopEmail.trim(),
      shopWebsite: shopWebsite.trim(),
      invoiceTitle: invoiceTitle.trim() || "SALES INVOICE",
      invoiceTerms: invoiceTerms.filter((t) => t.trim().length > 0),
      invoiceFooterNote: invoiceFooterNote.trim(),
      showWatermark,
      showPaidStamp: false,
      showBarcode,
      showQrCode: false,
      showSignatures,
      showAmountInWords,
    };

    try {
      await dispatch(updateInvoiceSettingsThunk(payload)).unwrap();
      onClose();
    } catch {
      // Error handled by thunk
    }
  };

  // Find real sales from store for preview
  const realPhoneSale = phoneSales.find((s) => s.customerName) || phoneSales[0] || null;
  const realGadgetSale = gadgetSales[gadgetSales.length - 1] || null;
  const sampleGadgetStock = gadgets[0] || null;

  const isGadgetMode = previewMode === "gadget";
  const previewItem = isGadgetMode
    ? {
        productName: realGadgetSale?.productName || sampleGadgetStock?.productName || "Airpods 2",
        description: sampleGadgetStock?.color ? `Color: ${sampleGadgetStock.color}` : "Original Smart Accessory & Gadget",
        code: realGadgetSale?.invoiceNumber || (sampleGadgetStock ? `GAD-${sampleGadgetStock.id.slice(-6).toUpperCase()}` : "GAD-001"),
        price: realGadgetSale ? realGadgetSale.sellingPrice : (sampleGadgetStock?.minSellingPrice || 1500),
        qty: realGadgetSale ? realGadgetSale.quantity : 1,
        discount: 0,
        total: realGadgetSale ? realGadgetSale.totalPrice : (sampleGadgetStock?.minSellingPrice || 1500),
        customerName: realGadgetSale?.customerName || "WALK-IN CUSTOMER",
        customerPhone: realGadgetSale?.customerPhone || "+8801700000000",
        customerAddress: "LOCAL CUSTOMER",
        paymentMethod: realGadgetSale?.paymentMethod || "Cash",
        warranty: realGadgetSale?.warrantyDays ? `${realGadgetSale.warrantyDays} Days Warranty` : "Standard Store Warranty",
      }
    : {
        productName: realPhoneSale ? `${realPhoneSale.brand} ${realPhoneSale.model}` : "iPhone 14",
        description: realPhoneSale
          ? [realPhoneSale.variant, realPhoneSale.color, realPhoneSale.ram, realPhoneSale.storage].filter(Boolean).join(" | ") || "Smart device"
          : "128 GB Used - LL/A",
        code: realPhoneSale?.imei ? `IMEI# ${realPhoneSale.imei}` : "IMEI# 358264146567599",
        price: realPhoneSale ? (realPhoneSale.finalPrice + (realPhoneSale.discount || 0)) : 47000,
        qty: realPhoneSale?.quantity || 1,
        discount: realPhoneSale?.discount || 0,
        total: realPhoneSale ? realPhoneSale.finalPrice : 47000,
        customerName: realPhoneSale?.customerName || "WALK-IN CUSTOMER",
        customerPhone: realPhoneSale?.customerPhone || "+8801700000000",
        customerAddress: realPhoneSale?.address || "LOCAL CUSTOMER",
        paymentMethod: realPhoneSale?.paymentMethod || "Cash",
        warranty: realPhoneSale?.warrantyExpiry
          ? `Until ${new Date(realPhoneSale.warrantyExpiry).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`
          : "Standard Store Warranty",
      };

  return (
    <div
      className="fixed inset-0 bg-black/65 z-50 flex items-center justify-center p-2.5 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="bg-card rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl border transition-all animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col m-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-col gap-3 p-4 border-b bg-muted/20 sm:flex-row sm:items-center sm:justify-between sm:p-5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <FileText className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                Invoice & Memo Setup
              </h3>
              <p className="text-xs text-muted-foreground">
                Customize shop details, logo, layout, and printed terms & conditions
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-muted rounded-lg transition-all cursor-pointer self-end sm:self-center"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-4 sm:px-6 pt-3 border-b bg-muted/10 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("shop")}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all border-b-2 flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === "shop"
                ? "border-primary text-primary bg-card"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Building className="size-3.5" /> Shop & Contact
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("layout")}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all border-b-2 flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === "layout"
                ? "border-primary text-primary bg-card"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sliders className="size-3.5" /> Layout & Badges
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("terms")}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all border-b-2 flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === "terms"
                ? "border-primary text-primary bg-card"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShieldCheck className="size-3.5" /> Terms & Conditions ({invoiceTerms.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all border-b-2 flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === "preview"
                ? "border-primary text-primary bg-card"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Eye className="size-3.5" /> Live Memo Preview
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: SHOP & CONTACT */}
          {activeTab === "shop" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Synced Shop Brand Info from Setup Profile */}
              <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-transparent p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  {profile.shopLogoUrl ? (
                    <div className="size-14 rounded-xl bg-white p-1 border border-slate-200 shadow-2xs flex items-center justify-center overflow-hidden shrink-0">
                      <img
                        src={profile.shopLogoUrl}
                        alt={profile.shopName}
                        className="size-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="size-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-xs">
                      {(profile.shopName || "PB").slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-cyan-800 dark:text-cyan-300 uppercase tracking-wider">
                      <Check className="size-3.5" /> Logo & Shop Name Synced from Setup Profile
                    </div>
                    <div className="text-lg font-black text-foreground truncate">
                      {profile.shopName || "Phone Bazar"}
                    </div>
                    {profile.shopTagline && (
                      <div className="text-xs text-muted-foreground font-medium truncate">
                        {profile.shopTagline}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-[11px] text-muted-foreground bg-background/60 p-2.5 rounded-xl border border-border/50 max-w-xs leading-snug">
                  Logo & shop name are automatically loaded into invoices from <strong>"Setup Profile & Image"</strong>.
                </div>
              </div>

              {/* Shop Invoice Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-1 block flex items-center gap-1.5">
                    <MapPin className="size-3 text-primary" /> Store Address
                  </label>
                  <input
                    type="text"
                    value={shopAddress}
                    onChange={(e) => setShopAddress(e.target.value)}
                    placeholder="Enter your store address..."
                    className="w-full px-3 py-2 rounded-xl border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-1 block flex items-center gap-1.5">
                    <Phone className="size-3 text-primary" /> Contact / Mobile Number(s)
                  </label>
                  <input
                    type="text"
                    value={shopPhone}
                    onChange={(e) => setShopPhone(e.target.value)}
                    placeholder="e.g. 01700000000, 01800000000"
                    className="w-full px-3 py-2 rounded-xl border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-1 block flex items-center gap-1.5">
                    <Mail className="size-3 text-primary" /> Official Email
                  </label>
                  <input
                    type="email"
                    value={shopEmail}
                    onChange={(e) => setShopEmail(e.target.value)}
                    placeholder="e.g. store@example.com"
                    className="w-full px-3 py-2 rounded-xl border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-1 block flex items-center gap-1.5">
                    <Globe className="size-3 text-primary" /> Website / Social Media (Optional)
                  </label>
                  <input
                    type="text"
                    value={shopWebsite}
                    onChange={(e) => setShopWebsite(e.target.value)}
                    placeholder="e.g. www.yourstore.com or facebook.com/yourstore"
                    className="w-full px-3 py-2 rounded-xl border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LAYOUT & BADGES */}
          {activeTab === "layout" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-1 block">
                    Invoice Heading Title
                  </label>
                  <input
                    type="text"
                    value={invoiceTitle}
                    onChange={(e) => setInvoiceTitle(e.target.value)}
                    placeholder="SALES INVOICE"
                    className="w-full px-3 py-2 rounded-xl border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-bold"
                  />
                  <span className="text-[11px] text-muted-foreground mt-1 block">
                    Displays in the center of the invoice (e.g. SALES INVOICE, CASH MEMO, RETAIL INVOICE)
                  </span>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-1 block">
                    Footer Copyright / Store Note
                  </label>
                  <input
                    type="text"
                    value={invoiceFooterNote}
                    onChange={(e) => setInvoiceFooterNote(e.target.value)}
                    placeholder={`e.g. ${shopName || "Store Name"} © ${new Date().getFullYear()}`}
                    className="w-full px-3 py-2 rounded-xl border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider border-b pb-1">
                  Visible Invoice Features
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center justify-between p-3 rounded-xl border bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-2">
                      <Barcode className="size-4 text-primary" /> Top Barcode Display
                    </span>
                    <input
                      type="checkbox"
                      checked={showBarcode}
                      onChange={(e) => setShowBarcode(e.target.checked)}
                      className="size-4 text-primary rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl border bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-2">
                      <Receipt className="size-4 text-primary" /> Amount in Words (TAKA ONLY)
                    </span>
                    <input
                      type="checkbox"
                      checked={showAmountInWords}
                      onChange={(e) => setShowAmountInWords(e.target.checked)}
                      className="size-4 text-primary rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl border bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors sm:col-span-2">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-2">
                      <Check className="size-4 text-primary" /> Signature Lines (Customer & Authorized)
                    </span>
                    <input
                      type="checkbox"
                      checked={showSignatures}
                      onChange={(e) => setShowSignatures(e.target.checked)}
                      className="size-4 text-primary rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TERMS & CONDITIONS */}
          {activeTab === "terms" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
                <div>
                  <h4 className="text-sm font-bold text-foreground">Terms & Conditions</h4>
                  <p className="text-xs text-muted-foreground">
                    These terms will be printed as bullet points on every sales memo
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetTerms}
                  className="text-xs gap-1 cursor-pointer"
                >
                  <RefreshCw className="size-3" /> Reset Standard Rules
                </Button>
              </div>

              {/* Add new term box */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTermInput}
                  onChange={(e) => setNewTermInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTerm();
                    }
                  }}
                  placeholder="Type a new warranty or sales condition..."
                  className="flex-1 px-3 py-2 rounded-xl border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <Button
                  type="button"
                  onClick={handleAddTerm}
                  className="gap-1.5 text-xs font-bold shrink-0 cursor-pointer"
                >
                  <Plus className="size-3.5" /> Add Condition
                </Button>
              </div>

              {/* Terms list */}
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {invoiceTerms.map((term, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between gap-3 p-2.5 rounded-xl border bg-muted/20 text-xs leading-relaxed group hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-start gap-2 flex-1">
                      <span className="font-bold text-primary shrink-0 mt-0.5">•</span>
                      <span className="text-foreground">{term}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveTerm(index)}
                      className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer p-1 shrink-0"
                      title="Delete rule"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: LIVE MEMO PREVIEW */}
          {activeTab === "preview" && (
            <div className="animate-in fade-in duration-200 space-y-3">
              {/* Preview Source Selector & Note */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-muted/40 rounded-xl border">
                <div className="flex items-center gap-2 text-xs">
                  <Eye className="size-4 text-primary shrink-0" />
                  <span className="font-bold text-foreground">Invoice Preview Mode:</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewMode("gadget")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      previewMode === "gadget"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-background text-muted-foreground hover:text-foreground border"
                    }`}
                  >
                    <Package className="size-3.5" />
                    Sell Gadget Info {realGadgetSale ? `(${realGadgetSale.productName})` : sampleGadgetStock ? `(${sampleGadgetStock.productName})` : "(Airpods 2)"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewMode("phone")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      previewMode === "phone"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-background text-muted-foreground hover:text-foreground border"
                    }`}
                  >
                    <Smartphone className="size-3.5" />
                    Sell Phone Info {realPhoneSale ? `(${realPhoneSale.model})` : "(iPhone 14)"}
                  </button>
                </div>
              </div>

              {/* Informative notice */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-[11px] text-cyan-900 dark:text-cyan-200">
                <Info className="size-3.5 shrink-0 text-cyan-600 dark:text-cyan-400" />
                <span>
                  When you sell an item in <strong>"Sell Gadget"</strong> or <strong>"Sell Phone"</strong>, the customer invoice is automatically generated with actual product details and pricing.
                </span>
              </div>

              {/* Simulated Paper Invoice Container */}
              <div className="bg-white text-slate-900 rounded-xl border border-slate-300 shadow-md p-4 sm:p-8 font-sans max-w-[760px] mx-auto text-xs leading-normal overflow-hidden">
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4 border-b border-slate-200 pb-4">
                  {/* Shop Info on left (from Setup Profile) */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {profile.shopLogoUrl ? (
                      <div className="size-14 rounded-lg bg-white p-1 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                        <img
                          src={profile.shopLogoUrl}
                          alt={profile.shopName}
                          className="size-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="size-12 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-base shrink-0 shadow-2xs">
                        {(profile.shopName || "PB").slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h2 className="text-base font-black uppercase tracking-tight text-slate-900">
                        {profile.shopName || "Phone Bazar"}
                      </h2>
                      {profile.shopTagline && (
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                          {profile.shopTagline}
                        </div>
                      )}
                      {(shopAddress || profile.shopAddress) && (
                        <div className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                          {shopAddress || profile.shopAddress}
                        </div>
                      )}
                      {(shopPhone || profile.shopPhone) && (
                        <div className="text-[11px] text-slate-700 mt-0.5 font-semibold">
                          Mobile: {shopPhone || profile.shopPhone}
                        </div>
                      )}
                      {(shopEmail || profile.shopEmail) && (
                        <div className="text-[11px] text-slate-600">
                          Email: {shopEmail || profile.shopEmail}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Top Right Barcode & Invoice Meta */}
                  <div className="text-right shrink-0">
                    {showBarcode && (
                      <div className="flex justify-end mb-1">
                        <SvgBarcode value={previewItem.code} />
                      </div>
                    )}
                    <div className="text-[10px] space-y-0.5 text-slate-600 font-mono">
                      <div>Invoice N°: <span className="font-bold text-slate-900">{previewItem.code}</span></div>
                      <div>InvSL: <span className="font-bold">#614</span></div>
                      <div>User: Admin</div>
                      <div>Date: {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</div>
                    </div>
                  </div>
                </div>

                {/* Title */}
                <div className="py-3 text-center">
                  <h3 className="text-sm font-black tracking-wider uppercase text-slate-800">
                    {invoiceTitle || "SALES INVOICE"}
                  </h3>
                </div>

                {/* Customer Section */}
                <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-200 text-[11px]">
                  <div>
                    <span className="font-bold uppercase text-slate-500 text-[10px]">Customer:</span>
                    <div className="font-extrabold text-slate-900 text-xs mt-0.5 uppercase">{previewItem.customerName}</div>
                    <div className="text-slate-600">Contact: {previewItem.customerPhone}</div>
                    <div className="text-slate-600">Client ID: CU/SEL/{isGadgetMode ? "GAD" : "PHN"}</div>
                  </div>
                  <div>
                    <span className="font-bold uppercase text-slate-500 text-[10px]">Address / Payment:</span>
                    <div className="text-slate-800 font-medium mt-0.5 uppercase">{previewItem.customerAddress}</div>
                    <div className="text-slate-600 mt-0.5">Payment: <span className="font-semibold text-slate-800">{previewItem.paymentMethod}</span></div>
                  </div>
                </div>

                {/* Products Table (Dynamic based on Sell Gadget or Sell Phone) */}
                <div className="overflow-x-auto w-full my-3">
                  <table className="w-full min-w-[500px] sm:min-w-0 text-[11px] border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-400 text-slate-700 font-bold text-[10px] uppercase">
                        <th className="py-1 text-left w-8">N°</th>
                        <th className="py-1 text-left">Description(Code)</th>
                        <th className="py-1 text-right w-20">Price</th>
                        <th className="py-1 text-center w-14">Qty</th>
                        <th className="py-1 text-right w-12">Dis</th>
                        <th className="py-1 text-right w-20">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="py-2 align-top font-semibold">1</td>
                        <td className="py-2">
                          <div className="font-bold text-slate-900 text-xs">
                            {previewItem.productName}
                          </div>
                          <div className="text-[10px] font-mono text-slate-600 mt-0.5">
                            {previewItem.code}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {previewItem.description}
                          </div>
                          {previewItem.warranty && (
                            <div className="text-[9.5px] text-slate-500 mt-0.5">
                              Warranty: {previewItem.warranty}
                            </div>
                          )}
                        </td>
                        <td className="py-2 text-right font-mono text-slate-700">
                          {new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(previewItem.price)}
                        </td>
                        <td className="py-2 text-center font-medium">
                          {previewItem.qty.toFixed(2)} Pcs
                        </td>
                        <td className="py-2 text-right font-mono text-slate-600">
                          {previewItem.discount > 0
                            ? new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(previewItem.discount)
                            : "0.00"}
                        </td>
                        <td className="py-2 text-right font-mono font-bold text-slate-900">
                          {new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(previewItem.total)}
                        </td>
                      </tr>
                      <tr className="h-6 border-b border-slate-100"><td colSpan={6} /></tr>
                    </tbody>
                  </table>
                </div>

                {/* Sub Total Section */}
                <div className="flex items-start justify-between border-t-2 border-slate-400 pt-2">
                  <div className="flex-1 pr-4">
                    {showAmountInWords && (
                      <div className="text-[11px] font-bold uppercase text-slate-800">
                        Amount in words: <span className="font-extrabold">{numberToWords(previewItem.total)}</span>
                      </div>
                    )}
                  </div>

                  <div className="w-44 space-y-1 text-right text-[11px] shrink-0">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Sub Total:</span>
                      <span className="font-mono font-bold">
                        {new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(previewItem.price * previewItem.qty)}
                      </span>
                    </div>
                    {previewItem.discount > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Discount:</span>
                        <span className="font-mono font-bold">
                          - {new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(previewItem.discount)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-600">Gross Total:</span>
                      <span className="font-mono font-bold">
                        {new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(previewItem.total)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-slate-300 pt-1 font-bold text-slate-900">
                      <span>Paid Amount:</span>
                      <span className="font-mono">
                        {new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(previewItem.total)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Outstanding:</span>
                      <span className="font-mono">0.00</span>
                    </div>
                  </div>
                </div>

                {/* Terms & Conditions Box */}
                {invoiceTerms.length > 0 && (
                  <div className="mt-4 pt-2 border-t border-slate-200">
                    <div className="font-extrabold text-[10px] uppercase text-slate-800 mb-1">
                      Terms & Conditions:
                    </div>
                    <ul className="space-y-0.5 text-[9.5px] text-slate-600 leading-tight">
                      {invoiceTerms.map((term, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="font-bold text-slate-800">•</span>
                          <span>{term}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Signatures */}
                {showSignatures && (
                  <div className="mt-8 pt-4 flex items-end justify-between gap-4">
                    <div className="w-36 text-center border-t border-slate-500 pt-1 text-[10px] font-semibold text-slate-700">
                      Customer Signature
                    </div>

                    <div className="w-36 text-center border-t border-slate-500 pt-1 text-[10px] font-semibold text-slate-700">
                      Authorized Signature
                    </div>
                  </div>
                )}

                {/* Footer copyright */}
                <div className="mt-6 pt-2 text-center text-[9px] text-slate-500 font-mono tracking-wider border-t border-slate-100">
                  {invoiceFooterNote || (shopName ? `${shopName.toUpperCase()} © ${new Date().getFullYear()}` : `STORE © ${new Date().getFullYear()}`)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-5 border-t bg-muted/10 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-full px-5 cursor-pointer"
          >
            Close
          </Button>

          <Button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="rounded-full px-6 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:via-blue-500 hover:to-indigo-500 text-white font-bold gap-2 cursor-pointer shadow-md"
          >
            {saving ? (
              <>
                <RefreshCw className="size-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Check className="size-4" /> Save Invoice Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
