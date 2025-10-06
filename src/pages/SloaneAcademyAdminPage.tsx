import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import MasterLayout from "../masterLayout/MasterLayout.jsx";
import appData from "../../backend/appData.json";

const RESOURCE_KEY = "sloane_academy_admin_resources_v1";
const ACTIVITY_KEY = "sloane_academy_admin_activity_v1";

interface Cohort {
  id: string;
  name: string;
}

interface Startup {
  id: string;
  name: string;
  cohort?: string;
}

interface ResourceItem {
  id: string;
  cohortId: string;
  cohortName: string;
  moduleTitle: string;
  summary: string;
  resourceType: string;
  deliveryMode: string;
  duration: string;
  link?: string;
  attachmentName?: string | null;
  status: "Published" | "Pending review" | "Draft";
  uploadedBy: string;
  addedAt: string;
}

interface ActivityItem {
  id: string;
  message: string;
  at: string;
}

interface PerformanceRow {
  startupId: string;
  startupName: string;
  cohortName: string;
  completion: number;
  timeSpentHours: number;
  activeLearners: number;
  riskLevel: "On track" | "Needs focus" | "At risk";
  lastActivity: string;
}

const rawCohorts = (appData as any)?.cohorts as Cohort[] | undefined;
const rawStartups = (appData as any)?.startups as Startup[] | undefined;

const DEFAULT_RESOURCES: ResourceItem[] = [
  {
    id: "demo-resource-1",
    cohortId: rawCohorts?.[0]?.id ?? "african-bank",
    cohortName: rawCohorts?.[0]?.name ?? "African Bank",
    moduleTitle: "Module 1: Fintech Innovations",
    summary: "Updated slide deck plus facilitator notes for onboarding session.",
    resourceType: "Slide deck",
    deliveryMode: "Facilitated workshop",
    duration: "90 min",
    link: "https://drive.google.com/",
    status: "Published",
    uploadedBy: "Sloane Academy Ops",
    addedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
  },
  {
    id: "demo-resource-2",
    cohortId: rawCohorts?.[1]?.id ?? "assupol",
    cohortName: rawCohorts?.[1]?.name ?? "Assupol",
    moduleTitle: "Customer Discovery Interview Guide",
    summary: "Template questions for partners to use during week 2 coaching.",
    resourceType: "Worksheet",
    deliveryMode: "Self-paced",
    duration: "45 min",
    status: "Pending review",
    uploadedBy: "Assupol Partner Team",
    addedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
];

const PERFORMANCE_BASELINE: Record<string, PerformanceRow> = {
  s1: {
    startupId: "s1",
    startupName: "AfriTech",
    cohortName: rawCohorts?.[0]?.name ?? "African Bank",
    completion: 68,
    timeSpentHours: 32,
    activeLearners: 5,
    riskLevel: "Needs focus",
    lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
  },
  s2: {
    startupId: "s2",
    startupName: "FinConnect",
    cohortName: rawCohorts?.[1]?.name ?? "Assupol",
    completion: 82,
    timeSpentHours: 28,
    activeLearners: 4,
    riskLevel: "On track",
    lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
  s3: {
    startupId: "s3",
    startupName: "RetailFlow",
    cohortName: rawCohorts?.[2]?.name ?? "Standard Bank",
    completion: 41,
    timeSpentHours: 19,
    activeLearners: 3,
    riskLevel: "At risk",
    lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
};

function readStoredResources(): ResourceItem[] {
  try {
    const raw = localStorage.getItem(RESOURCE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item?.id);
  } catch {
    return [];
  }
}

function writeStoredResources(items: ResourceItem[]) {
  try {
    localStorage.setItem(RESOURCE_KEY, JSON.stringify(items));
  } catch {
    /* ignore persistence issues */
  }
}

function readStoredActivity(): ActivityItem[] {
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item?.id);
  } catch {
    return [];
  }
}

function writeStoredActivity(items: ActivityItem[]) {
  try {
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en-ZA", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function determineRiskLabel(pct: number): PerformanceRow["riskLevel"] {
  if (pct >= 75) return "On track";
  if (pct >= 50) return "Needs focus";
  return "At risk";
}

export default function SloaneAcademyAdminPage() {
  const cohorts = useMemo(() => (Array.isArray(rawCohorts) ? rawCohorts : []), []);
  const startups = useMemo(() => (Array.isArray(rawStartups) ? rawStartups : []), []);

  const [resources, setResources] = useState<ResourceItem[]>(() => {
    const stored = readStoredResources();
    if (stored.length) return stored;
    return DEFAULT_RESOURCES;
  });
  const [activity, setActivity] = useState<ActivityItem[]>(() => {
    const stored = readStoredActivity();
    if (stored.length) return stored;
    return DEFAULT_RESOURCES.slice(0, 3).map((item) => ({
      id: `log-${item.id}`,
      message: `${item.status === "Published" ? "Published" : "Queued"} ${item.resourceType.toLowerCase()} · ${item.moduleTitle}`,
      at: item.addedAt,
    }));
  });

  useEffect(() => writeStoredResources(resources), [resources]);
  useEffect(() => writeStoredActivity(activity), [activity]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [attachmentLabel, setAttachmentLabel] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [form, setForm] = useState({
    cohortId: cohorts[0]?.id ?? "",
    moduleTitle: "",
    summary: "",
    resourceType: "Video",
    deliveryMode: "Self-paced",
    duration: "",
    link: "",
    uploadedBy: "",
  });

  const performanceRows = useMemo(() => {
    const baseRows: PerformanceRow[] = [];
    const fallbackCohorts = cohorts.length ? cohorts : [{ id: "general", name: "General" }];

    startups.slice(0, 6).forEach((startup, index) => {
      const baseline = PERFORMANCE_BASELINE[startup.id];
      const cohortMatch = (
        cohorts.find((c) => c.id === (startup.cohort || "")) ||
        (baseline?.cohortName ? cohorts.find((c) => c.name === baseline.cohortName) : undefined) ||
        fallbackCohorts[index % fallbackCohorts.length]
      );
      const completion = baseline?.completion ?? Math.max(25, 60 - index * 5);
      const row: PerformanceRow = {
        startupId: startup.id,
        startupName: startup.name,
        cohortName: cohortMatch?.name ?? "General",
        completion,
        timeSpentHours: baseline?.timeSpentHours ?? Math.max(10, 30 - index * 3),
        activeLearners: baseline?.activeLearners ?? Math.max(2, 5 - index),
        riskLevel: baseline?.riskLevel ?? determineRiskLabel(completion),
        lastActivity: baseline?.lastActivity ?? new Date(Date.now() - 1000 * 60 * 60 * (index + 12)).toISOString(),
      };
      baseRows.push(row);
    });

    if (!baseRows.length) {
      baseRows.push({
        startupId: "demo",
        startupName: "Sample Startup",
        cohortName: fallbackCohorts[0]?.name ?? "Sloane Academy",
        completion: 55,
        timeSpentHours: 18,
        activeLearners: 3,
        riskLevel: "Needs focus",
        lastActivity: new Date().toISOString(),
      });
    }

    return baseRows;
  }, [startups, cohorts]);

  const kpis = useMemo(() => {
    const total = performanceRows.length;
    const completionSum = performanceRows.reduce((sum, row) => sum + row.completion, 0);
    const avgCompletion = total ? Math.round(completionSum / total) : 0;
    const activeHours = performanceRows.reduce((sum, row) => sum + row.timeSpentHours, 0);
    const activeLearners = performanceRows.reduce((sum, row) => sum + row.activeLearners, 0);
    const alerts = performanceRows.filter((row) => row.riskLevel !== "On track").length;
    return {
      avgCompletion,
      activeHours,
      activeLearners,
      alerts,
      total,
    };
  }, [performanceRows]);

  const [cohortFilter, setCohortFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredPerformance = useMemo(() => {
    return performanceRows.filter((row) => {
      const passesCohort = cohortFilter === "all" || row.cohortName === cohortFilter;
      const passesStatus =
        statusFilter === "all" ||
        (statusFilter === "on-track" && row.riskLevel === "On track") ||
        (statusFilter === "needs-focus" && row.riskLevel === "Needs focus") ||
        (statusFilter === "at-risk" && row.riskLevel === "At risk");
      return passesCohort && passesStatus;
    });
  }, [performanceRows, cohortFilter, statusFilter]);

  function updateFeedback(message: string) {
    setFeedback(message);
    window.setTimeout(() => setFeedback(null), 3200);
  }

  function handleFormChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setAttachmentLabel(file ? file.name : null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.moduleTitle.trim()) {
      updateFeedback("Provide a module title before submitting.");
      return;
    }

    const cohort = cohorts.find((item) => item.id === form.cohortId) ?? cohorts[0] ?? { id: "general", name: "General" };
    const now = new Date().toISOString();
    const item: ResourceItem = {
      id: `res-${Date.now()}`,
      cohortId: cohort.id,
      cohortName: cohort.name,
      moduleTitle: form.moduleTitle.trim(),
      summary: form.summary.trim(),
      resourceType: form.resourceType,
      deliveryMode: form.deliveryMode,
      duration: form.duration.trim() || "Self-paced",
      link: form.link.trim() || undefined,
      attachmentName: attachmentLabel,
      status: "Pending review",
      uploadedBy: form.uploadedBy.trim() || "Partner portal",
      addedAt: now,
    };

    setResources((prev) => [item, ...prev]);
    setActivity((prev) => [
      {
        id: `log-${item.id}`,
        message: `Submitted ${item.resourceType.toLowerCase()} for ${item.moduleTitle}`,
        at: now,
      },
      ...prev,
    ].slice(0, 12));

    setForm((prev) => ({
      ...prev,
      moduleTitle: "",
      summary: "",
      duration: "",
      link: "",
    }));
    setAttachmentLabel(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    updateFeedback("Resource submitted for review.");
  }

  function updateResourceStatus(id: string, status: ResourceItem["status"]) {
    setResources((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
    const resource = resources.find((item) => item.id === id);
    if (resource) {
      setActivity((prev) => [
        {
          id: `log-${id}-${status}`,
          message: `${status} · ${resource.moduleTitle}`,
          at: new Date().toISOString(),
        },
        ...prev,
      ].slice(0, 12));
    }
  }

  function exportResources() {
    const headers = ["Cohort", "Module", "Type", "Delivery", "Duration", "Status", "Uploaded by", "Added at"];
    const rows = resources.map((item) => [
      item.cohortName,
      item.moduleTitle,
      item.resourceType,
      item.deliveryMode,
      item.duration,
      item.status,
      item.uploadedBy,
      formatDateTime(item.addedAt),
    ]);
    const csv = [headers, ...rows]
      .map((line) =>
        line
          .map((cell) => {
            const value = cell ?? "";
            return `"${String(value).replace(/"/g, '""')}"`;
          })
          .join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `sloane-academy-resources-${Date.now()}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    updateFeedback("Exporting resource library.");
  }

  return (
    <MasterLayout>
      <div className="container-fluid py-4">
        <div className="row g-24">
          <div className="col-12">
            <div className="card radius-16 border-0 shadow-sm p-24 bg-base">
              <div className="row g-16 align-items-center">
                <div className="col-12 col-lg-8">
                  <span className="badge bg-neutral-100 text-primary-700 mb-12">Partner console</span>
                  <h1 className="mb-12">Sloane Academy admin</h1>
                  <p className="text-secondary-light mb-0">
                    Upload programme materials, publish partner updates, and monitor startup engagement across cohorts. Use the filters to surface teams that need support.
                  </p>
                </div>
                <div className="col-12 col-lg-4 text-lg-end d-flex d-lg-block gap-12 justify-content-start">
                  <button type="button" className="btn btn-outline-primary-600 px-24" onClick={exportResources}>
                    <Icon icon="mdi:tray-arrow-down" className="me-6" /> Export library
                  </button>
                </div>
              </div>
            </div>
          </div>

          {feedback && (
            <div className="col-12">
              <div className="alert alert-success mb-0">{feedback}</div>
            </div>
          )}

          <div className="col-12">
            <div className="row g-16">
              <div className="col-6 col-lg-3">
                <div className="card radius-12 p-16 border-0 bg-base">
                  <span className="text-secondary-light">Average completion</span>
                  <h3 className="mt-12 mb-4">{kpis.avgCompletion}%</h3>
                  <small className="text-success-600">
                    <Icon icon="mdi:trending-up" /> {kpis.total} active teams
                  </small>
                </div>
              </div>
              <div className="col-6 col-lg-3">
                <div className="card radius-12 p-16 border-0 bg-base">
                  <span className="text-secondary-light">Learner hours logged</span>
                  <h3 className="mt-12 mb-4">{kpis.activeHours}</h3>
                  <small className="text-secondary-light">Across tracked startups</small>
                </div>
              </div>
              <div className="col-6 col-lg-3">
                <div className="card radius-12 p-16 border-0 bg-base">
                  <span className="text-secondary-light">Active learners</span>
                  <h3 className="mt-12 mb-4">{kpis.activeLearners}</h3>
                  <small className="text-secondary-light">Seats engaged this week</small>
                </div>
              </div>
              <div className="col-6 col-lg-3">
                <div className="card radius-12 p-16 border-0 bg-base">
                  <span className="text-secondary-light">Needs attention</span>
                  <h3 className="mt-12 mb-4">{kpis.alerts}</h3>
                  <small className="text-danger-600">Cohorts below target</small>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-xl-5">
            <div className="card radius-16 p-24 border-0 bg-base h-100">
              <h4 className="mb-16">Submit learning material</h4>
              <p className="text-secondary-light mb-16">
                Attach decks, worksheets, or recordings. Submissions move to review before being published to the academy catalogue.
              </p>
              <form onSubmit={handleSubmit} className="d-flex flex-column gap-16">
                <div>
                  <label className="form-label">Programme</label>
                  <select
                    className="form-select"
                    name="cohortId"
                    value={form.cohortId}
                    onChange={handleFormChange}
                    required
                  >
                    {cohorts.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Module title</label>
                  <input
                    type="text"
                    className="form-control"
                    name="moduleTitle"
                    placeholder="e.g. Designing for financial literacy"
                    value={form.moduleTitle}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Summary</label>
                  <textarea
                    className="form-control"
                    name="summary"
                    rows={3}
                    placeholder="What should founders expect from this material?"
                    value={form.summary}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="row g-12">
                  <div className="col">
                    <label className="form-label">Resource type</label>
                    <select className="form-select" name="resourceType" value={form.resourceType} onChange={handleFormChange}>
                      <option>Video</option>
                      <option>Slide deck</option>
                      <option>Worksheet</option>
                      <option>Templates</option>
                      <option>Reading</option>
                    </select>
                  </div>
                  <div className="col">
                    <label className="form-label">Delivery mode</label>
                    <select className="form-select" name="deliveryMode" value={form.deliveryMode} onChange={handleFormChange}>
                      <option>Self-paced</option>
                      <option>Facilitated workshop</option>
                      <option>Coaching session</option>
                      <option>Live webinar</option>
                    </select>
                  </div>
                </div>
                <div className="row g-12">
                  <div className="col">
                    <label className="form-label">Duration</label>
                    <input
                      type="text"
                      className="form-control"
                      name="duration"
                      placeholder="e.g. 45 min"
                      value={form.duration}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div className="col">
                    <label className="form-label">Access link</label>
                    <input
                      type="url"
                      className="form-control"
                      name="link"
                      placeholder="https://"
                      value={form.link}
                      onChange={handleFormChange}
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">Attach file</label>
                  <input type="file" className="form-control" onChange={handleFileChange} ref={fileInputRef} />
                  {attachmentLabel && <small className="text-secondary-light d-block mt-4">Attachment: {attachmentLabel}</small>}
                </div>
                <div>
                  <label className="form-label">Uploaded by</label>
                  <input
                    type="text"
                    className="form-control"
                    name="uploadedBy"
                    placeholder="e.g. Microsoft partner lead"
                    value={form.uploadedBy}
                    onChange={handleFormChange}
                  />
                </div>
                <button type="submit" className="btn btn-primary-600">Submit for review</button>
              </form>
            </div>
          </div>

          <div className="col-12 col-xl-7">
            <div className="card radius-16 p-24 border-0 bg-base h-100">
              <div className="d-flex flex-column flex-md-row justify-content-between gap-12 mb-16">
                <div>
                  <h4 className="mb-4">Resource library</h4>
                  <p className="text-secondary-light mb-0">Track drafts, review queue, and published material across cohorts.</p>
                </div>
              </div>
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th>Module</th>
                      <th>Cohort</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Updated</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resources.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="fw-medium">{item.moduleTitle}</div>
                          <small className="text-secondary-light">{item.summary || "—"}</small>
                        </td>
                        <td>{item.cohortName}</td>
                        <td>{item.resourceType}</td>
                        <td>
                          <span
                            className={`badge ${
                              item.status === "Published"
                                ? "bg-success-100 text-success-700"
                                : item.status === "Pending review"
                                ? "bg-warning-100 text-warning-700"
                                : "bg-neutral-100 text-neutral-700"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td>{formatDateTime(item.addedAt)}</td>
                        <td className="text-end">
                          <div className="btn-group btn-group-sm">
                            {item.status !== "Published" && (
                              <button type="button" className="btn btn-outline-success-600" onClick={() => updateResourceStatus(item.id, "Published")}>
                                Publish
                              </button>
                            )}
                            {item.status !== "Draft" && (
                              <button type="button" className="btn btn-outline-primary-600" onClick={() => updateResourceStatus(item.id, "Draft")}>
                                Move to draft
                              </button>
                            )}
                            {item.link && (
                              <a className="btn btn-outline-secondary" href={item.link} target="_blank" rel="noreferrer">
                                Open
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="col-12">
            <div className="card radius-16 p-24 border-0 bg-base">
              <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-12 mb-16">
                <div>
                  <h4 className="mb-4">Startup learning performance</h4>
                  <p className="text-secondary-light mb-0">Monitor progress across tracked startups. Use filters to spot teams falling behind.</p>
                </div>
                <div className="d-flex gap-12 flex-wrap">
                  <select className="form-select" value={cohortFilter} onChange={(event) => setCohortFilter(event.target.value)}>
                    <option value="all">All cohorts</option>
                    {[...new Set(performanceRows.map((row) => row.cohortName))].map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                  <select className="form-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                    <option value="all">All statuses</option>
                    <option value="on-track">On track</option>
                    <option value="needs-focus">Needs focus</option>
                    <option value="at-risk">At risk</option>
                  </select>
                </div>
              </div>
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th>Startup</th>
                      <th>Cohort</th>
                      <th style={{ width: "22%" }}>Completion</th>
                      <th>Hours</th>
                      <th>Learners</th>
                      <th>Status</th>
                      <th>Last activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPerformance.map((row) => (
                      <tr key={row.startupId}>
                        <td>{row.startupName}</td>
                        <td>{row.cohortName}</td>
                        <td>
                          <div className="progress" style={{ height: 10 }}>
                            <div
                              className={`progress-bar ${
                                row.riskLevel === "On track"
                                  ? "bg-success-600"
                                  : row.riskLevel === "Needs focus"
                                  ? "bg-warning-600"
                                  : "bg-danger-600"
                              }`}
                              role="progressbar"
                              style={{ width: `${row.completion}%` }}
                              aria-valuenow={row.completion}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            />
                          </div>
                          <small className="text-secondary-light">{row.completion}%</small>
                        </td>
                        <td>{row.timeSpentHours}</td>
                        <td>{row.activeLearners}</td>
                        <td>
                          <span
                            className={`badge ${
                              row.riskLevel === "On track"
                                ? "bg-success-100 text-success-700"
                                : row.riskLevel === "Needs focus"
                                ? "bg-warning-100 text-warning-700"
                                : "bg-danger-100 text-danger-700"
                            }`}
                          >
                            {row.riskLevel}
                          </span>
                        </td>
                        <td>{formatDateTime(row.lastActivity)}</td>
                      </tr>
                    ))}
                    {!filteredPerformance.length && (
                      <tr>
                        <td colSpan={7} className="text-center text-secondary-light py-24">
                          No startups match the current filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="col-12 col-xl-5">
            <div className="card radius-16 p-24 border-0 bg-base h-100">
              <h5 className="mb-16">Activity log</h5>
              <ul className="list-unstyled d-flex flex-column gap-12 mb-0">
                {activity.slice(0, 6).map((item) => (
                  <li key={item.id} className="border radius-12 p-16">
                    <div className="d-flex justify-content-between mb-6">
                      <span className="fw-medium">{item.message}</span>
                      <Icon icon="mdi:clock-outline" className="text-neutral-400" width={18} height={18} />
                    </div>
                    <small className="text-secondary-light">{formatDateTime(item.at)}</small>
                  </li>
                ))}
                {!activity.length && <li className="text-secondary-light">No activity recorded yet.</li>}
              </ul>
            </div>
          </div>

          <div className="col-12 col-xl-7">
            <div className="card radius-16 p-24 border-0 bg-base h-100">
              <h5 className="mb-16">Partner actions</h5>
              <div className="row g-16">
                <div className="col-12 col-md-6">
                  <div className="border radius-12 p-16 h-100">
                    <h6 className="mb-8">Upcoming tasks</h6>
                    <ul className="list-unstyled mb-0 text-secondary-light d-flex flex-column gap-6">
                      <li>• Finalise AWS mentor list for week 3 clinics</li>
                      <li>• Upload recordings from Cape Town founders session</li>
                      <li>• Share updated onboarding checklist with cohorts</li>
                    </ul>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="border radius-12 p-16 h-100">
                    <h6 className="mb-8">Support requests</h6>
                    <ul className="list-unstyled mb-0 text-secondary-light d-flex flex-column gap-6">
                      <li>• AfriTech: Needs design thinking coach for sprint</li>
                      <li>• RetailFlow: Requesting investor readiness review</li>
                      <li>• FinConnect: Waiting on compliance template</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MasterLayout>
  );
}
