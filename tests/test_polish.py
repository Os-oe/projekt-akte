#!/usr/bin/env python3
"""Gate 4 — Polish: 390px ohne Overflow, Erst-Load < 1,2 MB, OG-Tags,
Impressum/Datenschutz verlinkt + erreichbar, Erklär-Sprache (keine Technik-Begriffe),
CTA direkt auf cal.com, Transparenz-Zeile."""
import sys, threading, functools, http.server, socketserver, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(os.environ.get("PA_PORT", "8773"))
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

def main():
    httpd = start_server()
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        browser = p.chromium.launch()

        # --- Erst-Load-Gewicht (Desktop, inkl. aller initialen Requests)
        groessen = {}
        page = browser.new_page(viewport={"width": 1380, "height": 900})
        def merken(r):
            try:
                groessen[r.url] = len(r.body())
            except Exception:
                groessen[r.url] = 0
        page.on("response", merken)
        page.goto(BASE + "/?noauto=1", wait_until="networkidle")
        total = sum(groessen.values())
        check(f"Erst-Load < 1,2 MB ({total/1024:.0f} KB)", total < 1_200_000,
              str(sorted(((v, k.split('/')[-1]) for k, v in groessen.items()), reverse=True)[:6]))

        # --- OG / Meta
        for sel in ['meta[property="og:title"]', 'meta[property="og:description"]',
                    'meta[property="og:image"]', 'meta[property="og:url"]',
                    'meta[name="twitter:card"]', 'link[rel="canonical"]', 'meta[name="description"]']:
            check(f"Meta vorhanden: {sel}", page.locator(sel).count() == 1)
        check("og:image-Datei existiert", os.path.getsize(os.path.join(ROOT, "assets/img/og.jpg")) > 20000)

        # --- Erklär-Sprache: keine Technik-Begriffe auf der Demo-Seite
        import re
        body_text = page.evaluate("document.body.innerText")
        verboten = ["RAG", "Embedding", "LLM", "Vektor", "Token", "Prompt"]
        treffer = [w for w in verboten if re.search(r"\b" + w + r"\b", body_text)]
        check("keine Technik-Begriffe (RAG/LLM/Embeddings/Vektor/…)", treffer == [], str(treffer))
        check("Erklär-Dreiklang „liest mit · merkt sich · antwortet mit Quelle“",
              "liest mit" in body_text and "antwortet mit Quelle" in body_text)
        check("Claim „Kein Chatbot.“ + „Projektgedächtnis“", "Kein Chatbot." in body_text and "Projektgedächtnis" in body_text)
        check("Transparenz-Zeile (frei erfunden)", body_text.count("frei erfunden") >= 2)
        check("Pilot-Preis 990 € + 199 €/Monat", "990" in body_text and "199" in body_text)

        # --- CTA: direkt auf cal.com-Erstgespräch + UTM-Link
        check("CTA direkt auf cal.com/osai-solutions/erstgespraech",
              page.locator('a[href="https://cal.com/osai-solutions/erstgespraech"]').count() >= 2)
        check("osai.solutions?utm_source=projekt-akte verlinkt",
              page.locator('a[href^="https://osai.solutions?utm_source=projekt-akte"]').count() >= 1)

        # --- Footer-Links + Rechtsseiten erreichbar
        check("Footer verlinkt Impressum + Datenschutz",
              page.locator('.footer a[href="impressum.html"]').count() == 1 and
              page.locator('.footer a[href="datenschutz.html"]').count() >= 1)
        # --- Footer: „Wie funktioniert das?“-Aufklapper (inline, kein 404-Link)
        check("Footer: Aufklapper „Wie funktioniert das?“ vorhanden",
              page.locator(".footer-erklaer summary").count() == 1 and
              "Wie funktioniert das?" in page.text_content(".footer-erklaer summary"))
        erkl = page.text_content(".footer-erklaer")
        check("Footer-Erklärung: liest mit / merkt sich / Quelle + KI-Dienst-Passus",
              "liest" in erkl and "merkt sich" in erkl and "Quelle" in erkl and
              "KI-Dienst" in erkl and "nicht gespeichert" in erkl)
        check("Footer-Erklärung verlinkt Datenschutz inline",
              page.locator('.footer-erklaer a[href="datenschutz.html"]').count() == 1)
        page.goto(BASE + "/impressum.html", wait_until="domcontentloaded")
        imp = page.evaluate("document.body.innerText")
        check("Impressum: § 5 DDG + USt-ID", "§ 5 DDG" in imp and "DE462559965" in imp)
        page.goto(BASE + "/datenschutz.html", wait_until="domcontentloaded")
        ds = page.evaluate("document.body.innerText")
        check("Datenschutz: Freitext-Frage via Gemini erklärt", "Gemini" in ds and "Freitext" in ds.replace("Freitext-Frage", "Freitext"))
        check("Datenschutz: keine Speicherung + DSGVO-Rechte", "Keine Speicherung" in ds and "Art. 15" in ds)
        check("Datenschutz: kein Foto-/Mikrofon-Passus (angepasst, nicht kopiert)",
              "Mikrofon" not in ds and "Aufnahme" not in ds)

        # --- Mobile 390px: kein horizontaler Overflow, App nutzbar
        m = browser.new_page(viewport={"width": 390, "height": 844})
        m.goto(BASE + "/?fast=1&noauto=1", wait_until="networkidle")
        overflow = m.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
        check("390px: kein horizontaler Overflow (Seite)", overflow <= 0, str(overflow))
        m.click('[data-chip="c3"]')
        m.wait_for_function("() => window.__pa.busy === false", timeout=20000)
        overflow2 = m.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
        check("390px: kein Overflow nach Chat-Antwort", overflow2 <= 0, str(overflow2))
        check("390px: Chat steht vor der Akte",
              m.evaluate("document.querySelector('.chat').getBoundingClientRect().top < document.querySelector('.akte').getBoundingClientRect().top"))
        m.click('.msg:last-child .quelle-chip >> nth=0')
        m.wait_for_selector(".sheet.offen", timeout=5000)
        overflow3 = m.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
        check("390px: Bottom-Sheet ohne Overflow", overflow3 <= 0, str(overflow3))

        # --- Mobile: alle 5 Frage-Chips erreichbar (Scroll + Peek + Fade-Kante)
        m.evaluate("document.querySelector('#sheet .sheet-zu').click()")
        check("390px: 5 Frage-Chips gerendert", m.evaluate("document.querySelectorAll('.frage-chip').length") == 5)
        check("390px: Chips-Zeile scrollbar (Inhalt breiter als Sichtfenster)",
              m.evaluate("(s => s.scrollWidth > s.clientWidth)(document.getElementById('frage-chips'))"))
        check("390px: Fade-Kante sichtbar (hat-mehr) am Zeilenanfang",
              m.evaluate("document.querySelector('.chips-zeile').classList.contains('hat-mehr')"))
        m.evaluate("(s => s.scrollLeft = s.scrollWidth)(document.getElementById('frage-chips'))")
        m.wait_for_timeout(250)
        chip5_sichtbar = m.evaluate("""() => {
          const s = document.getElementById('frage-chips');
          const c = s.querySelector('[data-chip="c5"]');
          const sr = s.getBoundingClientRect(), cr = c.getBoundingClientRect();
          return cr.left >= sr.left - 2 && cr.right <= sr.right + 2 && cr.width > 40;
        }""")
        check("390px: Chip 5 nach Scroll voll im Sichtfenster", chip5_sichtbar)
        check("390px: Fade-Kante verschwindet am Zeilenende",
              m.evaluate("!document.querySelector('.chips-zeile').classList.contains('hat-mehr')"))

        browser.close()
    if httpd: httpd.shutdown()
    failed = [n for n, ok in CHECKS if not ok]
    print(f"\n{len(CHECKS) - len(failed)}/{len(CHECKS)} Checks grün")
    if failed:
        print("FEHLGESCHLAGEN:", failed)
        sys.exit(1)

if __name__ == "__main__":
    main()
