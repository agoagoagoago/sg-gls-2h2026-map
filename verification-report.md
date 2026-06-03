# Location Verification Report

**Programme:** Singapore 2H2026 Government Land Sales (GLS) — **Confirmed List**
**Official source:** [URA media release, Appendix 1 — `pr26-41a.pdf`](https://www.ura.gov.sg/-/media/Corporate/Media-Room/2026/Jun/pr26-41a.pdf) (PDF created 2026‑05‑29)
**Verification date:** 2026‑06‑03
**Result:** ✅ All 9 Confirmed List sites verified to official URA parcel polygons. **0 sites unverified / approximated.**

---

## Method (how locations were obtained)

1. **Downloaded the official PDF** and extracted its embedded **link annotations** with PyMuPDF
   (`verification/extract_pdf_links.py`). Every Confirmed List site name is a hyperlink of the form
   `https://eservice.ura.gov.sg/maps/?service=GLSRELEASE&site=<SITE_ID>` — URA's own GLS map service.
2. **Inspected URA's GLS map application** (`eservice.ura.gov.sg/maps`) to find how it resolves a
   `site=<id>` into a parcel. Its `GLSService` queries an ArcGIS feature layer with `SITE_ID=<id>`.
3. **Identified the authoritative feature service** from the app's `js/Map.js`:
   `https://maps.ura.gov.sg/arcgis/rest/services/lsag/ura_sale_sites/MapServer/0`
   (layer `URA_SALE_SITES_FILTERED`, native SVY21 / **EPSG:3414**).
4. **Queried each `SITE_ID`** for geometry + attributes, **reprojected to WGS84 (EPSG:4326)**
   (`verification/fetch_gls_geometry.py`). Raw response saved to
   `verification/ura_sale_sites_2h2026_wgs84.geojson`.
5. **Cross-checked** every parcel's official attributes (site area, GPR, residential units, sales
   agent, development type) **against the PDF table**. All values matched exactly — independent
   corroboration that each polygon is the correct parcel.

No coordinate was guessed, typed from memory, or derived from a road name. Every location is an
official URA parcel polygon.

---

## Per-site verification table

| # | Site name | Category | Official PDF | Official location URL (from PDF) | Coordinates (WGS84, centroid) | Polygon avail.? | Representation | Verification method | Status | Notes |
|---|-----------|----------|--------------|----------------------------------|-------------------------------|-----------------|----------------|---------------------|--------|-------|
| 1 | Marina Gardens Lane | Residential Site | pr26-41a.pdf | https://eservice.ura.gov.sg/maps/?service=GLSRELEASE&site=1060 | 1.276844, 103.863243 | **Yes** | polygon | PDF link → ura_sale_sites `SITE_ID=1060` → polygon (SVY21→WGS84); attrs cross-checked | ✅ Verified | Marina South (CCR). SA 6,007 m² = 0.60 ha ✓. Retail cap 150 m² GFA. |
| 2 | Orchard Boulevard | Residential Site | pr26-41a.pdf | https://eservice.ura.gov.sg/maps/?service=GLSRELEASE&site=1101 | 1.304147, 103.826534 | **Yes** | polygon | PDF link → ura_sale_sites `SITE_ID=1101` → polygon; attrs cross-checked | ✅ Verified | Orchard (CCR). SA 3,400 m² = 0.34 ha ✓. |
| 3 | East Coast Road | Residential Site | pr26-41a.pdf | https://eservice.ura.gov.sg/maps/?service=GLSRELEASE&site=1102 | 1.311716, 103.923576 | **Yes** | polygon (MultiPolygon) | PDF link → ura_sale_sites `SITE_ID=1102` → polygon; attrs cross-checked | ✅ Verified | Bedok (OCR). SA 5,500 m² = 0.55 ha ✓. Parcel split into two areas; min avg DU size 100 m². |
| 4 | De Souza Avenue | Residential Site | pr26-41a.pdf | https://eservice.ura.gov.sg/maps/?service=GLSRELEASE&site=1103 | 1.346054, 103.768704 | **Yes** | polygon | PDF link → ura_sale_sites `SITE_ID=1103` → polygon; attrs cross-checked | ✅ Verified | Bukit Timah (RCR). SA 22,200 m² = 2.22 ha ✓. |
| 5 | Tanjong Rhu Close | Residential Site | pr26-41a.pdf | https://eservice.ura.gov.sg/maps/?service=GLSRELEASE&site=1104 | 1.296417, 103.880061 | **Yes** | polygon | PDF link → ura_sale_sites `SITE_ID=1104` → polygon; attrs cross-checked | ✅ Verified | Kallang (RCR). SA 12,300 m² = 1.23 ha ✓. (Layer field `NAME_GLS` has a typo "Tamjong"; `LOCATION` field is correct.) |
| 6 | Berlayar Close | Residential Site | pr26-41a.pdf | https://eservice.ura.gov.sg/maps/?service=GLSRELEASE&site=1105 | 1.268124, 103.813071 | **Yes** | polygon | PDF link → ura_sale_sites `SITE_ID=1105` → polygon; attrs cross-checked | ✅ Verified | Bukit Merah (RCR). SA 28,200 m² = 2.82 ha ✓. |
| 7 | Holland Plain | Residential Site | pr26-41a.pdf | https://eservice.ura.gov.sg/maps/?service=GLSRELEASE&site=1106 | 1.328117, 103.784677 | **Yes** | polygon | PDF link → ura_sale_sites `SITE_ID=1106` → polygon; attrs cross-checked | ✅ Verified | Bukit Timah (CCR). SA 34,200 m² = 3.42 ha ✓. DU cap 610; childcare ≥700 m² GFA. |
| 8 | Jurong East Avenue 1 (EC) | Residential Site — **Executive Condominium** | pr26-41a.pdf | https://eservice.ura.gov.sg/maps/?service=GLSRELEASE&site=1107 | 1.340864, 103.739545 | **Yes** | polygon | PDF link → ura_sale_sites `SITE_ID=1107` → polygon; attrs cross-checked | ✅ Verified | Jurong East (OCR). SA 14,900 m² = 1.49 ha ✓. Agent **HDB** ✓. `DEVT_CODE = "Executive Condominium"` ✓. Childcare ≥750 m². |
| 9 | Town Hall Link | **White Site** | pr26-41a.pdf | https://eservice.ura.gov.sg/maps/?service=GLSRELEASE&site=1100 | 1.329993, 103.739758 | **Yes** | polygon | PDF link → ura_sale_sites `SITE_ID=1100` → polygon; attrs cross-checked | ✅ Verified | Jurong East (OCR). SA 37,228 m² ≈ 3.72 ha ✓. `DEVT_CODE = "White Site"` ✓. Office ≥40,000 m²; max resi 102,000 m²; childcare ≥800 m². |

> Coordinates are area‑weighted **centroids** of the official parcel polygons (used for map labels,
> markers, and "zoom to site"). The full parcel **polygons** are what the map actually draws — stored
> in `src/data/sites.json` (`geometry`) and mirrored in `verification/ura_sale_sites_2h2026_wgs84.geojson`.

---

## Attribute cross-check (PDF vs official feature service)

Every published figure matched the authoritative ArcGIS attributes exactly:

| Site | Area ha (PDF / GIS) | GPR (PDF / GIS) | Units (PDF / GIS) | Agent (PDF / GIS) | Category (PDF / GIS DEVT_CODE) |
|------|---------------------|-----------------|-------------------|-------------------|--------------------------------|
| Marina Gardens Lane | 0.60 / 0.60 ✓ | 5.6 / 5.6 ✓ | 390 / 390 ✓ | URA / URA ✓ | Residential / Residential w/ Commercial 1st Sty ✓ |
| Orchard Boulevard | 0.34 / 0.34 ✓ | 2.8 / 2.8 ✓ | 110 / 110 ✓ | URA / URA ✓ | Residential / Residential ✓ |
| East Coast Road | 0.55 / 0.55 ✓ | 1.6 / 1.6 ✓ | 85 / 85 ✓ | URA / URA ✓ | Residential / Residential ✓ |
| De Souza Avenue | 2.22 / 2.22 ✓ | 1.6 / 1.6 ✓ | 415 / 415 ✓ | URA / URA ✓ | Residential / Residential ✓ |
| Tanjong Rhu Close | 1.23 / 1.23 ✓ | 3.5 / 3.5 ✓ | 505 / 505 ✓ | URA / URA ✓ | Residential / Residential ✓ |
| Berlayar Close | 2.82 / 2.82 ✓ | 2.1 / 2.1 ✓ | 695 / 695 ✓ | URA / URA ✓ | Residential / Residential ✓ |
| Holland Plain | 3.42 / 3.42 ✓ | 1.8 / 1.8 ✓ | 610 / 610 ✓ | URA / URA ✓ | Residential / Residential ✓ |
| Jurong East Ave 1 (EC) | 1.49 / 1.49 ✓ | 5.0 / 5.0 ✓ | 735 / 735 ✓ | HDB / HDB ✓ | EC / Executive Condominium ✓ |
| Town Hall Link | 3.72 / 3.72 ✓ | 5.0 / 5.0 ✓ | 1,200 / 1,200 ✓ | URA / URA ✓ | White Site / White Site ✓ |

**Confirmed List totals (computed from `src/data/sites.json`):**
9 sites · **4,745** residential units · **0** hotel rooms · **83,350 m²** commercial space — matches the
official totals. Enforced at build time (`scripts/validate-data.mjs`) and at runtime (`src/summary.ts`).

---

## Data provenance & licensing notes

- **Site attributes:** URA 2H2026 GLS Programme media release (Appendix 1).
- **Geometry & official attributes:** URA map feature service `lsag/ura_sale_sites` (public, queried
  without credentials), reprojected SVY21 → WGS84.
- **Basemap:** OneMap raster tiles (`onemap.gov.sg/maps/tiles/Default`) — © contributors, Singapore
  Land Authority. Verified publicly accessible without an API key (HTTP 200, `image/png`, no token /
  referer required). OpenStreetMap offered as a fallback layer.
- This is an informational visualisation. Official tender and planning decisions should rely on
  URA / MND documentation and each parcel's detailed conditions of sale.

## Sites requiring manual confirmation

**None.** All nine Confirmed List sites are represented by official URA parcel polygons and pass the
attribute cross-check. Were any site unverifiable, it would carry `verificationStatus !== "verified"`
in `src/data/sites.json` and be visibly flagged on its marker, list card, and detail popup.
