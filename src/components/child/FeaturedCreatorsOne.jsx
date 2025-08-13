import { useState } from "react";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import appData from "../../data/appData.json";

const FeaturedCreatorsOne = () => {
  const cohorts = appData.cohorts;
  const [activeTab, setActiveTab] = useState("All");

  const allCourses = cohorts.flatMap((cohort) =>
    cohort.courses.map((course) => ({
      ...course,
      cohortName: cohort.name,
      cohortId: cohort.id,
    }))
  );

  const filteredCourses =
    activeTab === "All"
      ? allCourses
      : allCourses.filter((course) => course.cohortName === activeTab);

  const uniqueCohorts = [...new Set(cohorts.map((c) => c.name))];

  return (
    <div className="col-xxl-12 col-md-6">
      <div className="card h-100">
        <div className="card-header border-bottom d-flex align-items-center flex-wrap gap-2 justify-content-between">
          <h6 className="fw-bold text-lg mb-0">Learning Modules</h6>
          <Link
            to="#"
            className="text-primary-600 hover-text-primary d-flex align-items-center gap-1"
          >
            View All
            <Icon icon="solar:alt-arrow-right-linear" className="icon" />
          </Link>
        </div>

        <div className="card-body">
          {/* Tabs */}
          <div className="mb-4 d-flex flex-wrap gap-2">
            <button
              className={`btn btn-sm rounded-pill px-16 py-6 border ${
                activeTab === "All"
                  ? "btn-primary-600 text-white"
                  : "btn-outline-primary-600 text-primary-600"
              }`}
              onClick={() => setActiveTab("All")}
            >
              All
            </button>
            {uniqueCohorts.map((name) => (
              <button
                key={name}
                className={`btn btn-sm rounded-pill px-16 py-6 border ${
                  activeTab === name
                    ? "btn-primary-600 text-white"
                    : "btn-outline-primary-600 text-primary-600"
                }`}
                onClick={() => setActiveTab(name)}
              >
                {name}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="row gy-3">
            {filteredCourses.length === 0 ? (
              <div className="col-12 text-center text-secondary-light">
                No courses found for {activeTab}
              </div>
            ) : (
              filteredCourses.map((course) => (
                <div key={course.id} className="col-sm-6 col-xs-6">
                  <div className="nft-card bg-base radius-16 overflow-hidden shadow-4">
                    <div className="radius-16 overflow-hidden">
                      <img
                        src={course.videoThumbnail}
                        alt={course.title}
                        className="w-100 h-100 object-fit-cover"
                      />
                    </div>
                    <div className="p-12">
                      <h6 className="text-md fw-bold text-primary-light mb-12">
                        {course.title}
                      </h6>
                      <div className="text-sm text-secondary-light fw-medium">
                        {course.description}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturedCreatorsOne;
