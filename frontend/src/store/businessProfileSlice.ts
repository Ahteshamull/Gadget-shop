import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { toast } from "sonner";
import api from "./api";
import { apiErrorMessage, type ApiDataResponse } from "./apiTypes";

export type BusinessOwnerRole = "Owner" | "Partner";
export type BusinessType = "single" | "multiple";

export type BusinessOwner = {
  name: string;
  role: BusinessOwnerRole;
  share: number;
};

export type BusinessProfile = {
  businessType: BusinessType;
  owners: BusinessOwner[];
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
  isConfigured: boolean;
  updatedAt: string;
};

export type BrandingUpdatePayload = {
  shopName?: string;
  shopTagline?: string;
  shopLogoUrl?: string;
  loginHeadline?: string;
  loginDescription?: string;
  loginFooterText?: string;
  loginBannerUrl?: string;
};

export type InvoiceSettingsPayload = {
  shopName?: string;
  shopTagline?: string;
  shopLogoUrl?: string;
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
};

type BusinessProfileState = BusinessProfile & {
  loading: boolean;
  saving: boolean;
  bannerSaving: boolean;
  brandingSaving: boolean;
  invoiceSaving: boolean;
  error: string | null;
};

const defaultInvoiceTerms = [
  "1 Year official warranty free of cost only for new devices.",
  "10 days instant replacement guarantee for hardware issues on pre-owned devices.",
  "Purchase product sell or exchange within 10 days: 25% will be reduced from recent price.",
  "Apple warranty may take around 6 to 12 weeks depending on customs & flights.",
  "Cosmetic dent, physical damage, liquid damage, electric shock, software bugs will not receive replacement or warranty.",
  "Two years service warranty without parts.",
  "No warranty if physical damage, display broken, bending, scratch, dent, burn, electric shock, liquid damage or root is found.",
  "Before leaving shop, kindly check product properly. Outside repair, scratch or waterproof issues will not be accepted.",
  "USA & CANADA region smartphones can experience blacklist or update delay. Warranty covers hardware only. No replacement for blacklisted issues.",
];

const initialState: BusinessProfileState = {
  businessType: "single",
  owners: [],
  shopName: "Gadgets",
  shopTagline: "SALES CONSOLE",
  shopLogoUrl: "",
  loginHeadline: "Track every phone.\nOwn every customer.",
  loginDescription: "Manage stock, sales, warranties, and customer history by IMEI.",
  loginFooterText: "PhoneTrack admin panel",
  loginBannerUrl: "",
  shopAddress: "",
  shopPhone: "",
  shopEmail: "",
  shopWebsite: "",
  invoiceTitle: "SALES INVOICE",
  invoiceTerms: defaultInvoiceTerms,
  invoiceFooterNote: "",
  showWatermark: true,
  showPaidStamp: true,
  showBarcode: true,
  showQrCode: true,
  showSignatures: true,
  showAmountInWords: true,
  isConfigured: false,
  updatedAt: "",
  loading: false,
  saving: false,
  bannerSaving: false,
  brandingSaving: false,
  invoiceSaving: false,
  error: null,
};

export const fetchBusinessProfile = createAsyncThunk(
  "businessProfile/fetchBusinessProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiDataResponse<BusinessProfile>>("/business-profile");
      return response.data.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorMessage(error, "Failed to load business owner setup"));
    }
  },
);

export const saveBusinessProfile = createAsyncThunk(
  "businessProfile/saveBusinessProfile",
  async (
    payload: { businessType: BusinessType; owners: BusinessOwner[] } | BusinessOwner[],
    { rejectWithValue },
  ) => {
    try {
      const body = Array.isArray(payload)
        ? { businessType: payload.length > 1 ? "multiple" : "single", owners: payload }
        : payload;
      const response = await api.put<ApiDataResponse<BusinessProfile>>("/business-profile", body);
      toast.success(response.data.message || "Business owner setup saved successfully");
      return response.data.data;
    } catch (error: unknown) {
      const message = apiErrorMessage(error, "Failed to save business owner setup");
      toast.error(message);
      return rejectWithValue(message);
    }
  },
);

export const updateLoginBannerThunk = createAsyncThunk(
  "businessProfile/updateLoginBanner",
  async (bannerUrl: string, { rejectWithValue }) => {
    try {
      const response = await api.post<ApiDataResponse<{ loginBannerUrl: string }>>(
        "/business-profile/update-banner",
        { bannerUrl },
      );
      toast.success(response.data.message || "Banner updated successfully");
      return response.data.data.loginBannerUrl;
    } catch (error: unknown) {
      const message = apiErrorMessage(error, "Failed to update banner");
      toast.error(message);
      return rejectWithValue(message);
    }
  },
);

export const updateBrandingProfileThunk = createAsyncThunk(
  "businessProfile/updateBrandingProfile",
  async (payload: BrandingUpdatePayload, { rejectWithValue }) => {
    try {
      const response = await api.put<ApiDataResponse<BusinessProfile>>(
        "/business-profile/update-branding",
        payload,
      );
      toast.success(response.data.message || "Shop profile and branding updated successfully");
      return response.data.data;
    } catch (error: unknown) {
      const message = apiErrorMessage(error, "Failed to update branding profile");
      toast.error(message);
      return rejectWithValue(message);
    }
  },
);

export const updateInvoiceSettingsThunk = createAsyncThunk(
  "businessProfile/updateInvoiceSettings",
  async (payload: InvoiceSettingsPayload, { rejectWithValue }) => {
    try {
      const response = await api.put<ApiDataResponse<BusinessProfile>>(
        "/business-profile/update-invoice-settings",
        payload,
      );
      toast.success(response.data.message || "Invoice and memo settings updated successfully");
      return response.data.data;
    } catch (error: unknown) {
      const message = apiErrorMessage(error, "Failed to update invoice settings");
      toast.error(message);
      return rejectWithValue(message);
    }
  },
);

const businessProfileSlice = createSlice({
  name: "businessProfile",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBusinessProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBusinessProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.businessType =
          action.payload.businessType || (action.payload.owners.length > 1 ? "multiple" : "single");
        state.owners = action.payload.owners;
        state.shopName = action.payload.shopName || state.shopName;
        state.shopTagline = action.payload.shopTagline || state.shopTagline;
        state.shopLogoUrl = action.payload.shopLogoUrl ?? state.shopLogoUrl;
        state.loginHeadline = action.payload.loginHeadline || state.loginHeadline;
        state.loginDescription = action.payload.loginDescription || state.loginDescription;
        state.loginFooterText = action.payload.loginFooterText || state.loginFooterText;
        state.loginBannerUrl = action.payload.loginBannerUrl || "";
        state.shopAddress = action.payload.shopAddress ?? state.shopAddress;
        state.shopPhone = action.payload.shopPhone ?? state.shopPhone;
        state.shopEmail = action.payload.shopEmail ?? state.shopEmail;
        state.shopWebsite = action.payload.shopWebsite ?? state.shopWebsite;
        state.invoiceTitle = action.payload.invoiceTitle || state.invoiceTitle;
        state.invoiceTerms = action.payload.invoiceTerms || state.invoiceTerms;
        state.invoiceFooterNote = action.payload.invoiceFooterNote ?? state.invoiceFooterNote;
        state.showWatermark = action.payload.showWatermark ?? state.showWatermark;
        state.showPaidStamp = action.payload.showPaidStamp ?? state.showPaidStamp;
        state.showBarcode = action.payload.showBarcode ?? state.showBarcode;
        state.showQrCode = action.payload.showQrCode ?? state.showQrCode;
        state.showSignatures = action.payload.showSignatures ?? state.showSignatures;
        state.showAmountInWords = action.payload.showAmountInWords ?? state.showAmountInWords;
        state.isConfigured = action.payload.isConfigured;
        state.updatedAt = action.payload.updatedAt;
      })
      .addCase(fetchBusinessProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(saveBusinessProfile.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(saveBusinessProfile.fulfilled, (state, action) => {
        state.saving = false;
        state.businessType =
          action.payload.businessType || (action.payload.owners.length > 1 ? "multiple" : "single");
        state.owners = action.payload.owners;
        state.shopName = action.payload.shopName || state.shopName;
        state.shopTagline = action.payload.shopTagline || state.shopTagline;
        state.shopLogoUrl = action.payload.shopLogoUrl ?? state.shopLogoUrl;
        state.loginHeadline = action.payload.loginHeadline || state.loginHeadline;
        state.loginDescription = action.payload.loginDescription || state.loginDescription;
        state.loginFooterText = action.payload.loginFooterText || state.loginFooterText;
        state.loginBannerUrl = action.payload.loginBannerUrl || state.loginBannerUrl;
        state.isConfigured = action.payload.isConfigured;
        state.updatedAt = action.payload.updatedAt;
      })
      .addCase(saveBusinessProfile.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload as string;
      })
      .addCase(updateLoginBannerThunk.pending, (state) => {
        state.bannerSaving = true;
      })
      .addCase(updateLoginBannerThunk.fulfilled, (state, action) => {
        state.bannerSaving = false;
        state.loginBannerUrl = action.payload;
      })
      .addCase(updateLoginBannerThunk.rejected, (state) => {
        state.bannerSaving = false;
      })
      .addCase(updateBrandingProfileThunk.pending, (state) => {
        state.brandingSaving = true;
        state.error = null;
      })
      .addCase(updateBrandingProfileThunk.fulfilled, (state, action) => {
        state.brandingSaving = false;
        state.shopName = action.payload.shopName || state.shopName;
        state.shopTagline = action.payload.shopTagline || state.shopTagline;
        state.shopLogoUrl = action.payload.shopLogoUrl ?? state.shopLogoUrl;
        state.loginHeadline = action.payload.loginHeadline || state.loginHeadline;
        state.loginDescription = action.payload.loginDescription || state.loginDescription;
        state.loginFooterText = action.payload.loginFooterText || state.loginFooterText;
        state.loginBannerUrl = action.payload.loginBannerUrl || state.loginBannerUrl;
        state.updatedAt = action.payload.updatedAt;
      })
      .addCase(updateBrandingProfileThunk.rejected, (state, action) => {
        state.brandingSaving = false;
        state.error = action.payload as string;
      })
      .addCase(updateInvoiceSettingsThunk.pending, (state) => {
        state.invoiceSaving = true;
        state.error = null;
      })
      .addCase(updateInvoiceSettingsThunk.fulfilled, (state, action) => {
        state.invoiceSaving = false;
        state.shopName = action.payload.shopName || state.shopName;
        state.shopTagline = action.payload.shopTagline || state.shopTagline;
        state.shopLogoUrl = action.payload.shopLogoUrl ?? state.shopLogoUrl;
        state.shopAddress = action.payload.shopAddress ?? state.shopAddress;
        state.shopPhone = action.payload.shopPhone ?? state.shopPhone;
        state.shopEmail = action.payload.shopEmail ?? state.shopEmail;
        state.shopWebsite = action.payload.shopWebsite ?? state.shopWebsite;
        state.invoiceTitle = action.payload.invoiceTitle || state.invoiceTitle;
        state.invoiceTerms = action.payload.invoiceTerms || state.invoiceTerms;
        state.invoiceFooterNote = action.payload.invoiceFooterNote ?? state.invoiceFooterNote;
        state.showWatermark = action.payload.showWatermark ?? state.showWatermark;
        state.showPaidStamp = action.payload.showPaidStamp ?? state.showPaidStamp;
        state.showBarcode = action.payload.showBarcode ?? state.showBarcode;
        state.showQrCode = action.payload.showQrCode ?? state.showQrCode;
        state.showSignatures = action.payload.showSignatures ?? state.showSignatures;
        state.showAmountInWords = action.payload.showAmountInWords ?? state.showAmountInWords;
        state.updatedAt = action.payload.updatedAt;
      })
      .addCase(updateInvoiceSettingsThunk.rejected, (state, action) => {
        state.invoiceSaving = false;
        state.error = action.payload as string;
      });
  },
});

export default businessProfileSlice.reducer;
