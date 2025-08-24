// src/lib/lmsClient.js
// A tiny client that (1) publishes, (2) verifies by reading /live,
// and if the write didn't stick (or the API is a no-op), it falls back to
// creating a checkpoint and restoring it to LIVE.

export const API_BASE = "/api/lms";

export async function getLive({ tenantId, idToken }) {
  const headers = { "x-tenant-id": tenantId, "cache-control": "no-cache" };
  if (idToken) headers.Authorization = `Bearer ${idToken}`;
  const res = await fetch(`${API_BASE}/live`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function publishWithVerifyAndFallback(nextDoc, { tenantId, idToken }) {
  // 1) attach a unique write-stamp so we can verify the round-trip
  const stamp = Math.random().toString(36).slice(2);
  const candidate = {
    ...nextDoc,
    _meta: { ...(nextDoc?._meta || {}), lastClientWriteStamp: { at: new Date().toISOString(), nonce: stamp } },
  };

  const headersJSON = { "Content-Type": "application/json", "x-tenant-id": tenantId };
  if (idToken) headersJSON.Authorization = `Bearer ${idToken}`;

  // 2) try normal publish
  const put = await fetch(`${API_BASE}/publish`, {
    method: "PUT",
    headers: headersJSON,
    body: JSON.stringify({ data: candidate }),
  });
  if (!put.ok) throw new Error(await put.text());

  // 3) re-read live and verify our write-stamp
  try {
    const live = await getLive({ tenantId, idToken });
    const liveStamp = live?._meta?.lastClientWriteStamp?.nonce;
    if (liveStamp === stamp) return { live, usedFallback: false };
  } catch {
    // ignore; we'll attempt fallback below
  }

  // 4) server didn't reflect the write → fallback to checkpoint → restore
  const ck = await fetch(`${API_BASE}/checkpoints`, {
    method: "POST",
    headers: headersJSON,
    body: JSON.stringify({ message: "auto-publish fallback", data: candidate }),
  }).then(async (r) => (r.ok ? r.json() : Promise.reject(new Error(await r.text()))));

  await fetch(`${API_BASE}/restore/${ck.id}`, {
    method: "POST",
    headers: { "x-tenant-id": tenantId, ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}) },
  }).then(async (r) => {
    if (!r.ok) throw new Error(await r.text());
  });

  // 5) verify once more
  const liveAfter = await getLive({ tenantId, idToken });
  const liveStamp2 = liveAfter?._meta?.lastClientWriteStamp?.nonce;
  if (liveStamp2 !== stamp) {
    // We tried hard; bubble up a clear error so the UI can show a warning.
    throw new Error("Server did not reflect changes after fallback restore.");
  }
  return { live: liveAfter, usedFallback: true };
}
