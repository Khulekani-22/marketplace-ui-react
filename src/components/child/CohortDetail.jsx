import { useParams, Link } from "react-router-dom";
import appData from "../../data/appData.json";
import { Icon } from "@iconify/react";

const CohortDetail = () => {
  const { cohortId } = useParams();
  const cohort = appData.cohorts.find((c) => c.id === cohortId);

  if (!cohort) {
    return (
      <div className="col-12">
        <div className="alert alert-warning">Cohort not found.</div>
      </div>
    );
  }

  return (
    <div className="col-12">
      <div className="card">
        <div className="card-header border-bottom d-flex justify-content-between align-items-center">
          <h5 className="fw-bold mb-0">{cohort.name} – Modules</h5>
          <Link
            to="/"
            className="btn btn-outline-secondary rounded-pill d-flex align-items-center gap-2"
          >
            <Icon icon="ic:round-arrow-back" className="icon" />
            Back
          </Link>
        </div>

        <div className="card-body">
          <p className="text-secondary-light fw-medium mb-20">
            {cohort.courses.length} modules available
          </p>

          <div className="row g-4">
            {cohort.courses.map((course) => (
              <div key={course.id} className="col-md-6 col-lg-4">
                <div className="nft-card bg-base radius-16 overflow-hidden shadow-4 h-100">
                  <div className="radius-16 overflow-hidden">
                    <img
                      src={course.videoThumbnail}
                      alt={course.title}
                      className="w-100 h-160 object-fit-cover"
                    />
                  </div>
                  <div className="p-12">
                    <h6 className="text-md fw-bold text-primary-light mb-8">
                      {course.title}
                    </h6>
                    <p className="text-sm text-secondary-light mb-0">
                      {course.description}
                    </p>
                    <div className="d-flex align-items-center justify-content-between mt-12">
                      <span className="badge bg-primary-600 text-white text-xs px-8 py-2">
                        {course.duration}
                      </span>
                      <Link
                        to={course.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline-primary-600 rounded-pill"
                      >
                        Watch
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {cohort.courses.length === 0 && (
            <p className="text-muted mt-20">No modules yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CohortDetail;
