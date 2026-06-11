#!/usr/bin/env python3
"""Render making-of index.html -> PDF (A4) + per-page QA PNGs."""
import pathlib
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
PDF = pathlib.Path.home() / "Desktop/edits/projekt-akte-Making-of.pdf"
QA = HERE / "qa"
QA.mkdir(exist_ok=True)

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1240, "height": 1754})
    pg.goto(f"file://{HERE}/index.html")
    pg.wait_for_timeout(1500)  # fonts + images

    PDF.parent.mkdir(exist_ok=True)
    pg.pdf(path=str(PDF), format="A4", print_background=True,
           margin={"top": "0", "bottom": "0", "left": "0", "right": "0"})

    pages = pg.locator(".page")
    n = pages.count()
    for i in range(n):
        pages.nth(i).scroll_into_view_if_needed()
        pg.wait_for_timeout(250)
        pages.nth(i).screenshot(path=str(QA / f"page-{i+1}.png"))
    b.close()

print(f"PDF: {PDF} ({PDF.stat().st_size/1024/1024:.2f} MB), {n} QA pages -> {QA}")
