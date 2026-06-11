#!/usr/bin/env python3
"""Gate 1 — Korpus + Akte: alle 24 Artefakte gerendert, Filter korrekt,
Dokument-Ansicht öffnet; Konsistenz-Skript grün.
Standalone (kein pytest): eigener Static-Server, headless Chromium."""
import sys, threading, functools, http.server, socketserver, os, subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(os.environ.get("PA_PORT", "8762"))
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

# Erwartete Filter-Treffer (aus dem Korpus abgeleitet)
FILTER_EXPECT = {
    "alle": 24, "mail": 6, "dokument": 11, "whatsapp": 4, "notiz": 3, "foto": 5
}

def run(page):
    page.goto(BASE + "/?fast=1&noauto=1", wait_until="networkidle")

    # --- Konsistenz-Skript (Summen, Daten, §§, Referenzen)
    r = subprocess.run(["node", os.path.join(ROOT, "tools", "check-konsistenz.cjs")],
                       capture_output=True, text=True)
    check("Konsistenz-Skript grün", r.returncode == 0, r.stdout[-400:] + r.stderr[-200:])

    # --- 24 Artefakte + 10 Wochen-Header gerendert
    check("24 Artefakt-Karten gerendert", page.locator(".karte").count() == 24,
          str(page.locator(".karte").count()))
    check("10 Wochen-Header", page.locator(".woche-kopf").count() == 10)
    check("Zähler nennt 24 Dokumente", "24 Dokumente" in page.text_content("#akte-zaehler"))

    # --- jede ID A01–A24 vorhanden
    ids_ok = all(page.locator(f'.karte[data-art="A{i:02d}"]').count() == 1 for i in range(1, 25))
    check("IDs A01–A24 alle im DOM", ids_ok)

    # --- Filter: jeder Filter zeigt exakt die erwartete Kartenzahl
    for fid, erwartet in FILTER_EXPECT.items():
        page.click(f'[data-filter="{fid}"]')
        sichtbar = page.locator(".karte:visible").count()
        check(f"Filter {fid}: {erwartet} Karten", sichtbar == erwartet, str(sichtbar))
    page.click('[data-filter="alle"]')

    # --- Wochen-Header verschwinden mit, wenn Woche leer gefiltert
    page.click('[data-filter="mail"]')
    koepfe = page.locator(".woche-kopf:visible").count()
    check("Mail-Filter: nur Wochen mit Mails sichtbar", koepfe == 5, str(koepfe))  # A01/03(W1) A05(W2) A16(W5) A18(W6) A20(W7) = 5 Wochen
    page.click('[data-filter="alle"]')

    # --- Dokument-Ansicht öffnet: Angebot v1 zeigt Summen + Briefkopf
    page.click('[data-art="A04"] .karte-kopf')
    check("A04 öffnet", "open" in page.get_attribute('[data-art="A04"]', "class"))
    a04 = page.text_content('[data-art="A04"] .karte-inhalt')
    check("A04: Briefkopf Weber Ausbau GmbH", "Weber Ausbau GmbH" in a04)
    check("A04: Angebotssumme 103.400,00 €", "103.400,00 €" in a04)
    check("A04: 9 Positionen als Tabelle", page.locator('[data-art="A04"] tbody tr').count() == 9)

    # --- Schlussrechnung: komplette Brutto-Kette sichtbar
    page.click('[data-art="A24"] .karte-kopf')
    a24 = page.text_content('[data-art="A24"] .karte-inhalt')
    for wert in ["107.100,00 €", "127.449,00 €", "33.843,60 €", "45.124,80 €", "48.480,60 €"]:
        check(f"A24 zeigt {wert}", wert in a24)

    # --- WhatsApp-Ansicht: Bubbles beider Seiten
    page.click('[data-art="A13"] .karte-kopf')
    check("A13: WhatsApp-Bubbles gerendert", page.locator('[data-art="A13"] .wa-bubble').count() >= 3)
    check("A13: VDE 0100 im Text", "VDE 0100" in page.text_content('[data-art="A13"] .karte-inhalt'))

    # --- Notiz-Ansicht
    page.click('[data-art="A02"] .karte-kopf')
    check("A02: Notiz-Optik", page.locator('[data-art="A02"] .notiz').count() == 1)

    # --- Bedenkenanzeige: exakte Passage als Anker vorhanden
    page.click('[data-art="A14"] .karte-kopf')
    kern = page.locator('[data-art="A14"] [data-anchor="a14-kern"]')
    check("A14: Anker a14-kern existiert", kern.count() == 1)
    check("A14: § 4 Abs. 3 VOB/B in der Passage", "§ 4 Abs. 3 VOB/B" in kern.text_content())

    # --- alle Chip-Anker existieren im DOM
    fehlend = page.evaluate("""() => {
      const fehl = [];
      for (const c of window.AKTE.chips) for (const q of c.quellen) {
        if (!document.querySelector(`[data-art="${q.art}"] [data-anchor="${q.anchor}"]`)) fehl.push(q.anchor);
      }
      return fehl; }""")
    check("alle Chip-Anker im DOM", fehlend == [], str(fehlend))

def main():
    httpd = start_server()
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1380, "height": 900})
        try:
            run(page)
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
