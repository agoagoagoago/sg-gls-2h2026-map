import type { Site } from "./types";
import { num, sqm } from "./format";

const EXPECTED = { count: 9, units: 4745, hotel: 0, commercial: 83350 };

export function initSummary(container: HTMLElement, sites: Site[]): void {
  const totals = {
    count: sites.length,
    units: sites.reduce((t, s) => t + s.estimatedResidentialUnits, 0),
    hotel: sites.reduce((t, s) => t + s.estimatedHotelRooms, 0),
    commercial: sites.reduce((t, s) => t + s.estimatedCommercialSpaceSqm, 0),
  };

  // Runtime integrity check (mirrors the build-time gate in scripts/validate-data.mjs).
  const mismatches: string[] = [];
  if (totals.count !== EXPECTED.count) mismatches.push(`sites ${totals.count}≠${EXPECTED.count}`);
  if (totals.units !== EXPECTED.units) mismatches.push(`units ${totals.units}≠${EXPECTED.units}`);
  if (totals.hotel !== EXPECTED.hotel) mismatches.push(`hotel ${totals.hotel}≠${EXPECTED.hotel}`);
  if (totals.commercial !== EXPECTED.commercial) mismatches.push(`commercial ${totals.commercial}≠${EXPECTED.commercial}`);

  if (mismatches.length) {
    const msg = `GLS data integrity error — calculated totals do not match the official Confirmed List: ${mismatches.join(", ")}.`;
    console.error(msg);
    const banner = document.createElement("div");
    banner.className = "data-error-banner";
    banner.setAttribute("role", "alert");
    banner.textContent = `⚠ ${msg}`;
    container.before(banner);
    // Fail loudly during development so the mismatch can't be missed.
    if (import.meta.env.DEV) throw new Error(msg);
  }

  const cards: Array<{ value: string; label: string; sub?: string }> = [
    { value: num(totals.count), label: "Confirmed Sites" },
    { value: num(totals.units), label: "Estimated Residential Units" },
    { value: sqm(totals.commercial), label: "Estimated Commercial Space" },
    { value: num(totals.hotel), label: "Estimated Hotel Rooms" },
  ];

  container.innerHTML = cards
    .map(
      (c) =>
        `<div class="summary-card"><span class="summary-value">${c.value}</span>` +
        `<span class="summary-label">${c.label}</span></div>`,
    )
    .join("");
}
