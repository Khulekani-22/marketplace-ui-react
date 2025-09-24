// src/pages/LmsPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react/dist/iconify.js";
import MasterLayout from "../masterLayout/MasterLayout.jsx";

// ✅ Vite/CRA both support importing JSON at build time
import appData from "../../backend/appData.json";

// small helpers
const lsKey = "lms_completed_v1";
const readCompleted = () => {
  try {
    const raw = localStorage.getItem(lsKey);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
};
const writeCompleted = (set) => {
  try {
    localStorage.setItem(lsKey, JSON.stringify(Array.from(set)));
  } catch {}
};

export default function LmsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // ---- source data (from JSON) ----
  const cohorts = useMemo(() => appData?.cohorts ?? [], []);
  const hasCohorts = cohorts.length > 0;

  // ---- routing state (deep-linkable via query) ----
  const params = new URLSearchParams(location.search);
  const initialCohort = params.get("cohort") || (hasCohorts ? cohorts[0].id : "");
  const initialCourse = params.get("course") || "";

  const [cohortId, setCohortId] = useState(initialCohort);
  const [courseId, setCourseId] = useState(initialCourse);

  // ---- completion store ----
  const [completed, setCompleted] = useState(readCompleted);

  // keep URL in sync (so refresh keeps selection)
  useEffect(() => {
    const qp = new URLSearchParams(location.search);
    if (cohortId) qp.set("cohort", cohortId); else qp.delete("cohort");
    if (courseId) qp.set("course", courseId); else qp.delete("course");
    navigate({ search: qp.toString() }, { replace: true });
  }, [cohortId, courseId]); // eslint-disable-line react-hooks/exhaustive-deps

  // persist completion to localStorage
  useEffect(() => writeCompleted(completed), [completed]);

  // derived selections
  const cohort = useMemo(
    () => cohorts.find((c) => c.id === cohortId) || cohorts[0] || null,
    [cohorts, cohortId]
  );

  const courses = cohort?.courses ?? [];

  // ensure a valid selected course
  useEffect(() => {
    if (!courses?.length) {
      setCourseId("");
      return;
    }
    const exists = courses.some((c) => c.id === courseId);
    if (!exists) setCourseId(courses[0].id);
  }, [courses, courseId]);

  const course = useMemo(
    () => courses.find((c) => c.id === courseId) || null,
    [courses, courseId]
  );

  // progress
  const lessons = course?.lessons ?? [];
  const totalLessons = lessons.length;
  const doneCount = lessons.filter((l) => completed.has(l.id)).length;
  const progressPct = totalLessons ? Math.round((doneCount / totalLessons) * 100) : 0;

  function toggleLesson(id) {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // UI
  return (
    <MasterLayout>
      <div className="container-fluid">
        {/* header */}
        <div className="row align-items-center mb-24">
          <div className="col">
            <h2 className="mb-4">LMS · Cohorts & Courses</h2>
            <p className="text-secondary-light mb-0 d-none">
              Data loaded at build-time from <code>backend/appData.json</code> (no network).
            </p>
          </div>
          <div className="col-auto">
            {hasCohorts && (
              <select
                className="form-select btn btn-outline-primary-600 border rounded-pill px-16"
                value={cohort?.id ?? ""}
                onChange={(e) => setCohortId(e.target.value)}
                aria-label="Select cohort"
              >
                {cohorts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* body */}
        {!hasCohorts ? (
          <div className="alert alert-warning">No cohorts found in appData.json.</div>
        ) : (
          <div className="row g-24">
            {/* left: courses list */}
            <div className="col-12 col-lg-6">
              <div className="card radius-12 p-16 mb-3">
                <div className="d-flex align-items-center justify-content-between mb-12">
                  <h5 className="mb-0">{cohort?.name || "Cohort"}</h5>
                  <span className="badge bg-primary-600">{courses.length} modules</span>
                </div>

                {!courses.length ? (
                  <div className="text-secondary-light">No courses in this cohort.</div>
                ) : (
                  <div className="row g-16 mb-3 py-3">
                    {courses.map((m) => {
                      const mLessons = m.lessons ?? [];
                      const mDone = mLessons.filter((l) => completed.has(l.id)).length;
                      const mPct = mLessons.length
                        ? Math.round((mDone / mLessons.length) * 100)
                        : 0;

                      return (
                        <div key={m.id} className="col-12 py-2">
                          <button
                            type="button"
                            onClick={() => setCourseId(m.id)}
                            className={`w-100 d-flex align-items-stretch gap-12 p-12 radius-12 border ${
                              courseId === m.id ? "border-primary" : "border-neutral-200"
                            } bg-base text-start`}
                          >
                            <img
                              src={m.videoThumbnail}
                              alt={m.title}
                              className="rounded"
                              style={{ width: 96, height: 64, objectFit: "cover" }}
                              onError={(e) => (e.currentTarget.style.visibility = "hidden")}
                            />
                            <div className="flex-grow-1">
                              <div className="d-flex align-items-center justify-content-between">
                                <h6 className="mb-4">{m.title}</h6>
                                <span className="text-sm text-secondary-light">
                                  {mLessons.length} lessons
                                </span>
                              </div>
                              <p className="mb-8 text-secondary-light">{m.description}</p>
                              <div className="progress" style={{ height: 8 }}>
                                <div
                                  className="progress-bar"
                                  role="progressbar"
                                  style={{ width: `${mPct}%` }}
                                  aria-valuenow={mPct}
                                  aria-valuemin="0"
                                  aria-valuemax="100"
                                />
                              </div>
                              <small className="text-secondary-light">{mPct}% complete</small>
                            </div>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* right: course detail */}
            <div className="col-12 col-lg-6">
              <div className="card radius-12 p-16">
                {!course ? (
                  <div className="text-secondary-light">Select a module to view details.</div>
                ) : (
                  <>
                    <div className="d-flex align-items-center justify-content-between mb-12">
                      <h5 className="mb-0">{course.title}</h5>
                      <span className="badge bg-success-subtle text-success-main">
                        {progressPct}% complete
                      </span>
                    </div>

                    <img
                      src={course.videoThumbnail}
                      alt={course.title}
                      className="rounded mb-16 w-100"
                      style={{ maxHeight: 260, objectFit: "cover" }}
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />

                    <p className="text-secondary-light">{course.description}</p>

                    <hr className="my-16" />

                    <h6 className="mb-12 d-flex align-items-center gap-2">
                      <Icon icon="solar:play-circle-linear" />
                      Lessons
                    </h6>

                    {!lessons.length ? (
                      <div className="text-secondary-light">No lessons listed.</div>
                    ) : (
                      <ul className="list-group mb-16">
                        {lessons.map((l) => (
                          <li
                            key={l.id}
                            className="list-group-item d-flex align-items-center justify-content-between"
                          >
                            <div className="d-flex align-items-center gap-10">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={completed.has(l.id)}
                                onChange={() => toggleLesson(l.id)}
                                aria-label={`Mark ${l.title} complete`}
                              />
                              <div>
                                <div className="fw-semibold">{l.title}</div>
                                <small className="text-secondary-light">{l.duration}</small>
                              </div>
                            </div>
                            {completed.has(l.id) && (
                              <span className="badge bg-success-subtle text-success-main">Done</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}

                    {course.assessment && (
                      <>
                        <h6 className="mb-12 d-flex align-items-center gap-2">
                          <Icon icon="solar:checklist-minimalistic-linear" />
                          Assessment: {course.assessment.title}
                        </h6>
                        {(course.assessment.questions || []).map((q, qi) => (
                          <div key={qi} className="mb-12">
                            <div className="fw-semibold mb-8">{q.text}</div>
                            {(q.options || []).map((opt, oi) => (
                              <div key={oi} className="form-check mb-6">
                                <input
                                  className="form-check-input"
                                  type="radio"
                                  name={`q-${qi}`}
                                  id={`q-${qi}-${oi}`}
                                />
                                <label className="form-check-label" htmlFor={`q-${qi}-${oi}`}>
                                  {opt.text}
                                </label>
                              </div>
                            ))}
                          </div>
                        ))}
                        <button type="button" className="btn btn-primary">
                          Submit Answers
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </MasterLayout>
  );
}
