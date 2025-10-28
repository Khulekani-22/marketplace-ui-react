import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth } from "../firebase";
import { toast } from "react-toastify";

export default function MentorshipLayerSimple() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleBookNow = () => {
    if (!auth.currentUser) {
      toast.info("Please sign in to book mentorship sessions.");
      navigate("/login", { replace: false, state: { from: { pathname: "/mentorship" } } });
      return;
    }
    toast.info("Mentorship booking feature coming soon!");
  };

  return (
    <div className="container-fluid">
      {/* Welcome Card */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <h3 className="fw-bold mb-3">
                <i className="bi bi-person-workspace text-primary me-2"></i>
                Find Your Mentor
              </h3>
              <p className="text-muted mb-3">
                Connect with experienced mentors who can guide your startup journey. Get personalized advice,
                strategy sessions, and insights from industry experts.
              </p>
              <div className="d-flex gap-2 flex-wrap">
                <span className="badge bg-primary-subtle text-primary px-3 py-2">
                  <i className="bi bi-check-circle-fill me-1"></i> 1-on-1 Sessions
                </span>
                <span className="badge bg-success-subtle text-success px-3 py-2">
                  <i className="bi bi-calendar-check-fill me-1"></i> Flexible Scheduling
                </span>
                <span className="badge bg-info-subtle text-info px-3 py-2">
                  <i className="bi bi-award-fill me-1"></i> Vetted Experts
                </span>
              </div>
            </div>
            <div className="col-lg-4 text-center mt-3 mt-lg-0">
              <div className="p-4 bg-light rounded">
                <i className="bi bi-people-fill text-primary" style={{ fontSize: "4rem" }}></i>
                <p className="text-muted small mb-0 mt-2">Connect with mentors to accelerate your growth</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-8">
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search mentors by name, expertise, or topic..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-4">
              <button className="btn btn-primary w-100" disabled>
                <i className="bi bi-funnel me-2"></i>
                Filter by Expertise
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="row g-4 mb-4">
        {/* Browse Mentors */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100 hover-lift">
            <div className="card-body text-center p-4">
              <div className="mb-3">
                <i className="bi bi-search text-primary" style={{ fontSize: "3rem" }}></i>
              </div>
              <h5 className="fw-semibold mb-2">Browse Mentors</h5>
              <p className="text-muted small mb-3">
                Explore our directory of experienced mentors across various industries and expertise areas.
              </p>
              <button className="btn btn-outline-primary btn-sm" onClick={() => toast.info("Feature coming soon!")}>
                View All Mentors
              </button>
            </div>
          </div>
        </div>

        {/* Book a Session */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100 hover-lift">
            <div className="card-body text-center p-4">
              <div className="mb-3">
                <i className="bi bi-calendar-plus text-success" style={{ fontSize: "3rem" }}></i>
              </div>
              <h5 className="fw-semibold mb-2">Book a Session</h5>
              <p className="text-muted small mb-3">
                Schedule 1-on-1 mentorship sessions at times that work for you. Get personalized guidance.
              </p>
              <button className="btn btn-outline-success btn-sm" onClick={handleBookNow}>
                Book Now
              </button>
            </div>
          </div>
        </div>

        {/* My Sessions */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100 hover-lift">
            <div className="card-body text-center p-4">
              <div className="mb-3">
                <i className="bi bi-clock-history text-info" style={{ fontSize: "3rem" }}></i>
              </div>
              <h5 className="fw-semibold mb-2">My Sessions</h5>
              <p className="text-muted small mb-3">
                View your upcoming and past mentorship sessions. Access meeting links and session notes.
              </p>
              <Link
                to={auth.currentUser ? "/dashboard" : "/login"}
                className="btn btn-outline-info btn-sm"
                onClick={(e) => {
                  if (!auth.currentUser) {
                    e.preventDefault();
                    toast.info("Please sign in to view your sessions.");
                    navigate("/login", { state: { from: { pathname: "/mentorship" } } });
                  }
                }}
              >
                View Sessions
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Expertise Areas */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <h5 className="fw-semibold mb-3">
            <i className="bi bi-lightbulb text-warning me-2"></i>
            Popular Expertise Areas
          </h5>
          <div className="d-flex gap-2 flex-wrap">
            {[
              "Business Strategy",
              "Product Development",
              "Fundraising",
              "Marketing",
              "Sales",
              "Technology",
              "Legal",
              "Operations",
              "HR & Culture",
              "Finance",
            ].map((expertise) => (
              <button
                key={expertise}
                className="btn btn-sm btn-outline-secondary"
                onClick={() => toast.info(`Filtering by ${expertise} coming soon!`)}
              >
                {expertise}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <h5 className="fw-semibold mb-4">
            <i className="bi bi-question-circle text-primary me-2"></i>
            How It Works
          </h5>
          <div className="row g-4">
            <div className="col-md-3">
              <div className="text-center">
                <div
                  className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center mb-3"
                  style={{ width: "60px", height: "60px", fontSize: "1.5rem" }}
                >
                  1
                </div>
                <h6 className="fw-semibold">Find a Mentor</h6>
                <p className="text-muted small">
                  Browse our directory and find mentors with the expertise you need for your startup.
                </p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="text-center">
                <div
                  className="rounded-circle bg-success text-white d-inline-flex align-items-center justify-content-center mb-3"
                  style={{ width: "60px", height: "60px", fontSize: "1.5rem" }}
                >
                  2
                </div>
                <h6 className="fw-semibold">Book a Session</h6>
                <p className="text-muted small">
                  Choose a convenient time slot and book your 1-on-1 mentorship session.
                </p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="text-center">
                <div
                  className="rounded-circle bg-info text-white d-inline-flex align-items-center justify-content-center mb-3"
                  style={{ width: "60px", height: "60px", fontSize: "1.5rem" }}
                >
                  3
                </div>
                <h6 className="fw-semibold">Meet & Learn</h6>
                <p className="text-muted small">
                  Connect with your mentor via video call and get personalized guidance.
                </p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="text-center">
                <div
                  className="rounded-circle bg-warning text-white d-inline-flex align-items-center justify-content-center mb-3"
                  style={{ width: "60px", height: "60px", fontSize: "1.5rem" }}
                >
                  4
                </div>
                <h6 className="fw-semibold">Take Action</h6>
                <p className="text-muted small">
                  Apply insights from your session to accelerate your startup's growth.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="row g-4 mb-4">
        <div className="col-md-6">
          <div className="card border-0 bg-primary text-white h-100">
            <div className="card-body p-4">
              <h5 className="fw-semibold mb-3">
                <i className="bi bi-trophy-fill me-2"></i>
                For Startups
              </h5>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  Access experienced mentors
                </li>
                <li className="mb-2">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  Get personalized advice
                </li>
                <li className="mb-2">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  Accelerate your growth
                </li>
                <li className="mb-2">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  Flexible scheduling
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card border-0 bg-success text-white h-100">
            <div className="card-body p-4">
              <h5 className="fw-semibold mb-3">
                <i className="bi bi-people-fill me-2"></i>
                For Mentors
              </h5>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  Share your expertise
                </li>
                <li className="mb-2">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  Help startups succeed
                </li>
                <li className="mb-2">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  Earn income
                </li>
                <li className="mb-2">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  Set your own schedule
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="card border-0 bg-gradient shadow-lg mb-4" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
        <div className="card-body text-center text-white p-5">
          <h3 className="fw-bold mb-3">Ready to Find Your Mentor?</h3>
          <p className="mb-4">
            Join hundreds of startups who have accelerated their growth with expert mentorship.
          </p>
          <div className="d-flex gap-3 justify-content-center flex-wrap">
            <button className="btn btn-light btn-lg" onClick={handleBookNow}>
              <i className="bi bi-calendar-plus me-2"></i>
              Book a Session
            </button>
            <Link to="/services" className="btn btn-outline-light btn-lg">
              <i className="bi bi-grid-3x3 me-2"></i>
              Browse All Services
            </Link>
          </div>
        </div>
      </div>

      {/* Info Alert */}
      <div className="alert alert-info border-0 shadow-sm" role="alert">
        <i className="bi bi-info-circle-fill me-2"></i>
        <strong>Note:</strong> The mentorship directory is being optimized for better performance. Full mentor listings
        with profiles, availability, and booking will be available soon. In the meantime, you can{" "}
        <Link to="/services" className="alert-link">
          browse our services
        </Link>{" "}
        or{" "}
        <Link to="/contact" className="alert-link">
          contact us
        </Link>{" "}
        for assistance.
      </div>

      <style>{`
        .hover-lift {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .hover-lift:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
        }
      `}</style>
    </div>
  );
}
