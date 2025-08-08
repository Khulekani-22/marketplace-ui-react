import { useState } from "react";
import { Link } from "react-router-dom";
import appData from "../../data/appData.json";

const TrendingNFTsOne = () => {
  const services = appData.services || [];

  // Dynamically collect unique categories
  const categories = [
    "All",
    ...Array.from(new Set(services.map(s => s.category?.trim())))
  ];

  const [activeTab, setActiveTab] = useState("All");

  const filteredServices =
    activeTab === "All"
      ? services
      : services.filter(
          s =>
            s.category?.trim().toLowerCase() === activeTab.toLowerCase()
        );

  return (
    <div className="col-12">
      <div className="mb-16 mt-8 d-flex flex-wrap justify-content-between gap-16">
        <h6 className="mb-0">All Listings</h6>
        <ul className="nav button-tab nav-pills mb-16 gap-12" role="tablist">
          {categories.map(category => (
            <li className="nav-item" key={category} role="presentation">
              <button
                className={`nav-link fw-semibold text-secondary-light rounded-pill px-20 py-6 border border-neutral-300 ${
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
            {filteredServices.map(service => (
              <div
                className="col-xxl-3 col-sm-6 col-xs-6"
                key={service.id}
              >
                <div className="nft-card bg-base radius-16 overflow-hidden">
                  <div className="radius-16 overflow-hidden">
                    <img
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
                          R{service.price?.toLocaleString()}
                        </span>
                      </span>
                      <span className="text-sm fw-semibold text-primary-600">
                        ★ {service.rating}
                      </span>
                    </div>
                    <div className="d-flex align-items-center flex-wrap mt-12 gap-8">
                      <Link
                        to="#"
                        className="btn rounded-pill border text-neutral-500 border-neutral-500 radius-8 px-12 py-6 bg-hover-neutral-500 text-hover-white flex-grow-1"
                      >
                        Reviews
                      </Link>
                      <Link
                        to="#"
                        className="btn rounded-pill btn-primary-600 radius-8 px-12 py-6 flex-grow-1"
                      >
                        Buy Now
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {filteredServices.length === 0 && (
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
