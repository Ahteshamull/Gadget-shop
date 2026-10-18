/**
 * Device Barcode & IMEI Scanner Helper
 * Handles IMEI extraction, QR code parsing, TAC (Type Allocation Code) model lookup,
 * and audio confirmation tone.
 */

export interface ParsedDeviceInfo {
  imei: string;
  brand?: string;
  model?: string;
  variant?: string;
  color?: string;
  ram?: string;
  storage?: string;
  rawText: string;
}

/**
 * Parses raw barcode or QR scan text into structured device specs.
 */
export function parseScannedCode(raw: string): ParsedDeviceInfo {
  const text = raw.trim();
  const info: ParsedDeviceInfo = {
    imei: "",
    rawText: text,
  };

  // 1. Try parsing JSON if present
  if (text.startsWith("{") && text.endsWith("}")) {
    try {
      const parsed = JSON.parse(text);
      if (parsed.imei) info.imei = cleanIMEI(String(parsed.imei));
      if (parsed.brand) info.brand = String(parsed.brand);
      if (parsed.model) info.model = String(parsed.model);
      if (parsed.color) info.color = String(parsed.color);
      if (parsed.ram) info.ram = String(parsed.ram);
      if (parsed.storage) info.storage = String(parsed.storage);
      if (parsed.variant) info.variant = String(parsed.variant);
      if (info.imei) return info;
    } catch {
      // Not valid JSON, continue with text parsing
    }
  }

  // 2. Look for standard labeled lines (e.g., "IMEI: 356789...", "IMEI1: 356789...")
  const imeiMatch = text.match(/(?:imei|imei1|sn|serial)[\s:=]+([0-9]{14,17})/i);
  if (imeiMatch && imeiMatch[1]) {
    info.imei = cleanIMEI(imeiMatch[1]);
  } else {
    // 3. Look for any continuous 15-digit number
    const standaloneMatch = text.match(/\b([0-9]{15})\b/);
    if (standaloneMatch && standaloneMatch[1]) {
      info.imei = standaloneMatch[1];
    } else {
      // 4. Try extracting only digits if length is close to 15
      const onlyDigits = text.replace(/[^0-9]/g, "");
      if (onlyDigits.length >= 14 && onlyDigits.length <= 17) {
        info.imei = onlyDigits.slice(0, 15);
      } else {
        info.imei = text; // fallback to raw string
      }
    }
  }

  // Check for model or brand clues in multi-line text
  const lines = text.split(/[\r\n;,]+/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (/iphone/i.test(trimmed)) {
      info.brand = "Apple";
      info.model = trimmed;
    } else if (/galaxy|samsung/i.test(trimmed)) {
      info.brand = "Samsung";
    } else if (/redmi|xiaomi/i.test(trimmed)) {
      info.brand = "Xiaomi";
    } else if (/pixel/i.test(trimmed)) {
      info.brand = "Google";
    }
  }

  return info;
}

function cleanIMEI(val: string): string {
  const digits = val.replace(/[^0-9]/g, "");
  return digits.length > 15 ? digits.slice(0, 15) : digits;
}

/**
 * Intelligent TAC (first 8 digits of IMEI) or exact IMEI lookup against existing shop inventory.
 * If the exact phone was in inventory before, or another phone with same TAC exists, auto-fill specs.
 */
export function lookupDeviceFromInventory(
  imei: string,
  stockHistory?: Array<{
    imei?: string;
    brand?: string;
    model?: string;
    variant?: string;
    color?: string;
    ram?: string;
    storage?: string;
  }>,
): Partial<ParsedDeviceInfo> | null {
  if (!imei || typeof imei !== "string") return null;
  const clean = imei.replace(/[^0-9]/g, "");
  if (clean.length < 8) return null;
  if (!Array.isArray(stockHistory) || stockHistory.length === 0) return null;

  // 1. First Priority: Exact base IMEI match from earlier inventory
  const baseImei = imei.trim().replace(/\s*\(\d+\)$/, "").trim();
  const exactMatch = stockHistory.find((item) => {
    const itemBase = (item?.imei || "").trim().replace(/\s*\(\d+\)$/, "").trim();
    return itemBase === baseImei;
  });

  if (exactMatch) {
    return {
      brand: exactMatch.brand || "",
      model: exactMatch.model || "",
      variant: exactMatch.variant || "",
      ram: exactMatch.ram || "",
      storage: exactMatch.storage || "",
      color: exactMatch.color || "",
    };
  }

  // 2. Second Priority: TAC (first 8 digits) model family match
  const tac = clean.slice(0, 8);
  const match = stockHistory.find((item) => {
    const itemDigits = (item?.imei || "").replace(/[^0-9]/g, "");
    return itemDigits.startsWith(tac);
  });

  if (match) {
    return {
      brand: match.brand || "",
      model: match.model || "",
      variant: match.variant || "",
      ram: match.ram || "",
      storage: match.storage || "",
    };
  }

  return null;
}

export interface ResolvedImeiInfo {
  baseImei: string;
  finalImei: string;
  isRepeated: boolean;
  repeatIndex: number;
}

/**
 * Checks whether an IMEI number already exists in inventory/history records.
 * If it does, safely suffixes (1), (2), etc. for re-stocking repeat phones.
 * If it is brand new, returns the clean base IMEI without any suffix.
 */
export function resolveNextAvailableImei(
  rawImei: string,
  existingImeis?: string[]
): ResolvedImeiInfo {
  const trimmed = typeof rawImei === "string" ? rawImei.trim() : "";
  if (!trimmed) {
    return { baseImei: "", finalImei: "", isRepeated: false, repeatIndex: 0 };
  }

  // Extract base IMEI without any trailing sequence (N)
  const baseImei = trimmed.replace(/\s*\(\d+\)$/, "").trim();
  const lowerBase = baseImei.toLowerCase();

  const list = Array.isArray(existingImeis) ? existingImeis : [];
  const existingSet = new Set(
    list.map((val) => (typeof val === "string" ? val.trim().toLowerCase() : "")).filter(Boolean)
  );

  // If base IMEI is not in the system, it's completely new
  if (!existingSet.has(lowerBase)) {
    return {
      baseImei,
      finalImei: baseImei,
      isRepeated: false,
      repeatIndex: 0,
    };
  }

  // It already exists! Find the lowest available sequence suffix (1), (2), etc.
  let counter = 1;
  while (existingSet.has(`${lowerBase} (${counter})`)) {
    counter++;
  }

  return {
    baseImei,
    finalImei: `${baseImei} (${counter})`,
    isRepeated: true,
    repeatIndex: counter,
  };
}

/**
 * Crisp synthesized audio tone using Web Audio API on successful barcode scan.
 */
export function playScanSuccessTone(): void {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    // First tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, ctx.currentTime);
    gain1.gain.setValueAtTime(0.2, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.1);

    // Second chime
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1320, ctx.currentTime + 0.08);
    gain2.gain.setValueAtTime(0.25, ctx.currentTime + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.08);
    osc2.stop(ctx.currentTime + 0.22);

    setTimeout(() => {
      ctx.close().catch(() => undefined);
    }, 400);
  } catch {
    // AudioContext blocked or not supported, ignore silently
  }
}
