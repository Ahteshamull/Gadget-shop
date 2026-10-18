import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import {
  Camera,
  X,
  RefreshCw,
  Zap,
  ZapOff,
  CheckCircle2,
  AlertCircle,
  ScanLine,
} from "lucide-react";
import { playScanSuccessTone } from "@/lib/device-scanner-helper";

interface BarcodeScannerModalProps {
  open: boolean;
  onClose: () => void;
  onScan: (decodedText: string) => void;
  title?: string;
}

export function BarcodeScannerModal({
  open,
  onClose,
  onScan,
  title = "Scan Device Barcode / IMEI",
}: BarcodeScannerModalProps) {
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [manualInput, setManualInput] = useState("");

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isStoppingRef = useRef(false);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current && isScanning && !isStoppingRef.current) {
      isStoppingRef.current = true;
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch {
        // Ignore errors during stop
      } finally {
        scannerRef.current = null;
        setIsScanning(false);
        isStoppingRef.current = false;
      }
    }
  }, [isScanning]);

  const handleSuccessfulScan = useCallback(
    async (decodedText: string) => {
      playScanSuccessTone();
      await stopScanner();
      onScan(decodedText);
      onClose();
    },
    [stopScanner, onScan, onClose],
  );

  const startScanner = useCallback(
    async (cameraId?: string) => {
      setErrorMsg(null);
      const readerElement = document.getElementById("barcode-reader-viewport");
      if (!readerElement) return;

      try {
        // If already running, stop first
        if (scannerRef.current) {
          try {
            await scannerRef.current.stop();
            await scannerRef.current.clear();
          } catch {
            // ignore
          }
          scannerRef.current = null;
        }

        const formatsToSupport = [
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.DATA_MATRIX,
          Html5QrcodeSupportedFormats.ITF,
        ];

        const html5QrCode = new Html5Qrcode("barcode-reader-viewport", {
          formatsToSupport,
          verbose: false,
        });
        scannerRef.current = html5QrCode;

        const cameraConfig = cameraId
          ? { deviceId: { exact: cameraId } }
          : { facingMode: "environment" };

        await html5QrCode.start(
          cameraConfig,
          {
            fps: 20,
            qrbox: { width: 280, height: 180 },
            aspectRatio: 1.333,
          },
          (decodedText) => {
            handleSuccessfulScan(decodedText);
          },
          () => {
            // Ignore scan attempt frame misses
          },
        );

        setIsScanning(true);

        // Check torch capabilities
        try {
          const capabilities = html5QrCode.getRunningTrackCapabilities();
          if (capabilities && "torch" in capabilities) {
            setTorchSupported(true);
          } else {
            setTorchSupported(false);
          }
        } catch {
          setTorchSupported(false);
        }
      } catch (err: unknown) {
        console.error("Camera scanner error:", err);
        const errString = err instanceof Error ? err.message : String(err);
        if (errString.includes("NotAllowedError") || errString.includes("Permission")) {
          setErrorMsg(
            "Camera permission denied. Please allow camera access in your browser settings.",
          );
        } else if (
          errString.includes("NotFoundError") ||
          errString.includes("DevicesNotFoundError")
        ) {
          setErrorMsg("No camera device found on this system.");
        } else {
          setErrorMsg(
            "Unable to start camera. Please try again or enter IMEI manually.",
          );
        }
        setIsScanning(false);
      }
    },
    [handleSuccessfulScan],
  );

  useEffect(() => {
    if (!open) {
      stopScanner();
      return;
    }

    let isMounted = true;

    // Detect cameras
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!isMounted) return;
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back/environment camera
          const backCam = devices.find(
            (d) =>
              d.label.toLowerCase().includes("back") ||
              d.label.toLowerCase().includes("rear") ||
              d.label.toLowerCase().includes("environment"),
          );
          const chosenId = backCam ? backCam.id : devices[0].id;
          setSelectedCameraId(chosenId);
          startScanner(chosenId);
        } else {
          startScanner();
        }
      })
      .catch(() => {
        if (isMounted) startScanner();
      });

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, [open, startScanner, stopScanner]);

  const toggleTorch = async () => {
    if (!scannerRef.current || !torchSupported) return;
    try {
      const nextTorch = !torchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextTorch } as MediaTrackConstraintSet],
      });
      setTorchOn(nextTorch);
    } catch {
      setTorchSupported(false);
    }
  };

  const handleSwitchCamera = async (newCameraId: string) => {
    setSelectedCameraId(newCameraId);
    await startScanner(newCameraId);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      handleSuccessfulScan(manualInput.trim());
    }
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md z-[60] transition-opacity"
      />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 pointer-events-none sm:p-4">
        <div
          className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="px-5 py-3.5 border-b bg-muted/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-full bg-gradient-to-tr from-[#8b5cf6] to-[#6366f1] flex items-center justify-center text-white shadow-sm">
                <ScanLine className="size-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-foreground">{title}</h3>
                <p className="text-[11px] text-muted-foreground">
                  Point camera at the device barcode or QR code
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {torchSupported && isScanning && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  className={`size-8 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                    torchOn
                      ? "bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/20"
                      : "bg-background text-muted-foreground hover:text-foreground border-border"
                  }`}
                  title={torchOn ? "Turn off flash" : "Turn on flash"}
                >
                  {torchOn ? <Zap className="size-4 fill-white" /> : <ZapOff className="size-4" />}
                </button>
              )}

              {cameras.length > 1 && (
                <select
                  value={selectedCameraId}
                  onChange={(e) => handleSwitchCamera(e.target.value)}
                  className="h-8 max-w-[110px] text-xs rounded-lg border border-border bg-background px-2 text-foreground font-medium outline-none cursor-pointer"
                  title="Switch camera"
                >
                  {cameras.map((c, i) => (
                    <option key={c.id} value={c.id}>
                      {c.label || `Camera ${i + 1}`}
                    </option>
                  ))}
                </select>
              )}

              <button
                type="button"
                onClick={() => {
                  stopScanner();
                  onClose();
                }}
                className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer"
                title="Close"
              >
                <X className="size-4.5" />
              </button>
            </div>
          </div>

          {/* Scanner Viewport Box */}
          <div className="relative bg-black flex flex-col items-center justify-center min-h-[300px] overflow-hidden">
            {/* Native html5-qrcode element */}
            <div id="barcode-reader-viewport" className="w-full h-full max-h-[360px]" />

            {/* Custom Overlay Scanning HUD (when active) */}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                {/* Aim Box */}
                <div className="relative w-[280px] h-[170px] rounded-xl border-2 border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.25)]">
                  {/* Glowing corners */}
                  <div className="absolute -top-1 -left-1 size-5 border-t-3 border-l-3 border-cyan-400 rounded-tl" />
                  <div className="absolute -top-1 -right-1 size-5 border-t-3 border-r-3 border-cyan-400 rounded-tr" />
                  <div className="absolute -bottom-1 -left-1 size-5 border-b-3 border-l-3 border-cyan-400 rounded-bl" />
                  <div className="absolute -bottom-1 -right-1 size-5 border-b-3 border-r-3 border-cyan-400 rounded-br" />

                  {/* Laser scanning beam line */}
                  <div className="absolute left-1 right-1 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_8px_#ef4444] animate-[scanLaser_2.2s_ease-in-out_infinite]" />
                </div>

                <div className="mt-3 px-3 py-1 rounded-full bg-black/65 backdrop-blur-sm text-[11px] font-semibold text-cyan-300 border border-cyan-500/20 shadow-sm flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                  Align barcode inside frame
                </div>
              </div>
            )}

            {/* Error or Permission Denied Alert */}
            {errorMsg && (
              <div className="absolute inset-0 bg-background/95 backdrop-blur-sm p-6 flex flex-col items-center justify-center text-center">
                <div className="size-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-3">
                  <AlertCircle className="size-6" />
                </div>
                <h4 className="font-bold text-foreground text-sm">Unable to access camera</h4>
                <p className="text-xs text-muted-foreground mt-1.5 max-w-xs">{errorMsg}</p>
                <button
                  type="button"
                  onClick={() => startScanner(selectedCameraId)}
                  className="mt-4 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center gap-1.5 hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-sm"
                >
                  <RefreshCw className="size-3.5" /> Try Again
                </button>
              </div>
            )}
          </div>

          {/* Manual Input Fallback Footer */}
          <div className="p-4 border-t bg-card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <form onSubmit={handleManualSubmit} className="flex items-center gap-2 w-full">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Or type/paste IMEI directly..."
                className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <button
                type="submit"
                disabled={!manualInput.trim()}
                className="px-5 py-2 rounded-full bg-gradient-to-r from-[#8b5cf6] via-[#7c3aed] to-[#6366f1] text-white text-xs font-bold border border-white/20 shadow-sm shadow-purple-500/20 hover:shadow-md hover:shadow-purple-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
              >
                Confirm
              </button>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scanLaser {
          0% { top: 8%; opacity: 0.2; }
          50% { top: 88%; opacity: 1; }
          100% { top: 8%; opacity: 0.2; }
        }
      `}</style>
    </>
  );
}
