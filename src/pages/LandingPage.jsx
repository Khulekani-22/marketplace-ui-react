import React, { useMemo, useRef, useState } from "react";
import TrendingNFTsOne from "../components/child/TrendingNFTsOne.jsx";

export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState(["All"]);
  const [category, setCategory] = useState("All");
  const trendingRef = useRef(null);
  const handleHeroSubmit = (e) => {
    e.preventDefault();
    // Smooth scroll to the trending section when searching
    try { trendingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch {}
  };
  const categoryOptions = useMemo(() => (Array.isArray(categories) && categories.length ? categories : ["All"]), [categories]);
  return (
    <>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg bg-white border-bottom sticky-top">
        <div className="container">
          <a className="navbar-brand d-flex align-items-center gap-2" href="http://localhost:5173/">
          <img width={'200rem'} src="assets/images/logo-22.png" alt="logo" className="light-logo" />
          </a>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#nav"
            aria-controls="nav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon" />
          </button>

          <div id="nav" className="collapse navbar-collapse">
            <ul className="navbar-nav mx-lg-auto gap-lg-3">
              <li className="nav-item"><a className="nav-link active" aria-current="page" href="#">Home</a></li>
              <li className="nav-item"><a className="nav-link" href="#">Software</a></li>
              <li className="nav-item"><a className="nav-link" href="#">Services</a></li>
              <li className="nav-item"><a className="nav-link" href="#">Mentors</a></li>
              <li className="nav-item"><a className="nav-link" href="#">Pricing</a></li>
            </ul>
            <a className="btn btn-primary bg-hover-primary-800 hover-text-primary-200 rounded-pill px-4" href="/login">Get Started</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="py-5 py-lg-6 position-relative overflow-hidden bg-white">
        <div className="container py-5">
          <div className="row justify-content-center text-center">
            <div className="col-12 col-lg-9">
              <h1 className="display-4 fw-bold lh-sm mb-3">
                Find effective <span className="text-gradient">solutions</span>, grow
                your <span className="text-gradient">business</span> with a click
              </h1>
              <p className="lead text-secondary mb-4">
                Generate business plans, meet mentors, get accounting, legal and governance services. From problem to solution in minutes.
              </p>
              <div className="d-flex justify-content-center gap-3">
                <a className="text-primary-50 hover-text-primary-200 bg-hover-primary-800 btn bg-primary-500 btn-lg rounded-pill d-inline-flex align-items-center gap-2 px-4" href="#">
                  <i className="bi bi-play-fill" />
                  Watch Demo <span className="opacity-75">(3min)</span>
                </a>
                <a className="btn btn-outline-dark bg-hover-primary-800 hover-text-primary-200 border text-neutral-500 border-neutral-700 btn-lg rounded-pill px-4" href="#">View Listings</a>
              </div>
            </div>
          </div>

          {/* Mock app window with glass and gradient base */}
          <div className="position-relative mt-5">
            <div className="blob" />
            <div className="glass border mx-auto" style={{ maxWidth: '980px' }}>
              <div className="p-4 p-md-5">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <span className="rounded-circle bg-danger" style={{ width: '10px', height: '10px' }} />
                  <span className="rounded-circle bg-warning" style={{ width: '10px', height: '10px' }} />
                  <span className="rounded-circle bg-success" style={{ width: '10px', height: '10px' }} />
                </div>
                <div className="row g-3 justify-content-center">
                  <div className="col-12 col-lg-10">
                    <div className="p-4 rounded border bg-white shadow-sm">
                      <form className="row g-2 align-items-center" onSubmit={handleHeroSubmit}>
                        {/* Search input */}
                        <div className="col-12 col-md-8">
                          <input
                            type="text"
                            className="form-control form-control-lg"
                            placeholder="Search categories, or mentors..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>

                        {/* Category dropdown */}
                        <div className="col-12 col-md-3">
                          <select
                            className="form-select form-select-lg"
                            value={category}
                            onChange={(e) => {
                              const next = e.target.value || "All";
                              setCategory(next);
                            }}
                          >
                            {categoryOptions.map((c) => (
                              <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
                            ))}
                          </select>
                        </div>

                        {/* Search button */}
                        <div className="col-12 col-md-1 d-grid">
                          <button type="submit" className="btn btn-primary bg-hover-primary-800 hover-text-primary-200 btn-lg w-100">
                            <i className="bi bi-search" />
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating integrations */}
            <div className="float-badge shadow-sm" style={{ top: '-10px', left: '6%', animationDelay: '.2s' }} aria-hidden="true">
              <img src="assets/images/microsoft-teams.svg" alt="" />
            </div>
            <div className="float-badge shadow-sm" style={{ top: '30px', right: '10%', animationDelay: '.6s' }} aria-hidden="true">
              <img src="assets/images/skype.svg" alt="" />
            </div>
            <div className="float-badge shadow-sm" style={{ top: '55%', left: '2%', animationDelay: '.9s' }} aria-hidden="true">
              <img src="assets/images/paypal.svg" alt="" />
            </div>
            <div className="float-badge shadow-sm" style={{ top: '60%', right: '6%', animationDelay: '1.2s' }} aria-hidden="true">
              <img src="assets/images/wordpress.svg" alt="" />
            </div>
            <div className="float-badge shadow-sm" style={{ top: '15%', left: '22%', animationDelay: '1.4s' }} aria-hidden="true">
              <img src="assets/images/vimeo.svg" alt="" />
            </div>
            <div className="float-badge shadow-sm" style={{ top: '22%', right: '22%', animationDelay: '1.6s' }} aria-hidden="true">
              <img src="assets/images/slack.svg" alt="" />
            </div>
          </div>
        </div>
      </header>

      {/* Trending listings (login required to subscribe) */}
      <main className="bg-light py-5" ref={trendingRef}>
        <div className="container">
          <div className="row justify-content-center mb-4">
            <div className="col-12 col-lg-9 text-center">
              <h2 className="fw-semibold">Trending Services</h2>
              <p className="text-secondary mb-0">Browse listings. You’ll be prompted to log in before subscribing.</p>
            </div>
          </div>
          <div className="row">
            <div className="col-12">
              <TrendingNFTsOne
                query={searchQuery}
                onQueryChange={setSearchQuery}
                category={category}
                onCategoryChange={setCategory}
                onCategoriesChange={setCategories}
              />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
