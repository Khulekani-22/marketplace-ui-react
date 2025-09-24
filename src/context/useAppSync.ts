import { useContext } from "react";
import { AppSyncContext } from "./appSyncContext";

export const useAppSync = () => {
  const ctx = useContext(AppSyncContext);
  if (!ctx) throw new Error("useAppSync must be used inside <AppSyncProvider />");
  return ctx;
};
