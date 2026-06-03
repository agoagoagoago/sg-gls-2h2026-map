import "leaflet/dist/leaflet.css";
import "./styles.css";

import rawSites from "./data/sites.json";
import type { Site } from "./types";
import { SiteMap } from "./map";
import { SiteList } from "./list";
import { initFilters, syncFiltersUI, updateCount } from "./filters";
import { initSummary } from "./summary";
import { getState, subscribe, select, matchesFilters } from "./state";

const sites = rawSites as unknown as Site[];

const summaryEl = document.getElementById("summary")!;
const filtersEl = document.getElementById("filters")!;
const mapEl = document.getElementById("map")!;
const listEl = document.getElementById("site-list")!;

initSummary(summaryEl, sites);
initFilters(filtersEl, sites);

const map = new SiteMap(mapEl, sites, { onSelect: (id) => select(id, "map") });
const list = new SiteList(listEl, sites, { onSelect: (id) => select(id, "list") });

function computeVisibleIds(): Set<string> {
  const { filters } = getState();
  return new Set(sites.filter((s) => matchesFilters(s, filters)).map((s) => s.id));
}

function applyVisible(): void {
  const ids = computeVisibleIds();
  map.setVisible(ids);
  list.setVisible(ids);
  updateCount(ids.size, sites.length);
  // Drop a selection that the new filters hid.
  const sel = getState().selectedId;
  if (sel && !ids.has(sel)) select(null, "none");
}

// Initial render.
applyVisible();

subscribe((s, prev) => {
  const filtersChanged = JSON.stringify(s.filters) !== JSON.stringify(prev.filters);
  if (filtersChanged) {
    applyVisible();
    syncFiltersUI(filtersEl);
  }

  const selectionChanged =
    s.selectedId !== prev.selectedId || s.selectionSource !== prev.selectionSource;
  if (selectionChanged) {
    // Scroll the list into view only when the selection originated on the map.
    list.setSelected(s.selectedId, s.selectionSource === "map");
    // Fly the map only when the selection originated in the list (avoid re-pan
    // when the user just clicked a feature on the map).
    map.select(s.selectedId, s.selectionSource === "list");
  }
});
