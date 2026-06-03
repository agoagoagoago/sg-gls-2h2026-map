#!/usr/bin/env python3
"""
Step 2 of location verification — fetch the official parcel geometry + attributes
for each Confirmed List SITE_ID from URA's authoritative ArcGIS feature service,
reprojected to WGS84, and cross-check the attributes against the published table.

Feature service (discovered from the GLS map app's JS, js/Map.js):
    https://maps.ura.gov.sg/arcgis/rest/services/lsag/ura_sale_sites/MapServer/0

The map app queries this layer with `SITE_ID=<id>` — the same id carried in the
PDF hyperlink `?service=GLSRELEASE&site=<id>`.

Usage:
    pip install requests
    python fetch_gls_geometry.py
"""
import json
import requests

LAYER = "https://maps.ura.gov.sg/arcgis/rest/services/lsag/ura_sale_sites/MapServer/0/query"
HEADERS = {"User-Agent": "Mozilla/5.0", "Referer": "https://eservice.ura.gov.sg/maps/"}

# Confirmed List SITE_IDs from the PDF hyperlinks (display order).
SITES = {
    1060: "Marina Gardens Lane",
    1101: "Orchard Boulevard",
    1102: "East Coast Road",
    1103: "De Souza Avenue",
    1104: "Tanjong Rhu Close",
    1105: "Berlayar Close",
    1106: "Holland Plain",
    1107: "Jurong East Avenue 1 (EC)",
    1100: "Town Hall Link",
}

# Expected site areas (ha) from the published table — sanity check vs SA_SQM.
EXPECTED_HA = {
    1060: 0.60, 1101: 0.34, 1102: 0.55, 1103: 2.22, 1104: 1.23,
    1105: 2.82, 1106: 3.42, 1107: 1.49, 1100: 3.72,
}

ids = ",".join(map(str, SITES))
params = {
    "where": f"SITE_ID IN ({ids})",
    "outFields": "SITE_ID,NAME_GLS,LOCATION,GLS_FINAL,SALE_AGENT,DEVT_CODE,SA_SQM,GPR,"
    "HOUSING_UN,HOTEL_RM,COM_SQM,DATE_LNCH_EST,PLN_AREA_N,Region,SITE_STATUS,URL_WEB",
    "returnGeometry": "true",
    "outSR": "4326",
    "f": "geojson",
}
data = requests.get(LAYER, params=params, headers=HEADERS, timeout=90).json()
open("ura_sale_sites_2h2026_wgs84.geojson", "w", encoding="utf-8").write(json.dumps(data, indent=2))

print(f"Returned {len(data['features'])} features\n")
print(f"{'SITE_ID':>7} {'NAME':<26} {'AGENT':<5} {'DEVT_CODE':<26} {'SA(ha)':>7} {'exp':>5} ok")
for f in sorted(data["features"], key=lambda f: list(SITES).index(int(f["properties"]["SITE_ID"]))):
    p = f["properties"]
    sid = int(p["SITE_ID"])
    sa_ha = round((p.get("SA_SQM") or 0) / 10000, 2)
    ok = "✓" if abs(sa_ha - EXPECTED_HA[sid]) < 0.011 else "✗ MISMATCH"
    print(f"{sid:>7} {SITES[sid][:26]:<26} {str(p.get('SALE_AGENT')):<5} "
          f"{str(p.get('DEVT_CODE'))[:26]:<26} {sa_ha:>7.2f} {EXPECTED_HA[sid]:>5.2f} {ok}")
