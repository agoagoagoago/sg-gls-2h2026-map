import type { Site } from "./types";
import type { CategoryFilter, AgentFilter } from "./state";
import { getState, setFilter, resetFilters } from "./state";
import { formatMonth, esc } from "./format";

const CATEGORIES: Array<{ value: CategoryFilter; label: string }> = [
  { value: "all", label: "All Sites" },
  { value: "residential", label: "Residential" },
  { value: "ec", label: "Exec. Condo" },
  { value: "white", label: "White Site" },
];

export function initFilters(container: HTMLElement, sites: Site[]): void {
  const months = [...new Set(sites.map((s) => s.estimatedLaunchDate))].sort();

  const catRadios = CATEGORIES.map(
    (c) =>
      `<input type="radio" name="cat" id="cat-${c.value}" value="${c.value}"${c.value === "all" ? " checked" : ""}>` +
      `<label for="cat-${c.value}">${esc(c.label)}</label>`,
  ).join("");

  const monthOptions =
    `<option value="all">All launch months</option>` +
    months.map((m) => `<option value="${esc(m)}">${esc(formatMonth(m))}</option>`).join("");

  container.innerHTML =
    `<div class="filter-bar">` +
    `<fieldset class="filter-group">` +
    `<legend>Category</legend>` +
    `<div class="segmented" role="radiogroup" aria-label="Filter by site category">${catRadios}</div>` +
    `</fieldset>` +
    `<div class="filter-row">` +
    `<fieldset class="filter-group">` +
    `<legend><label for="filter-agent">Sales agent</label></legend>` +
    `<select id="filter-agent" class="filter-select">` +
    `<option value="all">All agents</option>` +
    `<option value="URA">URA</option>` +
    `<option value="HDB">HDB</option>` +
    `</select>` +
    `</fieldset>` +
    `<fieldset class="filter-group">` +
    `<legend><label for="filter-month">Launch month</label></legend>` +
    `<select id="filter-month" class="filter-select">${monthOptions}</select>` +
    `</fieldset>` +
    `</div>` +
    `<div class="filter-actions">` +
    `<button type="button" id="filter-reset" class="btn-reset">Reset filters</button>` +
    `<p class="filter-count" id="filter-count" role="status" aria-live="polite"></p>` +
    `</div>` +
    `</div>`;

  container.querySelectorAll<HTMLInputElement>('input[name="cat"]').forEach((r) => {
    r.addEventListener("change", () => {
      if (r.checked) setFilter("category", r.value as CategoryFilter);
    });
  });

  const agent = container.querySelector<HTMLSelectElement>("#filter-agent")!;
  agent.addEventListener("change", () => setFilter("agent", agent.value as AgentFilter));

  const month = container.querySelector<HTMLSelectElement>("#filter-month")!;
  month.addEventListener("change", () => setFilter("month", month.value));

  container.querySelector<HTMLButtonElement>("#filter-reset")!.addEventListener("click", () => {
    resetFilters();
    syncFiltersUI(container);
  });
}

/** Push current filter state back into the controls (used after Reset). */
export function syncFiltersUI(container: HTMLElement): void {
  const { filters } = getState();
  const radio = container.querySelector<HTMLInputElement>(`#cat-${filters.category}`);
  if (radio) radio.checked = true;
  const agent = container.querySelector<HTMLSelectElement>("#filter-agent");
  if (agent) agent.value = filters.agent;
  const month = container.querySelector<HTMLSelectElement>("#filter-month");
  if (month) month.value = filters.month;
}

export function updateCount(shown: number, total: number): void {
  const el = document.getElementById("filter-count");
  if (el) el.textContent = `Showing ${shown} of ${total} sites`;
}
