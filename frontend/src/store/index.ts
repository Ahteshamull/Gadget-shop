import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";
import authReducer from "./authSlice";
import phoneSalesReducer from "./phoneSalesSlice";
import gadgetsReducer from "./gadgetsSlice";
import partnerReducer from "./partnerSlice";
import userManagementReducer from "./userManagementSlice";
import businessProfileReducer from "./businessProfileSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    phoneSales: phoneSalesReducer,
    gadgets: gadgetsReducer,
    partner: partnerReducer,
    userManagement: userManagementReducer,
    businessProfile: businessProfileReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Type-safe custom hooks for Redux usage
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
