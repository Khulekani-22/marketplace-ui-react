import { createContext } from "react";

export const AppSyncContext = createContext({
  appData: null,
  appDataLoading: false,
  appDataError: "",
  role: "member",
  tenantId: "vendor",
  isAdmin: false,
  lastSyncAt: 0,
  syncNow: async () => {},
});
