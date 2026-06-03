#!/usr/bin/env python3
"""
Step 1 of location verification — extract the official site hyperlinks from the
URA 2H2026 GLS Programme PDF (Appendix 1, pr26-41a.pdf).

Each Confirmed List site name in the PDF is a hyperlink to URA's GLS map
service: https://eservice.ura.gov.sg/maps/?service=GLSRELEASE&site=<SITE_ID>

Usage:
    pip install pymupdf requests
    python extract_pdf_links.py

Reproduces the link table used to drive fetch_gls_geometry.py.
"""
import fitz  # PyMuPDF
import requests

PDF_URL = "https://www.ura.gov.sg/-/media/Corporate/Media-Room/2026/Jun/pr26-41a.pdf"
PDF_FILE = "pr26-41a.pdf"

# Download (skip if already present).
try:
    open(PDF_FILE, "rb").close()
except FileNotFoundError:
    r = requests.get(PDF_URL, headers={"User-Agent": "Mozilla/5.0"}, timeout=60)
    r.raise_for_status()
    open(PDF_FILE, "wb").write(r.content)

doc = fitz.open(PDF_FILE)
print(f"{'TEXT UNDER LINK':<40} URI")
print("-" * 100)
for pno in range(doc.page_count):
    page = doc[pno]
    for li in page.get_links():
        uri = li.get("uri")
        if not uri or "GLSRELEASE" not in uri:
            continue
        rect = fitz.Rect(li["from"])
        text = page.get_textbox(rect + (-2, -2, 2, 2)).strip().replace("\n", " ")
        print(f"{text[:40]:<40} {uri}")
doc.close()
