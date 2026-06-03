import type { Geometry } from "geojson";

export type Category = "Residential Site" | "White Site";
export type Subtype = "Executive Condominium" | null;
export type SalesAgent = "URA" | "HDB";
export type Representation = "polygon" | "point";
export type VerificationStatus = "verified" | "approximate" | "pending" | "unverified";

export interface LatLng {
  lat: number;
  lng: number;
}

/** [[southLat, westLng], [northLat, eastLng]] — Leaflet LatLngBounds order. */
export type BBox = [[number, number], [number, number]];

export interface Site {
  id: string;
  name: string;
  category: Category;
  subtype: Subtype;
  siteAreaHa: number;
  proposedGPR: number;
  estimatedResidentialUnits: number;
  estimatedHotelRooms: number;
  estimatedCommercialSpaceSqm: number;
  /** ISO year-month, e.g. "2026-08". */
  estimatedLaunchDate: string;
  salesAgent: SalesAgent;
  planningArea: string | null;
  region: string | null;
  developmentType: string | null;
  conditions: string | null;
  representation: Representation;
  coordinates: LatLng;
  bounds: BBox;
  geometry: Geometry;
  uraSiteId: number;
  officialLocationUrl: string;
  officialSitePageUrl: string | null;
  sourcePdfUrl: string;
  verificationMethod: string;
  verificationStatus: VerificationStatus;
}

/** A display "kind" used for styling/legend/filtering — derived from a Site. */
export type Kind = "residential" | "ec" | "white";

export function siteKind(s: Site): Kind {
  if (s.category === "White Site") return "white";
  if (s.subtype === "Executive Condominium") return "ec";
  return "residential";
}
