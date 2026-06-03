import type { Site, Kind } from "./types";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** "2026-08" -> "Aug 2026". Falls back to the raw string if unparseable. */
export function formatMonth(iso: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const month = MONTHS[Number(m[2]) - 1] ?? m[2];
  return `${month} ${m[1]}`;
}

/** Short badge text shown on markers and chips. */
export function kindBadge(kind: Kind): string {
  switch (kind) {
    case "white": return "W";
    case "ec": return "EC";
    default: return "R";
  }
}

/** Human label for a site's category/subtype. */
export function kindLabel(kind: Kind): string {
  switch (kind) {
    case "white": return "White Site";
    case "ec": return "Executive Condominium";
    default: return "Residential Site";
  }
}

export function categoryDisplay(s: Site): string {
  if (s.subtype) return `${s.category} · ${s.subtype}`;
  return s.category;
}

export function ha(n: number): string {
  return `${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ha`;
}

export function sqm(n: number): string {
  return `${n.toLocaleString()} m²`;
}

export function num(n: number): string {
  return n.toLocaleString();
}

/** Escape user-facing strings before injecting into innerHTML. */
export function esc(s: string | number | null | undefined): string {
  if (s === null || s === undefined) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
