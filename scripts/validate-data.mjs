/**
 * Build-time data integrity gate for the 2H2026 GLS Confirmed List dataset.
 *
 * Runs automatically before every `npm run build` (see package.json "prebuild").
 * If the dataset drifts from the official Confirmed List figures, the build
 * fails loudly instead of shipping an inaccurate map.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = resolve(__dirname, "../src/data/sites.json");

/** Official Confirmed List totals (URA 2H2026 GLS Programme, Appendix 1). */
const EXPECTED = {
  count: 9,
  residentialUnits: 4745,
  hotelRooms: 0,
  commercialSqm: 83350,
};

const errors = [];
const sites = JSON.parse(readFileSync(dataPath, "utf-8"));

if (!Array.isArray(sites)) {
  console.error("FATAL: sites.json is not an array.");
  process.exit(1);
}

// 1. Exactly nine sites.
if (sites.length !== EXPECTED.count) {
  errors.push(`Expected ${EXPECTED.count} sites, found ${sites.length}.`);
}

// 2. Totals.
const sum = (key) => sites.reduce((t, s) => t + (Number(s[key]) || 0), 0);
const totals = {
  residentialUnits: sum("estimatedResidentialUnits"),
  hotelRooms: sum("estimatedHotelRooms"),
  commercialSqm: sum("estimatedCommercialSpaceSqm"),
};
if (totals.residentialUnits !== EXPECTED.residentialUnits) {
  errors.push(`Residential units total ${totals.residentialUnits} !== ${EXPECTED.residentialUnits}.`);
}
if (totals.hotelRooms !== EXPECTED.hotelRooms) {
  errors.push(`Hotel rooms total ${totals.hotelRooms} !== ${EXPECTED.hotelRooms}.`);
}
if (totals.commercialSqm !== EXPECTED.commercialSqm) {
  errors.push(`Commercial space total ${totals.commercialSqm} !== ${EXPECTED.commercialSqm}.`);
}

// 3. Per-site structural integrity.
const ids = new Set();
const validCategories = new Set(["Residential Site", "White Site"]);
for (const s of sites) {
  const tag = s.name || s.id || "(unnamed)";
  if (!s.id || ids.has(s.id)) errors.push(`Duplicate or missing id near "${tag}".`);
  ids.add(s.id);
  if (!validCategories.has(s.category)) errors.push(`"${tag}": invalid category "${s.category}".`);

  // Every site must be geo-located and verified, or it must be flagged.
  const hasGeom = s.geometry && (s.geometry.type === "Polygon" || s.geometry.type === "MultiPolygon");
  const hasPoint =
    s.coordinates &&
    Number.isFinite(s.coordinates.lat) &&
    Number.isFinite(s.coordinates.lng) &&
    s.coordinates.lat > 1.1 && s.coordinates.lat < 1.5 &&
    s.coordinates.lng > 103.5 && s.coordinates.lng < 104.6;
  if (!hasPoint) errors.push(`"${tag}": missing/implausible Singapore coordinates.`);
  if (s.representation === "polygon" && !hasGeom) {
    errors.push(`"${tag}": representation="polygon" but no polygon geometry.`);
  }
  if (s.verificationStatus === "verified" && !s.officialLocationUrl) {
    errors.push(`"${tag}": marked verified but has no officialLocationUrl.`);
  }
  if (!["verified", "approximate", "pending", "unverified"].includes(s.verificationStatus)) {
    errors.push(`"${tag}": unknown verificationStatus "${s.verificationStatus}".`);
  }
}

if (errors.length) {
  console.error("\n✖ Data validation FAILED:\n" + errors.map((e) => "  - " + e).join("\n") + "\n");
  process.exit(1);
}

console.log(
  `✓ Data validation passed: ${sites.length} sites | ` +
    `${totals.residentialUnits.toLocaleString()} residential units | ` +
    `${totals.hotelRooms} hotel rooms | ` +
    `${totals.commercialSqm.toLocaleString()} m² commercial.`,
);
