import { api } from "./api";

interface FetchMineOptions {
  signal?: AbortSignal;
}

interface ListingsResponse {
  listings: any[];
  bookings: any[];
  vendor?: any;
  tenantId?: string;
}

export async function fetchMyVendorListings(options: FetchMineOptions = {}): Promise<ListingsResponse> {
  try {
    const { signal } = options;
    const { data } = await api.get("/api/data/services/mine", { signal } as any);
    const listings = Array.isArray(data?.listings) ? data.listings : [];
    const bookings = Array.isArray(data?.bookings) ? data.bookings : [];
    const vendor = data?.vendor || null;
    const tenantId = typeof data?.tenantId === "string" ? data.tenantId : undefined;
    return { listings, bookings, vendor, tenantId };
  } catch (e: any) {
    const status = e?.response?.status;
    if (status === 401 || status === 403 || status === 404) {
      return { listings: [], bookings: [] };
    }
    throw e;
  }
}
