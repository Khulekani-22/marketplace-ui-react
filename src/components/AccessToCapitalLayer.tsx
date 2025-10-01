import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { Offcanvas } from "bootstrap";

const FUNDING_TYPES = ["grant", "vc", "angel", "bank", "accelerator", "competition"] as const;

type FundingType = (typeof FUNDING_TYPES)[number];

type Opportunity = {
  id: string;
  type: FundingType;
  title: string;
  blurb: string;
  funder: string;
  amountDisplay: string;
  minAmount: number;
  maxAmount: number;
  deadline: string;
  matchScore: number;
  tag: string;
};

type FunderProfile = {
  id: string;
  name: string;
  focus: string;
  ticket: string;
  stage: string;
  geography: string;
  recent: string;
};

type Insight = {
  id: string;
  title: string;
  body: string;
  icon: string;
};

type FilterState = {
  minAmount?: number;
  maxAmount?: number;
  deadline: string;
  types: Set<FundingType>;
};

type ViewKey = "opportunities" | "funders" | "insights";

const FUNDING_META: Record<FundingType, { label: string; icon: string }> = {
  grant: { label: "Grants", icon: "lucide:banknote" },
  vc: { label: "VC Funding", icon: "solar:chart-square-linear" },
  angel: { label: "Angel Investors", icon: "mdi:angel-outline" },
  bank: { label: "Bank Products", icon: "mdi:bank-outline" },
  accelerator: { label: "Accelerators", icon: "material-symbols:rocket-launch" },
  competition: { label: "Competitions", icon: "ri:trophy-line" },
};

const VIEW_SWITCHER: Array<{ id: ViewKey; label: string }> = [
  { id: "opportunities", label: "Opportunities" },
  { id: "funders", label: "Funders" },
  { id: "insights", label: "Insights" },
];

const OPPORTUNITIES: Opportunity[] = [
  {
    id: "opp-1",
    type: "grant",
    title: "Fintech Innovation Grant",
    blurb: "Scaling inclusive fintech products serving underbanked communities across South Africa.",
    funder: "Development Finance Corp",
    amountDisplay: "R2M – R5M",
    minAmount: 2_000_000,
    maxAmount: 5_000_000,
    deadline: "2024-12-15",
    matchScore: 0.89,
    tag: "Grant",
  },
  {
    id: "opp-2",
    type: "vc",
    title: "AgriTech Seed Funding",
    blurb: "Early-stage capital for climate-smart agriculture and precision farming startups.",
    funder: "Green Valley Ventures",
    amountDisplay: "R500K – R2M",
    minAmount: 500_000,
    maxAmount: 2_000_000,
    deadline: "2024-11-30",
    matchScore: 0.76,
    tag: "VC",
  },
  {
    id: "opp-3",
    type: "accelerator",
    title: "Women in Tech Accelerator",
    blurb: "Six-month accelerator providing capital, mentorship, and cloud credits for women-led startups.",
    funder: "SheLeads Foundation",
    amountDisplay: "R1M + Credits",
    minAmount: 1_000_000,
    maxAmount: 1_000_000,
    deadline: "2024-10-31",
    matchScore: 0.92,
    tag: "Accelerator",
  },
  {
    id: "opp-4",
    type: "competition",
    title: "GreenTech Challenge",
    blurb: "Pan-African pitch competition awarding pilots for renewable and efficiency projects.",
    funder: "EcoSpark Alliance",
    amountDisplay: "R250K – R1M",
    minAmount: 250_000,
    maxAmount: 1_000_000,
    deadline: "2024-12-05",
    matchScore: 0.81,
    tag: "Competition",
  },
  {
    id: "opp-5",
    type: "bank",
    title: "Township Retail Growth Fund",
    blurb: "Flexible working capital lines for township retailers expanding footprint.",
    funder: "Ubuntu Commercial Bank",
    amountDisplay: "R1M – R5M",
    minAmount: 1_000_000,
    maxAmount: 5_000_000,
    deadline: "2025-01-20",
    matchScore: 0.68,
    tag: "Bank",
  },
  {
    id: "opp-6",
    type: "angel",
    title: "Pan-African Angel Syndicate",
    blurb: "Syndicated cheque sizes for founders with early commercial traction in digital services.",
    funder: "Catalyst Angels",
    amountDisplay: "R250K – R750K",
    minAmount: 250_000,
    maxAmount: 750_000,
    deadline: "2024-09-15",
    matchScore: 0.73,
    tag: "Angel",
  },
  {
    id: "opp-7",
    type: "vc",
    title: "Climate Resilience Venture Fund",
    blurb: "Series A capital for hardware and deep-tech solutions focused on climate resilience.",
    funder: "Aurora Impact Capital",
    amountDisplay: "R5M – R20M",
    minAmount: 5_000_000,
    maxAmount: 20_000_000,
    deadline: "2025-02-01",
    matchScore: 0.83,
    tag: "VC",
  },
  {
    id: "opp-8",
    type: "grant",
    title: "Digital Inclusion Grant",
    blurb: "Funding for platforms improving last-mile digital access in peri-urban regions.",
    funder: "Africa Innovation Council",
    amountDisplay: "R1M – R3.5M",
    minAmount: 1_000_000,
    maxAmount: 3_500_000,
    deadline: "2024-08-22",
    matchScore: 0.78,
    tag: "Grant",
  },
  {
    id: "opp-9",
    type: "competition",
    title: "SADC Impact Investment Challenge",
    blurb: "Showcase sustainable ventures and unlock catalytic prize money plus investor networks.",
    funder: "Impact Catalyzers",
    amountDisplay: "R300K – R1.2M",
    minAmount: 300_000,
    maxAmount: 1_200_000,
    deadline: "2024-11-05",
    matchScore: 0.74,
    tag: "Competition",
  },
  {
    id: "opp-10",
    type: "bank",
    title: "Renewable Infrastructure Debt Facility",
    blurb: "Structured debt for grid-tied solar and storage projects with proven offtake.",
    funder: "Continental Infrastructure Bank",
    amountDisplay: "R5M – R50M",
    minAmount: 5_000_000,
    maxAmount: 50_000_000,
    deadline: "2025-03-10",
    matchScore: 0.69,
    tag: "Bank",
  },
  {
    id: "opp-11",
    type: "vc",
    title: "Continental Growth Equity Fund",
    blurb: "Growth cheques for post-revenue ventures scaling across multiple African markets.",
    funder: "Equator Partners",
    amountDisplay: "R2M – R15M",
    minAmount: 2_000_000,
    maxAmount: 15_000_000,
    deadline: "2025-04-18",
    matchScore: 0.71,
    tag: "VC",
  },
  {
    id: "opp-12",
    type: "grant",
    title: "Healthcare Access Grant",
    blurb: "Grant support for telehealth and diagnostics platforms improving primary care.",
    funder: "Wellbeing Foundation",
    amountDisplay: "R1.5M – R4M",
    minAmount: 1_500_000,
    maxAmount: 4_000_000,
    deadline: "2024-09-30",
    matchScore: 0.77,
    tag: "Grant",
  },
  {
    id: "opp-13",
    type: "accelerator",
    title: "Smart Logistics Accelerator",
    blurb: "Twelve-week intensive with pilot financing for logistics and mobility innovators.",
    funder: "Velocity Labs",
    amountDisplay: "R750K – R2M",
    minAmount: 750_000,
    maxAmount: 2_000_000,
    deadline: "2024-10-10",
    matchScore: 0.8,
    tag: "Accelerator",
  },
  {
    id: "opp-14",
    type: "angel",
    title: "Creative Industries Angel Fund",
    blurb: "Creative economy syndicate backing scalable content and media-tech ventures.",
    funder: "Ubuntu Angel Collective",
    amountDisplay: "R200K – R1M",
    minAmount: 200_000,
    maxAmount: 1_000_000,
    deadline: "2024-08-05",
    matchScore: 0.7,
    tag: "Angel",
  },
  {
    id: "opp-15",
    type: "competition",
    title: "Youth Innovation Challenge",
    blurb: "National challenge highlighting youth-led ventures with community impact.",
    funder: "FutureMakers",
    amountDisplay: "R200K – R800K",
    minAmount: 200_000,
    maxAmount: 800_000,
    deadline: "2024-07-25",
    matchScore: 0.75,
    tag: "Competition",
  },
  {
    id: "opp-16",
    type: "bank",
    title: "Continental Infrastructure Facility",
    blurb: "Long-term senior debt for strategic infrastructure and logistics assets.",
    funder: "Pan-African Development Bank",
    amountDisplay: "R10M – R90M",
    minAmount: 10_000_000,
    maxAmount: 90_000_000,
    deadline: "2025-06-15",
    matchScore: 0.66,
    tag: "Bank",
  },
  {
    id: "opp-17",
    type: "vc",
    title: "Digital Africa Growth Fund",
    blurb: "Series B funding for platforms crossing the $5M ARR threshold across Africa.",
    funder: "Latitude Capital",
    amountDisplay: "R5M – R46M",
    minAmount: 5_000_000,
    maxAmount: 46_000_000,
    deadline: "2025-05-05",
    matchScore: 0.72,
    tag: "VC",
  },
];

const FUNDERS: FunderProfile[] = [
  {
    id: "funder-1",
    name: "Aurora Impact Capital",
    focus: "Climate resilience, clean infrastructure, circular economy",
    ticket: "R5M – R25M equity",
    stage: "Seed to Series B",
    geography: "South Africa, Kenya, Ghana",
    recent: "Backed SunGrid, a hybrid storage venture (Series A)",
  },
  {
    id: "funder-2",
    name: "Ubuntu Commercial Bank",
    focus: "SME working capital, productive asset finance",
    ticket: "R1M – R50M debt",
    stage: "Revenue-stage SMEs",
    geography: "Southern Africa",
    recent: "Launched township retail liquidity programme",
  },
  {
    id: "funder-3",
    name: "SheLeads Foundation",
    focus: "Women-led startups in digital health and inclusive fintech",
    ticket: "R1M grant + mentorship",
    stage: "Idea to traction",
    geography: "Pan-African",
    recent: "Graduated 24 startups in 2023 cohort",
  },
  {
    id: "funder-4",
    name: "Latitude Capital",
    focus: "Scale-stage consumer and B2B platforms",
    ticket: "R5M – R50M equity",
    stage: "Series A/B",
    geography: "Nigeria, South Africa, Egypt",
    recent: "Led R320M round in digital banking platform",
  },
];

const INSIGHTS: Insight[] = [
  {
    id: "insight-1",
    title: "Growth in Climate Capital",
    body: "Climate tech opportunities grew 18% quarter-on-quarter with ticket sizes trending towards venture debt to bridge scale-up gaps.",
    icon: "mdi:leaf",
  },
  {
    id: "insight-2",
    title: "Demand for Working Capital",
    body: "Township retail and manufacturing SMEs now represent 32% of funding matches, with banks favouring blended facilities backed by purchase orders.",
    icon: "solar:wallet-linear",
  },
  {
    id: "insight-3",
    title: "Investor Focus Areas",
    body: "VC partners continue to prioritise proven ARR, but accelerators and grant-makers are leaning into digital public goods and healthcare infrastructure.",
    icon: "ph:chart-line-duotone",
  },
];

function createDefaultFilters(): FilterState {
  return {
    minAmount: undefined,
    maxAmount: undefined,
    deadline: "",
    types: new Set<FundingType>(FUNDING_TYPES),
  };
}

function formatFundingShort(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) {
    return "R0";
  }
  if (amount >= 1_000_000_000) {
    return `R${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    return `R${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `R${(amount / 1_000).toFixed(1)}K`;
  }
  return `R${amount.toLocaleString()}`;
}

function formatDateDisplay(dateIso: string): string {
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) {
    return "TBC";
  }
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AccessToCapitalLayer() {
  const [view, setView] = useState<ViewKey>("opportunities");
  const [search, setSearch] = useState("");
  const [selectedChip, setSelectedChip] = useState<FundingType | null>(null);
  const [filters, setFilters] = useState<FilterState>(() => createDefaultFilters());
  const [minAmountInput, setMinAmountInput] = useState("");
  const [maxAmountInput, setMaxAmountInput] = useState("");
  const [deadlineInput, setDeadlineInput] = useState("");

  const offcanvasRef = useRef<HTMLDivElement | null>(null);
  const offcanvasInstance = useRef<Offcanvas | null>(null);

  useEffect(() => {
    if (offcanvasRef.current) {
      offcanvasInstance.current = Offcanvas.getOrCreateInstance(offcanvasRef.current);
    }
    return () => {
      offcanvasInstance.current?.dispose();
      offcanvasInstance.current = null;
    };
  }, []);

  const totalFunding = useMemo(
    () => OPPORTUNITIES.reduce((acc, opp) => acc + opp.maxAmount, 0),
    []
  );

  const averageMatchScore = useMemo(() => {
    if (OPPORTUNITIES.length === 0) return 0;
    const total = OPPORTUNITIES.reduce((acc, opp) => acc + opp.matchScore, 0);
    return Math.round((total / OPPORTUNITIES.length) * 100);
  }, []);

  const highMatchCount = useMemo(
    () => OPPORTUNITIES.filter((opp) => opp.matchScore >= 0.8).length,
    []
  );

  const successfulMatches = useMemo(
    () => Math.round(OPPORTUNITIES.filter((opp) => opp.matchScore >= 0.7).length * 73),
    []
  );

  const typeCounts = useMemo(() => {
    const counts: Record<FundingType, number> = {
      grant: 0,
      vc: 0,
      angel: 0,
      bank: 0,
      accelerator: 0,
      competition: 0,
    };
    for (const opp of OPPORTUNITIES) {
      counts[opp.type] += 1;
    }
    return counts;
  }, []);

  const filteredOpportunities = useMemo(() => {
    const query = search.trim().toLowerCase();
    return OPPORTUNITIES.filter((opp) => {
      if (selectedChip && opp.type !== selectedChip) {
        return false;
      }
      if (!selectedChip && !filters.types.has(opp.type)) {
        return false;
      }
      if (filters.minAmount !== undefined && opp.maxAmount < filters.minAmount) {
        return false;
      }
      if (filters.maxAmount !== undefined && opp.minAmount > filters.maxAmount) {
        return false;
      }
      if (filters.deadline) {
        const filterDate = new Date(filters.deadline);
        const deadline = new Date(opp.deadline);
        if (!Number.isNaN(filterDate.getTime()) && deadline > filterDate) {
          return false;
        }
      }
      if (!query) {
        return true;
      }
      const haystack = `${opp.title} ${opp.blurb} ${opp.funder} ${opp.tag}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [filters, search, selectedChip]);

  const closeFilters = () => {
    offcanvasInstance.current?.hide();
  };

  const handleChipToggle = (type: FundingType) => {
    setSelectedChip((prev) => (prev === type ? null : type));
    setFilters((prev) => {
      if (prev.types.has(type)) {
        return prev;
      }
      const nextTypes = new Set(prev.types);
      nextTypes.add(type);
      return { ...prev, types: nextTypes };
    });
  };

  const handleTypeCheckbox = (type: FundingType, checked: boolean) => {
    setFilters((prev) => {
      const nextTypes = new Set(prev.types);
      if (checked) {
        nextTypes.add(type);
      } else {
        nextTypes.delete(type);
      }
      return { ...prev, types: nextTypes };
    });
  };

  const handleFilterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextMin = minAmountInput.trim() ? Number(minAmountInput.trim()) : undefined;
    const nextMax = maxAmountInput.trim() ? Number(maxAmountInput.trim()) : undefined;
    setFilters((prev) => ({
      ...prev,
      minAmount: Number.isFinite(nextMin) ? nextMin : undefined,
      maxAmount: Number.isFinite(nextMax) ? nextMax : undefined,
      deadline: deadlineInput,
    }));
    toast.success("Filters updated");
    closeFilters();
  };

  const handleResetFilters = () => {
    setFilters(() => createDefaultFilters());
    setMinAmountInput("");
    setMaxAmountInput("");
    setDeadlineInput("");
    setSelectedChip(null);
    toast.info("Filters reset");
    closeFilters();
  };

  const handleApplyNow = (title: string) => {
    toast.info(`${title}: application flow coming soon`);
  };

  const handleBecomeFunder = () => {
    toast.info("Funder onboarding is coming soon. Contact our partnerships team for early access.");
  };

  return (
    <section className="access-capital py-4 py-lg-5">
      <div className="container-xxl">
        <div className="d-none access-capital__hero card border-0 mb-4 mb-lg-5">
          <div className="card-body p-4 p-lg-5">
            <div className="row g-4 align-items-center">
              <div className="col-lg-7">
                <div className="d-inline-flex align-items-center gap-2 mb-3 small text-white-50">
                  <Icon icon="mdi:bell-outline" width={18} height={18} />
                  <span><strong>{highMatchCount}</strong> new funding matches this week</span>
                </div>
                <h1 className="display-5 fw-bold mb-3 access-capital__hero-title">Funding Hub</h1>
                <p className="lead text-white-50 mb-4">
                  Connect with aligned funders, sponsors, and investors. Receive AI-assisted matches based on your profile, traction, and funding needs.
                </p>
                <div className="d-flex flex-wrap gap-2">
                  <a className="btn btn-primary btn-lg text-neutral-600" href="#opportunities">
                    <Icon icon="mdi:search" className="me-2" />
                    Browse Opportunities
                  </a>
                  <button type="button" className="btn btn-light btn-lg text-neutral-400 fw-semibold" onClick={handleBecomeFunder}>
                    <Icon icon="mdi:office-building-plus-outline" className="me-2" />
                    Become a Funder
                  </button>
                </div>
              </div>
              <div className="col-lg-5 d-none d-lg-block">
                <div className="access-capital__hero-visual" aria-hidden="true">
                  <img
                    src="https://www.22onsloane.co/wp-content/uploads/2025/09/business-people-laptop-or-discussion-in-meeting-i-2025-04-06-10-32-37-utc-scaled.jpg"
                    alt=""
                    loading="lazy"
                    className="img-fluid rounded-4 shadow-lg w-100 h-100 object-fit-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-3 mb-4">
          {[{
            id: "total-funding",
            label: "Total Funding Available",
            value: formatFundingShort(totalFunding),
            delta: "+12%",
          }, {
            id: "active-opportunities",
            label: "Active Opportunities",
            value: OPPORTUNITIES.length.toLocaleString(),
            delta: "+8%",
          }, {
            id: "successful-matches",
            label: "Successful Matches",
            value: successfulMatches.toLocaleString(),
            delta: "+23%",
          }, {
            id: "avg-success",
            label: "Average Match Score",
            value: `${averageMatchScore}%`,
            delta: "+5%",
          }].map((kpi) => (
            <div className="col-6 col-lg-3" key={kpi.id}>
              <div className="access-capital__kpi card h-100">
                <div className="card-body">
                  <div className="text-uppercase small text-secondary mb-2">{kpi.label}</div>
                  <div className="d-flex align-items-end justify-content-between">
                    <div className="access-capital__kpi-value">{kpi.value}</div>
                    <span className="access-capital__delta">
                      <Icon icon="mdi:arrow-top-right" className="me-1" />
                      {kpi.delta}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center gap-3 mb-3">
          <div className="access-capital__search flex-grow-1 d-flex align-items-center" role="search">
            <Icon icon="mdi:magnify" className="ms-3 me-2 text-secondary" aria-hidden="true" />
            <input
              id="access-capital-search"
              type="search"
              className="form-control border-0 bg-transparent"
              placeholder="Search funding opportunities…"
              aria-label="Search funding opportunities"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <button
            className="btn btn-outline-primary d-flex align-items-center gap-2"
            type="button"
            data-bs-toggle="offcanvas"
            data-bs-target="#accessCapitalFilters"
          >
            <Icon icon="mdi:filter-variant" />
            Filters
          </button>
        </div>

        <div className="btn-group access-capital__segmented" role="tablist" aria-label="View switch">
          {VIEW_SWITCHER.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`btn btn-outline-secondary${view === option.id ? " active" : ""}`}
              aria-pressed={view === option.id}
              onClick={() => setView(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="d-flex flex-wrap gap-2 mt-3" aria-label="Funding categories">
          {FUNDING_TYPES.map((type) => {
            const meta = FUNDING_META[type];
            const isActive = selectedChip === type;
            return (
              <button
                key={type}
                type="button"
                className={`access-capital__chip${isActive ? " active" : ""}`}
                onClick={() => handleChipToggle(type)}
              >
                <Icon icon={meta.icon} width={18} height={18} />
                <span>{meta.label}</span>
                <span className="text-secondary small">({typeCounts[type] ?? 0})</span>
              </button>
            );
          })}
        </div>

        <section id="opportunities" className={`mt-4${view === "opportunities" ? "" : " d-none"}`} aria-live="polite">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="h5 mb-0">Featured Opportunities</h2>
            <Link className="text-secondary d-inline-flex align-items-center gap-1" to="/marketplace">
              <span>View marketplace</span>
              <Icon icon="mdi:arrow-right" width={18} height={18} />
            </Link>
          </div>
          <div className="row g-3">
            {filteredOpportunities.length === 0 && (
              <div className="col-12">
                <div className="alert alert-warning" role="status">
                  No opportunities match the current filters. Try adjusting the criteria.
                </div>
              </div>
            )}
            {filteredOpportunities.map((opp) => (
              <div key={opp.id} className="col-12 col-md-6 col-xl-4">
                <article className="access-capital__card card h-100">
                  <div className="card-body d-flex flex-column">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="access-capital__badge">{opp.tag}</span>
                      <span className="access-capital__match">
                        <Icon icon="mdi:check-decagram" className="me-1" />
                        {Math.round(opp.matchScore * 100)}% match
                      </span>
                    </div>
                    <h3 className="h5">{opp.title}</h3>
                    <p className="text-secondary mb-3">{opp.blurb}</p>
                    <dl className="row g-0 small mb-0 flex-grow-1">
                      <dt className="col-5 text-secondary">Funder</dt>
                      <dd className="col-7">{opp.funder}</dd>
                      <dt className="col-5 text-secondary">Amount</dt>
                      <dd className="col-7">{opp.amountDisplay}</dd>
                      <dt className="col-5 text-secondary">Deadline</dt>
                      <dd className="col-7">
                        <time dateTime={opp.deadline}>{formatDateDisplay(opp.deadline)}</time>
                      </dd>
                    </dl>
                    <div className="d-grid mt-3">
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => handleApplyNow(opp.title)}
                        aria-label={`Apply now for ${opp.title}`}
                      >
                        Apply Now
                      </button>
                    </div>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </section>

        <section className={`mt-4${view === "funders" ? "" : " d-none"}`} aria-live="polite">
          <h2 className="h5 mb-3">Funder Directory</h2>
          <div className="row g-3">
            {FUNDERS.map((funder) => (
              <div className="col-12 col-lg-6" key={funder.id}>
                <article className="access-capital__card card h-100">
                  <div className="card-body">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <h3 className="h5 mb-0">{funder.name}</h3>
                      <span className="badge text-bg-light text-secondary">Active</span>
                    </div>
                    <p className="text-secondary mb-3">{funder.focus}</p>
                    <ul className="list-unstyled small mb-3 access-capital__meta">
                      <li>
                        <Icon icon="mdi:coin" className="me-2 text-primary" /> Ticket size: {funder.ticket}
                      </li>
                      <li>
                        <Icon icon="mdi:arrow-up-bold" className="me-2 text-primary" /> Preferred stage: {funder.stage}
                      </li>
                      <li>
                        <Icon icon="mdi:map-marker-outline" className="me-2 text-primary" /> Geography: {funder.geography}
                      </li>
                    </ul>
                    <div className="small text-secondary">Recent activity: {funder.recent}</div>
                  </div>
                </article>
              </div>
            ))}
            <div className="col-12">
              <div className="access-capital__coming text-center py-5">
                <Icon icon="mdi:domain" className="display-5 text-secondary mb-3" />
                <p className="lead mb-2">More verified funders are being onboarded weekly.</p>
                <button type="button" className="btn btn-outline-secondary" onClick={handleBecomeFunder}>
                  Join the directory
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className={`mt-4${view === "insights" ? "" : " d-none"}`} aria-live="polite">
          <h2 className="h5 mb-3">Funding Insights</h2>
          <div className="row g-3">
            {INSIGHTS.map((insight) => (
              <div className="col-12 col-lg-4" key={insight.id}>
                <article className="access-capital__card card h-100">
                  <div className="card-body">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <Icon icon={insight.icon} className="text-primary" width={24} height={24} />
                      <h3 className="h6 mb-0">{insight.title}</h3>
                    </div>
                    <p className="text-secondary mb-0">{insight.body}</p>
                  </div>
                </article>
              </div>
            ))}
            <div className="col-12">
              <div className="access-capital__coming text-center py-5">
                <Icon icon="mdi:chart-line" className="display-5 text-secondary mb-3" />
                <p className="lead mb-2">Personalised analytics are on our roadmap.</p>
                <Link className="btn btn-outline-secondary" to="/subscriptions">
                  Manage alerts
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div
        className="offcanvas offcanvas-end access-capital__filters"
        tabIndex={-1}
        id="accessCapitalFilters"
        ref={offcanvasRef}
        aria-labelledby="accessCapitalFiltersLabel"
      >
        <div className="offcanvas-header">
          <h5 id="accessCapitalFiltersLabel" className="mb-0">Filters</h5>
          <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close filters" />
        </div>
        <div className="offcanvas-body">
          <form className="vstack gap-3" onSubmit={handleFilterSubmit}>
            <div>
              <label htmlFor="filter-min-amount" className="form-label fw-semibold">Minimum amount (R)</label>
              <input
                id="filter-min-amount"
                type="number"
                min={0}
                className="form-control"
                value={minAmountInput}
                onChange={(event) => setMinAmountInput(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="filter-max-amount" className="form-label fw-semibold">Maximum amount (R)</label>
              <input
                id="filter-max-amount"
                type="number"
                min={0}
                className="form-control"
                value={maxAmountInput}
                onChange={(event) => setMaxAmountInput(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="filter-deadline" className="form-label fw-semibold">Deadline before</label>
              <input
                id="filter-deadline"
                type="date"
                className="form-control"
                value={deadlineInput}
                onChange={(event) => setDeadlineInput(event.target.value)}
              />
            </div>
            <div>
              <span className="form-label fw-semibold d-block">Funding type</span>
              <div className="d-flex flex-wrap gap-2">
                {FUNDING_TYPES.map((type) => (
                  <div className="form-check" key={type}>
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`filter-type-${type}`}
                      checked={filters.types.has(type)}
                      onChange={(event) => handleTypeCheckbox(type, event.target.checked)}
                    />
                    <label className="form-check-label" htmlFor={`filter-type-${type}`}>
                      {FUNDING_META[type].label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-primary flex-fill">
                <Icon icon="mdi:filter-check-outline" className="me-2" />
                Apply filters
              </button>
              <button type="button" className="btn btn-outline-secondary flex-fill" onClick={handleResetFilters}>
                Reset
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
