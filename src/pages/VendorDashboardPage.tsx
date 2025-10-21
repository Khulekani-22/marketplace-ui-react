import ChatMessageLayer from '../components/ChatMessageLayer';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import React, { useEffect, useState, useMemo } from "react";
import { Modal } from "react-bootstrap";
import MasterLayout from "../masterLayout/MasterLayout";
import { useVendor } from "../context/useVendor";
import { api } from "../lib/api";
import { useAppSync } from "../context/useAppSync";
import { Link } from "react-router-dom";

interface Booking {
	id: string;
	serviceId?: string;
	serviceTitle?: string;
	userName?: string;
	userEmail?: string;
	scheduledDate?: string;
	scheduledSlot?: string;
	meetingLink?: string;
}

interface Listing {
	id?: string;
	vendorId?: string;
	title?: string;
	category?: string;
	price?: number;
	status?: string;
	imageUrl?: string;
	reviewCount?: number;
	rating?: number;
}

interface Vendor {
	vendorId?: string;
	id?: string;
	ownerUid?: string;
	email?: string;
	name?: string;
	subscriptionPlan?: string;
	status?: string;
	kycStatus?: string;
	walletBalance?: number;
}

export default function VendorDashboardPage() {
	// Chat modal state
	const [chatModal, setChatModal] = useState<{ open: boolean, userEmail?: string, userName?: string }>({ open: false });
	// Calendar helpers: get booking dates as Date objects and bookings for a date


		// --- State declarations at top ---
		const { vendor } = useVendor?.() || { vendor: null };
		const typedVendor: Vendor | null = vendor as Vendor | null;
		const vendorId = typedVendor?.vendorId || typedVendor?.id || typedVendor?.ownerUid || typedVendor?.email || "me";
		const [bookings, setBookings] = useState<Booking[]>([]);
		const [meetingModal, setMeetingModal] = useState<{ open: boolean, booking: Booking | null, link: string, busy: boolean, error: string }>({ open: false, booking: null, link: '', busy: false, error: '' });
		const [err, setErr] = useState("");
		const [loading, setLoading] = useState(false);
		const [myListings, setMyListings] = useState<Listing[]>([]);
		const [wallet, setWallet] = useState<number>(0);
		const [stats, setStats] = useState<any>(null);
		const { appData } = useAppSync();

		// --- Calendar helpers directly after state ---
		const bookingDates = useMemo(() =>
			bookings
				.filter((b: Booking) => b.scheduledDate)
				.map((b: Booking) => new Date(b.scheduledDate as string)),
			[bookings]
		);

		function bookingsForDate(date: Date) {
			return bookings.filter((b: Booking) => {
				if (!b.scheduledDate) return false;
				const d = new Date(b.scheduledDate);
				return d.toDateString() === date.toDateString();
			});
		}

       // Fetch vendor dashboard stats (summary), bookings, and listings
       useEffect(() => {
	       (async () => {
		       if (!vendorId) return;
		       setLoading(true);
		       try {
			       // Summary stats
			       const statsResp = await api.get(`/api/vendors/${encodeURIComponent(vendorId)}/stats`);
			       setStats(statsResp.data || {});

			       // Listings
			       let listingsResp;
			       try {
				       listingsResp = await api.get(`/api/listings/vendor/${encodeURIComponent(vendorId)}`);
			       } catch {
				       listingsResp = { data: { listings: [] } };
			       }
			       setMyListings(Array.isArray(listingsResp.data?.listings) ? listingsResp.data.listings : []);

			       // Bookings
			       let bookingsResp;
			       try {
				       bookingsResp = await api.get(`/api/bookings/vendor/${encodeURIComponent(vendorId)}`);
			       } catch {
				       // fallback: try /api/subscriptions/bookings/mine
				       try {
					       bookingsResp = await api.get(`/api/subscriptions/bookings/mine`);
				       } catch {
					       bookingsResp = { data: { bookings: [] } };
				       }
			       }
			       setBookings(Array.isArray(bookingsResp.data?.bookings) ? bookingsResp.data.bookings : []);

			       // Wallet (from stats, fallback 0)
			       setWallet(Number(statsResp.data?.bookingStats?.revenue || 0));
		       } catch (e) {
			       setErr("Failed to load dashboard data");
		       }
		       setLoading(false);
	       })();
       }, [vendorId]);

	// Metrics
	const metrics = useMemo(() => {
		return [
			{ label: "Total Listings", value: myListings.length, icon: "bi bi-collection" },
			{ label: "Total Bookings", value: bookings.length, icon: "bi bi-calendar-check" },
			{ label: "Wallet Balance", value: `R${wallet.toLocaleString()}`, icon: "bi bi-wallet2" },
			{ label: "Avg. Rating", value: myListings.length ? (myListings.reduce((acc, l) => acc + (l.rating || 0), 0) / myListings.length).toFixed(2) : "—", icon: "bi bi-star-fill" },
		];
	}, [myListings, bookings, wallet]);

	// Bookings by service
	const bookingsByService = useMemo(() => {
		const map: Record<string, number> = {};
		bookings.forEach((b) => {
			const sid = String(b.serviceId || "");
			if (!sid) return;
			map[sid] = (map[sid] || 0) + 1;
		});
		return map;
	}, [bookings]);

		async function saveMeetingLink() {
			if (!meetingModal.booking) return;
			setMeetingModal((prev) => ({ ...prev, busy: true, error: '' }));
			try {
				await api.post(`/api/bookings/${encodeURIComponent(meetingModal.booking.id)}/meeting-link`, { link: meetingModal.link });
				setMeetingModal({ open: false, booking: null, link: '', busy: false, error: '' });
				// Refresh bookings
				const resp = await api.get(`/api/bookings/vendor/${encodeURIComponent(vendorId)}`);
				setBookings(Array.isArray(resp.data?.bookings) ? resp.data.bookings : []);
			} catch (e: any) {
				setMeetingModal((prev) => ({ ...prev, error: e?.message || 'Failed to save link', busy: false }));
			}
		}

	return (
		<MasterLayout>
			<div className="container py-4">
				<h2 className="mb-4">Vendor Dashboard</h2>
				{err && <div className="alert alert-danger">{err}</div>}


						{/* Metrics Row */}
						<div className="row g-3 mb-4">
							{metrics.map((m, idx) => (
								<div className="col-6 col-md-3" key={m.label}>
									<div className="card shadow-sm h-100 text-center p-3">
										<div className="mb-2"><i className={`${m.icon} fs-2 text-primary`}></i></div>
										<div className="fw-bold fs-4">{m.value}</div>
										<div className="text-muted small">{m.label}</div>
									</div>
								</div>
							))}
						</div>

						{/* Calendar View for Bookings */}
						<div className="mb-4">
							<div className="card">
								<div className="card-header d-flex align-items-center">
									<i className="bi bi-calendar-event me-2"></i>
									<span>Upcoming Bookings Calendar</span>
								</div>
								<div className="card-body">
									<Calendar
														tileContent={({ date, view }: { date: Date; view: string }) => {
															if (view === 'month') {
																const dayBookings = bookingsForDate(date);
																if (dayBookings.length > 0) {
																	return <span className="d-block text-primary" style={{ fontSize: 18 }}>•</span>;
																}
															}
															return null;
														}}
														tileClassName={({ date, view }: { date: Date; view: string }) => {
															if (view === 'month') {
																const hasBooking = bookingDates.some((d: Date) => d.toDateString() === date.toDateString());
																return hasBooking ? 'bg-light border border-primary' : undefined;
															}
															return undefined;
														}}
									/>
									<div className="small text-muted mt-2">• Dates with bookings are highlighted.</div>
								</div>
							</div>
						</div>

				{/* Listings Overview */}
				<div className="card mb-4">
					<div className="card-header d-flex justify-content-between align-items-center">
						<h6 className="mb-0">My Listings</h6>
						<Link to="/listings-vendors-mine" className="btn btn-sm btn-outline-primary">Manage Listings</Link>
					</div>
					<div className="card-body p-0">
						{!myListings.length && <div className="p-3 text-muted">No listings yet.</div>}
						{!!myListings.length && (
							<div className="table-responsive">
								<table className="table align-middle mb-0">
									<thead>
										<tr>
											<th style={{ width: 72 }}></th>
											<th>Title</th>
											<th>Category</th>
											<th>Price</th>
											<th>Status</th>
											<th>Bookings</th>
											<th>Rating</th>
										</tr>
									</thead>
									<tbody>
										{myListings.map((i, idx) => {
											const serviceKey = String(i.id || i.vendorId || "");
											return (
												<tr key={serviceKey || idx}>
													<td>
														<img
															src={i.imageUrl || "/assets/images/placeholder-4x3.png"}
															alt=""
															style={{ width: 64, height: 40, objectFit: "cover", borderRadius: 6 }}
														/>
													</td>
													<td className="fw-semibold">{i.title}</td>
													<td>{i.category || "—"}</td>
													<td>R{Number(i.price || 0).toLocaleString()}</td>
													<td><span className={`badge text-bg-${(i.status || "pending").toLowerCase() === "approved" ? "success" : (i.status || "pending").toLowerCase() === "pending" ? "warning" : "danger"}`}>{i.status || "pending"}</span></td>
													<td>{bookingsByService[serviceKey] || 0}</td>
													<td>{typeof i.rating === "number" ? i.rating.toFixed(1) : "—"}</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						)}
					</div>
				</div>

				{/* Bookings Management */}
				<div className="card mb-4">
					<div className="card-header d-flex justify-content-between align-items-center">
						<h6 className="mb-0">Bookings</h6>
						<span className="badge text-bg-secondary">Total: {bookings.length}</span>
					</div>
					<div className="card-body p-0">
						{!bookings.length && <div className="p-3 text-muted">No bookings yet. Once customers reserve sessions, they will appear here.</div>}
						{!!bookings.length && (
							<div className="table-responsive">
								<table className="table align-middle mb-0">
									<thead>
										<tr>
											<th>Service</th>
											<th>User</th>
											<th>Date</th>
											<th>Slot</th>
											<th>Meeting Link</th>
											<th></th>
										</tr>
									</thead>
									<tbody>
															{bookings.map((b, idx) => (
																<tr key={b.id || idx}>
																	<td>{b.serviceTitle || "—"}</td>
																	<td>{b.userName || b.userEmail || "—"}</td>
																	<td>{b.scheduledDate || "—"}</td>
																	<td>{b.scheduledSlot || "—"}</td>
																	<td>{b.meetingLink ? <a href={b.meetingLink} target="_blank" rel="noopener noreferrer">Join</a> : <span className="text-muted">None</span>}</td>
																	<td className="d-flex gap-2">
																		<button className="btn btn-sm btn-outline-primary" onClick={() => setMeetingModal({ open: true, booking: b, link: b.meetingLink || '', busy: false, error: '' })}>
																			{b.meetingLink ? 'Edit Link' : 'Add Link'}
																		</button>
																		<button className="btn btn-sm btn-outline-success" onClick={() => setChatModal({ open: true, userEmail: b.userEmail, userName: b.userName })} disabled={!b.userEmail}>
																			Message
																		</button>
																	</td>
																</tr>
															))}
			{/* Chat Modal for Booking Messaging */}
			<Modal show={chatModal.open} onHide={() => setChatModal({ open: false })} centered size="lg">
				<Modal.Header closeButton>
					<Modal.Title>Message {chatModal.userName || chatModal.userEmail || 'User'}</Modal.Title>
				</Modal.Header>
				<Modal.Body style={{ minHeight: 400 }}>
					{/* You can pass props to ChatMessageLayer if it supports targeting a user */}
					<ChatMessageLayer userEmail={chatModal.userEmail} userName={chatModal.userName} />
				</Modal.Body>
			</Modal>
									</tbody>
								</table>
							</div>
						)}
					</div>
				</div>

				{/* Meeting Link Modal */}
				<Modal show={meetingModal.open} onHide={() => setMeetingModal({ open: false, booking: null, link: '', busy: false, error: '' })} centered>
					<Modal.Header closeButton>
						<Modal.Title>{meetingModal.booking?.meetingLink ? 'Edit Meeting Link' : 'Add Meeting Link'}</Modal.Title>
					</Modal.Header>
					<Modal.Body>
						<div className="mb-2">Service: <strong>{meetingModal.booking?.serviceTitle}</strong></div>
						<div className="mb-2">User: <strong>{meetingModal.booking?.userName || meetingModal.booking?.userEmail}</strong></div>
						<input type="url" className="form-control mb-3" placeholder="Paste Zoom/Google Meet/MS Teams link" value={meetingModal.link} onChange={e => setMeetingModal(prev => ({ ...prev, link: e.target.value }))} />
						{meetingModal.error && <div className="alert alert-danger py-2">{meetingModal.error}</div>}
						<button className="btn btn-primary" disabled={meetingModal.busy || !meetingModal.link} onClick={saveMeetingLink}>
							{meetingModal.busy ? 'Saving…' : 'Save Link'}
						</button>
					</Modal.Body>
				</Modal>

			</div>
		</MasterLayout>
	);
}
