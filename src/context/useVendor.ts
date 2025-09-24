import { useContext } from "react";
import { VendorContext } from "./vendorContextBase";

export const useVendor = () => {
  const ctx = useContext(VendorContext);
  if (!ctx) throw new Error("useVendor must be used inside <VendorProvider />");
  return ctx;
};
