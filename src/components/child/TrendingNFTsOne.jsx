// src/components/TrendingNFTsOne.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import appData from "../../data/appData.json";

const API_BASE = "/api/lms";

// Normalize any legacy keys so the card always has the fields your UI expects
const normalize = (s) => ({
  ...s,
  vendor: s.vendor ?? s.vendorName ?? "",
  imageUrl: s.imageUrl ?? s.thumbnail ?? "",
  category: s.category ?? s.categoryId ?? "",
  rating: typeof s.rating === "number" ? s.rating : Number(s.rating || 0),
  reviews: Array.isArray(s.reviews) ? s.reviews : [],
  // default to "approved" for older data that doesn't have status
  status: (s.status ?? "approved").toString().toLowerCase(),
});

// Only show approved items to end users
const isApproved = (s) => s.status === "approved";

const TrendingNFTsOne = () => {
  const tenantId = useMemo(
    () => sessionStorage.getItem("tenantId") || "public",
    []
  );

  // Start with local file as an immediate render fallback (approved only)
  const [services, setServices] = useState(
    (appData.services || []).map(normalize).filter(isApproved)
  );
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");

  // Load live data from backend; fall back silently on any error
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/live`, {
          headers: { "x-tenant-id": tenantId },
        });
        if (res.ok) {
          const live = await res.json();
          const list = (live?.services || []).map(normalize).filter(isApproved);
          if (!cancelled) setServices(list);
        }
      } catch {
        // ignore; keep bundled data
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  // Categories reflect whatever data we ended up with (approved only)
  const categories = useMemo(() => {
    const uniq = Array.from(
      new Set(
        services
          .map((s) => (s.category || "").trim())
          .filter(Boolean)
      )
    );
    return ["All", ...uniq];
  }, [services]);

  const filteredServices = useMemo(() => {
    if (activeTab === "All") return services;
    const tab = activeTab.toLowerCase();
    return services.filter(
      (s) => (s.category || "").trim().toLowerCase() === tab
    );
  }, [services, activeTab]);

  return (
    <div className="col-12">
      <div className="mb-16 mt-8 d-flex flex-wrap justify-content-between gap-16">
        <h6 className="mb-0">All Listings</h6>
        <ul className="nav button-tab nav-pills mb-16 gap-12" role="tablist">
          {categories.map((category) => (
            <li className="nav-item" key={category} role="presentation">
              <button
                className={`nav-link btn btn-sm rounded-pill text-neutral-500 hover-text-white bg-neutral-300 bg-hover-primary-800 rounded-pill px-20 py-6 border border-neutral-300 ${
                  activeTab === category ? "active" : ""
                }`}
                onClick={() => setActiveTab(category)}
              >
                {category}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="tab-content">
        <div className="tab-pane fade show active">
          <div className="row g-3">
            {loading && (
              <div className="col-12 text-center text-secondary-light">
                Loading listings…
              </div>
            )}

            {!loading &&
              filteredServices.map((service) => (
                <div className="col-xxl-3 col-sm-6 col-xs-6" key={service.id}>
                  <div className="nft-card bg-base radius-16 overflow-hidden">
                    <div className="radius-16 overflow-hidden">
                      <img
                        style={{ width: "100%", maxHeight: "15vh" }}
                        src={service.imageUrl}
                        alt={service.title}
                        className="w-100 h-100 object-fit-cover"
                      />
                    </div>
                    <div className="p-10">
                      <h6 className="text-md fw-bold text-primary-light">
                        {service.title}
                      </h6>
                      <div className="d-flex align-items-center gap-8">
                        <img
                          src={
                            service.reviews?.[0]?.authorAvatar ||
                            "/assets/images/default-user.png"
                          }
                          className="w-28-px h-28-px rounded-circle object-fit-cover"
                          alt={service.reviews?.[0]?.author || "Startup"}
                        />
                        <span className="text-sm text-secondary-light fw-medium">
                          {service.vendor}
                        </span>
                      </div>
                      <div className="mt-10 d-flex align-items-center justify-content-between gap-8 flex-wrap">
                        <span className="text-sm text-secondary-light fw-medium">
                          Price:{" "}
                          <span className="text-sm text-primary-light fw-semibold">
                            R{Number(service.price || 0).toLocaleString()}
                          </span>
                        </span>
                        <span className="text-sm fw-semibold text-primary-600">
                          ★ {Number(service.rating || 0).toFixed(1)}
                        </span>
                      </div>
                      <div className="d-flex align-items-center flex-wrap mt-12 gap-8">
                        <Link
                          to="#"
                          className="btn rounded-pill border text-neutral-500 border-neutral-700 radius-8 px-12 py-6 bg-hover-primary-700 text-hover-white flex-grow-1"
                        >
                          Reviews
                        </Link>
                        <Link
                          to="#"
                          className="btn rounded-pill text-primary-50 hover-text-primary-200 bg-primary-500 bg-hover-primary-800 radius-8 px-12 py-6 flex-grow-1"
                        >
                          Subscribe
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

            {!loading && filteredServices.length === 0 && (
              <div className="col-12 text-center text-secondary-light">
                No services found in this category.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendingNFTsOne;
