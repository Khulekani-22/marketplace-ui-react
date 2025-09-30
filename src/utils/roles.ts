export type RoleName = string | null | undefined;

const FULL_ACCESS = new Set(["admin", "partner"]);

export function normalizeRole(role: RoleName): string {
  if (typeof role !== "string") return "member";
  const trimmed = role.trim().toLowerCase();
  return trimmed || "member";
}

export function hasFullAccess(role: RoleName): boolean {
  return FULL_ACCESS.has(normalizeRole(role));
}

export function isPartner(role: RoleName): boolean {
  return normalizeRole(role) === "partner";
}

export function elevateRole(role: RoleName): string {
  const normalized = normalizeRole(role);
  if (FULL_ACCESS.has(normalized)) return normalized;
  return "member";
}

export const FULL_ACCESS_ROLES = Array.from(FULL_ACCESS);
