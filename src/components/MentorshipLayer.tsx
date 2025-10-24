import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMentorshipListings, MentorListing } from "../hook/useMentorshipListings";
import { fetchMySubscriptions, subscribeToService } from "../lib/subscriptions";
import { useQuery } from "@tanstack/react-query";
import { auth } from "../firebase";
import { toast } from "react-toastify";
import { Modal } from "react-bootstrap";

interface BookingFormState {
  open: boolean;
  listing: MentorListing | null;
  date: string;
  slot: string;
  busy: boolean;
  error: string;
}

const SERVICE_DAY_START = 8;
const SERVICE_DAY_END = 17;

function createHourlySlots(start = SERVICE_DAY_START, end = SERVICE_DAY_END) {
  const slots: Array<{ value: string; label: string }> = [];
  for (let h = start; h < end; h += 1) {
    const next = h + 1;
    const value = `${String(h).padStart(2, "0")}:00`;
    slots.push({ value, label: `${formatHourLabel(h)} – ${formatHourLabel(next)}` });
  }
  return slots;
}

function formatHourLabel(hour: number) {
  const normalized = ((hour + 11) % 12) + 1;
  const period = hour >= 12 ? "PM" : "AM";
  return `${normalized}:00 ${period}`;
}

function formatPrice(amount: number) {
  const formatter = new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 });
  return formatter.format(Number(amount) || 0);
}

function formatDateTime(value?: string) {
  if (!value) return "";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "";
  }
}

function toDateInputValue(value?: string) {
  if (!value) return "";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return "";
    return date.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function renderStars(rating: number) {
  const rounded = Math.round((rating || 0) * 2) / 2;
  return (
    <span className="text-warning">
      {[1, 2, 3, 4, 5].map((idx) => {
        const diff = rounded - idx;
        if (diff >= 0) return <i key={idx} className="bi bi-star-fill me-1" />;
        if (diff === -0.5) return <i key={idx} className="bi bi-star-half me-1" />;
        return <i key={idx} className="bi bi-star me-1" />;
      })}
    </span>
  );
}

const bookingSlots = createHourlySlots();

export default function MentorshipLayer() {
  const [query, setQuery] = useState("");
  const [expertise, setExpertise] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const navigate = useNavigate();

  const { listings, isLoading, isFetching, fallback, error, refetch } = useMentorshipListings({ query, expertise });

  const { data: mySubscriptions = [], refetch: refetchSubscriptions } = useQuery({
    queryKey: ["myMentorshipSubscriptions", auth.currentUser?.uid || auth.currentUser?.email || "anon"],
    enabled: !!auth.currentUser,
    queryFn: async () => {
      if (!auth.currentUser) return [];
      return await fetchMySubscriptions();
    },
    staleTime: 1000 * 60,
  });

  const subscribedServices = useMemo(() => {
    const set = new Set<string>();
    mySubscriptions
      .filter((sub: any) => (sub?.type || "service") === "service" && !sub?.canceledAt)
      .forEach((sub: any) => set.add(String(sub.serviceId || "")));
    return set;
  }, [mySubscriptions]);

  const expertiseOptions = useMemo(() => {
    const tags = new Set<string>();
    listings.forEach((item) => {
      item.expertise.forEach((tag) => {
        const trimmed = tag.trim();
        if (trimmed) tags.add(trimmed);
      });
    });
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  }, [listings]);

  const [bookingForm, setBookingForm] = useState<BookingFormState>({
    open: false,
    listing: null,
    date: "",
    slot: "",
    busy: false,
    error: "",
  });

  useEffect(() => {
    if (!bookingForm.open) return;
    setBookingForm((prev) => ({ ...prev, error: "" }));
  }, [bookingForm.open]);

  function openBookingModal(listing: MentorListing) {
    if (!auth.currentUser) {
      toast.info("Please sign in to book mentorship sessions.");
      navigate("/login", { replace: false, state: { from: { pathname: "/mentorship" } } });
      return;
    }
    const presetDate = toDateInputValue(listing.nextSessionDate);
    setBookingForm({
      open: true,
      listing,
      date: presetDate,
      slot: "",
      busy: false,
      error: "",
    });
  }

  async function submitBooking() {
    if (!bookingForm.listing) return;
    if (!bookingForm.date || !bookingForm.slot) {
      setBookingForm((prev) => ({ ...prev, error: "Please select a date and time slot." }));
      return;
    }
    setBookingForm((prev) => ({ ...prev, busy: true, error: "" }));
    try {
      await subscribeToService(bookingForm.listing.serviceId, {
        scheduledDate: bookingForm.date,
        scheduledSlot: bookingForm.slot,
      });
      setBookingForm({ open: false, listing: null, date: "", slot: "", busy: false, error: "" });
      setSuccessMessage(`✅ Session booked with ${bookingForm.listing.mentorName} on ${new Date(`${bookingForm.date}T00:00:00`).toLocaleDateString()} at ${bookingForm.slot}.`);
      setAlertMessage("");
      refetchSubscriptions();
      refetch();
    } catch (err: any) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message || err?.message || "Failed to book mentorship session.";
      if (status === 400 && message?.includes("scheduled")) {
        setBookingForm((prev) => ({ ...prev, error: "This mentor requires a date and time slot. Please complete both fields." }));
      } else {
        setBookingForm((prev) => ({ ...prev, error: message || "Unable to complete booking." }));
      }
    } finally {
      setBookingForm((prev) => ({ ...prev, busy: false }));
    }
  }

  const showEmpty = !isLoading && !isFetching && listings.length === 0;

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body">
        <div className="d-flex flex-column flex-lg-row align-items-lg-center gap-3 mb-4">
          <div className="flex-grow-1">
            <label htmlFor="mentor-search" className="form-label fw-semibold text-uppercase text-muted small mb-1">
              Search mentors
            </label>
            <input
              id="mentor-search"
              type="search"
              className="form-control form-control-lg"
              placeholder="Search by mentor, topic, or company"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div style={{ minWidth: "220px" }}>
            <label htmlFor="mentor-expertise" className="form-label fw-semibold text-uppercase text-muted small mb-1">
              Expertise
            </label>
            <select
              id="mentor-expertise"
              className="form-select form-select-lg"
              value={expertise}
              onChange={(event) => setExpertise(event.target.value)}
            >
              <option value="">All specialisations</option>
              {expertiseOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        {successMessage && (
          <div className="alert alert-success d-flex align-items-center" role="alert">
            <i className="bi bi-check-circle-fill me-2" />
            <div>{successMessage}</div>
            <button type="button" className="btn-close ms-auto" aria-label="Close" onClick={() => setSuccessMessage("")} />
          </div>
        )}

        {alertMessage && (
          <div className="alert alert-warning d-flex align-items-center" role="alert">
            <i className="bi bi-exclamation-circle-fill me-2" />
            <div>{alertMessage}</div>
            <button type="button" className="btn-close ms-auto" aria-label="Close" onClick={() => setAlertMessage("")} />
          </div>
        )}

        {error && (
          <div className="alert alert-danger" role="alert">
            Unable to load mentorship listings right now. Please try again shortly.
          </div>
        )}

        {fallback && !error && (
          <div className="alert alert-info" role="alert">
            Showing cached mentorship data while we refresh the latest listings.
          </div>
        )}

        {isLoading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
            <p className="mt-3 text-muted">Loading mentorship opportunities…</p>
          </div>
        )}

        {showEmpty && (
          <div className="py-5 text-center text-muted">
            <i className="bi bi-search fs-1 d-block mb-3" />
            <p className="mb-1 fw-semibold">No mentors match your filters yet.</p>
            <p className="mb-0">Try a different search term or clear your filters.</p>
          </div>
        )}

        <div className="row gy-4">
          {listings.map((mentor) => {
            const alreadyBooked = subscribedServices.has(mentor.serviceId);
            return (
              <div className="col-12 col-md-6 col-xl-4" key={mentor.serviceId}>
                <div className="card h-100 border-0 shadow-sm">
                  {mentor.imageUrl && (
                    <div className="ratio ratio-16x9">
                      <img src={mentor.imageUrl} className="card-img-top object-fit-cover" alt={mentor.title} loading="lazy" />
                    </div>
                  )}
                  <div className="card-body d-flex flex-column">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="badge text-bg-primary text-uppercase">Mentorship</span>
                      {mentor.rating > 0 && (
                        <small className="text-muted d-flex align-items-center">
                          {renderStars(mentor.rating)}
                          <span className="ms-1">{mentor.rating.toFixed(1)}</span>
                          {mentor.reviewCount > 0 && <span className="ms-2 text-muted">({mentor.reviewCount} reviews)</span>}
                        </small>
                      )}
                    </div>
                    <h5 className="card-title mb-1">{mentor.mentorName}</h5>
                    <p className="text-muted mb-2">{mentor.title}</p>
                    {mentor.expertise.length > 0 && (
                      <div className="mb-2">
                        {mentor.expertise.slice(0, 4).map((tag) => (
                          <span key={tag} className="badge text-bg-light border me-1 mb-1">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-secondary small flex-grow-1">{mentor.description || "Book a one-on-one session tailored to your startup needs."}</p>
                    {mentor.nextSessionDate && (
                      <small className="text-muted d-block mt-1">
                        Next availability: {formatDateTime(mentor.nextSessionDate)}
                      </small>
                    )}
                    <div className="d-flex align-items-center justify-content-between mt-3">
                      <div>
                        <div className="fw-semibold text-dark">{formatPrice(mentor.price)}</div>
                        <small className="text-muted">Per session</small>
                      </div>
                      <div className="d-flex flex-column align-items-end">
                        <button
                          className="btn btn-primary"
                          disabled={alreadyBooked}
                          onClick={() => openBookingModal(mentor)}
                        >
                          {alreadyBooked ? "Already booked" : "Book session"}
                        </button>
                        <Link
                          to={`/marketplace-details?id=${encodeURIComponent(mentor.serviceId)}`}
                          className="btn btn-link btn-sm p-0 mt-2"
                        >
                          View booking details
                        </Link>
                        {mentor.meetingLink && (
                          <a
                            href={mentor.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-link btn-sm p-0 mt-1"
                          >
                            Open meeting link
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal show={bookingForm.open} onHide={() => setBookingForm((prev) => ({ ...prev, open: false }))} centered>
        <Modal.Header closeButton>
          <Modal.Title>Schedule mentorship session</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {bookingForm.listing && (
            <>
              <p className="mb-3">
                Booking with <strong>{bookingForm.listing.mentorName}</strong>
              </p>
              <div className="mb-3">
                <label className="form-label">Preferred date</label>
                <input
                  type="date"
                  className="form-control"
                  min={new Date().toISOString().slice(0, 10)}
                  value={bookingForm.date}
                  onChange={(event) => setBookingForm((prev) => ({ ...prev, date: event.target.value }))}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Time slot</label>
                <select
                  className="form-select"
                  value={bookingForm.slot}
                  onChange={(event) => setBookingForm((prev) => ({ ...prev, slot: event.target.value }))}
                >
                  <option value="">Select a time</option>
                  {bookingSlots.map((slot) => (
                    <option key={slot.value} value={slot.value}>
                      {slot.label}
                    </option>
                  ))}
                </select>
              </div>
              {bookingForm.error && <div className="alert alert-danger">{bookingForm.error}</div>}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button
            className="btn btn-outline-secondary"
            onClick={() => setBookingForm((prev) => ({ ...prev, open: false }))}
            disabled={bookingForm.busy}
          >
            Cancel
          </button>
          <button className="btn btn-primary" onClick={submitBooking} disabled={bookingForm.busy}>
            {bookingForm.busy ? (
              <span className="spinner-border spinner-border-sm me-2" role="status" />
            ) : null}
            Confirm booking
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
