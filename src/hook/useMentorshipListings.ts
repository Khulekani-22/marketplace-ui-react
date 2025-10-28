// src/hook/useMentorshipListings.ts
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAppSync } from "../context/useAppSync";
import { loadMentorshipListings, filterMentors } from "../lib/mentorship";

interface UseMentorshipListingsOptions {
  query?: string;
  expertise?: string;
  enabled?: boolean;
  includePast?: boolean;
}

export function useMentorshipListings(options: UseMentorshipListingsOptions = {}) {
  const { query = "", expertise = "", enabled = true, includePast = false } = options;
  const { appData } = useAppSync();
  const tenantId = useMemo(() => sessionStorage.getItem("tenantId") || "vendor", []);
  const normalizedTenantId = tenantId === "vendor" ? "public" : tenantId;

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: ["mentorshipListings", normalizedTenantId, includePast ? "withPast" : "upcoming"],
    enabled,
    queryFn: async ({ signal }) => {
  return await loadMentorshipListings({ tenantId: normalizedTenantId, signal, appData: (appData as any) ?? undefined, includePast });
    },
    staleTime: 1000 * 60, // 1 minute freshness
  });

  const listings = useMemo(() => {
    const base = data?.listings || [];
    if (!query && !expertise) return base;
    return filterMentors(base, query, { expertise, tenantId: normalizedTenantId });
  }, [data?.listings, expertise, query, normalizedTenantId]);

  return {
    listings,
    isLoading,
    isFetching,
    refetch,
    error,
    fallback: data?.fallback ?? false,
  };
}

export type { MentorListing } from "../lib/mentorship";
