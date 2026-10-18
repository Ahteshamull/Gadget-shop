import { BusinessProfileModel } from "../models/BusinessProfile.js";
import { UserModel } from "../models/User.js";
import { PartnerTransactionModel } from "../models/PartnerTransaction.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

const PROFILE_KEY = "default";

function serializeProfile(profile: {
  businessType?: "single" | "multiple";
  owners: Array<{ name: string; role: "Owner" | "Partner"; share: number }>;
  shopName?: string;
  shopTagline?: string;
  shopLogoUrl?: string;
  loginHeadline?: string;
  loginDescription?: string;
  loginFooterText?: string;
  loginBannerUrl?: string;
  shopAddress?: string;
  shopPhone?: string;
  shopEmail?: string;
  shopWebsite?: string;
  invoiceTitle?: string;
  invoiceTerms?: string[];
  invoiceFooterNote?: string;
  showWatermark?: boolean;
  showPaidStamp?: boolean;
  showBarcode?: boolean;
  showQrCode?: boolean;
  showSignatures?: boolean;
  showAmountInWords?: boolean;
  updatedAt?: Date | null;
}) {
  return {
    businessType: profile.businessType || (profile.owners.length > 1 ? "multiple" : "single"),
    owners: profile.owners,
    shopName: profile.shopName || "Phone Bazar",
    shopTagline: profile.shopTagline || "SALES CONSOLE",
    shopLogoUrl: profile.shopLogoUrl || "",
    loginHeadline: profile.loginHeadline || "Track every phone.\nOwn every customer.",
    loginDescription: profile.loginDescription || "Manage stock, sales, warranties, and customer history by IMEI.",
    loginFooterText: profile.loginFooterText || "PhoneTrack admin panel",
    loginBannerUrl: profile.loginBannerUrl || "",
    shopAddress: profile.shopAddress || "",
    shopPhone: profile.shopPhone || "",
    shopEmail: profile.shopEmail || "",
    shopWebsite: profile.shopWebsite || "",
    invoiceTitle: profile.invoiceTitle || "SALES INVOICE",
    invoiceTerms: profile.invoiceTerms || [
      "1 Year official warranty free of cost only for new devices.",
      "10 days instant replacement guarantee for hardware issues on pre-owned devices.",
      "Purchase product sell or exchange within 10 days: 25% will be reduced from recent price.",
      "Apple warranty may take around 6 to 12 weeks depending on customs & flights.",
      "Cosmetic dent, physical damage, liquid damage, electric shock, software bugs will not receive replacement or warranty.",
      "Two years service warranty without parts.",
      "No warranty if physical damage, display broken, bending, scratch, dent, burn, electric shock, liquid damage or root is found.",
      "Before leaving shop, kindly check product properly. Outside repair, scratch or waterproof issues will not be accepted.",
      "USA & CANADA region smartphones can experience blacklist or update delay. Warranty covers hardware only. No replacement for blacklisted issues.",
    ],
    invoiceFooterNote: profile.invoiceFooterNote || "",
    showWatermark: profile.showWatermark !== false,
    showPaidStamp: profile.showPaidStamp !== false,
    showBarcode: profile.showBarcode !== false,
    showQrCode: profile.showQrCode !== false,
    showSignatures: profile.showSignatures !== false,
    showAmountInWords: profile.showAmountInWords !== false,
    isConfigured: profile.owners.length > 0,
    updatedAt: profile.updatedAt ? profile.updatedAt.toISOString() : "",
  };
}

export const getBusinessProfile = asyncHandler(async (_req, res) => {
  let profile = await BusinessProfileModel.findOne({ key: PROFILE_KEY })
    .select("businessType owners shopName shopTagline shopLogoUrl loginHeadline loginDescription loginFooterText loginBannerUrl shopAddress shopPhone shopEmail shopWebsite invoiceTitle invoiceTerms invoiceFooterNote showWatermark showPaidStamp showBarcode showQrCode showSignatures showAmountInWords updatedAt")
    .lean();

  if (!profile || !profile.owners || profile.owners.length === 0) {
    const defaultOwner = await UserModel.findOne({
      role: { $in: ["owner", "admin"] },
      accessStatus: "active",
    }).sort({ createdAt: 1 });

    if (defaultOwner) {
      const created = await BusinessProfileModel.findOneAndUpdate(
        { key: PROFILE_KEY },
        {
          $set: {
            businessType: "single",
            owners: [{ name: defaultOwner.name, role: "Owner", share: 100 }],
            configuredBy: defaultOwner._id,
          },
        },
        { upsert: true, returnDocument: "after" },
      ).lean();
      if (created) {
        profile = created;
      }
    }
  }

  return sendSuccess(
    res,
    profile ? "Business owner setup loaded successfully" : "Business owner setup has not been configured yet",
    profile ? serializeProfile(profile) : { businessType: "single", owners: [], loginBannerUrl: "", isConfigured: false, updatedAt: "" },
  );
});

export const updateLoginBanner = asyncHandler(async (req, res) => {
  if (!req.user?.userId) {
    throw new AppError("Admin user context is missing from the access token", 401, "AUTH_CONTEXT_MISSING");
  }

  let finalBannerUrl = "";

  if (req.file) {
    const mimeType = req.file.mimetype || "image/jpeg";
    const base64Data = req.file.buffer.toString("base64");
    finalBannerUrl = `data:${mimeType};base64,${base64Data}`;
  } else if (typeof req.body?.bannerUrl === "string") {
    finalBannerUrl = req.body.bannerUrl.trim();
  }

  const profile = await BusinessProfileModel.findOneAndUpdate(
    { key: PROFILE_KEY },
    {
      $set: { loginBannerUrl: finalBannerUrl },
      $setOnInsert: {
        key: PROFILE_KEY,
        businessType: "single",
        owners: [],
        configuredBy: req.user.userId,
      },
    },
    { upsert: true, returnDocument: "after" },
  ).lean();

  return sendSuccess(
    res,
    finalBannerUrl ? "Login banner updated successfully." : "Login banner reset to default.",
    { loginBannerUrl: profile?.loginBannerUrl || "" },
  );
});

export const getLoginBanner = asyncHandler(async (_req, res) => {
  const profile = await BusinessProfileModel.findOne({ key: PROFILE_KEY })
    .select("shopName shopTagline shopLogoUrl loginHeadline loginDescription loginFooterText loginBannerUrl")
    .lean();

  return sendSuccess(res, "Login banner and branding fetched successfully.", {
    shopName: profile?.shopName || "Phone Bazar",
    shopTagline: profile?.shopTagline || "SALES CONSOLE",
    shopLogoUrl: profile?.shopLogoUrl || "",
    loginHeadline: profile?.loginHeadline || "Track every phone.\nOwn every customer.",
    loginDescription: profile?.loginDescription || "Manage stock, sales, warranties, and customer history by IMEI.",
    loginFooterText: profile?.loginFooterText || "PhoneTrack admin panel",
    loginBannerUrl: profile?.loginBannerUrl || "",
  });
});

export const upsertBusinessProfile = asyncHandler(async (req, res) => {
  if (!req.user?.userId) {
    throw new AppError("Admin user context is missing from the access token", 401, "AUTH_CONTEXT_MISSING");
  }

  const { businessType, owners } = req.body as {
    businessType?: "single" | "multiple";
    owners: Array<{ name: string; role: "Owner" | "Partner"; share: number }>;
  };

  const currentProfile = await BusinessProfileModel.findOne({ key: PROFILE_KEY }).lean();
  const existingPartnerNames = (currentProfile?.owners || []).map((o) => o.name.trim());
  const newPartnerNames = owners.map((o) => o.name.trim());

  // Detect removed partners and cascade delete their transactions
  const removedPartnerNames = existingPartnerNames.filter((name) => !newPartnerNames.includes(name));
  if (removedPartnerNames.length > 0) {
    await PartnerTransactionModel.deleteMany({
      partner: { $in: removedPartnerNames.map((name) => new RegExp(`^${name}$`, "i")) },
    });
  }

  const determinedType = businessType || (owners.length > 1 ? "multiple" : "single");

  const profile = await BusinessProfileModel.findOneAndUpdate(
    { key: PROFILE_KEY },
    {
      $set: {
        key: PROFILE_KEY,
        businessType: determinedType,
        owners,
        configuredBy: req.user.userId,
      },
    },
    { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true },
  );

  if (!profile) {
    throw new AppError("Business owner setup could not be saved", 500, "BUSINESS_PROFILE_SAVE_FAILED");
  }

  return sendSuccess(res, "Business owner setup saved successfully", serializeProfile(profile.toObject()));
});

export const updateBrandingProfile = asyncHandler(async (req, res) => {
  if (!req.user?.userId) {
    throw new AppError("Admin user context is missing from the access token", 401, "AUTH_CONTEXT_MISSING");
  }

  const {
    shopName,
    shopTagline,
    shopLogoUrl,
    loginHeadline,
    loginDescription,
    loginFooterText,
    loginBannerUrl,
  } = req.body;

  const updateSet: Record<string, unknown> = {};
  if (shopName !== undefined) updateSet.shopName = shopName.trim();
  if (shopTagline !== undefined) updateSet.shopTagline = shopTagline.trim();
  if (shopLogoUrl !== undefined) updateSet.shopLogoUrl = shopLogoUrl;
  if (loginHeadline !== undefined) updateSet.loginHeadline = loginHeadline.trim();
  if (loginDescription !== undefined) updateSet.loginDescription = loginDescription.trim();
  if (loginFooterText !== undefined) updateSet.loginFooterText = loginFooterText.trim();
  if (loginBannerUrl !== undefined) updateSet.loginBannerUrl = loginBannerUrl;

  const profile = await BusinessProfileModel.findOneAndUpdate(
    { key: PROFILE_KEY },
    {
      $set: updateSet,
      $setOnInsert: {
        key: PROFILE_KEY,
        businessType: "single",
        owners: [],
        configuredBy: req.user.userId,
      },
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  ).lean();

  return sendSuccess(
    res,
    "Shop branding and profile updated successfully.",
    profile ? serializeProfile(profile) : {},
  );
});

export const updateInvoiceSettings = asyncHandler(async (req, res) => {
  if (!req.user?.userId) {
    throw new AppError("Admin user context is missing from the access token", 401, "AUTH_CONTEXT_MISSING");
  }

  const {
    shopName,
    shopTagline,
    shopLogoUrl,
    shopAddress,
    shopPhone,
    shopEmail,
    shopWebsite,
    invoiceTitle,
    invoiceTerms,
    invoiceFooterNote,
    showWatermark,
    showPaidStamp,
    showBarcode,
    showQrCode,
    showSignatures,
    showAmountInWords,
  } = req.body;

  const updateSet: Record<string, unknown> = {};
  if (shopName !== undefined) updateSet.shopName = shopName.trim();
  if (shopTagline !== undefined) updateSet.shopTagline = shopTagline.trim();
  if (shopLogoUrl !== undefined) updateSet.shopLogoUrl = shopLogoUrl;
  if (shopAddress !== undefined) updateSet.shopAddress = shopAddress.trim();
  if (shopPhone !== undefined) updateSet.shopPhone = shopPhone.trim();
  if (shopEmail !== undefined) updateSet.shopEmail = shopEmail.trim();
  if (shopWebsite !== undefined) updateSet.shopWebsite = shopWebsite.trim();
  if (invoiceTitle !== undefined) updateSet.invoiceTitle = invoiceTitle.trim();
  if (invoiceTerms !== undefined && Array.isArray(invoiceTerms)) {
    updateSet.invoiceTerms = invoiceTerms.map((t: string) => t.trim()).filter(Boolean);
  }
  if (invoiceFooterNote !== undefined) updateSet.invoiceFooterNote = invoiceFooterNote.trim();
  if (showWatermark !== undefined) updateSet.showWatermark = Boolean(showWatermark);
  if (showPaidStamp !== undefined) updateSet.showPaidStamp = Boolean(showPaidStamp);
  if (showBarcode !== undefined) updateSet.showBarcode = Boolean(showBarcode);
  if (showQrCode !== undefined) updateSet.showQrCode = Boolean(showQrCode);
  if (showSignatures !== undefined) updateSet.showSignatures = Boolean(showSignatures);
  if (showAmountInWords !== undefined) updateSet.showAmountInWords = Boolean(showAmountInWords);

  const profile = await BusinessProfileModel.findOneAndUpdate(
    { key: PROFILE_KEY },
    {
      $set: updateSet,
      $setOnInsert: {
        key: PROFILE_KEY,
        businessType: "single",
        owners: [],
        configuredBy: req.user.userId,
      },
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  ).lean();

  return sendSuccess(
    res,
    "Invoice and memo settings updated successfully.",
    profile ? serializeProfile(profile) : {},
  );
});
