# CLAUDE.md — project context & resume guide

> Read this first when resuming. It captures **what this project is, how it was built, how the
> data was verified, and what's left to do**, so work can continue without re-deriving anything.

## 1. What this is

An interactive, responsive, **static** web map of the **9 Confirmed List sites** in Singapore's
**2H2026 Government Land Sales (GLS) Programme** (proposed Residential sites, one Executive
Condominium site, one White Site). Built as a polished planning-data dashboard.

- **Stack:** Vite 5 + TypeScript (strict) + Leaflet 1.9. Hand-written CSS (no UI framework).
- **Basemap:** OneMap (Singapore Land Authority), no API key; OpenStreetMap fallback.
- **No backend, no database, no API keys, no client-side secrets.**
- **Hosting target:** Render **Static Site** (blueprint in `render.yaml`).

## 2. Current status (as of 2026-06-03)

| Item | Status |
|---|---|
| Location verification (all 9 sites) | ✅ Done — official URA parcel polygons, attributes cross-checked |
| App build (`npm run build`) | ✅ Passes → `dist/` |
| Data integrity (build-time + runtime) | ✅ 9 sites / 4,745 units / 0 hotel / 83,350 m² |
| Headless-browser QA (Playwright smoke test) | ✅ 21/21 checks passed, 0 console errors |
| GitHub repo | ✅ **Pushed** → https://github.com/agoagoagoago/sg-gls-2h2026-map (PUBLIC, branch `main`) |
| **Render deployment** | ⏳ **NOT deployed** — requires the owner's Render login (see §7) |
| README screenshot | ⏳ Optional — placeholder in README; QA screenshots exist in `_verification/shots/` |

## 3. Commands

```bash
npm install        # deps (only runtime dep is leaflet)
npm run dev        # Vite dev server (http://localhost:5173)
npm run build      # prebuild data validation -> tsc --noEmit -> vite build -> dist/
npm run preview    # serve the production build (default :4173)
npm run validate   # run only the data integrity gate (scripts/validate-data.mjs)
```

`npm run build` fails loudly if the dataset drifts from the official Confirmed List totals.

## 4. Architecture / file map

```
index.html              # App shell: header, summary cards, layout, transparency <details>, footer
render.yaml             # Render Static Site blueprint (type: web, runtime: static, publish ./dist)
scripts/validate-data.mjs   # build-time data integrity gate (prebuild hook)
src/
  main.ts               # wires summary + map + list + filters; owns the state subscription
  state.ts              # tiny pub/sub store: filters + selection (+ matchesFilters())
  map.ts                # Leaflet map, OneMap+OSM layers, per-site polygon + accessible marker,
                        #   tooltips (hover), rich popups (click/tap/keyboard), legend, fit control
  list.ts               # accessible site cards (<button>, aria-pressed), show/hide + highlight
  filters.ts            # native radio (category) + selects (agent, launch month) + reset + count
  summary.ts            # 4 summary cards; recomputes totals and validates at runtime
  format.ts             # display helpers (month, badges, ha/sqm/num) + esc() HTML escaping
  types.ts              # Site type model + siteKind() (residential | ec | white)
  styles.css            # all styling, responsive grid, Leaflet overrides, reduced-motion
  vite-env.d.ts         # /// <reference types="vite/client" /> (for import.meta.env)
  data/sites.json       # THE dataset — attributes + embedded GeoJSON geometry per site
verification/           # committed, reproducible verification artifacts
  extract_pdf_links.py  # PDF -> embedded site hyperlinks (SITE_IDs)  [needs pymupdf, requests]
  fetch_gls_geometry.py # SITE_IDs -> URA ArcGIS polygons + attribute cross-check  [needs requests]
  ura_sale_sites_2h2026_wgs84.geojson   # raw official feature-service response (WGS84)
verification-report.md  # per-site verification table + attribute cross-check + methodology
README.md               # full docs (setup, attribution, deploy A/B, a11y, limitations)
_verification/          # GIT-IGNORED scratch: downloaded URA JS, PDF, tiles, Playwright smoke
                        #   test (smoke.mjs) + screenshots (shots/), preview.log
```

### Interaction model (important when editing)
- `state.ts` is the single source of truth. `main.ts` subscribes once.
- Selection has a `selectionSource` (`map` | `list` | `none`) to avoid feedback loops:
  - from **list** → map flies to the parcel + opens popup; from **map** → list card scrolls into view.
- Filters are AND-combined. **Category logic:** `residential` = all 8 residential incl. the EC;
  `ec` = the 1 EC site; `white` = the 1 White Site. (Verified by QA: 8 / 1 / 1.)
- Markers are keyboard-operable: on add, the icon element gets `tabindex=0`, `role=button`,
  `aria-label`, and Enter/Space → open popup.

## 5. Data verification — how locations were obtained (reproducible)

This is the crux of the project. **Do not guess coordinates.** The pipeline:

1. **Official PDF:** `https://www.ura.gov.sg/-/media/Corporate/Media-Room/2026/Jun/pr26-41a.pdf`
   (Appendix 1; PDF created 2026-05-29). Each Confirmed List site **name is a hyperlink** of the form
   `https://eservice.ura.gov.sg/maps/?service=GLSRELEASE&site=<SITE_ID>`.
2. URA's GLS map app (`eservice.ura.gov.sg/maps`, `js/service/GLSService.js`) resolves `site=<id>`
   by querying an ArcGIS feature layer with `SITE_ID=<id>`.
3. **Authoritative feature service** (from `js/Map.js`):
   `https://maps.ura.gov.sg/arcgis/rest/services/lsag/ura_sale_sites/MapServer/0`
   (layer `URA_SALE_SITES_FILTERED`, native **SVY21 / EPSG:3414**). Query with
   `outSR=4326&f=geojson` to get WGS84 polygons + attributes (no auth required).
4. **Cross-check** each parcel's official attributes (SA_SQM, GPR, HOUSING_UN, SALE_AGENT, DEVT_CODE,
   DATE_LNCH_EST) against the PDF — all 9 matched exactly. Centroids stored for labels / zoom.

### The 9 sites (display order) and their SITE_IDs
| # | Site | Category | SITE_ID |
|---|---|---|---|
| 1 | Marina Gardens Lane | Residential | 1060 |
| 2 | Orchard Boulevard | Residential | 1101 |
| 3 | East Coast Road | Residential (MultiPolygon parcel) | 1102 |
| 4 | De Souza Avenue | Residential | 1103 |
| 5 | Tanjong Rhu Close | Residential | 1104 |
| 6 | Berlayar Close | Residential | 1105 |
| 7 | Holland Plain | Residential | 1106 |
| 8 | Jurong East Avenue 1 (EC) | Residential / Executive Condominium (agent HDB) | 1107 |
| 9 | Town Hall Link | White Site | 1100 |

> The site IDs 1086–1110 etc. that also appear in the PDF are **Reserve List** sites — excluded.

To regenerate the dataset geometry: `python verification/fetch_gls_geometry.py` (rewrites
`verification/ura_sale_sites_2h2026_wgs84.geojson`). The committed `src/data/sites.json` was built
from that response, merging the official figures with centroids/bounds and rounding coords to 6 dp.

## 6. Key decisions & gotchas

- **OneMap tiles** `https://www.onemap.gov.sg/maps/tiles/Default/{z}/{x}/{y}.png` — free, **no token**
  (verified HTTP 200, no referer needed), zoom 11–19. Attribution is **mandatory** (OneMap logo + SLA);
  rendered in `map.ts`. OSM is a fallback base layer.
- `vite.config.ts` uses `base: "./"` so assets load whether served at domain root or a sub-path.
- `.gitattributes` forces **LF** line endings (Render builds on Linux).
- **Category is never conveyed by colour alone** — also shape (circle / dashed circle / dotted
  diamond), badge text (R / EC / W), and polygon line style (solid / dashed / dotted). Keep this if
  restyling.
- Data integrity is enforced **twice**: `scripts/validate-data.mjs` (build) and `src/summary.ts`
  (runtime, throws in DEV). Update **both** expected-totals constants if the dataset legitimately changes.
- `_verification/` is git-ignored (contains third-party URA JS copies, the PDF, tiles, and the
  Playwright `smoke.mjs` + screenshots). The clean, shareable artifacts live in `verification/`.
- Playwright was used **only** for QA and **removed** from `package.json` (don't re-add it as a
  committed dep; it bloats Render's `npm install`). The smoke test is `_verification/smoke.mjs` —
  run it against `npm run preview` if you need to re-verify interactions.
- Context note: the source PDF is dated **June 2026**, past the model's training cutoff — so all
  geometry/attributes were fetched **live** from URA, not recalled from memory.

## 7. Resume / next steps

1. **Deploy to Render** (only step needing the owner's login):
   - Blueprint: Render → New → **Blueprint** → connect `agoagoagoago/sg-gls-2h2026-map` → Apply.
   - or Static Site: New → **Static Site** → branch `main`, Build `npm install && npm run build`,
     Publish `dist`.
   - Confirm the `*.onrender.com` URL loads; pushes to `main` auto-redeploy.
2. *(Optional)* Commit a screenshot to `docs/screenshot.png` and update the README image link.
3. **If a revised/final GLS list is published:** re-run `verification/fetch_gls_geometry.py`,
   regenerate `src/data/sites.json`, update the expected totals in `validate-data.mjs` **and**
   `summary.ts`, refresh `verification-report.md`, then `npm run build` + re-run the smoke test.

## 8. Git / repo

- Remote: `origin` → https://github.com/agoagoagoago/sg-gls-2h2026-map (PUBLIC, default `main`).
- `gh` is authenticated as **agoagoagoago** (has `repo` scope).
- Normal flow: `git add -A && git commit -m "..." && git push`.
