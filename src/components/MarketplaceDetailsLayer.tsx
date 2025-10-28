import { Icon } from "@iconify/react/dist/iconify.js";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../lib/api";
import useReactApexChart from "../hook/useReactApexChart";
import ReactApexChart from "react-apexcharts";
import { Link } from "react-router-dom";
import firestoreService from "../services/firestoreService";
import { auth } from "../firebase";

interface Booking {
  id: string;
  serviceId: string;
  serviceTitle?: string;
  vendorName?: string;
  vendor?: string;
  scheduledDate?: string;
  scheduledSlot?: string;
  status?: string;
  price?: number;
  bookedAt?: string;
  imageUrl?: string;
  meetingLink?: string;
}

const MarketplaceDetailsLayer = () => {
  let { timeSeriesChartSeries, timeSeriesChartOptions } = useReactApexChart();
  const [isStarred, setIsStarred] = useState(false);
  const toggleStar = () => {
    setIsStarred(!isStarred);
  };

  // Booking details state
  const [booking, setBooking] = useState<Booking | null>(null);
  // Booking notes state
  const [notes, setNotes] = useState<string>("");
  const [notesSaved, setNotesSaved] = useState(false);
  // Service details and reviews state
  const [service, setService] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  // Other vendor services state
  const [otherServices, setOtherServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const serviceId = params.get("id");
    if (!serviceId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    // Fetch booking
    api.get("/api/subscriptions/bookings/mine")
      .then(async ({ data }) => {
        if (Array.isArray(data?.bookings)) {
          const found = data.bookings.find((b: Booking) => String(b.serviceId) === String(serviceId));
          setBooking(found || null);
          // Load notes from Firestore
          if (found && auth.currentUser) {
            const userId = auth.currentUser.uid;
            const noteDocId = `${found.id}_${userId}`;
            const noteDoc = await firestoreService.getDocument("bookingNotes", noteDocId);
            setNotes((noteDoc && typeof noteDoc === "object" && "notes" in noteDoc) ? (noteDoc.notes as string) : "");
          } else {
            setNotes("");
          }
          // Fetch service details and reviews
          if (found) {
            api.get(`/api/data/services/${encodeURIComponent(found.serviceId)}`)
              .then(({ data: svcDetail }) => {
                setService(svcDetail?.service || null);
                const vendorId = svcDetail?.service?.vendorId;
                // Fetch two other services from the same vendor
                if (vendorId) {
                  api.get(`/api/data/services`, { params: { vendor: vendorId, pageSize: 3 } })
                    .then(({ data: svcList }) => {
                      // Exclude current service
                      const others = Array.isArray(svcList?.items)
                        ? svcList.items.filter((s: any) => String(s.id) !== String(found.serviceId)).slice(0, 2)
                        : [];
                      setOtherServices(others);
                    })
                    .catch(() => setOtherServices([]));
                } else {
                  setOtherServices([]);
                }
              })
              .catch(() => {
                setService(null);
                setOtherServices([]);
              });
            api.get(`/api/data/services/${encodeURIComponent(found.serviceId)}/reviews`)
              .then(({ data }) => setReviews(Array.isArray(data?.reviews) ? data.reviews : []))
              .catch(() => setReviews([]));
          } else {
            setOtherServices([]);
          }
        } else {
          setBooking(null);
          setOtherServices([]);
        }
      })
      .catch(() => {
        setBooking(null);
        setOtherServices([]);
      })
      .finally(() => setLoading(false));
  }, [location.search]);

  function handleNotesSave() {
    if (!booking || !auth.currentUser) return;
    const userId = auth.currentUser.uid;
    const noteDocId = `${booking.id}_${userId}`;
    firestoreService.updateDocument("bookingNotes", noteDocId, {
      bookingId: booking.id,
      userId,
      notes,
      updatedAt: new Date(),
    }).catch(async () => {
      // If doc doesn't exist, create it
      await firestoreService.addDocument("bookingNotes", {
        bookingId: booking.id,
        userId,
        notes,
        createdAt: new Date(),
        updatedAt: new Date(),
        id: noteDocId,
      });
    });
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 1500);
  }

  return (
    <>
      <div className='row gy-4'>
        {/* Booking details section */}
        <div className='col-12 mb-4'>
          {loading ? (
            <div className='alert alert-info'>Loading booking details…</div>
          ) : booking ? (
            <>
              <div className='card shadow-sm p-3 mb-3'>
                <h5 className='mb-2'>Booking Details</h5>
                <div className='mb-2'><strong>Service:</strong> {booking.serviceTitle || booking.serviceId}</div>
                <div className='mb-2'><strong>Vendor:</strong> {booking.vendorName || booking.vendor || "—"}</div>
                <div className='mb-2'><strong>Date:</strong> {booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString() : "—"}</div>
                <div className='mb-2'><strong>Time Slot:</strong> {booking.scheduledSlot || "—"}</div>
                <div className='mb-2'><strong>Status:</strong> {booking.status || "—"}</div>
                <div className='mb-2'><strong>Price:</strong> R {Number(booking.price || 0).toLocaleString()}</div>
                {booking.meetingLink ? (
                  <div className='mb-2'>
                    <strong>Meeting Link:</strong> <a href={booking.meetingLink} target='_blank' rel='noopener noreferrer'>{booking.meetingLink}</a>
                    <button className='btn btn-sm btn-outline-secondary ms-2' onClick={() => booking.meetingLink && navigator.clipboard.writeText(booking.meetingLink)}>Copy Link</button>
                  </div>
                ) : (
                  <div className='mb-2'><strong>Meeting Link:</strong> <span className='text-muted'>Not available yet</span></div>
                )}
                {/* Booking Notes Section */}
                <div className='mb-2 mt-3'>
                  <strong>Session Notes / Questions:</strong>
                  <textarea
                    className='form-control mt-2 mb-2'
                    rows={3}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder='Add notes or questions for your session…'
                    disabled={loading}
                  />
                  <button className='btn btn-sm btn-primary' onClick={handleNotesSave} disabled={loading || !booking}>
                    Save Notes
                  </button>
                  {notesSaved && <span className='ms-2 text-success'>Notes saved!</span>}
                </div>
              </div>
              {/* Service Details Section */}
              {service && (
                <div className='card shadow-sm p-3 mb-3'>
                  <h5 className='mb-2'>Service Details</h5>
                  <div className='mb-2'><strong>Title:</strong> {service.title}</div>
                  <div className='mb-2'><strong>Description:</strong> {service.description}</div>
                  <div className='mb-2'><strong>Category:</strong> {service.category}</div>
                  <div className='mb-2'><strong>Vendor:</strong> {service.vendor}</div>
                  <div className='mb-2'><strong>Price:</strong> R {Number(service.price || 0).toLocaleString()}</div>
                  <div className='mb-2'><strong>Rating:</strong> {Number(service.rating || 0).toFixed(1)}</div>
                </div>
              )}
              {/* Reviews Section */}
              <div className='card shadow-sm p-3 mb-3'>
                <h5 className='mb-2'>Reviews</h5>
                {reviews.length === 0 ? (
                  <div className='text-muted'>No reviews yet.</div>
                ) : (
                  <ul className='list-unstyled mb-0'>
                    {reviews.slice(0, 5).map((r, idx) => (
                      <li key={idx} className='mb-2'>
                        <strong>{r.author || "Anonymous"}</strong>: {r.comment || "No comment"}
                        <span className='ms-2 text-warning'>★ {Number(r.rating || 0).toFixed(1)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
                {/* Other Services from Vendor Section */}
                {otherServices.length > 0 && (
                  <div className='card shadow-sm p-3 mb-3'>
                    <h5 className='mb-2'>Other Services from this Vendor</h5>
                    <ul className='list-unstyled mb-0'>
                      {otherServices.map((svc: any, idx: number) => (
                        <li key={svc.id || idx} className='mb-2'>
                          <strong>{svc.title}</strong> — {svc.category}
                          <span className='ms-2'>R {Number(svc.price || 0).toLocaleString()}</span>
                          <Link to={`/marketplace-details?id=${svc.id}`} className='ms-2 btn btn-sm btn-outline-primary'>View</Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </>
          ) : (
            <div className='alert alert-warning'>No booking found for this service.</div>
          )}
        </div>
        <div className='col-xxl-9 col-lg-8'>
          <div className='card h-100 p-0 radius-12'>
            <div className='card-body px-24 py-32'>
              <div className='d-flex align-items-center justify-content-between mb-24'>
                <div className='d-flex align-items-center'>
                  <img
                    src='assets/images/crypto/bitcoin.png'
                    alt='WowDash React Vite'
                    className='w-72-px h-72-px rounded-circle flex-shrink-0 me-12 overflow-hidden'
                  />
                  <div className='flex-grow-1 d-flex flex-column'>
                    <h4 className='mb-4'>
                      Bitcoin{" "}
                      <span className='text-md text-neutral-400 fw-semibold'>
                        BTC
                      </span>{" "}
                    </h4>
                    <span className='text-md mb-0 fw-medium text-neutral-500 d-block'>
                      Currency in USD. Market Open
                    </span>
                  </div>
                </div>
                <div className='d-flex align-items-center gap-24'>
                  <div className='d-flex flex-column align-items-end'>
                    <div className='d-flex align-items-center gap-8 mb-4'>
                      <h6 className='mb-0'>$0.32533</h6>
                      <span className='text-sm fw-semibold rounded-pill bg-success-focus text-success-main border br-success px-8 py-4 line-height-1 d-flex align-items-center gap-1'>
                        <Icon icon='bxs:up-arrow' className='text-xs' /> 10%
                      </span>
                    </div>
                    <div className=''>
                      <span className='fw-semibold text-secondary-light text-sm'>
                        +0,021301
                      </span>
                      <span className='fw-semibold text-success-600 text-sm'>
                        (+6.42%)
                      </span>
                    </div>
                  </div>
                  <button
                    type='button'
                    className='star-btn w-48-px h-48-px d-flex justify-content-center align-items-center border radius-8 text-2xl text-neutral-400 text-hover-primary-600 line-height-1'
                    onClick={toggleStar}
                  >
                    <i
                      className={
                        isStarred
                          ? "ri-star-fill text-primary-600"
                          : "ri-star-line"
                      }
                    />
                  </button>
                </div>
              </div>
              <h6 className='mb-16'>About</h6>
              <p className='text-secondary-light'>
                IoT Chain (ITC) is a cryptocurrency and operates on the Ethereum
                platform. IoT Chain has a current supply of 99,999,999 with
                87,214,657.4756 in circulation. The last known price of IoT
                Chain is 0.01318397 USD and is up 0.00 over the last 24 hours.
                It is currently trading on 5 active market(s) with $0.00 traded
                over the last 24 hours. More information can be found at
                https://iotchain.io/.
              </p>
              <div className='my-24'>
                <div className='d-flex flex-wrap align-items-center justify-content-between'>
                  <h6 className='text-lg mb-0'>Bitcoin Chain Price</h6>
                  <select
                    className='form-select bg-base form-select-sm w-auto radius-8'
                    defaultValue='Select Frequency'
                  >
                    <option value='Select Frequency' disabled>
                      Select Frequency
                    </option>
                    <option value='Yearly'>Yearly</option>
                    <option value='Monthly'>Monthly</option>
                    <option value='Weekly'>Weekly</option>
                    <option value='Today'>Today</option>
                  </select>
                </div>
                <div className=''>
                  <div
                    id='timeSeriesChart'
                    className='apexcharts-tooltip-style-1'
                  />
                  <ReactApexChart
                    options={{
                      ...timeSeriesChartOptions,
                      chart: {
                        ...timeSeriesChartOptions.chart,
                        type: "area" as const,
                        zoom: {
                          ...timeSeriesChartOptions.chart?.zoom,
                          type: "x" as const,
                        },
                      },
                      stroke: {
                        ...timeSeriesChartOptions.stroke,
                        curve: "smooth" as const,
                        lineCap: "round" as const,
                      },
                      xaxis: {
                        ...timeSeriesChartOptions.xaxis,
                        type: "category" as const,
                      },
                    }}
                    series={timeSeriesChartSeries}
                    type='area'
                    height={350}
                  />
                </div>
              </div>
              {/* Table Start */}
              <div className='border radius-12 p-24'>
                <h6 className='text-md mb-16'>Market Stats</h6>
                <div className='table-responsive scroll-sm'>
                  <table className='table bordered-table rounded-table sm-table mb-0'>
                    <thead>
                      <tr>
                        <th scope='col'>Market Cap</th>
                        <th scope='col'>Volume (24H)</th>
                        <th scope='col'>Circulating Supply</th>
                        <th scope='col'>Max Supply</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <h6 className='text-md mb-4'>$1.15M</h6>
                          <span className='text-neutral-500 text-sm'>
                            39% of crypto market
                          </span>
                        </td>
                        <td>
                          <h6 className='text-md mb-4'>$146.36k</h6>
                          <span className='bg-success-focus text-success-600 px-16 py-6 rounded-pill fw-semibold text-xs'>
                            <i className='ri-arrow-up-s-fill' />
                            1.37%
                          </span>
                        </td>
                        <td>
                          <h6 className='text-md mb-4'>807.21M ITC</h6>
                          <span className='text-neutral-500 text-sm'>
                            91% of crypto market
                          </span>
                        </td>
                        <td>
                          <h6 className='text-md mb-4'>10B ITC</h6>
                          <div className='d-flex align-items-center gap-8 w-100-px'>
                            <div
                              className='progress w-100  bg-primary-50 rounded-pill h-4-px'
                              role='progressbar'
                              aria-label='Basic example'
                              aria-valuenow={50}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            >
                              <div
                                className='progress-bar bg-primary-600 rounded-pill'
                                style={{ width: "50%" }}
                              />
                            </div>
                            <span className='text-neutral-500 text-sm'>8%</span>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              {/* Table End */}
            </div>
          </div>
        </div>
        <div className='col-xxl-3 col-lg-4'>
          <div className='card h-100'>
            <div className='card-body p-0'>
              <div className='p-24 border-bottom'>
                <ul
                  className='nav nav-pills style-three pill-tab border input-form-light p-0 radius-8 bg-neutral-50'
                  id='pills-tab'
                  role='tablist'
                >
                  <li className='nav-item' role='presentation'>
                    <button
                      className='nav-link px-12 py-10 text-md w-100 text-center radius-8 active'
                      id='pills-Buy-tab'
                      data-bs-toggle='pill'
                      data-bs-target='#pills-Buy'
                      type='button'
                      role='tab'
                      aria-controls='pills-Buy'
                      aria-selected='true'
                    >
                      Buy
                    </button>
                  </li>
                  <li className='nav-item' role='presentation'>
                    <button
                      className='nav-link px-12 py-10 text-md w-100 text-center radius-8'
                      id='pills-Sell-tab'
                      data-bs-toggle='pill'
                      data-bs-target='#pills-Sell'
                      type='button'
                      role='tab'
                      aria-controls='pills-Sell'
                      aria-selected='false'
                    >
                      Sell
                    </button>
                  </li>
                  <li className='nav-item' role='presentation'>
                    <button
                      className='nav-link px-12 py-10 text-md w-100 text-center radius-8'
                      id='pills-Convert-tab'
                      data-bs-toggle='pill'
                      data-bs-target='#pills-Convert'
                      type='button'
                      role='tab'
                      aria-controls='pills-Convert'
                      aria-selected='false'
                    >
                      Convert
                    </button>
                  </li>
                </ul>
                <div className='tab-content' id='pills-tabContent'>
                  <div
                    className='tab-pane fade show active'
                    id='pills-Buy'
                    role='tabpanel'
                    aria-labelledby='pills-Buy-tab'
                    tabIndex={0}
                  >
                    <div className=''>
                      <div className='text-center mt-24'>
                        <h3 className='text-neutral-400 mb-16'>$0</h3>
                        <span className='text-neutral-500 text-sm'>
                          You can buy up to $25,000
                        </span>
                      </div>
                      <div className='mt-24 border radius-8 position-relative'>
                        <button
                          type='button'
                          className='bg-primary-600 w-40-px h-40-px rounded-circle border border-3 border-primary-100 d-flex justify-content-center align-items-center text-white position-absolute top-50 translate-middle-y end-0 me-60'
                        >
                          <i className='ri-arrow-up-down-line' />
                        </button>
                        <div className='p-16 d-flex align-items-center border-bottom'>
                          <span className='text-neutral-500 fw-medium w-76-px border-end'>
                            Buy
                          </span>
                          <div className='d-flex align-items-center justify-content-between flex-grow-1 ps-16'>
                            <div className='d-flex align-items-center gap-8'>
                              <img
                                src='assets/images/crypto/crypto-img1.png'
                                alt='WowDash React Vite'
                                className='w-24-px h-24-px rounded-circle flex-shrink-0 overflow-hidden'
                              />
                              <div className='flex-grow-1 d-flex flex-column'>
                                <span className='text-sm mb-0 fw-medium text-primary-light d-block'>
                                  ITC
                                </span>
                              </div>
                            </div>
                            <Link
                              to='#'
                              className='text-md text-neutral-500 text-hover-primary-600'
                            >
                              <i className='ri-arrow-right-s-line' />
                            </Link>
                          </div>
                        </div>
                        <div className='p-16 d-flex align-items-center'>
                          <span className='text-neutral-500 fw-medium w-76-px border-end'>
                            Pay with
                          </span>
                          <div className='d-flex align-items-center justify-content-between flex-grow-1 ps-16'>
                            <div className='d-flex align-items-center gap-8'>
                              <img
                                src='assets/images/crypto/paypal.png'
                                alt='WowDash React Vite'
                                className='w-24-px h-24-px rounded-circle flex-shrink-0 overflow-hidden'
                              />
                              <div className='flex-grow-1 d-flex flex-column'>
                                <span className='text-sm mb-0 fw-medium text-primary-light d-block'>
                                  Paypal
                                </span>
                              </div>
                            </div>
                            <Link
                              to='#'
                              className='text-md text-neutral-500 text-hover-primary-600'
                            >
                              <i className='ri-arrow-right-s-line' />
                            </Link>
                          </div>
                        </div>
                      </div>
                      <button
                        type='button'
                        className='btn btn-primary text-sm btn-sm px-12 py-16 w-100 radius-8 mt-24 pb-8'
                        data-bs-toggle='modal'
                        data-bs-target='#exampleModalEdit'
                      >
                        Buy
                      </button>
                    </div>
                  </div>
                  <div
                    className='tab-pane fade'
                    id='pills-Sell'
                    role='tabpanel'
                    aria-labelledby='pills-Sell-tab'
                    tabIndex={0}
                  >
                    <div className=''>
                      <div className='text-center mt-24'>
                        <h3 className='text-neutral-400 mb-16'>$0</h3>
                        <span className='text-neutral-500 text-sm'>
                          You can buy up to $25,000
                        </span>
                      </div>
                      <div className='mt-24 border radius-8 position-relative'>
                        <button
                          type='button'
                          className='bg-primary-600 w-40-px h-40-px rounded-circle border border-3 border-primary-100 d-flex justify-content-center align-items-center text-white position-absolute top-50 translate-middle-y end-0 me-60'
                        >
                          <i className='ri-arrow-up-down-line' />
                        </button>
                        <div className='p-16 d-flex align-items-center border-bottom'>
                          <span className='text-neutral-500 fw-medium w-76-px border-end'>
                            Buy
                          </span>
                          <div className='d-flex align-items-center justify-content-between flex-grow-1 ps-16'>
                            <div className='d-flex align-items-center gap-8'>
                              <img
                                src='assets/images/crypto/crypto-img1.png'
                                alt='WowDash React Vite'
                                className='w-24-px h-24-px rounded-circle flex-shrink-0 overflow-hidden'
                              />
                              <div className='flex-grow-1 d-flex flex-column'>
                                <span className='text-sm mb-0 fw-medium text-primary-light d-block'>
                                  ITC
                                </span>
                              </div>
                            </div>
                            <Link
                              to='#'
                              className='text-md text-neutral-500 text-hover-primary-600'
                            >
                              <i className='ri-arrow-right-s-line' />
                            </Link>
                          </div>
                        </div>
                        <div className='p-16 d-flex align-items-center'>
                          <span className='text-neutral-500 fw-medium w-76-px border-end'>
                            Pay with
                          </span>
                          <div className='d-flex align-items-center justify-content-between flex-grow-1 ps-16'>
                            <div className='d-flex align-items-center gap-8'>
                              <img
                                src='assets/images/crypto/paypal.png'
                                alt='WowDash React Vite'
                                className='w-24-px h-24-px rounded-circle flex-shrink-0 overflow-hidden'
                              />
                              <div className='flex-grow-1 d-flex flex-column'>
                                <span className='text-sm mb-0 fw-medium text-primary-light d-block'>
                                  Paypal
                                </span>
                              </div>
                            </div>
                            <Link
                              to='#'
                              className='text-md text-neutral-500 text-hover-primary-600'
                            >
                              <i className='ri-arrow-right-s-line' />
                            </Link>
                          </div>
                        </div>
                      </div>
                      <button
                        type='button'
                        className='btn btn-primary text-sm btn-sm px-12 py-16 w-100 radius-8 mt-24 pb-8'
                        data-bs-toggle='modal'
                        data-bs-target='#exampleModalEdit'
                      >
                        Buy
                      </button>
                    </div>
                  </div>
                  <div
                    className='tab-pane fade'
                    id='pills-Convert'
                    role='tabpanel'
                    aria-labelledby='pills-Convert-tab'
                    tabIndex={0}
                  >
                    <div className=''>
                      <div className='text-center mt-24'>
                        <h3 className='text-neutral-400 mb-16'>$0</h3>
                        <span className='text-neutral-500 text-sm'>
                          You can buy up to $25,000
                        </span>
                      </div>
                      <div className='mt-24 border radius-8 position-relative'>
                        <button
                          type='button'
                          className='bg-primary-600 w-40-px h-40-px rounded-circle border border-3 border-primary-100 d-flex justify-content-center align-items-center text-white position-absolute top-50 translate-middle-y end-0 me-60'
                        >
                          <i className='ri-arrow-up-down-line' />
                        </button>
                        <div className='p-16 d-flex align-items-center border-bottom'>
                          <span className='text-neutral-500 fw-medium w-76-px border-end'>
                            Buy
                          </span>
                          <div className='d-flex align-items-center justify-content-between flex-grow-1 ps-16'>
                            <div className='d-flex align-items-center gap-8'>
                              <img
                                src='assets/images/crypto/crypto-img1.png'
                                alt='WowDash React Vite'
                                className='w-24-px h-24-px rounded-circle flex-shrink-0 overflow-hidden'
                              />
                              <div className='flex-grow-1 d-flex flex-column'>
                                <span className='text-sm mb-0 fw-medium text-primary-light d-block'>
                                  ITC
                                </span>
                              </div>
                            </div>
                            <Link
                              to='#'
                              className='text-md text-neutral-500 text-hover-primary-600'
                            >
                              <i className='ri-arrow-right-s-line' />
                            </Link>
                          </div>
                        </div>
                        <div className='p-16 d-flex align-items-center'>
                          <span className='text-neutral-500 fw-medium w-76-px border-end'>
                            Pay with
                          </span>
                          <div className='d-flex align-items-center justify-content-between flex-grow-1 ps-16'>
                            <div className='d-flex align-items-center gap-8'>
                              <img
                                src='assets/images/crypto/paypal.png'
                                alt='WowDash React Vite'
                                className='w-24-px h-24-px rounded-circle flex-shrink-0 overflow-hidden'
                              />
                              <div className='flex-grow-1 d-flex flex-column'>
                                <span className='text-sm mb-0 fw-medium text-primary-light d-block'>
                                  Paypal
                                </span>
                              </div>
                            </div>
                            <Link
                              to='#'
                              className='text-md text-neutral-500 text-hover-primary-600'
                            >
                              <i className='ri-arrow-right-s-line' />
                            </Link>
                          </div>
                        </div>
                      </div>
                      <button
                        type='button'
                        className='btn btn-primary text-sm btn-sm px-12 py-16 w-100 radius-8 mt-24 pb-8'
                        data-bs-toggle='modal'
                        data-bs-target='#exampleModalEdit'
                      >
                        Buy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className='px-24 py-20'>
                <div className='d-flex align-items-center justify-content-between gap-8 pb-24 border-bottom'>
                  <h6 className='text-lg mb-0'>Watchlist</h6>
                  <Link to='#' className='text-primary-600 fw-medium text-md'>
                    Sell all
                  </Link>
                </div>
                <div className='d-flex align-items-center justify-content-between flex-wrap gap-8 py-16 border-bottom'>
                  <div className='d-flex align-items-center'>
                    <img
                      src='assets/images/crypto/crypto-img1.png'
                      alt='WowDash React Vite'
                      className='w-40-px h-40-px rounded-circle flex-shrink-0 me-12 overflow-hidden'
                    />
                    <div className='flex-grow-1 d-flex flex-column'>
                      <span className='text-md mb-0 fw-medium text-primary-light d-block'>
                        Bitcoin
                      </span>
                      <span className='text-xs mb-0 fw-normal text-secondary-light'>
                        BTC
                      </span>
                    </div>
                  </div>
                  <div className=' d-flex flex-column'>
                    <span className='text-md mb-0 fw-medium text-primary-light d-block'>
                      $1,236.21
                    </span>
                    <span className='text-xs mb-0 fw-normal text-secondary-light'>
                      1.4363 BTC{" "}
                    </span>
                  </div>
                </div>
                <div className='d-flex align-items-center justify-content-between flex-wrap gap-8 py-16 border-bottom'>
                  <div className='d-flex align-items-center'>
                    <img
                      src='assets/images/crypto/crypto-img2.png'
                      alt='WowDash React Vite'
                      className='w-40-px h-40-px rounded-circle flex-shrink-0 me-12 overflow-hidden'
                    />
                    <div className='flex-grow-1 d-flex flex-column'>
                      <span className='text-md mb-0 fw-medium text-primary-light d-block'>
                        Ethereum
                      </span>
                      <span className='text-xs mb-0 fw-normal text-secondary-light'>
                        ETH
                      </span>
                    </div>
                  </div>
                  <div className=' d-flex flex-column'>
                    <span className='text-md mb-0 fw-medium text-primary-light d-block'>
                      $1,236.21
                    </span>
                    <span className='text-xs mb-0 fw-normal text-secondary-light'>
                      1.4363 ETH{" "}
                    </span>
                  </div>
                </div>
                <div className='d-flex align-items-center justify-content-between flex-wrap gap-8 py-16 border-bottom'>
                  <div className='d-flex align-items-center'>
                    <img
                      src='assets/images/crypto/crypto-img5.png'
                      alt='WowDash React Vite'
                      className='w-40-px h-40-px rounded-circle flex-shrink-0 me-12 overflow-hidden'
                    />
                    <div className='flex-grow-1 d-flex flex-column'>
                      <span className='text-md mb-0 fw-medium text-primary-light d-block'>
                        Dogecoin
                      </span>
                      <span className='text-xs mb-0 fw-normal text-secondary-light'>
                        DOGE
                      </span>
                    </div>
                  </div>
                  <div className=' d-flex flex-column'>
                    <span className='text-md mb-0 fw-medium text-primary-light d-block'>
                      $1,658
                    </span>
                    <span className='text-xs mb-0 fw-normal text-secondary-light'>
                      1.4363 DOGE
                    </span>
                  </div>
                </div>
                <div className='d-flex align-items-center justify-content-between flex-wrap gap-8 py-16'>
                  <div className='d-flex align-items-center'>
                    <img
                      src='assets/images/crypto/crypto-img6.png'
                      alt='WowDash React Vite'
                      className='w-40-px h-40-px rounded-circle flex-shrink-0 me-12 overflow-hidden'
                    />
                    <div className='flex-grow-1 d-flex flex-column'>
                      <span className='text-md mb-0 fw-medium text-primary-light d-block'>
                        Digibyte
                      </span>
                      <span className='text-xs mb-0 fw-normal text-secondary-light'>
                        DGB
                      </span>
                    </div>
                  </div>
                  <div className=' d-flex flex-column'>
                    <span className='text-md mb-0 fw-medium text-primary-light d-block'>
                      $165,8
                    </span>
                    <span className='text-xs mb-0 fw-normal text-secondary-light'>
                      1.4363 DGB
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Modal Edit Currency */}
      <div
        className='modal fade'
        id='exampleModalEdit'
        tabIndex={-1}
        aria-labelledby='exampleModalEditLabel'
        aria-hidden='true'
      >
        <div className='modal-dialog modal-dialog modal-dialog-centered'>
          <div className='modal-content radius-16 bg-base'>
            <div className='modal-body px-32 py-56'>
              <div className='text-center'>
                <span className='w-100-px h-100-px bg-success-600 rounded-circle d-inline-flex justify-content-center align-items-center text-2xxl mb-32 text-white'>
                  <i className='ri-check-line' />
                </span>
                <h5 className='mb-8 text-2xl'>Your purchase was successful!</h5>
                <p className='text-neutral-500 mb-0'>
                  {" "}
                  <span className='text-primary-600'>16.2665 ITC</span> will be
                  available in your portfolio on 10-10-2022
                </p>
                <Link to='/index' className='btn btn-primary-600 mt-32 px-24'>
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MarketplaceDetailsLayer;
