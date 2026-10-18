import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "./api";
import { Gadget, GadgetSale } from "@/lib/gadget-store";
import { apiErrorMessage, type ApiDataResponse, listPayload, type MongoEntity, type PaginatedApiResponse } from "./apiTypes";

interface GadgetsState {
  gadgets: Gadget[];
  sales: GadgetSale[];
  loading: boolean;
  error: string | null;
}

const initialState: GadgetsState = {
  gadgets: [],
  sales: [],
  loading: false,
  error: null,
};

type GadgetApiItem = Omit<Gadget, "id"> & MongoEntity;
type GadgetStockCreatePayload = Omit<Gadget, "id" | "createdAt">;
type GadgetSaleApiItem = Omit<GadgetSale, "id" | "gadgetId"> &
  MongoEntity & {
    gadgetId: string | MongoEntity;
  };

const mapGadget = (g: GadgetApiItem): Gadget => ({
  ...g,
  id: g.id ?? g._id ?? "",
});

const mapGadgetSale = (s: GadgetSaleApiItem): GadgetSale => ({
  ...s,
  id: s.id ?? s._id ?? "",
  gadgetId: typeof s.gadgetId === "object" ? s.gadgetId.id ?? s.gadgetId._id ?? "" : s.gadgetId,
});

export const fetchGadgets = createAsyncThunk(
  "gadgets/fetchGadgets",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<GadgetApiItem[] | PaginatedApiResponse<GadgetApiItem>>("/gadgets");
      return listPayload(response.data).map(mapGadget);
    } catch (error: unknown) {
      return rejectWithValue(apiErrorMessage(error, "Failed to fetch gadgets"));
    }
  }
);

import { toast } from "sonner";

export const addGadgetStock = createAsyncThunk(
  "gadgets/addGadgetStock",
  async (gadgetData: GadgetStockCreatePayload, { rejectWithValue }) => {
    try {
      const response = await api.post<ApiDataResponse<GadgetApiItem>>("/gadgets", gadgetData);
      toast.success(response.data.message || "Gadget added to stock successfully");
      return mapGadget(response.data.data);
    } catch (error: unknown) {
      const errMsg = apiErrorMessage(error, "Failed to add gadget stock");
      toast.error(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const updateGadgetStock = createAsyncThunk(
  "gadgets/updateGadgetStock",
  async ({ id, patch }: { id: string; patch: Partial<Gadget> }, { rejectWithValue }) => {
    try {
      const response = await api.put<ApiDataResponse<GadgetApiItem>>(`/gadgets/${id}`, patch);
      toast.success(response.data.message || "Gadget updated successfully");
      return mapGadget(response.data.data);
    } catch (error: unknown) {
      const errMsg = apiErrorMessage(error, "Failed to update gadget");
      toast.error(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const deleteGadgetStock = createAsyncThunk(
  "gadgets/deleteGadgetStock",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/gadgets/${id}`);
      toast.success(response.data.message || "Gadget deleted successfully");
      return id;
    } catch (error: unknown) {
      const errMsg = apiErrorMessage(error, "Failed to delete gadget");
      toast.error(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const fetchGadgetSales = createAsyncThunk(
  "gadgets/fetchGadgetSales",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<GadgetSaleApiItem[] | PaginatedApiResponse<GadgetSaleApiItem>>("/gadgets-sales");
      return listPayload(response.data).map(mapGadgetSale);
    } catch (error: unknown) {
      return rejectWithValue(apiErrorMessage(error, "Failed to fetch gadget sales"));
    }
  }
);

export const sellGadget = createAsyncThunk(
  "gadgets/sellGadget",
  async (saleData: Omit<GadgetSale, "id">, { rejectWithValue }) => {
    try {
      const response = await api.post<ApiDataResponse<GadgetSaleApiItem>>("/gadgets-sales", saleData);
      toast.success(response.data.message || "Gadget sale registered successfully");
      return mapGadgetSale(response.data.data);
    } catch (error: unknown) {
      const errMsg = apiErrorMessage(error, "Failed to complete gadget sale");
      toast.error(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

const gadgetsSlice = createSlice({
  name: "gadgets",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch gadgets
      .addCase(fetchGadgets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGadgets.fulfilled, (state, action) => {
        state.loading = false;
        state.gadgets = action.payload;
      })
      .addCase(fetchGadgets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add gadget
      .addCase(addGadgetStock.fulfilled, (state, action) => {
        state.gadgets.unshift(action.payload);
      })
      // Update gadget
      .addCase(updateGadgetStock.fulfilled, (state, action) => {
        const index = state.gadgets.findIndex((g) => g.id === action.payload.id);
        if (index !== -1) {
          state.gadgets[index] = action.payload;
        }
      })
      // Delete gadget
      .addCase(deleteGadgetStock.fulfilled, (state, action) => {
        state.gadgets = state.gadgets.filter((g) => g.id !== action.payload);
        state.sales = state.sales.filter((s) => s.gadgetId !== action.payload);
      })
      // Fetch sales
      .addCase(fetchGadgetSales.fulfilled, (state, action) => {
        state.sales = action.payload;
      })
      // Sell gadget
      .addCase(sellGadget.fulfilled, (state, action) => {
        state.sales.unshift(action.payload);
      });
  },
});

export default gadgetsSlice.reducer;
