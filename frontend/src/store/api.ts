import axios from "axios";

const rawApiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:5001/api";
const API_URL = rawApiUrl.replace(/\/+$/, "");

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  },
});

let authRedirectInProgress = false;

// Request interceptor to automatically add authorization headers
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("pt_token") ?? sessionStorage.getItem("pt_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle session expiration (status 410 / 401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 410)) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("pt_auth");
        localStorage.removeItem("pt_user");
        localStorage.removeItem("pt_token");
        localStorage.removeItem("pt_session");
        localStorage.removeItem("pt_auth_expires_at");
        sessionStorage.removeItem("pt_auth");
        sessionStorage.removeItem("pt_user");
        sessionStorage.removeItem("pt_token");
        sessionStorage.removeItem("pt_session");
        sessionStorage.removeItem("pt_auth_expires_at");
        const alreadyOnLogin = window.location.pathname === "/login";
        if (!alreadyOnLogin && !authRedirectInProgress) {
          authRedirectInProgress = true;
          window.location.assign("/login");
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
