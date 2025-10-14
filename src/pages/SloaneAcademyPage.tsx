import { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import MasterLayout from "../masterLayout/MasterLayout.jsx";
import { useAppSync } from "../context/useAppSync";

const PROGRESS_KEY = "sloane_academy_progress_v2";
const FALLBACK_VIDEO = "https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4";

interface Course {
  id: string;
  title: string;
  description?: string;
  videoUrl?: string;
  videoThumbnail?: string;
  duration?: string;
}

interface Cohort {
  id: string;
  name: string;
  description?: string;
  courses?: Course[];
}

interface EventItem {
  id: string;
  title: string;
  date?: string;
  time?: string;
  host?: string;
  location?: string;
  imageUrl?: string;
  type?: string;
}

interface AppDataShape {
  cohorts?: Cohort[];
  events?: EventItem[];
}

function readStoredProgress(): Set<string> {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id) => typeof id === "string"));
  } catch {
    return new Set();
  }
}

function writeStoredProgress(ids: Set<string>) {
  try {
    const arr = Array.from(ids);
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(arr));
  } catch {
    /* ignore persistence issues */
  }
}

function parseDurationMinutes(text?: string): number {
  if (!text) return 0;
  const match = text.match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

function formatDate(iso?: string): string {
  if (!iso) return "To be announced";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "To be announced";
  return new Intl.DateTimeFormat("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

function resolveVideoUrl(course: Course | undefined): string {
  if (!course) return FALLBACK_VIDEO;
  const url = (course as any)?.videoUrl || (course as any)?.video || null;
  if (typeof url === "string" && url.startsWith("http")) return url;
  return FALLBACK_VIDEO;
}

export default function SloaneAcademyPage() {
  const { appData } = useAppSync();
  const rawData = (appData || { cohorts: [], events: [] }) as AppDataShape;
  
  const cohorts = useMemo(() => (Array.isArray(rawData?.cohorts) ? rawData.cohorts : []), [rawData]);
  const [progress, setProgress] = useState<Set<string>>(readStoredProgress);
  const [cohortId, setCohortId] = useState(() => cohorts[0]?.id ?? "");
  const [courseId, setCourseId] = useState(() => cohorts[0]?.courses?.[0]?.id ?? "");
  const [expandedId, setExpandedId] = useState(() => cohorts[0]?.courses?.[0]?.id ?? "");

  useEffect(() => writeStoredProgress(progress), [progress]);

  const cohort = useMemo(() => cohorts.find((c) => c.id === cohortId) || cohorts[0] || null, [cohorts, cohortId]);
  const courses = useMemo(() => (Array.isArray(cohort?.courses) ? cohort.courses : []), [cohort]);

  useEffect(() => {
    if (!courses.length) {
      setCourseId("");
      setExpandedId("");
      return;
    }
    if (!courses.some((courseItem) => courseItem.id === courseId)) {
      const fallback = courses[0]?.id ?? "";
      setCourseId(fallback);
      setExpandedId(fallback);
    }
  }, [courses, courseId]);

  useEffect(() => {
    if (courseId) setExpandedId(courseId);
  }, [courseId]);

  const course = useMemo(() => courses.find((c) => c.id === courseId) || null, [courses, courseId]);

  const allModules = useMemo(() => {
    const items: { course: Course; cohort: Cohort }[] = [];
    cohorts.forEach((c) => {
      c?.courses?.forEach((crs) => {
        if (!crs?.id) return;
        items.push({ course: crs, cohort: c });
      });
    });
    return items;
  }, [cohorts]);

  const totalModules = allModules.length;
  const completedModules = useMemo(() => allModules.filter((item) => progress.has(item.course.id)).length, [allModules, progress]);
  const completionPct = totalModules ? Math.round((completedModules / totalModules) * 100) : 0;

  const totalMinutes = useMemo(() => allModules.reduce((minutes, item) => minutes + parseDurationMinutes(item.course.duration), 0), [allModules]);

  const courseProgress = useMemo(() => {
    return courses.map((crs) => {
      const minutes = parseDurationMinutes(crs.duration);
      const completed = progress.has(crs.id);
      return {
        id: crs.id,
        title: crs.title,
        description: crs.description,
        thumbnail: crs.videoThumbnail,
        minutes,
        completed,
      };
    });
  }, [courses, progress]);

  const upcomingEvents = useMemo(() => {
    const rawEvents = Array.isArray(rawData?.events) ? rawData.events : [];
    const today = new Date();
    return rawEvents
      .filter((event) => {
        if (!event?.date) return true;
        const date = new Date(event.date);
        return !Number.isNaN(date.getTime()) && date >= today;
      })
      .slice(0, 3);
  }, []);

  function handleModuleSelect(id: string) {
    if (!id) return;
    setCourseId(id);
    setExpandedId(id);
    try {
      document.getElementById("sloane-progress")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      /* ignore scroll errors */
    }
  }

  function handleVideoEnded(id: string) {
    if (!id) return;
    setProgress((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  function resetModule(id: string) {
    setProgress((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  const currentComplete = course ? progress.has(course.id) : false;

  return (
    <MasterLayout>
      <div className="container-fluid py-4">
        <div className="row g-24">
          <div className="col-12">
            <div className="card radius-16 border-0 shadow-sm p-24 bg-base">
              <div className="row g-16 align-items-center">
                <div className="col-12 col-lg-7">
                  <span className="badge bg-primary-100 text-primary-700 mb-12">Sloane Academy</span>
                  <h1 className="mb-12">Video-led learning journeys for African founders & operators</h1>
                  <p className="text-secondary-light mb-16">
                    Watch partner-powered modules end-to-end to unlock completion. Switch programmes to explore other academies and keep your knowledge current.
                  </p>
                  <div className="d-flex flex-wrap gap-12">
                    <button
                      type="button"
                      className="btn btn-primary-600 px-24"
                      onClick={() => document.getElementById("sloane-cohort-selector")?.scrollIntoView({ behavior: "smooth" })}
                    >
                      Browse programmes
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-primary-600 px-24"
                      onClick={() => document.getElementById("sloane-progress")?.scrollIntoView({ behavior: "smooth" })}
                    >
                      View my progress
                    </button>
                  </div>
                </div>
                <div className="col-12 col-lg-5">
                  <div className="card border-0 radius-16 bg-base p-24 h-100">
                    <div className="d-flex justify-content-between align-items-center mb-16">
                      <h6 className="mb-0">Overall progress</h6>
                      <span className="badge bg-primary-50 text-primary-700">{completionPct}%</span>
                    </div>
                    <p className="text-secondary-light mb-20">
                      You have completed {completedModules} of {totalModules} video modules across partner programmes.
                    </p>
                    <div className="d-flex align-items-center gap-16">
                      <div className="progress flex-grow-1" style={{ height: 12 }}>
                        <div
                          className="progress-bar bg-primary-600"
                          role="progressbar"
                          style={{ width: `${completionPct}%` }}
                          aria-valuenow={completionPct}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        />
                      </div>
                      <span className="fw-medium text-primary-700">{completionPct}%</span>
                    </div>
                    <div className="mt-20 d-flex flex-wrap gap-16">
                      <div className="d-flex align-items-center gap-8">
                        <Icon icon="mdi:account-group" className="text-primary-500" width={24} height={24} />
                        <span className="text-secondary-light">{cohorts.length} partner tracks</span>
                      </div>
                      <div className="d-flex align-items-center gap-8">
                        <Icon icon="mdi:clock-outline" className="text-warning-500" width={24} height={24} />
                        <span className="text-secondary-light">~{Math.max(1, Math.round(totalMinutes / 60))} hrs of content</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12">
            <div className="row g-16">
              <div className="col-6 col-md-3">
                <div className="card radius-12 p-16 h-100 border-0 bg-base">
                  <span className="text-secondary-light">Programmes</span>
                  <h3 className="mt-12 mb-0">{cohorts.length}</h3>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="card radius-12 p-16 h-100 border-0 bg-base">
                  <span className="text-secondary-light">Modules</span>
                  <h3 className="mt-12 mb-0">{totalModules}</h3>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="card radius-12 p-16 h-100 border-0 bg-base">
                  <span className="text-secondary-light">Completed</span>
                  <h3 className="mt-12 mb-0">{completedModules}</h3>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="card radius-12 p-16 h-100 border-0 bg-base">
                  <span className="text-secondary-light">Completion</span>
                  <h3 className="mt-12 mb-0">{completionPct}%</h3>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12" id="sloane-cohort-selector">
            <div className="card radius-16 p-24 border-0 bg-base">
              <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-12 mb-20">
                <div>
                  <h4 className="mb-4">Partner programmes</h4>
                  <p className="text-secondary-light mb-0">Switch academies to watch partner videos and track completion.</p>
                </div>
                <div>
                  <select
                    className="form-select btn btn-outline-primary-600 border rounded-pill px-24"
                    value={cohort?.id ?? ""}
                    onChange={(event) => setCohortId(event.target.value)}
                    aria-label="Select partner programme"
                  >
                    {cohorts.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {courses.length ? (
                <div className="accordion" id="module-accordion" role="tablist">
                  {courseProgress.map((item) => {
                    const expanded = expandedId === item.id;
                    return (
                      <div key={item.id} className="accordion-item border radius-12 mb-12 bg-base">
                        <h2 className="accordion-header" id={`module-head-${item.id}`}>
                          <button
                            type="button"
                            className={`accordion-button d-flex gap-16 align-items-center ${expanded ? "" : "collapsed"}`}
                            onClick={() => handleModuleSelect(item.id)}
                            aria-expanded={expanded}
                            aria-controls={`module-panel-${item.id}`}
                          >
                            {item.thumbnail ? (
                              <img
                                src={item.thumbnail}
                                alt=""
                                className="rounded"
                                style={{ width: 80, height: 56, objectFit: "cover" }}
                              />
                            ) : (
                              <div
                                className="rounded bg-neutral-100 d-flex align-items-center justify-content-center"
                                style={{ width: 80, height: 56 }}
                              >
                                <Icon icon="mdi:play-circle-outline" width={28} height={28} className="text-primary-500" />
                              </div>
                            )}
                            <div className="flex-grow-1 text-start">
                              <div className="d-flex align-items-center justify-content-between gap-12">
                                <span className="fw-medium">{item.title}</span>
                                <span className={`badge ${item.completed ? "bg-success-100 text-success-700" : "bg-neutral-100 text-neutral-700"}`}>
                                  {item.completed ? "Completed" : "Pending"}
                                </span>
                              </div>
                              <small className="text-secondary-light">{item.minutes || 30} min video</small>
                            </div>
                          </button>
                        </h2>
                        <div
                          id={`module-panel-${item.id}`}
                          className={`accordion-collapse collapse ${expanded ? "show" : ""}`}
                          aria-labelledby={`module-head-${item.id}`}
                          data-bs-parent="#module-accordion"
                        >
                          <div className="accordion-body">
                            <p className="text-secondary-light mb-12">{item.description || "This module description will be added soon."}</p>
                            <div className="d-flex flex-wrap gap-12 text-secondary-light">
                              <span className="d-flex align-items-center gap-8">
                                <Icon icon="mdi:clock-outline" width={18} height={18} /> {item.minutes || 30} min
                              </span>
                              <span className="d-flex align-items-center gap-8">
                                <Icon
                                  icon={item.completed ? "mdi:check-circle" : "mdi:checkbox-blank-circle-outline"}
                                  width={18}
                                  height={18}
                                  className={item.completed ? "text-success-500" : "text-neutral-400"}
                                />
                                {item.completed ? "Watched" : "Not watched yet"}
                              </span>
                            </div>
                            <button type="button" className="btn btn-sm btn-outline-primary-600 mt-16" onClick={() => handleModuleSelect(item.id)}>
                              Watch module
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="alert alert-warning mb-0">This programme does not have any modules yet.</div>
              )}
            </div>
          </div>

          <div className="col-12" id="sloane-progress">
            <div className="row g-24">
              <div className="col-12 col-xl-8">
                <div className="card radius-16 p-24 border-0 bg-base h-100">
                  <div className="d-flex align-items-center justify-content-between mb-20">
                    <div>
                      <h4 className="mb-4">{course?.title || "Module detail"}</h4>
                      <p className="text-secondary-light mb-0">Watch the full video to automatically mark the module as complete.</p>
                    </div>
                    {course && currentComplete && (
                      <button type="button" className="btn btn-sm btn-outline-primary-600" onClick={() => resetModule(course.id)}>
                        Reset module
                      </button>
                    )}
                  </div>

                  {!course ? (
                    <div className="alert alert-warning mb-0">Select a module to start watching.</div>
                  ) : (
                    <div className="d-flex flex-column gap-16">
                      <div className="ratio ratio-16x9 radius-16 overflow-hidden bg-neutral-100">
                        <video
                          key={course.id}
                          controls
                          poster={course.videoThumbnail}
                          onEnded={() => handleVideoEnded(course.id)}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        >
                          <source src={resolveVideoUrl(course)} type="video/mp4" />
                          Your browser does not support embedded videos.
                        </video>
                      </div>
                      <div className="d-flex flex-wrap gap-12 align-items-center">
                        <span className={`badge ${currentComplete ? "bg-success-100 text-success-700" : "bg-warning-100 text-warning-700"}`}>
                          {currentComplete ? "Completed" : "Watch to complete"}
                        </span>
                        <span className="text-secondary-light">Duration · {parseDurationMinutes(course.duration) || 30} min</span>
                      </div>
                      <p className="text-secondary-light mb-0">{course.description}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="col-12 col-xl-4">
                <div className="card radius-16 p-24 border-0 bg-base">
                  <h5 className="mb-12">Upcoming experiences</h5>
                  {!upcomingEvents.length ? (
                    <p className="text-secondary-light mb-0">No upcoming events yet. Keep an eye on the partner bulletin.</p>
                  ) : (
                    <ul className="list-unstyled mb-0 d-flex flex-column gap-16">
                      {upcomingEvents.map((event) => (
                        <li key={event.id} className="border radius-12 p-16">
                          <div className="d-flex align-items-center gap-12 mb-8">
                            <span className="badge bg-primary-50 text-primary-700">{event.type || "Learning"}</span>
                            <span className="text-secondary-light">{formatDate(event.date)} · {event.time || "TBA"}</span>
                          </div>
                          <h6 className="mb-4">{event.title}</h6>
                          <p className="text-secondary-light mb-8">{event.host}</p>
                          <p className="text-secondary-light mb-0">{event.location || "Virtual"}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="col-12">
            <div className="card radius-16 p-24 border-0 bg-base">
              <div className="row g-16 align-items-center">
                <div className="col-12 col-md-8">
                  <h5 className="mb-8">Need a facilitator or learning support?</h5>
                  <p className="text-secondary-light mb-0">Share feedback with the Sloane Academy team for coaching requests, facilitator sessions, or to unlock partner resources.</p>
                </div>
                <div className="col-12 col-md-4 text-md-end">
                  <a className="btn btn-outline-primary-600" href="mailto:academy@22onsloane.co">Email the academy team</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MasterLayout>
  );
}
