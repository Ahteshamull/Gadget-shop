import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "./api";
import { apiErrorMessage } from "./apiTypes";

interface UserInfo {
  id?: string;
  email: string;
  role: string;
  name: string;
}

interface AuthState {
  user: UserInfo | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

type LoginResponse = {
  id?: string;
  name?: string;
  email: string;
  role: string;
  token: string;
  message: string;
};

type LoginCredentials = {
  email: string;
  password: string;
  remember: boolean;
};

const AUTH_EXPIRY_KEY = "pt_auth_expires_at";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const storageKeys = ["pt_auth", "pt_token", "pt_user", "pt_session", AUTH_EXPIRY_KEY] as const;

const clearStoredAuth = (): void => {
  if (typeof window === "undefined") return;
  storageKeys.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
};

const getStoredValue = (key: string): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(key) ?? sessionStorage.getItem(key);
};

const isStoredAuthExpired = (): boolean => {
  if (typeof window === "undefined") return false;
  const expiresAt = Number(getStoredValue(AUTH_EXPIRY_KEY));
  return Number.isFinite(expiresAt) && expiresAt > 0 && Date.now() > expiresAt;
};

const getInitialUser = (): UserInfo | null => {
  if (typeof window === "undefined") return null;
  if (isStoredAuthExpired()) {
    clearStoredAuth();
    return null;
  }
  try {
    const stored = getStoredValue("pt_user");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const getInitialToken = (): string | null => {
  if (typeof window === "undefined") return null;
  if (isStoredAuthExpired()) {
    clearStoredAuth();
    return null;
  }
  return getStoredValue("pt_token");
};

const getInitialAuth = (): boolean => {
  if (typeof window === "undefined") return false;
  if (isStoredAuthExpired()) {
    clearStoredAuth();
    return false;
  }
  return Boolean(getStoredValue("pt_token"));
};

const initialState: AuthState = {
  user: getInitialUser(),
  token: getInitialToken(),
  loading: false,
  error: null,
  isAuthenticated: getInitialAuth(),
};

import { toast } from "sonner";

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await api.post<LoginResponse>("/auth/login", {
        email: credentials.email,
        password: credentials.password,
      });
      const { id, name: apiName, email, role, token } = response.data;
      if (!email || !role || !token) {
        throw new Error("Login response did not include a valid access token.");
      }

      const name = apiName?.trim() || email.split("@")[0];
      const userData: UserInfo = { id, email, role, name };

      if (typeof window !== "undefined") {
        clearStoredAuth();
        const targetStorage = credentials.remember ? localStorage : sessionStorage;
        targetStorage.setItem("pt_auth", "1");
        targetStorage.setItem("pt_token", token);
        targetStorage.setItem("pt_user", JSON.stringify(userData));
        targetStorage.setItem("pt_session", credentials.remember ? "persistent" : "session");
        targetStorage.setItem(AUTH_EXPIRY_KEY, String(Date.now() + THIRTY_DAYS_MS));

        const savedToken = targetStorage.getItem("pt_token");
        if (savedToken !== token) {
          throw new Error("Access token could not be saved in this browser.");
        }
      }

      toast.success(`Welcome back, ${name}!`);
      return { user: userData, token };
    } catch (error: unknown) {
      const message = apiErrorMessage(error, "Login failed. Check connection or credentials.");
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    hydrateAuthFromStorage(state) {
      state.user = getInitialUser();
      state.token = getInitialToken();
      state.isAuthenticated = getInitialAuth();
    },
    logoutUser(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      if (typeof window !== "undefined") {
        clearStoredAuth();
      }
      toast.info("Signed out successfully.");
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      });
  },
});

export const { hydrateAuthFromStorage, logoutUser, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
