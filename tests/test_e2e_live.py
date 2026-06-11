#!/usr/bin/env python3
"""Gate 5 — E2E gegen die Live-URL: Choreografie live, 1 echter /api/ask
durch die UI, Origin-Lock live, Rechtsseiten erreichbar."""
import sys, json, urllib.request, urllib.error

BASE = "https://projekt-akte.demo.osai.solutions"

CHECKS = []
def check(name, cond, detail=""):
    CHECKS.append((name, bool(cond)))
    print(("  ✓ " if cond else "  ✗ ") + name + (f"  [{detail}]" if detail and not cond else ""))

def main():
    # --- Origin-Lock live (ohne Origin → 403)
    req = urllib.request.Request(BASE + "/api/ask", method="POST",
                                 data=json.dumps({"frage": "Test"}).encode(),
                                 headers={"Content-Type": "application/json"})
    try:
        urllib.request.urlopen(req, timeout=30)
        check("live: ohne Origin → 403", False, "kein Fehler")
    except urllib.error.HTTPError as e:
        check("live: ohne Origin → 403", e.code == 403, str(e.code))

    # --- Rechtsseiten
    for seite, marker in [("impressum.html", "§ 5 DDG"), ("datenschutz.html", "Gemini")]:
        with urllib.request.urlopen(BASE + "/" + seite, timeout=30) as r:
            check(f"live: {seite} erreichbar + Inhalt", r.status == 200 and marker in r.read().decode())

    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1380, "height": 900})

        # --- Auto-Demo live
        page.goto(BASE + "/?fast=1", wait_until="networkidle")
        page.wait_for_function("() => window.__pa && window.__pa.busy === false && window.__pa.autoDemoRuns === 1", timeout=30000)
        page.wait_for_selector('[data-anchor="a14-kern"].passage-glow', timeout=8000)
        check("live: Auto-Demo + Passage-Glow", True)
        check("live: 24 Karten", page.locator(".karte").count() == 24)

        # --- Fotos laden über CDN
        geladen = page.evaluate("""() => {
          const imgs = [...document.querySelectorAll('.karte-foto-thumb')];
          return imgs.filter(i => i.complete && i.naturalWidth > 100).length; }""")
        check("live: Foto-Thumbnails laden", geladen == 5, str(geladen))

        # --- echter /api/ask durch die UI
        page.fill("#eingabe-feld", "Wie hoch ist die Restforderung der Schlussrechnung?")
        page.click("#eingabe-senden")
        page.wait_for_function("() => window.__pa && window.__pa.busy === false", timeout=90000)
        page.wait_for_timeout(300)
        letzte = page.text_content(".msg.bot:last-of-type")
        quellen = page.evaluate("window.__pa.lastQuellen")
        check("live /api/ask: Antwort nennt 48.480,60", "48.480,60" in letzte, letzte[:220])
        check("live /api/ask: Quelle A24", "A24" in quellen, str(quellen))
        check("live /api/ask: Spur „Live aus der Akte“", "Live aus der Akte" in letzte)

        browser.close()

    failed = [n for n, ok in CHECKS if not ok]
    print(f"\n{len(CHECKS) - len(failed)}/{len(CHECKS)} Checks grün")
    if failed:
        print("FEHLGESCHLAGEN:", failed)
        sys.exit(1)

if __name__ == "__main__":
    main()
