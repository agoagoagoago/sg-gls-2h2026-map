import L from "leaflet";
import type { Feature } from "geojson";
import type { Site, Kind } from "./types";
import { siteKind } from "./types";
import {
  formatMonth, kindBadge, kindLabel, categoryDisplay, ha, sqm, num, esc,
} from "./format";

/** Singapore bounding box (with a little padding) for max-bounds + initial view. */
const SG_BOUNDS = L.latLngBounds([1.16, 103.59], [1.48, 104.09]);

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

interface SiteLayers {
  site: Site;
  kind: Kind;
  polygon: L.GeoJSON;
  marker: L.Marker;
}

export interface SiteMapOptions {
  onSelect: (id: string) => void;
}

export class SiteMap {
  private map: L.Map;
  private group = L.featureGroup();
  private layers = new Map<string, SiteLayers>();
  private visible = new Set<string>();
  private selectedId: string | null = null;

  constructor(container: HTMLElement, sites: Site[], opts: SiteMapOptions) {
    this.map = L.map(container, {
      center: SG_BOUNDS.getCenter(),
      zoom: 12,
      minZoom: 11,
      maxZoom: 19,
      maxBounds: SG_BOUNDS.pad(0.05),
      maxBoundsViscosity: 1.0,
      zoomControl: true,
      // Default keyboard panning is on; we add feature-level keyboard support below.
    });

    // Primary basemap: OneMap (Singapore Land Authority). Free, no token; the
    // exact endpoint and attribution used by URA's own SPACE map service.
    const oneMapAttribution =
      '<img src="https://www.onemap.gov.sg/web-assets/images/logo/om_logo.png" ' +
      'style="height:16px;width:16px;vertical-align:middle" alt="OneMap" /> ' +
      '<a href="https://www.onemap.gov.sg/" target="_blank" rel="noopener">OneMap</a> ' +
      '&copy; contributors &#124; ' +
      '<a href="https://www.sla.gov.sg/" target="_blank" rel="noopener">Singapore Land Authority</a>';

    const oneMap = L.tileLayer(
      "https://www.onemap.gov.sg/maps/tiles/Default/{z}/{x}/{y}.png",
      { minZoom: 11, maxZoom: 19, attribution: oneMapAttribution, detectRetina: true },
    );

    // Fallback basemap (resilience if OneMap is unreachable from the viewer).
    const osm = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      minZoom: 11,
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    });

    oneMap.addTo(this.map);
    L.control.layers(
      { "OneMap (SLA)": oneMap, "OpenStreetMap": osm },
      {},
      { position: "topright" },
    ).addTo(this.map);

    this.group.addTo(this.map);

    for (const site of sites) {
      this.layers.set(site.id, this.buildLayers(site, opts.onSelect));
      this.visible.add(site.id);
    }

    this.addLegend();
    this.addFitControl();
    this.refreshGroup();
    this.fitToVisible(false);

    // Keep the map honest after layout settles (sidebar/responsive shifts).
    setTimeout(() => this.map.invalidateSize(), 200);
    window.addEventListener("resize", () => this.map.invalidateSize());
  }

  private buildLayers(site: Site, onSelect: (id: string) => void): SiteLayers {
    const kind = siteKind(site);

    const feature: Feature = { type: "Feature", geometry: site.geometry, properties: {} };
    const polygon = L.geoJSON(feature, {
      style: () => this.polygonStyle(kind, false),
      // Polygons are decorative/secondary; the marker is the a11y entry point.
      interactive: true,
    });

    const marker = L.marker(L.latLng(site.coordinates.lat, site.coordinates.lng), {
      icon: this.markerIcon(kind, false),
      keyboard: true,
      riseOnHover: true,
      title: `${site.name} — ${categoryDisplay(site)}`,
      alt: `${site.name}, ${categoryDisplay(site)}`,
    });

    const tooltipHtml = this.tooltipHtml(site, kind);
    marker.bindTooltip(tooltipHtml, { direction: "top", offset: [0, -14], opacity: 1, className: "site-tooltip" });
    polygon.bindTooltip(tooltipHtml, { sticky: true, direction: "top", opacity: 1, className: "site-tooltip" });

    // The rich popup is bound to the marker only (single, predictable anchor).
    // Clicking the polygon selects the site, which opens the marker popup.
    const popupHtml = this.popupHtml(site, kind);
    marker.bindPopup(popupHtml, { className: "site-popup", maxWidth: 320, minWidth: 260, autoPanPadding: [24, 24] });

    const trigger = () => onSelect(site.id);
    marker.on("click", trigger);
    polygon.on("click", trigger);

    // Make the marker a first-class, keyboard-operable control once rendered.
    // (Re-fires on every (re)add, each time against a fresh icon element.)
    marker.on("add", () => {
      const el = marker.getElement();
      if (!el) return;
      el.setAttribute("tabindex", "0");
      el.setAttribute("role", "button");
      el.setAttribute(
        "aria-label",
        `${site.name}, ${categoryDisplay(site)}. ${num(site.estimatedResidentialUnits)} residential units. Press Enter for details.`,
      );
      el.addEventListener("keydown", (ev: KeyboardEvent) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          trigger();
        }
      });
    });

    return { site, kind, polygon, marker };
  }

  private polygonStyle(kind: Kind, selected: boolean): L.PathOptions {
    // Category is conveyed by colour AND line style (solid / dashed / dash-dot),
    // never colour alone.
    const base: Record<Kind, L.PathOptions> = {
      residential: { color: "#1d4ed8", dashArray: undefined, fillColor: "#3b82f6" },
      ec: { color: "#7c3aed", dashArray: "7 5", fillColor: "#8b5cf6" },
      white: { color: "#b45309", dashArray: "2 6", fillColor: "#f59e0b" },
    };
    const s = base[kind];
    return {
      color: s.color,
      weight: selected ? 4 : 2.5,
      opacity: 0.95,
      dashArray: s.dashArray,
      fillColor: s.fillColor,
      fillOpacity: selected ? 0.35 : 0.18,
    };
  }

  private markerIcon(kind: Kind, selected: boolean): L.DivIcon {
    const badge = kindBadge(kind);
    const cls = `site-pin pin-${kind}${selected ? " is-selected" : ""}`;
    return L.divIcon({
      className: "site-pin-wrap",
      html: `<span class="${cls}" aria-hidden="true"><span class="site-pin-badge">${badge}</span></span>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -14],
      tooltipAnchor: [0, -10],
    });
  }

  private tooltipHtml(site: Site, kind: Kind): string {
    return (
      `<div class="tt">` +
      `<span class="tt-badge tt-${kind}">${esc(kindBadge(kind))}</span>` +
      `<span class="tt-title">${esc(site.name)}</span>` +
      `<span class="tt-cat">${esc(categoryDisplay(site))}</span>` +
      `<span class="tt-meta">${num(site.estimatedResidentialUnits)} units · ${esc(formatMonth(site.estimatedLaunchDate))}</span>` +
      `</div>`
    );
  }

  private popupHtml(site: Site, kind: Kind): string {
    const verifyClass = site.verificationStatus === "verified" ? "ok" : "warn";
    const verifyLabel = site.verificationStatus === "verified" ? "Verified" : site.verificationStatus;
    const rows: Array<[string, string]> = [
      ["Category", esc(site.category)],
      ...(site.subtype ? [["Subtype", esc(site.subtype)] as [string, string]] : []),
      ["Site area", ha(site.siteAreaHa)],
      ["Proposed GPR", num(site.proposedGPR)],
      ["Residential units", num(site.estimatedResidentialUnits)],
      ["Hotel rooms", num(site.estimatedHotelRooms)],
      ["Commercial space", sqm(site.estimatedCommercialSpaceSqm)],
      ["Launch date", esc(formatMonth(site.estimatedLaunchDate))],
      ["Sales agent", esc(site.salesAgent)],
      ...(site.planningArea ? [["Planning area", esc(`${site.planningArea}${site.region ? " (" + site.region + ")" : ""}`)] as [string, string]] : []),
    ];
    const dl = rows.map(([k, v]) => `<div class="kv"><dt>${k}</dt><dd>${v}</dd></div>`).join("");
    const cond = site.conditions
      ? `<p class="popup-cond"><strong>Conditions:</strong> ${esc(site.conditions)}</p>`
      : "";
    return (
      `<div class="popup-head pop-${kind}">` +
      `<span class="popup-badge">${esc(kindBadge(kind))}</span>` +
      `<div><h3 class="popup-title">${esc(site.name)}</h3>` +
      `<p class="popup-sub">${esc(kindLabel(kind))}</p></div></div>` +
      `<dl class="popup-grid">${dl}</dl>` +
      cond +
      `<p class="popup-verify ${verifyClass}">Location: <strong>${esc(verifyLabel)}</strong></p>` +
      `<p class="popup-links">` +
      `<a href="${esc(site.officialLocationUrl)}" target="_blank" rel="noopener">Official URA site map ↗</a>` +
      (site.officialSitePageUrl
        ? ` · <a href="${esc(site.officialSitePageUrl)}" target="_blank" rel="noopener">Site details ↗</a>`
        : "") +
      `</p>`
    );
  }

  private addLegend(): void {
    const Legend = L.Control.extend({
      options: { position: "bottomleft" as L.ControlPosition },
      onAdd: () => {
        const div = L.DomUtil.create("div", "map-legend");
        div.setAttribute("aria-label", "Map legend");
        div.innerHTML =
          `<h4>Site categories</h4>` +
          `<ul>` +
          `<li><span class="lg-swatch lg-residential"><span>R</span></span> Residential Site <em>(solid)</em></li>` +
          `<li><span class="lg-swatch lg-ec"><span>EC</span></span> Executive Condominium <em>(dashed)</em></li>` +
          `<li><span class="lg-swatch lg-white"><span>W</span></span> White Site <em>(dotted)</em></li>` +
          `</ul>`;
        L.DomEvent.disableClickPropagation(div);
        return div;
      },
    });
    new Legend().addTo(this.map);
  }

  private addFitControl(): void {
    const Fit = L.Control.extend({
      options: { position: "topleft" as L.ControlPosition },
      onAdd: () => {
        const div = L.DomUtil.create("div", "leaflet-bar map-fit-control");
        const a = L.DomUtil.create("a", "", div) as HTMLAnchorElement;
        a.href = "#";
        a.title = "Fit all visible sites";
        a.setAttribute("role", "button");
        a.setAttribute("aria-label", "Fit map to all visible sites");
        a.innerHTML = "⤢";
        L.DomEvent.on(a, "click", (e) => {
          L.DomEvent.stop(e);
          this.fitToVisible(true);
        });
        return div;
      },
    });
    new Fit().addTo(this.map);
  }

  private refreshGroup(): void {
    this.group.clearLayers();
    for (const id of this.visible) {
      const l = this.layers.get(id);
      if (!l) continue;
      this.group.addLayer(l.polygon);
      this.group.addLayer(l.marker);
    }
  }

  /** Show only the given site ids; re-fit unless a selected site is still visible. */
  setVisible(ids: Set<string>): void {
    this.visible = new Set(ids);
    this.refreshGroup();
    if (this.selectedId && !this.visible.has(this.selectedId)) {
      this.applySelectionStyle(this.selectedId, false);
      this.selectedId = null;
    }
    this.fitToVisible(true);
  }

  fitToVisible(animate: boolean): void {
    if (this.visible.size === 0) {
      this.map.fitBounds(SG_BOUNDS, { animate: false });
      return;
    }
    const bounds = this.group.getBounds();
    if (bounds.isValid()) {
      this.map.fitBounds(bounds, {
        padding: [40, 40],
        maxZoom: 16,
        animate: animate && !prefersReducedMotion,
      });
    }
  }

  private applySelectionStyle(id: string, selected: boolean): void {
    const l = this.layers.get(id);
    if (!l) return;
    l.polygon.setStyle(this.polygonStyle(l.kind, selected));
    if (selected) l.polygon.bringToFront();
    const el = l.marker.getElement();
    el?.querySelector(".site-pin")?.classList.toggle("is-selected", selected);
  }

  /** Select a site: highlight, zoom to its parcel, open the rich popup. */
  select(id: string | null, pan: boolean): void {
    if (this.selectedId && this.selectedId !== id) {
      this.applySelectionStyle(this.selectedId, false);
    }
    this.selectedId = id;
    if (!id) {
      this.map.closePopup();
      return;
    }
    const l = this.layers.get(id);
    if (!l) return;
    if (!this.visible.has(id)) return;
    this.applySelectionStyle(id, true);

    if (pan) {
      const b = l.polygon.getBounds();
      const finish = () => l.marker.openPopup();
      if (b.isValid()) {
        this.map.flyToBounds(b, {
          padding: [60, 60],
          maxZoom: 17,
          animate: !prefersReducedMotion,
        });
        if (prefersReducedMotion) finish();
        else this.map.once("moveend", finish);
      } else {
        finish();
      }
    } else {
      l.marker.openPopup();
    }
  }

  invalidate(): void {
    this.map.invalidateSize();
  }
}
