#!/usr/bin/env python3
"""Gate 2 — Q&A-Choreografie: jede Chip-Antwort referenziert die korrekten
Artefakt-IDs, Highlight-Class-Assertion auf der exakten Passage,
„nichts in der Akte“-Pfad, Auto-Demo läuft genau 1×, Bottom-Sheet mobil."""
import sys, threading, functools, http.server, socketserver, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(os.environ.get("PA_PORT", "8764"))
BASE = os.environ.get("PA_BASE", f"http://127.0.0.1:{PORT}")

CHECKS = []
def check(name, cond, detail=""):
    CHECKS.append((name, bool(cond)))
    print(("  ✓ " if cond else "  ✗ ") + name + (f"  [{detail}]" if detail and not cond else ""))

def start_server():
    if os.environ.get("PA_BASE"):
        return None
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer(("127.0.0.1", PORT), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd

# Erwartete Quellen-Zuordnung je Chip (CONCEPT §3)
CHIP_EXPECT = {
    "c1": {"quellen": ["A14", "A13"], "anchor": "a14-kern"},
    "c2": {"quellen": ["A15", "A16"], "anchor": "a15-summe"},
    "c3": {"quellen": ["A23", "A22"], "anchor": "a23-restpunkte"},
    "c4": {"quellen": ["A18"], "anchor": "a18-freigabe"},
}

def warte_fertig(page):
    page.wait_for_function("() => window.__pa && window.__pa.busy === false", timeout=20000)

def run_desktop(page):
    # --- Auto-Demo: spielt genau 1× (erste Chip-Frage)
    page.goto(BASE + "/?fast=1", wait_until="networkidle")
    page.wait_for_selector(".msg.user", timeout=15000)
    warte_fertig(page)
    check("Auto-Demo: genau 1 Lauf", page.evaluate("window.__pa.autoDemoRuns") == 1)
    check("Auto-Demo: Frage = Chip 1", "Bedenken zur Elektrik" in page.text_content(".msg.user"))
    page.wait_for_timeout(1200)
    check("Auto-Demo: läuft nicht erneut (genau 1 User-Frage)", page.locator(".msg.user").count() == 1)
    check("Auto-Demo: Quellen-Chips gepoppt", page.locator(".msg .quelle-chip.pop").count() == 2)
    check("Auto-Demo: A14-Karte im Fokus", page.locator('.karte[data-art="A14"].fokus.open').count() == 1)
    page.wait_for_selector('[data-anchor="a14-kern"].passage-glow', timeout=5000)
    check("Auto-Demo: exakte Passage leuchtet (a14-kern)", True)

    # --- alle kuratierten Chips durchspielen
    page.goto(BASE + "/?fast=1&noauto=1", wait_until="networkidle")
    for cid, exp in CHIP_EXPECT.items():
        page.click(f'[data-chip="{cid}"]')
        warte_fertig(page)
        quellen = page.evaluate("window.__pa.lastQuellen")
        check(f"{cid}: Quellen-IDs {exp['quellen']}", quellen == exp["quellen"], str(quellen))
        erste = exp["quellen"][0]
        check(f"{cid}: Karte {erste} fokussiert + geöffnet",
              page.locator(f'.karte[data-art="{erste}"].fokus.open').count() == 1)
        page.wait_for_selector(f'.karte[data-art="{erste}"] [data-anchor="{exp["anchor"]}"].passage-glow', timeout=5000)
        check(f"{cid}: Passage {exp['anchor']} leuchtet (Class-Assertion)", True)
        chip_arts = page.evaluate("""() => [...document.querySelectorAll('.msg:last-child .quelle-chip')]
            .map(c => c.getAttribute('data-art'))""")
        check(f"{cid}: Quellen-Chips zeigen Dokumentname+Datum",
              chip_arts == exp["quellen"] and all(
                  page.locator(f'.msg:last-child .quelle-chip[data-art="{a}"] .q-datum').count() == 1
                  for a in exp["quellen"]), str(chip_arts))

    # --- zweiter Quellen-Chip von c1: Klick wechselt Highlight auf A13
    page.click('[data-chip="c1"]')
    warte_fertig(page)
    page.click('.msg:last-child .quelle-chip[data-art="A13"]')
    page.wait_for_selector('.karte[data-art="A13"] [data-anchor="a13-befund"].passage-glow', timeout=5000)
    check("Quellen-Chip-Klick: A13-Passage leuchtet", True)
    check("Quellen-Chip-Klick: A13-Karte fokussiert", page.locator('.karte[data-art="A13"].fokus').count() == 1)

    # --- Chip 5: der Ehrlichkeits-Pfad
    page.click('[data-chip="c5"]')
    warte_fertig(page)
    letzte = page.text_content(".msg.bot:last-of-type")
    check("c5: „Dazu steht nichts in der Akte“", "Dazu steht nichts in der Akte" in letzte)
    check("c5: als unbekannt gestylt", page.locator(".msg.bot.unbekannt").count() >= 1)
    check("c5: keine Quellen-Chips", page.evaluate(
        "document.querySelectorAll('.msg:last-child .quelle-chip').length") == 0)
    check("c5: Spur nennt ehrliche Grenze", "Ehrliche Grenze" in letzte)

    # --- Panel-Quellen (Offene Punkte) nutzen dieselbe Choreografie
    page.click('#offene-punkte .quelle-chip >> nth=0')
    page.wait_for_selector('.karte[data-art="A23"] [data-anchor="a23-restpunkte"].passage-glow', timeout=5000)
    check("Offener Punkt 1 → A23-Passage leuchtet", True)

def run_mobile(page):
    page.goto(BASE + "/?fast=1&noauto=1", wait_until="networkidle")
    page.click('[data-chip="c1"]')
    warte_fertig(page)
    check("mobil: Quellen-Chips gepoppt", page.locator(".msg .quelle-chip.pop").count() == 2)
    check("mobil: kein Auto-Fokus in der Akte (Chat bleibt vorn)",
          page.locator(".karte.fokus").count() == 0)
    page.click('.msg:last-child .quelle-chip[data-art="A14"]')
    page.wait_for_selector(".sheet.offen", timeout=5000)
    check("mobil: Bottom-Sheet öffnet", True)
    check("mobil: Sheet zeigt Dokument-Titel", "Bedenkenanzeige" in page.text_content("#sheet-kopf"))
    page.wait_for_selector('#sheet-inhalt [data-anchor="a14-kern"].passage-glow', timeout=5000)
    check("mobil: gehighlightete Passage im Sheet", True)
    page.click(".sheet-zu")
    page.wait_for_timeout(500)
    check("mobil: Sheet schließt", page.locator(".sheet.offen").count() == 0)

def main():
    httpd = start_server()
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1380, "height": 900})
        try:
            run_desktop(page)
            m = browser.new_page(viewport={"width": 390, "height": 844})
            run_mobile(m)
        finally:
            browser.close()
    if httpd: httpd.shutdown()
    failed = [n for n, ok in CHECKS if not ok]
    print(f"\n{len(CHECKS) - len(failed)}/{len(CHECKS)} Checks grün")
    if failed:
        print("FEHLGESCHLAGEN:", failed)
        sys.exit(1)

if __name__ == "__main__":
    main()
