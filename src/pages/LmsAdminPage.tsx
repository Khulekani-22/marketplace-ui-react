// src/pages/LmsAdminPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { auth } from "../lib/firebase";

const LS_DRAFT_KEY = "lms_admin_draft_v1";
const LS_UNDO_STACK = "lms_admin_undo_v1";
const LS_HISTORY_CACHE = "lms_admin_history_cache_v1";
const API_BASE = "/api/lms";

/* ------------------------------ utils ------------------------------ */
function safeParse(jsonLike) {
  try {
    return typeof jsonLike === "string" ? JSON.parse(jsonLike) : jsonLike;
  } catch {
    return null;
  }
}
function deepClone(x) { return JSON.parse(JSON.stringify(x)); }
function human(ts) { return new Date(ts).toLocaleString(); }
function summarize(appData) {
  const cohorts = Array.isArray(appData?.cohorts) ? appData.cohorts.length : 0;
  const courses =
    appData?.cohorts?.reduce(
      (n, c) => n + (Array.isArray(c.courses) ? c.courses.length : 0),
      0
    ) ?? 0;
  const lessons =
    appData?.cohorts?.reduce(
      (n, c) =>
        n +
        (Array.isArray(c.courses)
          ? c.courses.reduce(
              (m, crs) => m + (Array.isArray(crs.lessons) ? crs.lessons.length : 0),
              0
            )
          : 0),
      0
    ) ?? 0;
  return { cohorts, courses, lessons };
}

/* ------------------------------ page ------------------------------ */
export default function LmsAdminPage() {
  const tenantId = useMemo(
    () => sessionStorage.getItem("tenantId") || "vendor",
    []
  );

  // working copy
  const [data, setData] = useState(() => {
    const draft = safeParse(localStorage.getItem(LS_DRAFT_KEY));
    return (
      draft ?? {
        cohorts: [],
        bookings: [],
        events: [],
        forumThreads: [],
        jobs: [],
        mentorshipSessions: [],
        messageThreads: [],
        services: [],
        leads: [],
        startups: [],
      }
    );
  });
  const [text, setText] = useState(() => JSON.stringify(data, null, 2));
  const [tab, setTab] = useState("visual");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [err, setErr] = useState(null);

  // undo
  const undoRef = useRef([]);

  // server history
  const [history, setHistory] = useState(() => {
    const cache = safeParse(localStorage.getItem(LS_HISTORY_CACHE));
    return cache ?? [];
  });

  // selection for visual editor
  const cohorts = data?.cohorts ?? [];
  const [cohortId, setCohortId] = useState(cohorts[0]?.id ?? "");
  const currentCohort = useMemo(
    () => cohorts.find((c) => c.id === cohortId),
    [cohorts, cohortId]
  );
  const [courseSearch, setCourseSearch] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const selectedCourse = useMemo(
    () => currentCohort?.courses?.find((c) => c.id === selectedCourseId),
    [currentCohort, selectedCourseId]
  );

  /* -------------------------- helpers -------------------------- */
  function pushUndo(prev) {
    const stack = safeParse(localStorage.getItem(LS_UNDO_STACK)) ?? [];
    stack.unshift(prev);
    const trimmed = stack.slice(0, 10);
    localStorage.setItem(LS_UNDO_STACK, JSON.stringify(trimmed));
    undoRef.current = trimmed;
  }
  function doSetData(next) {
    pushUndo(data);
    setData(next);
    setText(JSON.stringify(next, null, 2));
    localStorage.setItem(LS_DRAFT_KEY, JSON.stringify(next));
  }
  function undo() {
    const stack = undoRef.current.length
      ? undoRef.current
      : safeParse(localStorage.getItem(LS_UNDO_STACK)) ?? [];
    if (!stack.length) return;
    const prev = stack.shift();
    undoRef.current = stack;
    localStorage.setItem(LS_UNDO_STACK, JSON.stringify(stack));
    setData(prev);
    setText(JSON.stringify(prev, null, 2));
  }
  function toastOK(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  /* ------------------------- initial load ------------------------- */
  useEffect(() => {
    (async () => {
      try {
        setBusy(true);
        const idToken = await auth.currentUser?.getIdToken?.();
        const res = await fetch(`${API_BASE}/live`, {
          headers: {
            "x-tenant-id": tenantId,
            ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
          },
        });
        if (res.ok) {
          const payload = await res.json();
          setData(payload);
          setText(JSON.stringify(payload, null, 2));
          localStorage.setItem(LS_DRAFT_KEY, JSON.stringify(payload));
          setCohortId(payload?.cohorts?.[0]?.id ?? "");
        }
        await refreshHistory();
      } catch (e) {
        console.warn("Init load failed:", e);
      } finally {
        setBusy(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshHistory() {
    try {
      const idToken = await auth.currentUser?.getIdToken?.();
      const hx = await fetch(`${API_BASE}/checkpoints`, {
        headers: {
          "x-tenant-id": tenantId,
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
      }).then((r) => (r.ok ? r.json() : { items: [] }));
      const items = hx.items ?? [];
      setHistory(items);
      localStorage.setItem(LS_HISTORY_CACHE, JSON.stringify(items.slice(0, 2)));
    } catch {
      /* ignore */
    }
  }

  /* ---------------------- import / export ---------------------- */
  async function handleImport(ev) {
    const file = ev.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      doSetData(json);
      toastOK("Imported JSON into working copy");
    } catch {
      setErr("Invalid JSON file");
    } finally {
      ev.target.value = "";
    }
  }
  function handleExport() {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.download = `lms-working-copy-${Date.now()}.json`;
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ---------------------- publish to live ---------------------- */
  async function handlePublish() {
    setErr(null);
    setBusy(true);
    try {
      const idToken = await auth.currentUser?.getIdToken?.();
      const res = await fetch(`${API_BASE}/publish`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ data }),
      });
      if (!res.ok) throw new Error((await res.text()) || `Publish failed (${res.status})`);
      toastOK("Published to live");
      await refreshHistory();
    } catch (e) {
      setErr(e.message || "Publish failed");
    } finally {
      setBusy(false);
    }
  }

  /* ------------------------- checkpoints ------------------------- */
  async function handleSaveCheckpoint(message) {
    setErr(null);
    try {
      const idToken = await auth.currentUser?.getIdToken?.();
      const res = await fetch(`${API_BASE}/checkpoints`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ message: message || "", data }),
      });
      if (!res.ok) throw new Error(await res.text());
      toastOK("Checkpoint saved");
      await refreshHistory();
    } catch (e) {
      setErr(e.message || "Failed to save checkpoint");
    }
  }

  async function handleRestore(id) {
    if (!window.confirm("Restore this snapshot to LIVE? This will overwrite appData.json.")) return;
    try {
      const idToken = await auth.currentUser?.getIdToken?.();
      const res = await fetch(`${API_BASE}/restore/${id}`, {
        method: "POST",
        headers: {
          "x-tenant-id": tenantId,
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
      });
      if (!res.ok) throw new Error(await res.text());
      toastOK("Restored and published");
      await refreshHistory();
      const live = await fetch(`${API_BASE}/live`).then((r) => r.json());
      doSetData(live);
    } catch (e) {
      setErr(e.message || "Restore failed");
    }
  }

  async function handleClearHistory() {
    if (!window.confirm("Clear ALL checkpoints on the server?")) return;
    try {
      const idToken = await auth.currentUser?.getIdToken?.();
      const res = await fetch(`${API_BASE}/checkpoints`, {
        method: "DELETE",
        headers: {
          "x-tenant-id": tenantId,
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
      });
      if (!res.ok) throw new Error(await res.text());
      toastOK("Cleared history");
      await refreshHistory();
    } catch (e) {
      setErr(e.message || "Failed to clear");
    }
  }

  /* --------------------------- editor logic --------------------------- */
  function addCohort() {
    const name = prompt("Cohort name?");
    if (!name) return;
    const id = name.toLowerCase().replace(/\s+/g, "-");
    const next = deepClone(data);
    next.cohorts = next.cohorts || [];
    next.cohorts.push({ id, name, courses: [] });
    doSetData(next);
    setCohortId(id);
  }
  function renameCohort() {
    if (!currentCohort) return;
    const name = prompt("New cohort name:", currentCohort.name || "");
    if (!name) return;
    const next = deepClone(data);
    const c = next.cohorts.find((x) => x.id === currentCohort.id);
    c.name = name;
    doSetData(next);
  }
  function deleteCohort() {
    if (!currentCohort) return;
    if (!window.confirm(`Delete cohort "${currentCohort.name}"?`)) return;
    const next = deepClone(data);
    next.cohorts = next.cohorts.filter((x) => x.id !== currentCohort.id);
    doSetData(next);
    setCohortId(next.cohorts[0]?.id ?? "");
    setSelectedCourseId(null);
  }
  function addCourse() {
    if (!currentCohort) return;
    const title = prompt("Course title?");
    if (!title) return;
    const id = (currentCohort.courses?.length || 0) + 1 + "";
    const next = deepClone(data);
    const co = next.cohorts.find((x) => x.id === currentCohort.id);
    co.courses = co.courses || [];
    co.courses.push({
      id,
      title,
      description: "",
      videoThumbnail: "",
      aiHint: "",
      lessons: [],
    });
    doSetData(next);
  }
  function duplicateCourse() {
    if (!selectedCourse || !currentCohort) return;
    const next = deepClone(data);
    const co = next.cohorts.find((x) => x.id === currentCohort.id);
    const copy = deepClone(selectedCourse);
    copy.id = (co.courses.length + 1).toString();
    copy.title = copy.title + " (Copy)";
    co.courses.push(copy);
    doSetData(next);
  }
  function deleteCourse() {
    if (!selectedCourse || !currentCohort) return;
    if (!window.confirm(`Delete "${selectedCourse.title}"?`)) return;
    const next = deepClone(data);
    const co = next.cohorts.find((x) => x.id === currentCohort.id);
    co.courses = co.courses.filter((c) => c.id !== selectedCourse.id);
    doSetData(next);
    setSelectedCourseId(null);
  }
  function updateCourseField(field, value) {
    const next = deepClone(data);
    const co = next.cohorts.find((x) => x.id === currentCohort.id);
    const cr = co.courses.find((c) => c.id === selectedCourse.id);
    cr[field] = value;
    doSetData(next);
  }
  function addLesson() {
    if (!selectedCourse) return;
    const title = prompt("Lesson title?");
    if (!title) return;
    const next = deepClone(data);
    const co = next.cohorts.find((x) => x.id === currentCohort.id);
    const cr = co.courses.find((c) => c.id === selectedCourse.id);
    cr.lessons = cr.lessons || [];
    const idx = cr.lessons.length + 1;
    cr.lessons.push({
      id: `${cr.id}-${String.fromCharCode(96 + idx)}`,
      title,
      duration: "15 min",
      completed: false,
    });
    doSetData(next);
  }
  function updateLesson(i, patch) {
    const next = deepClone(data);
    const co = next.cohorts.find((x) => x.id === currentCohort.id);
    const cr = co.courses.find((c) => c.id === selectedCourse.id);
    cr.lessons[i] = { ...cr.lessons[i], ...patch };
    doSetData(next);
  }
  function deleteLesson(i) {
    if (!selectedCourse) return;
    const next = deepClone(data);
    const co = next.cohorts.find((x) => x.id === currentCohort.id);
    const cr = co.courses.find((c) => c.id === selectedCourse.id);
    cr.lessons.splice(i, 1);
    doSetData(next);
  }

  /* --------------------------- render --------------------------- */
  const counts = summarize(data);
  const filteredCourses =
    currentCohort?.courses?.filter((c) =>
      c.title.toLowerCase().includes(courseSearch.toLowerCase())
    ) ?? [];

  return (
    <div className="container py-4">
      {/* small CSS for compact list actions */}
      <style>{`
        .history-item{ padding: .75rem 1rem; }
        .item-actions{ opacity: 0; transition: opacity .15s ease; }
        .history-item:hover .item-actions{ opacity: 1; }
        .pill{ padding:.25rem .5rem; border-radius:9999px; font-weight:600; font-size:.75rem; }
        .pill-low{ background:#fde2e0; color:#b42318; }     /* red-ish */
        .pill-med{ background:#eadcfb; color:#5925dc; }    /* purple-ish */
        .pill-high{ background:#d1fadf; color:#067647; }   /* green-ish */
        .pill-none{ background:#e9ecef; color:#495057; }
        .icon{ width:20px; height:20px; margin-right:.5rem; opacity:.8 }
        .btn-icon{ width:36px; height:36px; display:inline-flex; align-items:center; justify-content:center; }
      `}</style>

      <div className="d-flex align-items-center justify-content-between mb-2">
        <h1 className="display-6 mb-0">LMS Admin</h1>
        <div className="text-muted small">
          Cohorts: {counts.cohorts} · Courses: {counts.courses} · Lessons: {counts.lessons}
        </div>
      </div>

      <p className="text-secondary">
        Manage cohorts, courses and lessons. Draft persists in <code>localStorage</code>. Checkpoints live on the server (with a 2-item offline cache).
      </p>

      

      {/* top actions */}
      <div className="d-flex gap-2 mb-3">
        <label className="btn btn-light mb-0">
          Import JSON
          <input type="file" accept="application/json" hidden onChange={handleImport} />
        </label>
        <button className="btn btn-outline-secondary" onClick={handleExport}>
          Export Current
        </button>
        <button
          className="btn btn-success"
          onClick={handlePublish}
          disabled={busy}
          title="Write working copy to live appData.json on the server"
        >
          {busy ? "Publishing…" : "Publish to live"}
        </button>
      </div>

      {toast && <div className="alert alert-success py-2">{toast}</div>}
      {err && <div className="alert alert-danger py-2">{err}</div>}

      {/* compact checkpoint toolbar */}
      <CompactCheckpointBar
        onSave={handleSaveCheckpoint}
        onClear={handleClearHistory}
        onUndo={undo}
        disabled={busy}
      />

      <div className="d-flex gap-3">
        {/* left: editor */}
        <div className="flex-grow-1">
          <ul className="nav nav-tabs mb-3">
            <li className="nav-item">
              <button
                className={`nav-link ${tab === "visual" ? "active" : ""}`}
                onClick={() => setTab("visual")}
              >
                Visual editor
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${tab === "json" ? "active" : ""}`}
                onClick={() => setTab("json")}
              >
                JSON editor
              </button>
            </li>
          </ul>

          {tab === "json" ? (
            <JsonEditor
              text={text}
              setText={setText}
              onApply={() => {
                const j = safeParse(text);
                if (!j) { setErr("Invalid JSON"); return; }
                doSetData(j);
                toastOK("Applied JSON to working copy");
              }}
            />
          ) : (
            <VisualEditor
              data={data}
              cohortId={cohortId}
              setCohortId={setCohortId}
              currentCohort={currentCohort}
              courseSearch={courseSearch}
              setCourseSearch={setCourseSearch}
              filteredCourses={filteredCourses}
              selectedCourseId={selectedCourseId}
              setSelectedCourseId={setSelectedCourseId}
              selectedCourse={selectedCourse}
              addCohort={addCohort}
              renameCohort={renameCohort}
              deleteCohort={deleteCohort}
              addCourse={addCourse}
              duplicateCourse={duplicateCourse}
              deleteCourse={deleteCourse}
              updateCourseField={updateCourseField}
              addLesson={addLesson}
              updateLesson={updateLesson}
              deleteLesson={deleteLesson}
            />
          )}
        </div>

        {/* right: compact history */}
        <div style={{ width: 420 }}>
          <CompactHistory items={history} onRestore={handleRestore} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------- compact checkpoint bar ------------------------- */
function CompactCheckpointBar({ onSave, onClear, onUndo, disabled }) {
  const [msg, setMsg] = useState("");
  return (
    <div className="card mb-3">
      <div className="card-body d-flex align-items-center gap-2 py-2">
        <ClockIcon className="icon" />
        <input
          className="form-control"
          placeholder="Checkpoint message (e.g. 'Added AWS serverless module')"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
        />
        <button
          className="btn btn-primary"
          onClick={() => onSave(msg)}
          disabled={disabled}
          title="Save checkpoint"
        >
          Save
        </button>
        <button className="btn btn-outline-secondary btn-icon" onClick={onUndo} title="Undo">
          ↶
        </button>
        <button className="btn btn-outline-danger btn-icon" onClick={onClear} title="Clear history">
          🗑
        </button>
      </div>
    </div>
  );
}

/* ------------------------------- JSON editor ------------------------------ */
function JsonEditor({ text, setText, onApply }) {
  return (
    <div className="card">
      <div className="card-header fw-semibold">Working copy (JSON)</div>
      <div className="card-body">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={22}
          spellCheck={false}
          className="form-control font-monospace"
        />
        <div className="d-flex justify-content-between mt-2">
          <small className="text-muted">
            Tip: Press <kbd>⌘/Ctrl</kbd>+<kbd>A</kbd> then <kbd>⌘/Ctrl</kbd>+<kbd>C</kbd> to copy.
          </small>
          <button className="btn btn-outline-primary" onClick={onApply}>
            Apply JSON
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ visual editor ------------------------------ */
function VisualEditor(props) {
  const {
    data,
    cohortId,
    setCohortId,
    currentCohort,
    courseSearch,
    setCourseSearch,
    filteredCourses,
    selectedCourseId,
    setSelectedCourseId,
    selectedCourse,
    addCohort,
    renameCohort,
    deleteCohort,
    addCourse,
    duplicateCourse,
    deleteCourse,
    updateCourseField,
    addLesson,
    updateLesson,
    deleteLesson,
  } = props;

  const cohorts = data?.cohorts ?? [];

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between">
        <span className="fw-semibold">Visual editor</span>
        <span className="text-muted small">Friendly CRUD for cohorts, courses & lessons</span>
      </div>
      <div className="card-body">
        {/* Cohort row */}
        <div className="d-flex align-items-center gap-2 mb-3">
          <label className="fw-medium me-2">Cohort</label>
          <select
            className="form-select"
            style={{ maxWidth: 320 }}
            value={cohortId}
            onChange={(e) => setCohortId(e.target.value)}
          >
            {cohorts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name || c.id}
              </option>
            ))}
          </select>
          <button className="btn btn-outline-primary" onClick={addCohort}>+ Add cohort</button>
          <button className="btn btn-outline-secondary" onClick={renameCohort} disabled={!currentCohort}>Rename</button>
          <button className="btn btn-outline-danger" onClick={deleteCohort} disabled={!currentCohort}>Delete</button>
        </div>

        <div className="row">
          {/* Courses list */}
          <div className="col-4">
            <label className="fw-medium">Courses</label>
            <input
              className="form-control mb-2"
              placeholder="Search"
              value={courseSearch}
              onChange={(e) => setCourseSearch(e.target.value)}
            />
            <div className="list-group mb-2" style={{ maxHeight: 360, overflow: "auto" }}>
              {filteredCourses.map((c) => (
                <button
                  key={c.id}
                  className={
                    "list-group-item list-group-item-action " +
                    (selectedCourseId === c.id ? "active" : "")
                  }
                  onClick={() => setSelectedCourseId(c.id)}
                >
                  {c.title}
                </button>
              ))}
              {!filteredCourses.length && <div className="text-muted small p-2">No courses.</div>}
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-primary" onClick={addCourse} disabled={!currentCohort}>+ Add course</button>
              <button className="btn btn-outline-secondary" onClick={duplicateCourse} disabled={!selectedCourse}>Duplicate</button>
              <button className="btn btn-outline-danger" onClick={deleteCourse} disabled={!selectedCourse}>Delete</button>
            </div>
          </div>

          {/* Course details */}
          <div className="col">
            {selectedCourse ? (
              <CourseEditor
                course={selectedCourse}
                updateCourseField={updateCourseField}
                addLesson={addLesson}
                updateLesson={updateLesson}
                deleteLesson={deleteLesson}
              />
            ) : (
              <div className="text-muted mt-2">Select a course to edit details and lessons.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CourseEditor({ course, updateCourseField, addLesson, updateLesson, deleteLesson }) {
  return (
    <>
      <div className="mb-3">
        <label className="form-label">Title</label>
        <input
          className="form-control"
          value={course.title || ""}
          onChange={(e) => updateCourseField("title", e.target.value)}
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Description</label>
        <textarea
          className="form-control"
          rows={3}
          value={course.description || ""}
          onChange={(e) => updateCourseField("description", e.target.value)}
        />
      </div>
      <div className="row g-3 mb-3">
        <div className="col">
          <label className="form-label">Video thumbnail URL</label>
          <input
            className="form-control"
            value={course.videoThumbnail || ""}
            onChange={(e) => updateCourseField("videoThumbnail", e.target.value)}
          />
        </div>
        <div className="col">
          <label className="form-label">AI hint (optional)</label>
          <input
            className="form-control"
            value={course.aiHint || ""}
            onChange={(e) => updateCourseField("aiHint", e.target.value)}
          />
        </div>
      </div>

      <div className="d-flex align-items-center justify-content-between">
        <h6 className="mb-2">Lessons</h6>
        <button className="btn btn-outline-primary btn-sm" onClick={addLesson}>
          + Add lesson
        </button>
      </div>
      <div className="table-responsive">
        <table className="table table-sm align-middle">
          <thead>
            <tr>
              <th style={{ width: 80 }}>ID</th>
              <th>Title</th>
              <th style={{ width: 120 }}>Duration</th>
              <th style={{ width: 100 }}>Completed</th>
              <th style={{ width: 70 }}></th>
            </tr>
          </thead>
          <tbody>
            {course.lessons?.map((lsn, i) => (
              <tr key={lsn.id || i}>
                <td>{lsn.id}</td>
                <td>
                  <input
                    className="form-control form-control-sm"
                    value={lsn.title || ""}
                    onChange={(e) => updateLesson(i, { title: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    className="form-control form-control-sm"
                    value={lsn.duration || ""}
                    onChange={(e) => updateLesson(i, { duration: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={!!lsn.completed}
                    onChange={(e) => updateLesson(i, { completed: !!e.target.checked })}
                  />
                </td>
                <td className="text-end">
                  <button className="btn btn-outline-danger btn-sm" onClick={() => deleteLesson(i)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!course.lessons?.length && (
              <tr>
                <td colSpan={5} className="text-muted small">
                  No lessons yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ----------------------------- compact history ---------------------------- */
function CompactHistory({ items, onRestore }) {
  return (
    <div className="card">
      <div className="card-header fw-semibold d-flex justify-content-between">
        <span>Version history</span>
        <span className="text-muted small">Showing latest checkpoints</span>
      </div>

      {!items?.length ? (
        <div className="list-group list-group-flush">
          <div className="list-group-item text-muted small">
            No checkpoints yet.
            <div className="mt-1">Offline cache keeps the two most recent checkpoints.</div>
          </div>
        </div>
      ) : (
        <div className="list-group list-group-flush">
          {items.map((ck) => {
            const sev = severity(ck.delta);
            return (
              <div key={ck.id} className="list-group-item history-item">
                <div className="d-flex align-items-start justify-content-between gap-3">
                  <div className="d-flex align-items-start">
                    <ClockIcon className="icon" />
                    <div className="text-truncate" style={{ maxWidth: 220 }}>
                      <div className="fw-semibold text-truncate">
                        {ck.message || "(no message)"}
                      </div>
                      <div className="text-muted small">{human(ck.ts)}</div>
                      <div className="text-muted small">
                        Δ Cohorts: {fmt(ck.delta?.cohorts)} · Δ Courses: {fmt(ck.delta?.courses)} · Δ
                        Lessons: {fmt(ck.delta?.lessons)}
                      </div>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    <span className={`pill ${sev.className}`}>{sev.label}</span>
                    <div className="item-actions">
                      <button
                        className="btn btn-outline-primary btn-sm"
                        title="Restore snapshot to LIVE"
                        onClick={() => onRestore(ck.id)}
                      >
                        Restore
                      </button>
                      <a
                        className="btn btn-outline-secondary btn-sm ms-1"
                        title="Download snapshot JSON"
                        href={`${API_BASE}/checkpoints/${ck.id}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------- helpers UI ------------------------------- */
function fmt(n) {
  const v = Number(n || 0);
  return (v >= 0 ? "+" : "") + v;
}
function severity(delta) {
  const score =
    Math.abs(delta?.cohorts || 0) +
    Math.abs(delta?.courses || 0) +
    Math.abs(delta?.lessons || 0);
  if (score === 0) return { label: "No change", className: "pill-none" };
  if (score <= 2) return { label: "Low", className: "pill-low" };
  if (score <= 5) return { label: "Medium", className: "pill-med" };
  return { label: "High", className: "pill-high" };
}
function ClockIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="12" cy="12" r="9" strokeWidth="1.6"></circle>
      <path d="M12 7v5l3 2" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
