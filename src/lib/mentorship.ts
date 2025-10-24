// src/lib/mentorship.ts
// Utilities for loading and normalizing mentor-focused service listings.
import { api } from "./api";

type Nullable<T> = T | null | undefined;

export interface MentorListing {
  id: string;
  serviceId: string;
  mentorId: string;
  mentorName: string;
  title: string;
  description: string;
  price: number;
  rating: number;
  reviewCount: number;
  vendorName: string;
  imageUrl: string;
  category: string;
  expertise: string[];
  tenantId?: string;
  nextSessionDate?: string;
  durationMinutes?: number;
  meetingLink?: string;
  payload?: Record<string, any>;
}

interface FetchMentorshipOptions {
  tenantId?: string;
  signal?: AbortSignal;
  search?: string;
  refresh?: boolean;
  pageSize?: number;
  includePast?: boolean;
}

const MENTORSHIP_KEYWORDS = [
  "mentor",
  "mentorship",
  "coaching",
  "advisory",
  "office hours",
  "clinic",
];

function normalizeMentorListing(raw: Record<string, any>): MentorListing | null {
  if (!raw) return null;
  const serviceId = String(raw.id ?? raw.serviceId ?? "").trim();
  if (!serviceId) return null;
  const mentorId = String(raw.mentorId ?? raw.vendorId ?? raw.ownerUid ?? serviceId).trim();
  const mentorName =
    String(raw.mentorName ?? raw.vendor ?? raw.vendorName ?? raw.contactName ?? raw.title ?? "").trim() ||
    "Mentor";
  const title = String(raw.title ?? raw.serviceTitle ?? mentorName).trim() || mentorName;
  const description = String(raw.description ?? raw.bio ?? "").trim();
  const imageUrl = String(raw.imageUrl ?? raw.thumbnail ?? raw.avatar ?? "").trim();
  const category = String(raw.category ?? "Mentorship").trim() || "Mentorship";
  const price = Number(raw.price ?? raw.rate ?? 0) || 0;
  const rating = Number(raw.rating ?? raw.averageRating ?? 0) || 0;
  const reviewCount = Number(raw.reviewCount ?? raw.reviews?.length ?? 0) || 0;
  const vendorName = String(raw.vendor ?? raw.vendorName ?? raw.company ?? mentorName).trim();
  const tags: string[] = Array.isArray(raw.tags)
    ? raw.tags.map((t: any) => String(t)).filter(Boolean)
    : [];
  const expertiseSources: string[] = [];
  if (Array.isArray(raw.expertise)) expertiseSources.push(...raw.expertise.map((t: any) => String(t)));
  if (Array.isArray(raw.skills)) expertiseSources.push(...raw.skills.map((t: any) => String(t)));
  if (tags.length) expertiseSources.push(...tags);
  const expertise = Array.from(new Set(expertiseSources.map((t) => t.trim()).filter(Boolean)));
  const nextSessionDate =
    raw.nextSessionDate ||
    raw.sessionDate ||
    raw.scheduledDate ||
    raw.payload?.sessionDate ||
    raw.payload?.rawSession?.sessionDate ||
    raw.payload?.rawSession?.scheduledDate ||
    undefined;
  const durationMinutesRaw =
    raw.durationMinutes ??
    raw.duration ??
    raw.payload?.duration ??
    raw.payload?.rawSession?.duration ??
    raw.payload?.rawSession?.durationMinutes;
  const durationMinutes = Number(durationMinutesRaw);
  const meetingLink =
    raw.meetingLink ||
    raw.payload?.meetingLink ||
    raw.payload?.rawSession?.meetingLink ||
    undefined;

  return {
    id: serviceId,
    serviceId,
    mentorId,
    mentorName,
    title,
    description,
    price,
    rating,
    reviewCount,
    vendorName,
    imageUrl,
    category,
    expertise,
    tenantId: raw.tenantId ? String(raw.tenantId) : undefined,
    nextSessionDate: nextSessionDate ? String(nextSessionDate) : undefined,
    durationMinutes: Number.isFinite(durationMinutes) && durationMinutes > 0 ? durationMinutes : undefined,
    meetingLink,
    payload: raw,
  };
}

function containsMentorKeyword(value: Nullable<string>) {
  if (!value) return false;
  const lower = value.toLowerCase();
  return MENTORSHIP_KEYWORDS.some((kw) => lower.includes(kw));
}

function looksLikeMentorshipService(service: Record<string, any>) {
  if (!service) return false;
  if (containsMentorKeyword(service.title)) return true;
  if (containsMentorKeyword(service.category)) return true;
  if (containsMentorKeyword(service.description)) return true;
  if (Array.isArray(service.tags) && service.tags.some((tag: any) => containsMentorKeyword(String(tag)))) return true;
  const listingType = String(service.listingType ?? service.type ?? "").toLowerCase();
  if (listingType === "mentorship" || listingType === "mentor") return true;
  return false;
}

function deriveMentorsFromSessions(appData: Record<string, any>): MentorListing[] {
  const sessions = Array.isArray(appData?.mentorshipSessions) ? appData.mentorshipSessions : [];
  if (!sessions.length) return [];
  const services = Array.isArray(appData?.services) ? appData.services : [];
  const vendors = Array.isArray(appData?.vendors) ? appData.vendors : [];

  const catalog = new Map<string, MentorListing>();

  sessions.forEach((session: Record<string, any>) => {
    const mentorId = String(session?.mentorId ?? session?.mentorName ?? "").trim();
    if (!mentorId) return;
    const serviceId = String(session?.serviceId ?? "").trim();
    const service = serviceId ? services.find((svc: any) => String(svc?.id) === serviceId) : null;
    const vendor = vendors.find((v: any) => String(v?.vendorId ?? v?.id) === mentorId);

    const listing = normalizeMentorListing({
      id: serviceId || mentorId,
      mentorId,
      mentorName: session?.mentorName,
      title: session?.serviceTitle ?? session?.topic ?? session?.mentorName,
      description:
        session?.topic ||
        service?.description ||
        "Book a mentorship session to get personalised advice from this mentor.",
      price: service?.price ?? session?.price ?? 0,
      rating: service?.rating ?? vendor?.rating ?? 0,
      reviewCount: service?.reviewCount ?? 0,
      vendor: vendor?.name ?? session?.mentorName,
      vendorName: vendor?.name ?? session?.mentorName,
      imageUrl: service?.imageUrl ?? vendor?.avatar ?? "",
      category: service?.category ?? "Mentorship",
      tags: ["mentorship"],
      tenantId: service?.tenantId ?? vendor?.tenantId ?? session?.tenantId,
      expertise: vendor?.expertise ?? vendor?.skills ?? [],
      sessionDate: session?.sessionDate ?? session?.scheduledDate,
      duration: session?.duration ?? session?.durationMinutes,
      meetingLink: session?.meetingLink,
      payload: { session, service, vendor },
    });

    if (!listing) return;
    const existing = catalog.get(listing.serviceId) || catalog.get(listing.mentorId);
    if (!existing) {
      catalog.set(listing.serviceId, listing);
      return;
    }

    // Prefer richer listing information
    const existingScore = (existing.description ? 1 : 0) + (existing.imageUrl ? 1 : 0);
    const nextScore = (listing.description ? 1 : 0) + (listing.imageUrl ? 1 : 0);
    if (nextScore > existingScore) {
      catalog.set(listing.serviceId, listing);
    }
  });

  return Array.from(catalog.values());
}

export async function fetchMentorshipServices(
  options: FetchMentorshipOptions = {}
): Promise<{ listings: MentorListing[]; fallback: boolean }> {
  const { signal, search, tenantId, pageSize, refresh, includePast } = options;
  const params: Record<string, any> = {};
  if (search) params.q = search;
  if (tenantId) params.tenantId = tenantId;
  if (pageSize) params.limit = pageSize;
  if (refresh) params.refresh = "true";
  if (includePast != null) params.includePast = includePast ? "true" : "false";

  try {
    const { data } = await api.get("/api/mentorship", { params, signal } as any);
    const items = Array.isArray(data?.listings) ? data.listings : [];
    const normalized = items
      .map((entry: any) => normalizeMentorListing(entry))
      .filter(Boolean) as MentorListing[];
    return { listings: normalized, fallback: !!data?.fallback };
  } catch (error) {
    console.warn("[mentorship] Falling back to cached appData", (error as Error)?.message || error);
    return { listings: [], fallback: true };
  }
}

export function buildMentorshipFallback(appData: Nullable<Record<string, any>>): MentorListing[] {
  if (!appData) return [];
  const services = Array.isArray(appData?.services) ? appData.services : [];
  const fromServices = services
    .filter((svc: any) => looksLikeMentorshipService(svc))
    .map((svc: any) => normalizeMentorListing(svc))
    .filter(Boolean) as MentorListing[];

  if (fromServices.length) return fromServices;

  return deriveMentorsFromSessions(appData);
}

export function filterMentors(list: MentorListing[], query: string, facets: { expertise?: string; tenantId?: string } = {}) {
  if (!Array.isArray(list) || !list.length) return [];
  const needle = query?.trim().toLowerCase() || "";
  const expertiseNeedle = facets.expertise?.toLowerCase() || "";
  const tenantId = facets.tenantId?.toLowerCase() || "";

  return list.filter((mentor) => {
    if (tenantId && String(mentor.tenantId || "").toLowerCase() !== tenantId) return false;
    if (expertiseNeedle && !mentor.expertise.some((tag) => tag.toLowerCase().includes(expertiseNeedle))) return false;
    if (!needle) return true;
    return [mentor.mentorName, mentor.title, mentor.vendorName, mentor.description]
      .concat(mentor.expertise)
      .some((value) => (value || "").toLowerCase().includes(needle));
  });
}

export function sortMentors(list: MentorListing[]) {
  return [...list].sort((a, b) => {
    const byRating = (Number(b.rating) || 0) - (Number(a.rating) || 0);
    if (Math.abs(byRating) > 0.05) return byRating;
    const byReviews = (Number(b.reviewCount) || 0) - (Number(a.reviewCount) || 0);
    if (byReviews !== 0) return byReviews;
    return a.mentorName.localeCompare(b.mentorName);
  });
}

export interface MentorshipDataSnapshot {
  listings: MentorListing[];
  fallback: boolean;
}

export async function loadMentorshipListings(
  options: FetchMentorshipOptions & { appData?: Record<string, any> } = {}
): Promise<MentorshipDataSnapshot> {
  const { appData, ...fetchOptions } = options;
  const { listings: liveListings, fallback: liveFallback } = await fetchMentorshipServices(fetchOptions);
  if (liveListings.length) {
    return { listings: sortMentors(liveListings), fallback: liveFallback };
  }
  const fallback = appData ? buildMentorshipFallback(appData) : [];
  return { listings: sortMentors(fallback), fallback: true };
}
