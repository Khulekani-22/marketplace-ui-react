import { useState } from "react";
import { Link } from "react-router-dom";
import appData from "../../data/appData.json";

const Workspace1 = () => {
  const events = appData.events || [];

  // Dynamically collect unique types
  const types = [
    "All",
    ...Array.from(new Set(events.map(s => s.type?.trim())))
  ];

  const [activeTab, setActiveTab] = useState("All");

  const filteredevents =
    activeTab === "All"
      ? events
      : events.filter(
          s =>
            s.type?.trim().toLowerCase() === activeTab.toLowerCase()
        );

  return (
    <div className="col-12">
      <div className="mb-16 mt-8 d-flex flex-wrap justify-content-between gap-16">
        <h6 className="mb-0">All Events</h6>
        <ul className="nav button-tab nav-pills mb-16 gap-12" role="tablist">
          {types.map(type => (
            <li className="nav-item" key={type} role="presentation">
              <button
                className={`nav-link text-neutral-500 hover-text-white bg-neutral-300 bg-hover-primary-800 rounded-pill px-20 py-6 border border-neutral-300 ${
                  activeTab === type ? "active" : ""
                }`}
                onClick={() => setActiveTab(type)}
              >
                {type}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="tab-content">
        <div className="tab-pane fade show active">
          <div className="row g-3">
            {filteredevents.map(event => (
              <div
                className="col-xxl-3 col-sm-6 col-xs-6"
                key={event.id}
              >
                <div className="nft-card bg-base radius-16 overflow-hidden">
                  <div className="radius-16 overflow-hidden">
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="w-100 h-100 object-fit-cover"
                    />
                  </div>
                  <div className="p-10">
                    <h6 className="text-md fw-bold text-primary-light">
                      {event.title}
                    </h6>
                    <div className="mt-10 d-flex align-items-center justify-content-between gap-8 flex-wrap">
                      <span className="text-sm text-secondary-light fw-medium">
                        
                        <span className="text-sm text-primary-light fw-semibold">
                         Host: {event.host}
                        </span>
                      </span>
                      <span className="text-sm fw-semibold text-primary-600">
                        Time: {event.time}
                      </span>
                    </div>
                    <div className="d-flex align-items-center flex-wrap mt-12 gap-8">
                      
                      <Link
                        to="#"
                        className="btn rounded-pill  text-primary-50 hover-text-primary-200 bg-primary-500 bg-hover-primary-800 radius-8 px-12 py-6 flex-grow-1"
                      >
                        RSVP
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {filteredevents.length === 0 && (
              <div className="col-12 text-center text-secondary-light">
                No events found in this category.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Workspace1;
