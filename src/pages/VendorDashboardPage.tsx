import ChatMessageLayer from '../components/ChatMessageLayer';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import React, { useMemo, useCallback, useState } from "react";
import { useQuery } from 'react-query';
import { Modal } from "react-bootstrap";
import MasterLayout from "../masterLayout/MasterLayout";
import { useVendor } from "../context/useVendor";
import { useWallet } from "../hook/useWalletAxios";
import { api } from "../lib/api";
import { fetchMyVendorListings } from "../lib/listings";
import { Link } from "react-router-dom";

interface Booking {
	id: string;
	serviceId?: string;
	serviceTitle?: string;
	userName?: string;
	userEmail?: string;
	customerId?: string;
	customerEmail?: string;
	scheduledDate?: string;
	scheduledSlot?: string;
	meetingLink?: string;
}

interface Listing {
	id?: string;
	vendorId?: string;
	title?: string;
	reviewCount?: number;
	rating?: number;
	category?: string;
	price?: number;
	status?: string;
	imageUrl?: string;
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
	// Top-level hooks and state
	const { vendor } = useVendor?.() || { vendor: null };
	const typedVendor: Vendor | null = vendor as Vendor | null;
	const { wallet, loading: walletLoading, eligible: walletEligible, error: walletError } = useWallet();
	const [chatModal, setChatModal] = useState<{ open: boolean, userEmail?: string, userName?: string }>({ open: false });
	const [meetingModal, setMeetingModal] = useState<{ open: boolean, booking: Booking | null, link: string, busy: boolean, error: string }>({ open: false, booking: null, link: '', busy: false, error: '' });
			// React Query: Fetch listings and bookings
			const listingsTarget = typedVendor?.vendorId || typedVendor?.id || typedVendor?.ownerUid || typedVendor?.email;
			const listingsQueryKey = useMemo(() => ['vendorListingsBookings', listingsTarget], [listingsTarget]);
			const listingsQueryFn = useCallback(async () => {
				if (!typedVendor) return { listings: [], bookings: [] };
				return await fetchMyVendorListings({});
			}, [typedVendor]);

			const {
				data: listingsBookingsData = { listings: [], bookings: [] },
				error: listingsBookingsError,
				isLoading: listingsBookingsLoading,
				refetch: refetchListingsBookings
			} = useQuery(listingsQueryKey, listingsQueryFn, {
				enabled: !!listingsTarget,
			});

			const myListings: Listing[] = useMemo(() => {
				const incoming = listingsBookingsData?.listings;
				return Array.isArray(incoming) ? incoming : [];
			}, [listingsBookingsData]);

			const bookings: Booking[] = useMemo(() => {
				const incoming = listingsBookingsData?.bookings;
				return Array.isArray(incoming) ? incoming : [];
			}, [listingsBookingsData]);

			// Error message for display
			const err = useMemo(() => {
				if (!listingsBookingsError) return "";
				if (typeof listingsBookingsError === 'object' && 'message' in listingsBookingsError) {
					return String((listingsBookingsError as any).message || "");
				}
				return listingsBookingsError?.toString?.() || "";
			}, [listingsBookingsError]);

			// Calendar helpers
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

			// Metrics
			const metrics = useMemo(() => {
				return [
					{ label: "Total Listings", value: myListings.length, icon: "bi bi-collection" },
					{ label: "Total Bookings", value: bookings.length, icon: "bi bi-calendar-check" },
					{ label: "Wallet Balance", value: walletEligible && wallet ? `R${Number(wallet?.balance ?? 0).toLocaleString()}` : walletLoading ? "Loading…" : walletError ? "Error" : "—", icon: "bi bi-wallet2" },
					{ label: "Avg. Rating", value: myListings.length ? (myListings.reduce((acc: number, l: Listing) => acc + (l.rating || 0), 0) / myListings.length).toFixed(2) : "—", icon: "bi bi-star-fill" },
				];
			}, [myListings, bookings, wallet, walletEligible, walletLoading, walletError]);


	// Bookings by service
	const bookingsByService = useMemo(() => {
		const map: Record<string, number> = {};
		bookings.forEach((b: Booking) => {
			const sid = String(b.serviceId || "");
			if (!sid) return;
			map[sid] = (map[sid] || 0) + 1;
		});
		return map;
	}, [bookings]);

		async function saveMeetingLink() {
			if (!meetingModal.booking) return;
			setMeetingModal((prev: typeof meetingModal) => ({ ...prev, busy: true, error: '' }));
			try {
				await api.post(`/api/bookings/${encodeURIComponent(meetingModal.booking.id)}/meeting-link`, { link: meetingModal.link });
				setMeetingModal({ open: false, booking: null, link: '', busy: false, error: '' });
				refetchListingsBookings();
			} catch (e: any) {
				setMeetingModal((prev: typeof meetingModal) => ({ ...prev, error: e?.message || 'Failed to save link', busy: false }));
			}
		}

	return (
		<MasterLayout>
			<div className="container py-4">
				<h2 className="mb-4">Vendor Dashboard</h2>
				{err && <div className="alert alert-danger">{err}</div>}
				{listingsBookingsLoading && !err && (
					<div className="alert alert-info">Loading your latest listings and bookings…</div>
				)}


						{/* Wallet eligibility and error display */}
						{walletEligible && wallet && (
							<div className="alert alert-primary d-flex justify-content-between align-items-center mb-3">
								<span>
									<strong>My Wallet:</strong> {Number(wallet?.balance ?? 0).toLocaleString()} credits available.
								</span>
								<Link className="btn btn-sm btn-outline-light" to="/wallet">View wallet</Link>
							</div>
						)}
						{!walletEligible && (
							<div className="alert alert-warning mb-3">My Wallet is only available to startup, vendor, and admin accounts.</div>
						)}
						{walletError && (
							<div className="alert alert-danger mb-3">Failed to load wallet: {String(walletError)}</div>
						)}
						{/* Metrics Row */}
						<div className="row g-3 mb-4">
									{metrics.map((m) => (
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



				{/* Bookings Management */}
				<div className="card mb-4">
					<div className="card-header d-flex justify-content-between align-items-center">
						<h6 className="mb-0">Bookings</h6>
						<span className="badge text-bg-secondary">Total: {bookings.length}</span>
					</div>
					<div className="card-body p-0">
						{/* Booking notes error removed: now handled by React Query or not shown */}
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
											<th>Session Notes</th>
											<th>Meeting Link</th>
											<th></th>
										</tr>
									</thead>
									<tbody>
															{bookings.map((b: Booking) => (
																<tr key={b.id || `${b.serviceId || 'svc'}-${b.scheduledDate || 'date'}-${b.scheduledSlot || 'slot'}` }>
																	<td>{b.serviceTitle || "—"}</td>
																	<td>{b.userName || b.userEmail || "—"}</td>
																	<td>{b.scheduledDate || "—"}</td>
																	<td>{b.scheduledSlot || "—"}</td>
																	<td style={{ minWidth: 200, maxWidth: 280 }}>
																		{(() => {
																			// Booking notes removed: now handled by React Query or not shown
																			return <span className="text-muted">—</span>;
																		})()}
																	</td>
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
										{myListings.map((i: Listing) => {
											const serviceKey = String(i.id || i.vendorId || "");
											const listingRowKey = serviceKey || `listing-${i.title || 'untitled'}-${i.category || 'category'}`;
											return (
												<tr key={listingRowKey}>
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

			</div>
		</MasterLayout>
	);
}
