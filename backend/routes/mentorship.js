import express from "express";
import firestoreDataStore, { getData as getHybridData } from "../utils/firestoreDataStore.js";

const router = express.Router();

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function uniqueStrings(list) {
  return Array.from(
    new Set(
      (list || [])
        .map((item) => (item != null ? String(item).trim() : ""))
        .filter((item) => item.length > 0)
    )
  );
}

function buildMentorIndex({ vendors = [], profiles = [], users = [], companies = [], startups = [] }) {
  const index = new Map();
  const addRecord = (key, record) => {
    if (!record) return;
    const raw = key != null ? String(key).trim() : "";
    if (!raw) return;
    if (!index.has(raw)) index.set(raw, record);
    const lower = raw.toLowerCase();
    if (!index.has(lower)) index.set(lower, record);
  };

  const addEmails = (record, fields = []) => {
    fields.forEach((field) => {
      const value = record?.[field];
      if (!value) return;
      addRecord(String(value).toLowerCase(), record);
    });
  };

  vendors.forEach((vendor) => {
    addRecord(vendor.vendorId || vendor.id, vendor);
    addRecord(vendor.id, vendor);
    addRecord(vendor.ownerUid, vendor);
    addEmails(vendor, ["contactEmail", "email"]);
  });

  profiles.forEach((profile) => {
    addRecord(profile.id || profile.uid || profile.ownerUid, profile);
    addEmails(profile, ["email", "contactEmail"]);
  });

  companies.forEach((company) => {
    addRecord(company.id || company.companyId, company);
    addEmails(company, ["email", "contactEmail"]);
  });

  startups.forEach((startup) => {
    addRecord(startup.id || startup.startupId, startup);
    addEmails(startup, ["email", "contactEmail"]);
  });

  users.forEach((user) => {
    addRecord(user.uid || user.id || user.email, user);
    addEmails(user, ["email"]);
  });

  return index;
}

function collectExpertise({ session, service, mentor }) {
  const tags = new Set();
  const push = (value) => {
    if (!value) return;
    const str = String(value).trim();
    if (str) tags.add(str);
  };

  safeArray(mentor?.expertise).forEach(push);
  safeArray(mentor?.skills).forEach(push);
  safeArray(mentor?.tags).forEach(push);
  safeArray(service?.tags).forEach(push);
  safeArray(session?.tags).forEach(push);
  if (session?.topic) push(session.topic);
  if (session?.focusArea) push(session.focusArea);
  if (service?.category && service.category.toLowerCase().includes("mentor")) push(service.category);

  return Array.from(tags);
}

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function pickMentorRecord({ session, service, mentorIndex }) {
  const candidates = uniqueStrings([
    session?.mentorId,
    session?.mentorEmail,
    service?.vendorId,
    service?.ownerUid,
    service?.contactEmail,
  ]);

  for (const key of candidates) {
    if (mentorIndex.has(key)) return mentorIndex.get(key);
    const lower = key.toLowerCase();
    if (mentorIndex.has(lower)) return mentorIndex.get(lower);
  }

  return null;
}

function normalizeListing({ session, service, mentor }) {
  if (!session && !service && !mentor) return null;

  const serviceId = String(service?.id ?? session?.serviceId ?? session?.id ?? "").trim();
  const mentorId = String(
    session?.mentorId ?? mentor?.vendorId ?? mentor?.id ?? mentor?.ownerUid ?? service?.vendorId ?? serviceId
  ).trim();

  const mentorName =
    session?.mentorName ||
    mentor?.fullName ||
    mentor?.name ||
    mentor?.companyName ||
    service?.vendor ||
    "Mentor";

  const title =
    service?.title ||
    session?.serviceTitle ||
    session?.topic ||
    mentor?.specialisation ||
    mentorName;

  const description =
    service?.description ||
    session?.topic ||
    mentor?.bio ||
    mentor?.about ||
    "Book a mentorship session to get personalised advice from this mentor.";

  const price = toNumber(service?.price ?? session?.price ?? mentor?.rate ?? mentor?.hourlyRate, 0);
  const rating = toNumber(service?.rating ?? mentor?.rating, 0);
  const reviewCount = toNumber(
    service?.reviewCount ??
      (Array.isArray(service?.reviews) ? service.reviews.length : mentor?.reviewCount ?? mentor?.reviews?.length),
    0
  );

  const vendorName =
    service?.vendor || mentor?.companyName || mentor?.organisation || mentor?.name || mentorName;

  const imageUrl =
    service?.imageUrl ||
    service?.thumbnail ||
    mentor?.avatar ||
    mentor?.photoUrl ||
    mentor?.profileImage ||
    "";

  const tenantId =
    session?.tenantId ||
    service?.tenantId ||
    mentor?.tenantId ||
    mentor?.tenant ||
    "public";

  const expertise = collectExpertise({ session, service, mentor });

  const nextSessionDate = session?.sessionDate || session?.scheduledDate || session?.nextSessionDate;
  const durationMinutes = toNumber(session?.duration ?? session?.durationMinutes, 0) || undefined;

  const payload = {
    sessionId: session?.id,
    sessionDate: nextSessionDate,
    duration: session?.duration ?? session?.durationMinutes,
    status: session?.status,
    rawSession: session || null,
    rawService: service || null,
    rawMentor: mentor || null,
  };

  return {
    id: serviceId || mentorId || session?.id || `mentor_${mentorName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
    serviceId: serviceId || mentorId || "",
    mentorId: mentorId || serviceId || "",
    mentorName,
    title,
    description,
    price,
    rating,
    reviewCount,
    vendorName,
    imageUrl,
    category: service?.category || "Mentorship",
    expertise,
    tenantId,
    nextSessionDate: nextSessionDate || undefined,
    durationMinutes,
    meetingLink: session?.meetingLink || service?.meetingLink || undefined,
    payload,
  };
}

function sortMentorListings(listings) {
  return [...listings].sort((a, b) => {
    const ratingDiff = (Number(b.rating) || 0) - (Number(a.rating) || 0);
    if (Math.abs(ratingDiff) > 0.05) return ratingDiff;
    const reviewsDiff = (Number(b.reviewCount) || 0) - (Number(a.reviewCount) || 0);
    if (reviewsDiff !== 0) return reviewsDiff;
    return String(a.mentorName || "").localeCompare(String(b.mentorName || ""));
  });
}

function filterMentorListings(listings, { search = "", expertise = "", tenantId = "" } = {}) {
  const needle = search.trim().toLowerCase();
  const expertiseNeedle = expertise.trim().toLowerCase();
  const tenantNeedle = tenantId.trim().toLowerCase();

  return listings.filter((listing) => {
    if (tenantNeedle) {
      const listingTenant = String(listing.tenantId || "").toLowerCase();
      if (listingTenant !== tenantNeedle) return false;
    }

    if (expertiseNeedle) {
      const matchExpertise = safeArray(listing.expertise).some((tag) =>
        String(tag).toLowerCase().includes(expertiseNeedle)
      );
      if (!matchExpertise) return false;
    }

    if (!needle) return true;

    const searchSpace = [
      listing.mentorName,
      listing.title,
      listing.vendorName,
      listing.description,
      ...(listing.expertise || []),
    ]
      .filter(Boolean)
      .map((value) => String(value).toLowerCase());

    return searchSpace.some((value) => value.includes(needle));
  });
}

async function buildMentorshipListings({ tenantId, limit, includePastSessions = true }) {
  const context = { tenantId, limit, includePastSessions };
  const response = {
    listings: [],
    fallback: false,
  };

  let sessions = [];
  let services = [];
  let vendors = [];
  let profiles = [];
  let users = [];
  let companies = [];
  let startups = [];

  try {
    sessions = await firestoreDataStore.getMentorshipSessions({
      tenantId,
      limit,
      includePast: includePastSessions,
    });

    if (!sessions.length) {
      return response;
    }

    const serviceIds = uniqueStrings(sessions.map((session) => session.serviceId));
    services = serviceIds.length
      ? await firestoreDataStore.getDocumentsByIds('services', serviceIds)
      : [];

    const mentorIds = uniqueStrings(sessions.map((session) => session.mentorId));
    const [vendorDocs, profileDocs, userDocs, companyDocs, startupDocs] = await Promise.all([
      mentorIds.length ? firestoreDataStore.getDocumentsByIds('vendors', mentorIds) : Promise.resolve([]),
      mentorIds.length ? firestoreDataStore.getDocumentsByIds('profiles', mentorIds) : Promise.resolve([]),
      mentorIds.length ? firestoreDataStore.getDocumentsByIds('users', mentorIds) : Promise.resolve([]),
      mentorIds.length ? firestoreDataStore.getDocumentsByIds('companies', mentorIds) : Promise.resolve([]),
      mentorIds.length ? firestoreDataStore.getDocumentsByIds('startups', mentorIds) : Promise.resolve([]),
    ]);

    vendors = vendorDocs;
    profiles = profileDocs;
    users = userDocs;
    companies = companyDocs;
    startups = startupDocs;
  } catch (error) {
    console.warn('[Mentorship] Falling back to hybrid data store', error?.message || error);
    response.fallback = true;
    const data = await getHybridData(true);
    sessions = safeArray(data?.mentorshipSessions);
    services = safeArray(data?.services);
    vendors = safeArray(data?.vendors);
    profiles = safeArray(data?.profiles);
    users = safeArray(data?.users);
    companies = safeArray(data?.companies);
    startups = safeArray(data?.startups);
  }

  if (!includePastSessions) {
    const now = Date.now();
    sessions = sessions.filter((session) => {
      const ts = Date.parse(
        session?.sessionDate || session?.scheduledDate || session?.nextSessionDate || session?.createdAt || ''
      );
      if (!Number.isFinite(ts)) return true;
      return ts >= now;
    });
  }

  if (!sessions.length) {
    return response;
  }

  const serviceMap = new Map();
  services.forEach((service) => {
    const key = service?.id != null ? String(service.id) : null;
    if (!key) return;
    if (!serviceMap.has(key)) serviceMap.set(key, service);
  });

  const mentorIndex = buildMentorIndex({ vendors, profiles, users, companies, startups });

  const listingMap = new Map();
  sessions.forEach((session) => {
    const serviceKey = session?.serviceId != null ? String(session.serviceId) : '';
    const service = serviceKey && serviceMap.has(serviceKey) ? serviceMap.get(serviceKey) : null;
    const mentor = pickMentorRecord({ session, service, mentorIndex }) || null;
    const listing = normalizeListing({ session, service, mentor });
    if (!listing) return;

    const dedupeKey = listing.serviceId || listing.mentorId || listing.id;
    if (!listingMap.has(dedupeKey)) {
      listingMap.set(dedupeKey, listing);
    } else {
      const existing = listingMap.get(dedupeKey);
      const existingScore = (existing.description ? 1 : 0) + (existing.imageUrl ? 1 : 0);
      const nextScore = (listing.description ? 1 : 0) + (listing.imageUrl ? 1 : 0);
      if (nextScore > existingScore) {
        listingMap.set(dedupeKey, listing);
      }
    }
  });

  response.listings = Array.from(listingMap.values());
  return response;
}

router.get('/', async (req, res) => {
  const tenantId = req.tenant?.id || 'public';
  const { q = '', expertise = '', limit, includePast } = req.query || {};

  try {
    const limitNumber = limit != null ? Number(limit) : undefined;
    const includePastSessions = includePast !== 'false';

    const base = await buildMentorshipListings({
      tenantId,
      limit: limitNumber,
      includePastSessions,
    });

    const filtered = filterMentorListings(base.listings, {
      search: String(q || ''),
      expertise: String(expertise || ''),
      tenantId,
    });

    const sorted = sortMentorListings(filtered);

    res.json({
      listings: sorted,
      total: sorted.length,
      fallback: base.fallback,
    });
  } catch (error) {
    console.error('[Mentorship] Failed to load listings', error);
    res.status(500).json({
      status: 'error',
      message: error?.message || 'Failed to load mentorship listings',
    });
  }
});

export default router;
