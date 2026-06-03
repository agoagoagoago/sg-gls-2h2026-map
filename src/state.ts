import type { Site } from "./types";
import { siteKind } from "./types";

export type CategoryFilter = "all" | "residential" | "ec" | "white";
export type AgentFilter = "all" | "URA" | "HDB";
export type MonthFilter = "all" | string; // "all" or ISO month e.g. "2026-08"

export interface Filters {
  category: CategoryFilter;
  agent: AgentFilter;
  month: MonthFilter;
}

export interface AppState {
  filters: Filters;
  /** id of the currently selected site, or null. */
  selectedId: string | null;
  /**
   * Where the most recent selection came from — lets views avoid feedback
   * loops (e.g. the map should not re-pan when the user clicked the map).
   */
  selectionSource: "map" | "list" | "none";
}

type Listener = (state: AppState, prev: AppState) => void;

const listeners = new Set<Listener>();

const state: AppState = {
  filters: { category: "all", agent: "all", month: "all" },
  selectedId: null,
  selectionSource: "none",
};

export function getState(): AppState {
  return state;
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit(prev: AppState): void {
  for (const fn of listeners) fn(state, prev);
}

function snapshot(): AppState {
  return {
    filters: { ...state.filters },
    selectedId: state.selectedId,
    selectionSource: state.selectionSource,
  };
}

export function setFilter<K extends keyof Filters>(key: K, value: Filters[K]): void {
  if (state.filters[key] === value) return;
  const prev = snapshot();
  state.filters[key] = value;
  emit(prev);
}

export function resetFilters(): void {
  const prev = snapshot();
  state.filters = { category: "all", agent: "all", month: "all" };
  emit(prev);
}

export function select(id: string | null, source: "map" | "list" | "none" = "none"): void {
  const prev = snapshot();
  state.selectedId = id;
  state.selectionSource = source;
  emit(prev);
}

/** True if `site` passes the current filter set. */
export function matchesFilters(site: Site, filters: Filters): boolean {
  const kind = siteKind(site);
  if (filters.category === "residential" && site.category !== "Residential Site") return false;
  if (filters.category === "ec" && kind !== "ec") return false;
  if (filters.category === "white" && kind !== "white") return false;
  if (filters.agent !== "all" && site.salesAgent !== filters.agent) return false;
  if (filters.month !== "all" && site.estimatedLaunchDate !== filters.month) return false;
  return true;
}
