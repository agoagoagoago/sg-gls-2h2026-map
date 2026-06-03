import type { Site } from "./types";
import { siteKind } from "./types";
import { formatMonth, kindBadge, categoryDisplay, num, esc } from "./format";

export interface SiteListOptions {
  onSelect: (id: string) => void;
}

interface CardRef {
  site: Site;
  li: HTMLLIElement;
  button: HTMLButtonElement;
}

export class SiteList {
  private cards = new Map<string, CardRef>();
  private selectedId: string | null = null;

  constructor(container: HTMLElement, sites: Site[], opts: SiteListOptions) {
    const ul = document.createElement("ul");
    ul.className = "site-cards";
    ul.setAttribute("role", "list");

    for (const site of sites) {
      const kind = siteKind(site);
      const li = document.createElement("li");
      li.setAttribute("role", "listitem");

      const button = document.createElement("button");
      button.type = "button";
      button.className = `site-card card-${kind}`;
      button.dataset.id = site.id;
      button.setAttribute("aria-pressed", "false");
      button.innerHTML =
        `<span class="card-badge badge-${kind}" aria-hidden="true">${esc(kindBadge(kind))}</span>` +
        `<span class="card-body">` +
        `<span class="card-title">${esc(site.name)}</span>` +
        `<span class="card-cat">${esc(categoryDisplay(site))}</span>` +
        `<span class="card-meta">` +
        `<span class="cm"><span class="cm-k">Units</span> ${num(site.estimatedResidentialUnits)}</span>` +
        `<span class="cm"><span class="cm-k">Launch</span> ${esc(formatMonth(site.estimatedLaunchDate))}</span>` +
        `<span class="cm"><span class="cm-k">Agent</span> ${esc(site.salesAgent)}</span>` +
        `</span></span>`;
      button.addEventListener("click", () => opts.onSelect(site.id));

      li.appendChild(button);
      ul.appendChild(li);
      this.cards.set(site.id, { site, li, button });
    }

    container.appendChild(ul);

    // Empty-state message (toggled in setVisible).
    const empty = document.createElement("p");
    empty.className = "list-empty";
    empty.id = "list-empty";
    empty.hidden = true;
    empty.textContent = "No sites match the current filters.";
    container.appendChild(empty);
  }

  setVisible(ids: Set<string>): void {
    let shown = 0;
    for (const [id, ref] of this.cards) {
      const visible = ids.has(id);
      ref.li.hidden = !visible;
      if (visible) shown++;
    }
    const empty = document.getElementById("list-empty");
    if (empty) empty.hidden = shown > 0;
  }

  setSelected(id: string | null, scroll: boolean): void {
    if (this.selectedId && this.cards.has(this.selectedId)) {
      const prev = this.cards.get(this.selectedId)!;
      prev.button.setAttribute("aria-pressed", "false");
      prev.button.classList.remove("is-selected");
    }
    this.selectedId = id;
    if (!id) return;
    const ref = this.cards.get(id);
    if (!ref) return;
    ref.button.setAttribute("aria-pressed", "true");
    ref.button.classList.add("is-selected");
    if (scroll) {
      ref.button.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "nearest",
      });
    }
  }
}
