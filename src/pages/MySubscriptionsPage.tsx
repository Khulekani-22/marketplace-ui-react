import { useState } from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import { Modal } from "react-bootstrap";

// Types you likely already have:
type Booking = {
  id: string;
  serviceId: string | number;
  serviceTitle: string;
  vendorName?: string;
  scheduledDate?: string;
  scheduledSlot?: string;
  meetingLink?: string;
  status?: string;
  price?: number;
};

type Service = {
  id: string | number;
  title?: string;
  vendor?: string;
  category?: string;
  description?: string;
  imageUrl?: string;
  price?: number;
  rating?: number;
};

// --- Meeting link modal state
const initialMeetingState = {
  open: false,
  booking: null as Booking | null,
  link: "",
  busy: false,
  error: "",
};

export default function MySubscriptionsAndBookings() {
  // Assumed existing state/values in your file:
  const [activeTab, setActiveTab] = useState<"subscriptions" | "bookings">("subscriptions");
  const [items, setItems] = useState<Service[]>([]);
  const [subscriptions, setSubscriptions] = useState<
    Array<{ serviceId: string | number; scheduledDate?: string; scheduledSlot?: string }>
  >([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState("");
  const [busyMap, setBusyMap] = useState<Record<string, boolean>>({});

  const [detailsModal, setDetailsModal] = useState<{ open: boolean; service: Service | null }>({
    open: false,
    service: null,
  });

  const [reviewModal, setReviewModal] = useState<{
    open: boolean;
    service: Service | null;
    rating: number;
    comment: string;
    busy: boolean;
    error: string;
  }>({ open: false, service: null, rating: 0, comment: "", busy: false, error: "" });

  const [meetingModal, setMeetingModal] = useState(initialMeetingState);

  // --- Helpers you referenced (stub or import yours)
  const formatDate = (d: string) => new Date(d).toLocaleDateString();
  const formatSlot = (s: string) => s;
  const getStatusBadgeClass = (status?: string) => {
    const v = (status || "").toLowerCase();
    if (v === "cancelled") return "bg-danger";
    if (v === "completed") return "bg-success";
    return "bg-info";
  };
  const renderStars = (n: number) => "★".repeat(Math.round(n));
  const submitReview = async () => { /* your impl */ };
  const loadSubscriptions = async (_opts?: { silent?: boolean }) => { /* your impl */ };
  const handleUnsubscribe = async (_serviceId: string | number) => { /* your impl */ };

  // --- Your API post (swap with your api instance)
  async function saveMeetingLink() {
    if (!meetingModal.booking) return;
    setMeetingModal((prev) => ({ ...prev, busy: true, error: "" }));
    try {
      const id = encodeURIComponent(meetingModal.booking.id);
      await fetch(`/api/bookings/${id}/meeting-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link: meetingModal.link }),
      });
      setMeetingModal(initialMeetingState);
      await loadSubscriptions({ silent: true });
      alert("Meeting link saved!");
    } catch (e: any) {
      setMeetingModal((prev) => ({
        ...prev,
        error: e?.message || "Failed to save link",
        busy: false,
      }));
    }
  }

  return (
    <MasterLayout>
      <Breadcrumb title="My Subscriptions & Bookings" />

      <div className="card">
        <div className="card-header border-bottom py-16 px-24">
          <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
            <div className="d-flex gap-2">
              <button
                type="button"
                className={`btn btn-sm ${activeTab === "subscriptions" ? "btn-primary-600" : "btn-outline-primary"}`}
                onClick={() => setActiveTab("subscriptions")}
              >
                <i className="ri-shopping-cart-line me-1" />
                Subscriptions ({items.length})
              </button>

              <button
                type="button"
                className={`btn btn-sm ${activeTab === "bookings" ? "btn-primary-600" : "btn-outline-primary"}`}
                onClick={() => setActiveTab("bookings")}
              >
                <i className="ri-calendar-check-line me-1" />
                Bookings ({bookings.length})
              </button>
            </div>

            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => loadSubscriptions({ silent: true })}
              disabled={loading || refreshing}
            >
              {refreshing ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
                  Refreshing…
                </>
              ) : (
                <>
                  <i className="ri-refresh-line me-1" />
                  Refresh
                </>
              )}
            </button>
          </div>
        </div>

        <div className="card-body">
          {err && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              <i className="ri-error-warning-line me-2" />
              {err}
              <button type="button" className="btn-close" onClick={() => setErr("")} aria-label="Close" />
            </div>
          )}

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary-600" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-secondary mt-3">Loading your {activeTab}...</p>
            </div>
          ) : (
            <>
              {/* Subscriptions Tab */}
              {activeTab === "subscriptions" && (
                <div className="row g-3">
                  {items.length === 0 && (
                    <div className="col-12 text-center py-5">
                      <i className="ri-shopping-cart-line display-4 text-secondary mb-3" />
                      <h5 className="text-secondary">No active subscriptions</h5>
                      <p className="text-muted">Browse the marketplace to subscribe to services</p>
                      <a href="/dashboard" className="btn btn-primary-600 mt-2">
                        <i className="ri-store-2-line me-1" />
                        Browse Marketplace
                      </a>
                    </div>
                  )}

                  {items.map((s) => {
                    const sub = subscriptions.find((t) => String(t.serviceId) === String(s.id));
                    const hasSchedule = !!(sub?.scheduledDate && sub?.scheduledSlot);
                    return (
                      <div className="col-12 col-md-6 col-lg-4" key={String(s.id)}>
                        <div className="card h-100 shadow-sm hover-shadow">
                          {s.imageUrl && (
                            <img
                              src={s.imageUrl}
                              className="card-img-top"
                              alt={s.title || "Listing"}
                              style={{ height: 180, objectFit: "cover" }}
                            />
                          )}
                          <div className="card-body d-flex flex-column">
                            <h6 className="card-title mb-2">{s.title || "Listing"}</h6>
                            <div className="text-muted small mb-2">
                              <i className="ri-building-line me-1" />
                              {s.vendor || "Unknown Vendor"}
                            </div>
                            <div className="text-muted small mb-2">
                              <i className="ri-price-tag-3-line me-1" />
                              {s.category || "General"}
                            </div>

                            {s.description && (
                              <p className="flex-grow-1 text-secondary small mb-3">
                                {s.description.slice(0, 120)}
                                {s.description.length > 120 ? "…" : ""}
                              </p>
                            )}

                            {hasSchedule && (
                              <div className="alert alert-info alert-sm p-2 mb-3">
                                <i className="ri-calendar-line me-1" />
                                <small>
                                  <strong>Next Session:</strong>
                                  <br />
                                  {formatDate(sub!.scheduledDate!)} at {formatSlot(sub!.scheduledSlot!)}
                                </small>
                              </div>
                            )}

                            <div className="d-flex justify-content-between align-items-center mt-auto pt-2 border-top">
                              <div>
                                <strong className="text-primary-600">
                                  R {Number(s.price || 0).toLocaleString()}
                                </strong>
                                {!!s.rating && (
                                  <div className="small text-muted">
                                    <i className="ri-star-fill text-warning" /> {Number(s.rating).toFixed(1)}
                                  </div>
                                )}
                              </div>

                              <div className="d-flex gap-2">
                                <button
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => setDetailsModal({ open: true, service: s })}
                                >
                                  <i className="ri-eye-line me-1" />
                                  View Details
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-success"
                                  onClick={() =>
                                    setReviewModal({
                                      open: true,
                                      service: s,
                                      rating: 0,
                                      comment: "",
                                      busy: false,
                                      error: "",
                                    })
                                  }
                                >
                                  <i className="ri-star-line me-1" />
                                  Review
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleUnsubscribe(s.id)}
                                  disabled={!!busyMap[String(s.id)]}
                                >
                                  {busyMap[String(s.id)] ? (
                                    <>
                                      <span className="spinner-border spinner-border-sm me-1" role="status" />
                                      Removing…
                                    </>
                                  ) : (
                                    <>
                                      <i className="ri-close-circle-line me-1" />
                                      Unsubscribe
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Bookings Tab */}
              {activeTab === "bookings" && (
                <div className="row g-3">
                  {bookings.length === 0 && (
                    <div className="col-12 text-center py-5">
                      <i className="ri-calendar-check-line display-4 text-secondary mb-3" />
                      <h5 className="text-secondary">No bookings found</h5>
                      <p className="text-muted">Book service sessions to see them here</p>
                      <a href="/dashboard" className="btn btn-primary-600 mt-2">
                        <i className="ri-calendar-event-line me-1" />
                        Book a Session
                      </a>
                    </div>
                  )}

                  {bookings.map((booking) => (
                    <div className="col-12 col-md-6 col-lg-4" key={booking.id}>
                      <div className="card h-100 shadow-sm hover-shadow">
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <h6 className="card-title mb-0">{booking.serviceTitle}</h6>
                            <span className={`badge ${getStatusBadgeClass(booking.status)}`}>
                              {booking.status || "Scheduled"}
                            </span>
                          </div>

                          {booking.vendorName && (
                            <div className="text-muted small mb-2">
                              <i className="ri-building-line me-1" />
                              {booking.vendorName}
                            </div>
                          )}

                          {booking.scheduledDate && (
                            <div className="mb-2">
                              <div className="d-flex align-items-center text-primary-600 mb-1">
                                <i className="ri-calendar-event-fill me-2" />
                                <strong>{formatDate(booking.scheduledDate)}</strong>
                              </div>
                              {booking.scheduledSlot && (
                                <div className="d-flex align-items-center text-muted ms-4">
                                  <i className="ri-time-line me-2" />
                                  {formatSlot(booking.scheduledSlot)}
                                </div>
                              )}
                            </div>
                          )}

                          {!!booking.price && booking.price > 0 && (
                            <div className="mb-2">
                              <i className="ri-money-dollar-circle-line me-1" />
                              <strong>R {Number(booking.price || 0).toLocaleString()}</strong>
                            </div>
                          )}

                          <div className="mt-3 pt-3 border-top">
                            <div className="d-flex gap-2">
                              <button
                                className="btn btn-sm btn-outline-primary flex-grow-1"
                                onClick={() =>
                                  (window.location.href = `/marketplace-details?id=${booking.serviceId}`)
                                }
                              >
                                <i className="ri-eye-line me-1" />
                                View Service
                              </button>

                              {booking.status?.toLowerCase() === "scheduled" && (
                                <>
                                  <button
                                    className="btn btn-sm btn-outline-info"
                                    onClick={() =>
                                      setMeetingModal({
                                        open: true,
                                        booking,
                                        link: booking.meetingLink || "",
                                        busy: false,
                                        error: "",
                                      })
                                    }
                                    title="Add meeting link"
                                  >
                                    <i className="ri-link" />
                                  </button>
                                  <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleUnsubscribe(booking.serviceId)}
                                    disabled={!!busyMap[String(booking.serviceId)]}
                                    title="Cancel booking"
                                  >
                                    <i className="ri-close-line" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Details Modal (render once) */}
      <Modal
        show={detailsModal.open}
        onHide={() => setDetailsModal({ open: false, service: null })}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Listing Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailsModal.service && (
            <div>
              <h5>{detailsModal.service.title}</h5>
              <div className="mb-2 text-muted">{detailsModal.service.vendor}</div>
              <div className="mb-2">Category: {detailsModal.service.category}</div>
              <div className="mb-2">
                Price: R {Number(detailsModal.service.price || 0).toLocaleString()}
              </div>
              <div className="mb-2">
                Rating: {renderStars(Number(detailsModal.service.rating || 0))}{" "}
                {Number(detailsModal.service.rating || 0).toFixed(1)}
              </div>
              <div className="mb-2">{detailsModal.service.description}</div>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Review Modal (render once) */}
      <Modal
        show={reviewModal.open}
        onHide={() =>
          setReviewModal({ open: false, service: null, rating: 0, comment: "", busy: false, error: "" })
        }
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Review Listing</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {reviewModal.service && (
            <div>
              <div className="mb-2">{reviewModal.service.title}</div>
              <div className="mb-3">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setReviewModal((prev) => ({ ...prev, rating: n }))}
                    className="btn btn-link p-0 me-1"
                    aria-label={`Rate ${n} stars`}
                  >
                    <span style={{ fontSize: 24, color: reviewModal.rating >= n ? "#f5a623" : "#ccc" }}>
                      ★
                    </span>
                  </button>
                ))}
              </div>
              <textarea
                className="form-control mb-3"
                rows={3}
                placeholder="Write a quick comment (optional)"
                value={reviewModal.comment}
                onChange={(e) =>
                  setReviewModal((prev) => ({ ...prev, comment: e.target.value }))
                }
              />
              {reviewModal.error && <div className="alert alert-danger py-2">{reviewModal.error}</div>}
              <button
                className="btn btn-primary"
                disabled={reviewModal.busy || reviewModal.rating < 1}
                onClick={submitReview}
              >
                {reviewModal.busy ? "Submitting…" : "Submit review"}
              </button>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Meeting Link Modal (render once) */}
      <Modal
        show={meetingModal.open}
        onHide={() => setMeetingModal(initialMeetingState)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Save Meeting Link</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {meetingModal.booking && (
            <div>
              <div className="mb-2">
                Service: <strong>{meetingModal.booking.serviceTitle}</strong>
              </div>
              <input
                type="text"
                className="form-control mb-3"
                placeholder="Paste meeting link here"
                value={meetingModal.link}
                onChange={(e) => setMeetingModal((prev) => ({ ...prev, link: e.target.value }))}
                disabled={meetingModal.busy}
              />
              {meetingModal.error && <div className="alert alert-danger py-2">{meetingModal.error}</div>}
              <button
                className="btn btn-primary"
                disabled={meetingModal.busy || !meetingModal.link}
                onClick={saveMeetingLink}
              >
                {meetingModal.busy ? "Saving…" : "Save Link"}
              </button>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </MasterLayout>
  );
}
