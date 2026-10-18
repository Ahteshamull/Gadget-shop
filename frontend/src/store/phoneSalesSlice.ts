import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "./api";
import { Sale } from "@/lib/phone-store";
import { toast } from "sonner";
import { apiErrorMessage, type ApiDataResponse, listPayload, type MongoEntity, type PaginatedApiResponse } from "./apiTypes";

interface PhoneSalesState {
  items: Sale[];
  loading: boolean;
  error: string | null;
}

const initialState: PhoneSalesState = {
  items: [],
  loading: false,
  error: null,
};

type PhoneApiItem = Omit<Sale, "id"> &
  MongoEntity & {
    ownership?: Sale["ownership"];
  };

export type PhoneStockCreatePayload = Pick<
  Sale,
  | "imei"
  | "brand"
  | "model"
  | "variant"
  | "color"
  | "ram"
  | "storage"
  | "purchasePrice"
  | "sellingPrice"
  | "sellerNID"
  | "supplierName"
  | "supplierPhone"
  | "buyerName"
  | "buyerPhone"
  | "warrantyExpiry"
  | "salesPerson"
  | "addedBy"
>;

const mapPhone = (phone: PhoneApiItem): Sale => ({
  ...phone,
  id: phone.id ?? phone._id ?? "",
  sellerNID: phone.sellerNID ?? "",
  supplierName: phone.supplierName ?? phone.buyerName ?? "",
  supplierPhone: phone.supplierPhone ?? phone.buyerPhone ?? "",
  buyerName: phone.buyerName ?? phone.supplierName ?? "",
  buyerPhone: phone.buyerPhone ?? phone.supplierPhone ?? "",
  addedBy: phone.addedBy || "Admin",
  ownership: phone.ownership ?? [],
});

export const fetchPhoneSales = createAsyncThunk(
  "phoneSales/fetchPhoneSales",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<PhoneApiItem[] | PaginatedApiResponse<PhoneApiItem>>("/phones");
      return listPayload(response.data).map(mapPhone);
    } catch (error: unknown) {
      return rejectWithValue(apiErrorMessage(error, "Failed to fetch phone sales"));
    }
  }
);

export const registerPhoneStock = createAsyncThunk(
  "phoneSales/registerPhoneStock",
  async (phoneData: PhoneStockCreatePayload, { rejectWithValue }) => {
    try {
      const response = await api.post<ApiDataResponse<PhoneApiItem>>("/phones", phoneData);
      toast.success(response.data.message || "Phone stock registered successfully");
      return mapPhone(response.data.data);
    } catch (error: unknown) {
      const errMsg = apiErrorMessage(error, "Failed to register stock");
      toast.error(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const updatePhoneStock = createAsyncThunk(
  "phoneSales/updatePhoneStock",
  async ({ id, patch }: { id: string; patch: Partial<Sale> }, { rejectWithValue }) => {
    try {
      const response = await api.put<ApiDataResponse<PhoneApiItem>>(`/phones/${id}`, patch);
      toast.success(response.data.message || "Phone stock updated successfully");
      return mapPhone(response.data.data);
    } catch (error: unknown) {
      const errMsg = apiErrorMessage(error, "Failed to update phone stock");
      toast.error(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const deletePhoneStock = createAsyncThunk(
  "phoneSales/deletePhoneStock",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/phones/${id}`);
      toast.success(response.data.message || "Phone stock deleted successfully");
      return id;
    } catch (error: unknown) {
      const errMsg = apiErrorMessage(error, "Failed to delete stock");
      toast.error(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

const phoneSalesSlice = createSlice({
  name: "phoneSales",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchPhoneSales.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPhoneSales.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchPhoneSales.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add
      .addCase(registerPhoneStock.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      // Update
      .addCase(updatePhoneStock.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      // Delete
      .addCase(deletePhoneStock.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
      });
  },
});

export default phoneSalesSlice.reducer;
