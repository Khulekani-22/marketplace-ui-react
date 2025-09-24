// src/lib/lmsClient.js
// A tiny client that (1) publishes, (2) verifies by reading /live,
// and if the write didn't stick (or the API is a no-op), it falls back to
// creating a checkpoint and restoring it to LIVE.

import { api } from "./api";

export const API_BASE = "/api/lms";

export async function getLive({ tenantId }) {
  const { data } = await api.get(`${API_BASE}/live`, {
    headers: {
      "x-tenant-id": tenantId,
      "cache-control": "no-cache",
    },
  });
  return data;
}

export async function publishWithVerifyAndFallback(nextDoc, { tenantId }) {
  // 1) attach a unique write-stamp so we can verify the round-trip
  const stamp = Math.random().toString(36).slice(2);
  const candidate = {
    ...nextDoc,
    _meta: { ...(nextDoc?._meta || {}), lastClientWriteStamp: { at: new Date().toISOString(), nonce: stamp } },
  };

  // 2) try normal publish
  await api.put(
    `${API_BASE}/publish`,
    { data: candidate },
    {
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": tenantId,
      },
    }
  );

  // 3) re-read live and verify our write-stamp
  try {
    const live = await getLive({ tenantId });
    const liveStamp = live?._meta?.lastClientWriteStamp?.nonce;
    if (liveStamp === stamp) return { live, usedFallback: false };
  } catch {
    // ignore; we'll attempt fallback below
  }

  // 4) server didn't reflect the write → fallback to checkpoint → restore
  const { data: ck } = await api.post(
    `${API_BASE}/checkpoints`,
    { message: "auto-publish fallback", data: candidate },
    {
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": tenantId,
      },
    }
  );

  await api.post(
    `${API_BASE}/restore/${ck.id}`,
    null,
    {
      headers: {
        "x-tenant-id": tenantId,
      },
    }
  );

  // 5) verify once more
  const liveAfter = await getLive({ tenantId });
  const liveStamp2 = liveAfter?._meta?.lastClientWriteStamp?.nonce;
  if (liveStamp2 !== stamp) {
    // We tried hard; bubble up a clear error so the UI can show a warning.
    throw new Error("Server did not reflect changes after fallback restore.");
  }
  return { live: liveAfter, usedFallback: true };
}
