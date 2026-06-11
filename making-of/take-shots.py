#!/usr/bin/env python3
"""Fresh live screenshots for the projekt-akte making-of PDF.

Shots (all from https://projekt-akte.demo.osai.solutions):
  cover   — demo-grid, Chip 1 beantwortet, Passage pulsiert (desktop 1440)
  puls    — demo-grid, Chip 2 (Nachtrag N1), Quellen-Chips + Glow
  ehrlich — Chat, Chip 5 → "Dazu steht nichts in der Akte"
  filter  — Akte links mit aktivem 📷-Foto-Filter
  brief   — Wochen-Brief + Offene-Punkte-Panels
  sheet   — Mobile 390px, Bottom-Sheet mit gehighlighteter Passage
Output: PNG @2x → JPEG ≤2000px q86 in shots/.
"""
import pathlib
from PIL import Image
from playwright.sync_api import sync_playwright

URL = "https://projekt-akte.demo.osai.solutions/?noauto=1&fast=1"
OUT = pathlib.Path(__file__).parent / "shots"
OUT.mkdir(exist_ok=True)


def settle(pg, ms=500):
    pg.wait_for_timeout(ms)


def ask(pg, chip_id, wait_ms=2600):
    pg.evaluate(f"window.__pa.askChip('{chip_id}'); 1")
    settle(pg, wait_ms)  # fast=1: Antwort + Chips + Glow in <2s


def to_jpg(name):
    src = OUT / f"{name}.png"
    img = Image.open(src).convert("RGB")
    if img.width > 2000:
        img = img.resize((2000, round(img.height * 2000 / img.width)), Image.LANCZOS)
    img.save(OUT / f"{name}.jpg", "JPEG", quality=86, optimize=True)
    src.unlink()


with sync_playwright() as p:
    b = p.chromium.launch()

    # ---------- Desktop 1440 ----------
    ctx = b.new_context(viewport={"width": 1440, "height": 980}, device_scale_factor=2)
    pg = ctx.new_page()
    pg.goto(URL, wait_until="networkidle")
    settle(pg, 1200)
    grid = pg.locator(".demo-grid")
    grid.scroll_into_view_if_needed()
    settle(pg, 600)

    # 1) Foto-Filter zuerst (wird durch spätere Asks auf "Alle" zurückgesetzt)
    pg.click('[data-filter="foto"]')
    settle(pg, 900)
    pg.locator(".akte").screenshot(path=str(OUT / "filter.png"))

    # 2) Cover: Chip 1 (Bedenkenanzeige) — der Geld-Moment, volle Demo-Grid
    ask(pg, "c1")
    grid.screenshot(path=str(OUT / "cover.png"))

    # 3) Puls: Chip 2 (Nachtrag N1) — anderes Dokument leuchtet
    ask(pg, "c2")
    grid.screenshot(path=str(OUT / "puls.png"))

    # 4) Ehrlichkeit: Chip 5 → "Dazu steht nichts in der Akte" (nur Chat)
    ask(pg, "c5", wait_ms=2200)
    pg.locator(".chat").screenshot(path=str(OUT / "ehrlich.png"))

    # 5) Wochen-Brief + Offene Punkte
    panels = pg.locator(".panels")
    panels.scroll_into_view_if_needed()
    settle(pg, 900)  # reveal-Animationen
    pg.locator(".panels-grid").screenshot(path=str(OUT / "brief.png"))
    ctx.close()

    # ---------- Mobile 390 — Bottom-Sheet ----------
    ctx2 = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=3)
    pg2 = ctx2.new_page()
    pg2.goto(URL, wait_until="networkidle")
    settle(pg2, 1000)
    pg2.locator(".chat").scroll_into_view_if_needed()
    settle(pg2, 400)
    ask(pg2, "c1")
    pg2.locator(".quelle-chip").first.click()
    settle(pg2, 1400)  # Sheet offen + Passage-Glow + Scroll
    pg2.screenshot(path=str(OUT / "sheet.png"))
    ctx2.close()
    b.close()

for n in ("cover", "puls", "ehrlich", "filter", "brief", "sheet"):
    to_jpg(n)
print("shots done:", sorted(x.name for x in OUT.iterdir()))
