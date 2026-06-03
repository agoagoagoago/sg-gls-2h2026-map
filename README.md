# Singapore 2H2026 GLS Programme — Confirmed List Sites

An interactive, responsive, **static** map of the **nine Confirmed List sites** in Singapore's
2H2026 Government Land Sales (GLS) Programme — proposed Residential sites, the Executive
Condominium (EC) site, and the White Site.

Every site is drawn as its **official URA parcel polygon**, located from the hyperlinks embedded in
URA's official media release and cross-checked against URA's authoritative map feature service. No
coordinates were guessed. See [`verification-report.md`](./verification-report.md).

- **No backend. No database. No API keys. No client-side secrets.**
- Deploys as a **Render Static Site** straight from GitHub.

---

## Screenshot

> _Add a screenshot here._ Run `npm run dev`, open the app, and capture the dashboard
> (header + summary cards + filters + map + site list). Save it to `docs/screenshot.png`
> and reference it:
>
> ```markdown
> ![Dashboard](docs/screenshot.png)
> ```

---

## Technology stack

| Concern | Choice |
|---|---|
| Build tool | [Vite](https://vitejs.dev/) 5 |
| Language | TypeScript (strict) |
| Mapping | [Leaflet](https://leafletjs.com/) 1.9 |
| Basemap | [OneMap](https://www.onemap.gov.sg/) (Singapore Land Authority); OpenStreetMap fallback |
| Styling | Hand-written CSS (no framework) |
| Data | Static `src/data/sites.json` (GeoJSON geometry embedded) |
| Hosting | Render Static Site |

No state-management library, analytics, logins, or servers.

---

## Local setup

Requires Node 18+.

```bash
npm install      # install dependencies
npm run dev      # start the Vite dev server (http://localhost:5173)
npm run build    # type-check + validate data + production build into dist/
npm run preview  # preview the production build locally
```

`npm run build` runs, in order:

1. `npm run validate` (prebuild) — `scripts/validate-data.mjs` fails the build if the dataset drifts
   from the official Confirmed List totals (9 sites · 4,745 units · 0 hotel rooms · 83,350 m²).
2. `tsc --noEmit` — strict type-check.
3. `vite build` — emits the static site to `dist/`.

---

## Data source & attribution

- **Site attributes** (site area, GPR, estimated residential units, hotel rooms, commercial space,
  launch date, sales agent) are from the official URA **2H2026 GLS Programme** media release,
  Appendix 1: **[`pr26-41a.pdf`](https://www.ura.gov.sg/-/media/Corporate/Media-Room/2026/Jun/pr26-41a.pdf)**.
- **Site geometry** (parcel polygons) is from URA's authoritative ArcGIS feature service
  `lsag/ura_sale_sites` (`maps.ura.gov.sg`), reprojected from SVY21 (EPSG:3414) to WGS84 (EPSG:4326).

This project is **not affiliated with or endorsed by** URA, HDB, or the Singapore Government. It is an
informational visualisation; official tender/planning decisions should rely on URA / MND
documentation.

### Basemap attribution requirements

The map uses **OneMap** raster tiles:

```
https://www.onemap.gov.sg/maps/tiles/Default/{z}/{x}/{y}.png
```

OneMap tiles are **free and require no API key** (verified: the tile endpoint returns HTTP 200
`image/png` with no token or referer). OneMap's terms require displaying the **OneMap logo and
attribution**; the app renders:

> _(OneMap logo)_ **OneMap** © contributors | **Singapore Land Authority**

A clearly attributed **OpenStreetMap** layer is provided as a fallback (© OpenStreetMap
contributors). You can switch basemaps via the layer control on the map.

---

## Location verification methodology

1. Download the official PDF and extract its **link annotations** — each Confirmed List site name
   links to `eservice.ura.gov.sg/maps/?service=GLSRELEASE&site=<SITE_ID>`.
2. URA's GLS map app resolves `site=<id>` by querying its feature layer with `SITE_ID=<id>`.
3. Query that layer (`lsag/ura_sale_sites/MapServer/0`) for each id → official parcel polygon +
   attributes, reprojected to WGS84.
4. Cross-check every parcel's official attributes (area, GPR, units, agent, development type) against
   the PDF — **all matched exactly**.

Reproduce it:

```bash
pip install pymupdf requests
python verification/extract_pdf_links.py     # PDF -> site hyperlinks (SITE_IDs)
python verification/fetch_gls_geometry.py    # SITE_IDs -> polygons + attribute cross-check
```

Full results: [`verification-report.md`](./verification-report.md). Raw official response:
[`verification/ura_sale_sites_2h2026_wgs84.geojson`](./verification/ura_sale_sites_2h2026_wgs84.geojson).

### Point vs polygon representation

Each site records a `representation` field:

- **`polygon`** — an official parcel boundary is available and is drawn on the map (this is the case
  for **all 9** sites). A centroid is also stored for labelling and "zoom to site".
- **`point`** — _only_ a verified point location is available; the site would be shown as a marker.

Parcel outlines are **never fabricated**. If neither a boundary nor a verified point could be
obtained, the site would be flagged (`verificationStatus !== "verified"`) and visibly marked in the
UI. Currently **no sites are flagged**.

---

## Accessibility features

- Semantic landmarks (`header`, `main`, `aside`, `footer`) and a **skip-to-map** link.
- Filters use **native radio/select** controls — full keyboard semantics and labels.
- Site list items are real `<button>`s with `aria-pressed`; map markers are keyboard-focusable
  (`tabindex`, `role="button"`, descriptive `aria-label`, Enter/Space to open details).
- **Categories are never conveyed by colour alone** — each has a distinct marker **shape** (circle /
  dashed circle / dotted diamond), a **text badge** (R / EC / W), and a distinct **line style** on its
  polygon (solid / dashed / dotted), all explained in the legend.
- Visible `:focus-visible` rings, readable contrast, touch-friendly targets.
- Honours `prefers-reduced-motion` (disables map fly animations, smooth scroll, and transitions).
- A live region announces the "Showing X of 9 sites" filter count.

---

## Interaction model

- **Hover / focus** a map feature → compact tooltip (name, category, units, launch).
- **Click / tap / Enter** a feature → rich popup (area, GPR, units, hotel rooms, commercial space,
  launch, agent, verification status, official links).
- **Click a list card** → map flies to that parcel and opens its popup; the card highlights.
- **Click a map feature** → its list card highlights and scrolls into view.
- **Filters** (category, sales agent, launch month) update the map **and** the list together.

---

## Deploy to GitHub (owner: `agoagoagoago`)

Target repository: **`https://github.com/agoagoagoago/sg-gls-2h2026-map`** (default branch `main`).

```bash
git init
git add .
git commit -m "Build interactive Singapore 2H2026 GLS sites map"
git branch -M main

# Create the repo and push (choose ONE visibility flag):
gh repo create agoagoagoago/sg-gls-2h2026-map --source=. --remote=origin --push --public
# or, if it already exists:
git remote add origin https://github.com/agoagoagoago/sg-gls-2h2026-map.git
git push -u origin main
```

---

## Deploy to Render (Static Site)

This repo includes [`render.yaml`](./render.yaml). Two ways to deploy:

### Method A — Render Dashboard

1. Push the project to `https://github.com/agoagoagoago/sg-gls-2h2026-map`.
2. In Render, **New → Static Site**.
3. Connect the GitHub repository.
4. Select branch **`main`**.
5. Set:
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
6. Click **Create Static Site** to deploy.
7. Confirm the resulting `*.onrender.com` URL loads the map correctly.
8. Subsequent pushes to `main` trigger automatic redeploys.

### Method B — Render Blueprint

1. Keep `render.yaml` at the repo root.
2. In Render, **New → Blueprint**.
3. Connect the repository.
4. Review the detected static-site configuration (name `sg-gls-2h2026-map`, publish `./dist`).
5. **Apply** to deploy the Blueprint.
6. Confirm a successful build and that the live map behaves correctly.

No environment variables are required.

---

## Project structure

```
.
├── index.html               # App shell (header, summary, layout, footer)
├── render.yaml              # Render Static Site blueprint
├── package.json             # scripts + deps
├── tsconfig.json
├── vite.config.ts
├── scripts/
│   └── validate-data.mjs    # build-time data integrity gate
├── public/
│   └── favicon.svg
├── src/
│   ├── main.ts              # wires map + list + filters + summary together
│   ├── map.ts               # Leaflet map, polygons, markers, tooltips, popups, legend
│   ├── list.ts              # accessible site cards
│   ├── filters.ts           # category / agent / launch-month filters
│   ├── summary.ts           # summary cards + runtime total validation
│   ├── state.ts             # tiny filter/selection store (pub/sub)
│   ├── format.ts            # display helpers + HTML escaping
│   ├── types.ts             # Site type model
│   ├── styles.css
│   └── data/
│       └── sites.json       # verified dataset (attributes + GeoJSON geometry)
├── verification/            # reproducible verification scripts + official data response
│   ├── extract_pdf_links.py
│   ├── fetch_gls_geometry.py
│   └── ura_sale_sites_2h2026_wgs84.geojson
├── verification-report.md
└── README.md
```

---

## Known limitations

- Figures are **estimates** from the GLS Programme release (e.g. dwelling-unit counts) and may change;
  always defer to the latest URA/MND documents and conditions of sale.
- Parcel polygons reflect URA's published GLS map at the verification date; boundaries can be refined
  before tender.
- The map depends on **OneMap** (and OpenStreetMap fallback) tile availability; both are third-party
  services with no SLA guarantee for this project.
- The app is read-only and client-side; there is no search-by-address or routing.

## Sites that remain unverified

**None.** All nine Confirmed List sites are verified to official URA parcel polygons.
