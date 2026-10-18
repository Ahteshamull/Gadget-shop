import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { toast } from "sonner";
import api from "./api";
import { apiErrorMessage, type ApiDataResponse, type ApiMessageResponse } from "./apiTypes";

export type AccessRequestStatus = "pending" | "approved" | "rejected";
export type AccessRole = "owner" | "admin" | "partner" | "staff";

export type AccessRequest = {
  id: string;
  name: string;
  email: string;
  message: string;
  requestedRole: AccessRole;
  status: AccessRequestStatus;
  decidedBy: string | null;
  decidedAt: string | null;
  decisionNote: string;
  createdUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: AccessRole;
  accessStatus: "active" | "disabled";
  createdAt: string;
  updatedAt: string;
};

type DecisionPayload = {
  id: string;
  action: "approve" | "reject";
  role: AccessRole;
  note?: string;
};

export type CreateUserPayload = {
  name: string;
  email: string;
  password: string;
  role: AccessRole;
};

type UserManagementState = {
  requests: AccessRequest[];
  users: ManagedUser[];
  loading: boolean;
  usersLoading: boolean;
  createLoading: boolean;
  actionLoadingId: string | null;
  deleteLoadingId: string | null;
  roleLoadingId: string | null;
  statusLoadingId: string | null;
  error: string | null;
};

const initialState: UserManagementState = {
  requests: [],
  users: [],
  loading: false,
  usersLoading: false,
  createLoading: false,
  actionLoadingId: null,
  deleteLoadingId: null,
  roleLoadingId: null,
  statusLoadingId: null,
  error: null,
};

export const createManagedUser = createAsyncThunk(
  "userManagement/createManagedUser",
  async (payload: CreateUserPayload, { rejectWithValue }) => {
    try {
      const response = await api.post<ApiDataResponse<ManagedUser>>("/admin/users/create-user", payload);
      toast.success(response.data.message || "User account created successfully");
      return response.data.data;
    } catch (error: unknown) {
      const message = apiErrorMessage(error, "Failed to create user account");
      toast.error(message);
      return rejectWithValue(message);
    }
  },
);

export const updateManagedUserRole = createAsyncThunk(
  "userManagement/updateManagedUserRole",
  async ({ id, role }: { id: string; role: AccessRole }, { rejectWithValue }) => {
    try {
      const response = await api.patch<ApiDataResponse<ManagedUser>>(`/admin/users/update-role/${id}`, {
        role,
      });
      toast.success(response.data.message || "User role updated successfully");
      return response.data.data;
    } catch (error: unknown) {
      const message = apiErrorMessage(error, "Failed to update user role");
      toast.error(message);
      return rejectWithValue(message);
    }
  },
);

export const updateManagedUserStatus = createAsyncThunk(
  "userManagement/updateManagedUserStatus",
  async ({ id, accessStatus }: { id: string; accessStatus: "active" | "disabled" }, { rejectWithValue }) => {
    try {
      const response = await api.patch<ApiDataResponse<ManagedUser>>(`/admin/users/update-status/${id}`, {
        accessStatus,
      });
      toast.success(response.data.message || "Account status updated successfully");
      return response.data.data;
    } catch (error: unknown) {
      const message = apiErrorMessage(error, "Failed to update account status");
      toast.error(message);
      return rejectWithValue(message);
    }
  },
);


export const fetchAccessRequests = createAsyncThunk(
  "userManagement/fetchAccessRequests",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiDataResponse<AccessRequest[]>>("/admin/access-requests");
      return response.data.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorMessage(error, "Failed to load access requests"));
    }
  },
);

export const decideAccessRequest = createAsyncThunk(
  "userManagement/decideAccessRequest",
  async (payload: DecisionPayload, { rejectWithValue }) => {
    try {
      const response = await api.patch<ApiDataResponse<AccessRequest>>(
        `/admin/access-requests/${payload.id}`,
        {
          action: payload.action,
          role: payload.role,
          note: payload.note ?? "",
        },
      );
      toast.success(response.data.message);
      return response.data.data;
    } catch (error: unknown) {
      const message = apiErrorMessage(error, "Failed to update access request");
      toast.error(message);
      return rejectWithValue(message);
    }
  },
);

export const fetchManagedUsers = createAsyncThunk(
  "userManagement/fetchManagedUsers",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiDataResponse<ManagedUser[]>>("/admin/users");
      return response.data.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorMessage(error, "Failed to load user accounts"));
    }
  },
);

export const deleteManagedUser = createAsyncThunk(
  "userManagement/deleteManagedUser",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await api.delete<ApiMessageResponse>(`/admin/users/${id}`);
      toast.success(response.data.message);
      return id;
    } catch (error: unknown) {
      const message = apiErrorMessage(error, "Failed to delete staff account");
      toast.error(message);
      return rejectWithValue(message);
    }
  },
);

const userManagementSlice = createSlice({
  name: "userManagement",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccessRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAccessRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = action.payload;
      })
      .addCase(fetchAccessRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(decideAccessRequest.pending, (state, action) => {
        state.actionLoadingId = action.meta.arg.id;
        state.error = null;
      })
      .addCase(decideAccessRequest.fulfilled, (state, action) => {
        state.actionLoadingId = null;
        state.requests = state.requests.map((request) =>
          request.id === action.payload.id ? action.payload : request,
        );
      })
      .addCase(decideAccessRequest.rejected, (state, action) => {
        state.actionLoadingId = null;
        state.error = action.payload as string;
      })
      .addCase(fetchManagedUsers.pending, (state) => {
        state.usersLoading = true;
        state.error = null;
      })
      .addCase(fetchManagedUsers.fulfilled, (state, action) => {
        state.usersLoading = false;
        state.users = action.payload;
      })
      .addCase(fetchManagedUsers.rejected, (state, action) => {
        state.usersLoading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteManagedUser.pending, (state, action) => {
        state.deleteLoadingId = action.meta.arg;
        state.error = null;
      })
      .addCase(deleteManagedUser.fulfilled, (state, action) => {
        state.deleteLoadingId = null;
        state.users = state.users.filter((user) => user.id !== action.payload);
      })
      .addCase(deleteManagedUser.rejected, (state, action) => {
        state.deleteLoadingId = null;
        state.error = action.payload as string;
      })
      .addCase(createManagedUser.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(createManagedUser.fulfilled, (state, action) => {
        state.createLoading = false;
        state.users.unshift(action.payload);
      })
      .addCase(createManagedUser.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload as string;
      })
      .addCase(updateManagedUserRole.pending, (state, action) => {
        state.roleLoadingId = action.meta.arg.id;
        state.error = null;
      })
      .addCase(updateManagedUserRole.fulfilled, (state, action) => {
        state.roleLoadingId = null;
        state.users = state.users.map((u) => (u.id === action.payload.id ? action.payload : u));
      })
      .addCase(updateManagedUserRole.rejected, (state, action) => {
        state.roleLoadingId = null;
        state.error = action.payload as string;
      })
      .addCase(updateManagedUserStatus.pending, (state, action) => {
        state.statusLoadingId = action.meta.arg.id;
        state.error = null;
      })
      .addCase(updateManagedUserStatus.fulfilled, (state, action) => {
        state.statusLoadingId = null;
        state.users = state.users.map((u) => (u.id === action.payload.id ? action.payload : u));
      })
      .addCase(updateManagedUserStatus.rejected, (state, action) => {
        state.statusLoadingId = null;
        state.error = action.payload as string;
      });
  },
});

export default userManagementSlice.reducer;

