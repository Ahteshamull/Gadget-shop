import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "./api";
import { PartnerTransaction, ShopExpense } from "@/lib/phone-store";
import { apiErrorMessage, type ApiDataResponse, listPayload, type MongoEntity, type PaginatedApiResponse } from "./apiTypes";

interface PartnerState {
  transactions: PartnerTransaction[];
  expenses: ShopExpense[];
  loading: boolean;
  error: string | null;
}

const initialState: PartnerState = {
  transactions: [],
  expenses: [],
  loading: false,
  error: null,
};

type PartnerTransactionApiItem = Omit<PartnerTransaction, "id"> & MongoEntity;
type ShopExpenseApiItem = Omit<ShopExpense, "id"> & MongoEntity;

const mapTransaction = (tx: PartnerTransactionApiItem): PartnerTransaction => ({
  ...tx,
  id: tx.id ?? tx._id ?? "",
});

const mapExpense = (exp: ShopExpenseApiItem): ShopExpense => ({
  ...exp,
  id: exp.id ?? exp._id ?? "",
});

export const fetchPartnerTransactions = createAsyncThunk(
  "partner/fetchPartnerTransactions",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<PartnerTransactionApiItem[] | PaginatedApiResponse<PartnerTransactionApiItem>>("/partners/transactions");
      return listPayload(response.data).map(mapTransaction);
    } catch (error: unknown) {
      return rejectWithValue(apiErrorMessage(error, "Failed to fetch partner ledger"));
    }
  }
);

import { toast } from "sonner";

export const addPartnerTransaction = createAsyncThunk(
  "partner/addPartnerTransaction",
  async (txData: Omit<PartnerTransaction, "id">, { rejectWithValue }) => {
    try {
      const response = await api.post<ApiDataResponse<PartnerTransactionApiItem>>("/partners/transactions", txData);
      toast.success(response.data.message || "Capital transaction logged successfully");
      return mapTransaction(response.data.data);
    } catch (error: unknown) {
      const errMsg = apiErrorMessage(error, "Failed to log transaction");
      toast.error(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const deletePartnerTransaction = createAsyncThunk(
  "partner/deletePartnerTransaction",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/partners/transactions/${id}`);
      toast.success(response.data.message || "Transaction deleted successfully");
      return id;
    } catch (error: unknown) {
      const errMsg = apiErrorMessage(error, "Failed to delete transaction");
      toast.error(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const fetchShopExpenses = createAsyncThunk(
  "partner/fetchShopExpenses",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<ShopExpenseApiItem[] | PaginatedApiResponse<ShopExpenseApiItem>>("/expenses");
      return listPayload(response.data).map(mapExpense);
    } catch (error: unknown) {
      return rejectWithValue(apiErrorMessage(error, "Failed to fetch expenses"));
    }
  }
);

export const addShopExpense = createAsyncThunk(
  "partner/addShopExpense",
  async (expenseData: Omit<ShopExpense, "id">, { rejectWithValue }) => {
    try {
      const response = await api.post<ApiDataResponse<ShopExpenseApiItem>>("/expenses", expenseData);
      toast.success(response.data.message || "Shop expense logged successfully");
      return mapExpense(response.data.data);
    } catch (error: unknown) {
      const errMsg = apiErrorMessage(error, "Failed to add expense");
      toast.error(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

export const deleteShopExpense = createAsyncThunk(
  "partner/deleteShopExpense",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/expenses/${id}`);
      toast.success(response.data.message || "Expense deleted successfully");
      return id;
    } catch (error: unknown) {
      const errMsg = apiErrorMessage(error, "Failed to delete expense");
      toast.error(errMsg);
      return rejectWithValue(errMsg);
    }
  }
);

const partnerSlice = createSlice({
  name: "partner",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Transactions
      .addCase(fetchPartnerTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPartnerTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload;
      })
      .addCase(fetchPartnerTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add transaction
      .addCase(addPartnerTransaction.fulfilled, (state, action) => {
        state.transactions.unshift(action.payload);
      })
      // Delete transaction
      .addCase(deletePartnerTransaction.fulfilled, (state, action) => {
        state.transactions = state.transactions.filter((tx) => tx.id !== action.payload);
      })
      // Fetch Expenses
      .addCase(fetchShopExpenses.fulfilled, (state, action) => {
        state.expenses = action.payload;
      })
      // Add Expense
      .addCase(addShopExpense.fulfilled, (state, action) => {
        state.expenses.unshift(action.payload);
      })
      // Delete Expense
      .addCase(deleteShopExpense.fulfilled, (state, action) => {
        state.expenses = state.expenses.filter((exp) => exp.id !== action.payload);
      });
  },
});

export default partnerSlice.reducer;
