#!/usr/bin/env python3
"""Gate 3 — Live-Pfad + Panels + Fotos: Fixture-Frage → Schema + Quellen-IDs aus
dem Korpus, Origin-Lock 403, Cap graceful (429 → Chips-Hinweis im UI),
Wochen-Brief + Offene Punkte gerendert, alle 5 Fotos laden.
Braucht GOOGLE_AI_STUDIO (wird aus agent-studio/.env GOOGLE_AI_STUDIO_KEY gezogen)."""
import sys, os, json, time, subprocess, urllib.request, urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(os.environ.get("PA_PORT", "8771"))
CAPPORT = PORT + 1
BASE = f"http://127.0.0.1:{PORT}"

CHECKS = []
def check(name, cond, detail=""):
    CHECKS.append((name, bool(cond)))
    print(("  ✓ " if cond else "  ✗ ") + name + (f"  [{detail}]" if detail and not cond else ""))

def lade_key():
    if os.environ.get("GOOGLE_AI_STUDIO"):
        return os.environ["GOOGLE_AI_STUDIO"]
    env = "/Users/Osman/Desktop/APPS/agent-studio/.env"
    with open(env) as f:
        for line in f:
            if line.startswith("GOOGLE_AI_STUDIO_KEY="):
                return line.split("=", 1)[1].strip()
    return ""

def post_ask(base, frage, origin=None):
    req = urllib.request.Request(base + "/api/ask", method="POST",
                                 data=json.dumps({"frage": frage}).encode(),
                                 headers={"Content-Type": "application/json"})
    if origin:
        req.add_header("Origin", origin)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read())
        except Exception:
            return e.code, {}

def warte_auf(base):
    for _ in range(40):
        try:
            urllib.request.urlopen(base + "/", timeout=2)
            return True
        except Exception:
            time.sleep(0.25)
    return False

def main():
    key = lade_key()
    env = dict(os.environ, GOOGLE_AI_STUDIO=key)
    srv = subprocess.Popen(["node", "dev-server.mjs", str(PORT)], cwd=ROOT, env=env,
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    env_cap = dict(env, PA_DAILY_CAP="0")
    srv_cap = subprocess.Popen(["node", "dev-server.mjs", str(CAPPORT)], cwd=ROOT, env=env_cap,
                               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        check("dev-server läuft", warte_auf(BASE))
        check("cap-server läuft", warte_auf(f"http://127.0.0.1:{CAPPORT}"))

        # --- Schutzschicht: Origin-Lock
        status, _ = post_ask(BASE, "Wie hoch war das Angebot?", origin=None)
        check("ohne Origin → 403", status == 403, str(status))
        status, _ = post_ask(BASE, "Wie hoch war das Angebot?", origin="https://boese-seite.example")
        check("fremder Origin → 403", status == 403, str(status))
        status, body = post_ask(BASE, "", origin=BASE)
        check("leere Frage → 400", status == 400, str(status))
        status, body = post_ask(BASE, "x" * 300, origin=BASE)
        check("überlange Frage → 413 + fallback", status == 413 and body.get("fallback") is True, str(status))

        # --- Cap graceful
        status, body = post_ask(f"http://127.0.0.1:{CAPPORT}", "Wie hoch war das Angebot?", origin=f"http://127.0.0.1:{CAPPORT}")
        check("Cap erreicht → 429 + fallback:true", status == 429 and body.get("fallback") is True, f"{status} {body}")

        # --- Fixture-Frage → Schema + Quellen aus dem Korpus (echter Gemini-Call)
        status, body = post_ask(BASE, "Wie hoch war die zweite Abschlagsrechnung und wann wurde sie gestellt?", origin=BASE)
        check("Fixture: HTTP 200 + ok", status == 200 and body.get("ok") is True, f"{status} {str(body)[:200]}")
        check("Fixture: kein model-Feld in der Response", "model" not in body, str(sorted(body.keys())))
        antwort = body.get("antwort") or {}
        check("Fixture: Schema {antwort, quellen[], unbekannt}",
              isinstance(antwort.get("antwort"), str) and isinstance(antwort.get("quellen"), list)
              and isinstance(antwort.get("unbekannt"), bool), str(antwort)[:200])
        gueltig = {f"A{i:02d}" for i in range(1, 25)}
        check("Fixture: Quellen-IDs ⊆ Korpus", set(antwort.get("quellen", [])) <= gueltig, str(antwort.get("quellen")))
        check("Fixture: nennt A21 als Quelle", "A21" in antwort.get("quellen", []), str(antwort.get("quellen")))
        check("Fixture: Antwort nennt 37.920 oder 45.124,80",
              ("37.920" in antwort.get("antwort", "")) or ("45.124,80" in antwort.get("antwort", "")),
              antwort.get("antwort", "")[:200])
        check("Fixture: nicht unbekannt", antwort.get("unbekannt") is False)

        # --- Playwright: UI-Ebene (Panels, Fotos, Live-Eingabe + graceful Cap)
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page(viewport={"width": 1380, "height": 900})
            antworten = []
            page.on("response", lambda r: antworten.append(r) if "/api/ask" in r.url else None)
            page.goto(BASE + "/?fast=1&noauto=1", wait_until="networkidle")

            # Panels
            wb = page.text_content("#wochen-brief")
            check("Wochen-Brief W6 gerendert", "Woche 6" in wb and "08.05.2026" in wb)
            check("Wochen-Brief: 3 Rubriken", all(s in wb for s in ["passiert", "Nächstes", "wartet"]))
            check("Wochen-Brief: Quellen-Chips", page.locator("#wochen-brief .quelle-chip").count() >= 5)
            check("Offene Punkte: 3 Karten", page.locator("#offene-punkte .punkt-karte").count() == 3)
            check("Offene Punkte: jede mit Quellen-Chip",
                  page.locator("#offene-punkte .punkt-karte .quelle-chip").count() == 3)

            # Fotos: alle 5 laden echt (naturalWidth > 0)
            page.click('[data-filter="foto"]')
            for art in ["A11", "A12", "A13", "A19"]:
                page.click(f'.karte[data-art="{art}"] .karte-kopf')
            geladen = page.evaluate("""() => {
              const imgs = [...document.querySelectorAll('.karte .wa-foto, .karte .karte-foto-thumb')];
              return { n: imgs.length, ok: imgs.filter(i => i.complete && i.naturalWidth > 200).length };
            }""")
            check("Fotos: alle gerenderten Bilder laden (naturalWidth > 200)",
                  geladen["ok"] == geladen["n"] and geladen["n"] >= 5, str(geladen))
            page.click('[data-filter="alle"]')

            # Live-Eingabe end-to-end durch die UI (2. echter Call)
            page.fill("#eingabe-feld", "Welche lichte Türbreite ist für die barrierefreie Tür nötig?")
            page.click("#eingabe-senden")
            page.wait_for_function("() => window.__pa && window.__pa.busy === false", timeout=60000)
            page.wait_for_timeout(300)
            letzte = page.text_content(".msg.bot:last-of-type")
            check("Live-UI: Antwort nennt 90 cm", "90" in letzte, letzte[:200])
            check("Live-UI: Quellen-Chips erscheinen", page.evaluate("window.__pa.lastQuellen").__len__() >= 1
                  if True else False, str(page.evaluate("window.__pa.lastQuellen")))
            check("Live-UI: A19 unter den Quellen", "A19" in page.evaluate("window.__pa.lastQuellen"))
            check("Live-UI: Spur „Live aus der Akte“", "Live aus der Akte" in letzte)

            # graceful Cap im UI (cap-server)
            page2 = browser.new_page(viewport={"width": 1380, "height": 900})
            page2.goto(f"http://127.0.0.1:{CAPPORT}/?fast=1&noauto=1", wait_until="networkidle")
            page2.fill("#eingabe-feld", "Wie hoch war das Angebot?")
            page2.click("#eingabe-senden")
            page2.wait_for_selector(".msg.bot.unbekannt", timeout=15000)
            txt = page2.text_content(".msg.bot.unbekannt")
            check("Cap im UI: graceful Hinweis auf Beispielfragen", "Beispielfragen" in txt, txt[:200])
            check("Cap im UI: Eingabe wieder aktiv", page2.evaluate("!document.getElementById('eingabe-feld').disabled"))
            browser.close()
    finally:
        srv.terminate()
        srv_cap.terminate()

    failed = [n for n, ok in CHECKS if not ok]
    print(f"\n{len(CHECKS) - len(failed)}/{len(CHECKS)} Checks grün")
    if failed:
        print("FEHLGESCHLAGEN:", failed)
        sys.exit(1)

if __name__ == "__main__":
    main()
