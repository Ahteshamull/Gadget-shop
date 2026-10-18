import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { Image as ImageIcon, Upload, Link as LinkIcon, RefreshCw, X, Sparkles, Check } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import { updateLoginBannerThunk } from "@/store/businessProfileSlice";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface BannerSettingsModalProps {
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

export function BannerSettingsModal({ open, onClose }: BannerSettingsModalProps) {
  const dispatch = useAppDispatch();
  const currentBanner = useAppSelector((state) => state.businessProfile.loginBannerUrl);
  const bannerSaving = useAppSelector((state) => state.businessProfile.bannerSaving);

  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [urlInput, setUrlInput] = useState<string>("");
  const [inputMode, setInputMode] = useState<"upload" | "url">("upload");
  const [imgLoadError, setImgLoadError] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setPreviewUrl(currentBanner || "");
      setUrlInput(currentBanner || "");
      setImgLoadError(false);
    }
  }, [open, currentBanner]);

  if (!open) return null;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Disallow non-image file extensions explicitly
    const isDisallowed = /\.(exe|bat|sh|msi|zip|rar|tar|7z|pdf|docx?|xlsx?|txt|mp4|mov|mp3|avi)$/i.test(file.name);
    if (isDisallowed) {
      toast.error("Please select a valid image file");
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      toast.error("Image file size cannot exceed 25MB");
      return;
    }

    setImgLoadError(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      let dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      // Fix MIME if browser provided generic or empty MIME
      if (dataUrl.startsWith("data:application/octet-stream;") || dataUrl.startsWith("data:;")) {
        const mime = getEffectiveMimeType(file);
        dataUrl = dataUrl.replace(/^data:[^;]*;/, `data:${mime};`);
      }

      // Try quick canvas optimization
      const testImg = new Image();
      testImg.onload = () => {
        try {
          if (testImg.width > 0 && testImg.height > 0) {
            let width = testImg.width;
            let height = testImg.height;
            const maxWidth = 1600;
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(testImg, 0, 0, width, height);
              const outputMime = file.name.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
              const optimized = canvas.toDataURL(outputMime, 0.85);
              if (optimized && optimized.length > 100) {
                setPreviewUrl(optimized);
                return;
              }
            }
          }
        } catch {
          // ignore canvas errors
        }
        setPreviewUrl(dataUrl);
      };
      testImg.onerror = () => {
        setPreviewUrl(dataUrl);
      };
      testImg.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) {
      toast.error("Please enter an image URL");
      return;
    }
    setPreviewUrl(urlInput.trim());
  };

  const handleSave = async () => {
    await dispatch(updateLoginBannerThunk(previewUrl)).unwrap();
    onClose();
  };

  const activeCustomBanner = previewUrl || currentBanner || "";

  return (
    <>
      <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-50 transition-opacity" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pointer-events-none">
        <div
          className="bg-card w-full max-w-2xl max-h-[92vh] rounded-2xl shadow-2xl border border-border overflow-y-auto flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b bg-muted/25 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold shadow-xs">
                <ImageIcon className="size-5" />
              </div>
              <div>
                <h2 className="font-bold text-base text-foreground">Login Banner Settings</h2>
                <p className="text-xs text-muted-foreground">
                  Customize and manage the login screen brand banner image
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="size-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Mode selection tabs */}
            <div className="flex gap-2 p-1 bg-muted/40 rounded-xl border">
              <button
                type="button"
                onClick={() => setInputMode("upload")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  inputMode === "upload"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Upload className="size-3.5" />
                Upload from Computer
              </button>
              <button
                type="button"
                onClick={() => setInputMode("url")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  inputMode === "url"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LinkIcon className="size-3.5" />
                Image URL
              </button>
            </div>

            {/* Input area */}
            {inputMode === "upload" ? (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,.jpg,.jpeg,.png,.webp,.svg,.gif,.avif,.bmp,.jfif"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-border hover:border-primary/50 bg-muted/10 hover:bg-muted/20 rounded-xl p-6 flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer"
                >
                  <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Upload className="size-6" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-foreground">Click to select an image</span>
                    <p className="text-xs text-muted-foreground mt-0.5">Supported formats: PNG, JPG, JPEG, WEBP, SVG (Max 10MB)</p>
                  </div>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Direct Image URL</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="flex-1 h-10 px-3 text-sm rounded-lg bg-background border border-input focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground"
                  />
                  <Button type="button" variant="secondary" onClick={handleApplyUrl} className="shrink-0">
                    Preview
                  </Button>
                </div>
              </div>
            )}

            {/* Live Preview Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Login Screen Live Preview</span>
                {previewUrl ? (
                  <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Check className="size-3" /> Custom banner selected
                  </span>
                ) : currentBanner ? (
                  <span className="text-[11px] font-medium text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
                    <Check className="size-3" /> Current custom banner active
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-muted-foreground">Default brand background active</span>
                )}
              </div>

              <div className="relative h-56 rounded-xl overflow-hidden border border-border shadow-inner bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 flex flex-col justify-between p-5 text-white">
                {/* Subtle ambient glows */}
                <div className="absolute -top-16 -left-16 size-48 rounded-full bg-cyan-500/15 blur-2xl pointer-events-none" />
                <div className="absolute -bottom-16 -right-16 size-48 rounded-full bg-blue-600/15 blur-2xl pointer-events-none" />

                {activeCustomBanner && !imgLoadError ? (
                  <>
                    <img
                      src={activeCustomBanner}
                      alt=""
                      onError={() => setImgLoadError(true)}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-950/40" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/40" />
                  </>
                ) : null}

                {/* Simulated Login Brand Overlay */}
                <div className="relative z-10 flex items-center gap-2">
                  <div className="size-7 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center">
                    <Sparkles className="size-3.5 text-white" />
                  </div>
                  <div className="text-xs font-bold text-white tracking-wide">PhoneTrack</div>
                </div>

                <div className="relative z-10">
                  <h4 className="text-base font-bold text-white leading-tight">
                    Smart IMEI Lifecycle & Retail Console
                  </h4>
                  <p className="text-xs text-white/70 mt-1 line-clamp-1">
                    Manage sales, gadgets, dividends and warranty in real-time.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t bg-muted/20 flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={bannerSaving}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={bannerSaving}
              className="flex items-center gap-1.5"
            >
              {bannerSaving && <RefreshCw className="size-3.5 animate-spin" />}
              Save Banner
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
