# Lessons — Projekt-Akte Build (2026-06-11)

Erkenntnisse aus dem autonomen one-prompt-Lauf 5 (Station ② op-build),
wiederverwendbar für künftige Demo-/Korpus-Projekte.

## Korpus-Engineering (das Herzstück dieses Produkttyps)

- **Eine Quelle, zwei Konsumenten:** `data.js` als UMD (window.AKTE + module.exports)
  speist Frontend UND `/api/ask` — Korpus-Drift zwischen UI und Live-Antwort ist
  damit konstruktiv unmöglich. Muster für jedes „befragbare Inhalte"-Projekt.
- **Konsistenz-Skript VOR der UI schreiben.** 30 Checks (Summen-Arithmetik inkl.
  Brutto-Kette, Datum↔Wochen-Mapping per Modulo, §§-Regexe, Anker-Referenzen,
  globale Anker-Eindeutigkeit) haben den Korpus in einem Durchgang wasserdicht
  gemacht — die UI-Phasen fanden danach null Inhaltsfehler.
- **Anker-System:** Passagen als `data-anchor` (nie `id` — Inhalte werden in
  Timeline UND Bottom-Sheet doppelt gerendert, IDs würden kollidieren).
  Chips referenzieren `{art, anchor, snippet}`; das Konsistenz-Skript erzwingt,
  dass jeder Anker existiert.
- **Fachlichkeit = Vertrauen:** VOB/B-Paragraphen konsistent über Artefakte hinweg
  zitieren (Bedenkenanzeige §4(3) → Nachtrag §2(6) → Behinderung §6(1) →
  Abnahme §12(4) → Gewährleistung §13(4) → Zahlung §16 → Bürgschaft §17) erzeugt
  die „das riecht nach echter Baustelle"-Wirkung. Detail mit Punch: die
  88,5-cm-Türfrage, die per DIN 18040-1 (≥90 cm) korrigiert wird.

## Choreografie

- **Der Geld-Moment ist eine Kette, kein Feature:** Frage → Tipp-Animation →
  Quellen-Chips poppen gestaffelt (260 ms) → Karte öffnet + scrollt → Passage
  pulsiert gelb. Jedes Glied einzeln testbar machen (Class-Assertions auf
  `.fokus`, `.passage-glow`), nicht „sieht gut aus".
- **Timeline-Scroll nie mit `scrollIntoView` allein:** das scrollt auch die SEITE
  und reißt den Nutzer aus dem Chat. Innerhalb des Containers per
  `getBoundingClientRect()`-Delta + `container.scrollTo` scrollen; `scrollIntoView`
  nur für bewusste Seiten-Sprünge (Panel-Chips).
- **Auto-Demo an Sichtbarkeit koppeln, nicht an Zeit** (Excellence-Fix): IO auf
  dem Chat-Panel (threshold 0.35) statt setTimeout — sonst läuft der Aha-Moment
  mobil unsichtbar unterhalb des Folds ab. „Genau 1×" über Flag + Zähler
  (`__pa.autoDemoRuns`) testbar machen.
- **`?fast=1`-Testmodus von Anfang an einbauen** (Typing instant, Delays ≤10 ms):
  die Choreografie-Suite (35 Checks) läuft dadurch in ~20 s statt Minuten.

## Tests

- **Stray-Server-Falle:** Port 8765 war von einem fremden Python-Prozess belegt →
  POSTs liefen gegen dessen 501 statt gegen den eigenen Dev-Server, während GET
  „funktionierte". Symptom merken: 501 = SimpleHTTPRequestHandler. Bei
  Test-Ports immer ausgefallene Nummern wählen oder `lsof` prüfen — nie fremde
  Prozesse killen.
- **Substring-Fallen in Sprach-Checks:** „RAG" matcht in „FRAGE" (Chrome wendet
  `text-transform: uppercase` in `innerText` an!). Verbots-Wortlisten immer mit
  `\b`-Wortgrenzen prüfen.
- **`data-art` doppelt vergeben** (Karten + Quellen-Chips) → Locator auf
  `.karte[data-art=…]` einschränken. Selektoren in Tests so spezifisch wie die
  Komponente, nicht wie das Attribut.

## Live-Pfad / Schutzschicht

- Das Angebots-Blitz-Muster (Origin-Lock → 403, In-Memory-Caps global+IP,
  graceful `fallback:true` → UI fällt auf kuratierte Chips zurück) ließ sich
  1:1 portieren; Cap-Test ohne Quota-Verbrauch über zweite Server-Instanz mit
  `PA_DAILY_CAP=0`.
- **Quellen-Pflicht serverseitig erzwingen:** Gemini-Antwort wird bereinigt —
  IDs gegen den Korpus validiert, und `quellen:[] ⇒ unbekannt:true ⇒` Antwort
  wird durch „Dazu steht nichts in der Akte." ersetzt. Das Schema allein reicht
  nicht; die eiserne Regel muss im Code nachgezogen werden.
- Gemini-Flash beantwortete beide Fixture-Fragen korrekt mit richtigen
  IDs (A21/37.920 · A19/90 cm · A24/48.480,60) — ~15k-Zeichen-Korpus als
  Plaintext-Kontext reicht völlig, kein Such-Index nötig bei dieser Größe.

## Assets

- **NB2 brennt gern Fake-App-UI ins Bild** („WhatsApp-Foto" → Screenshot mit
  erfundenem Absender „Bauleiter Alex" + Statusleiste). Bei Chat-Foto-Anmutung
  explizit prompten: „clean photo WITHOUT any app interface / text overlay /
  status bar". Faktencheck gegen den Nachrichtentext (Alu-Adern sichtbar?
  Gipskarton, nicht Ziegel?) hat 1 Retake gekostet, 0,05 €.
- Fotos für Thumbnails/Bubbles aggressiv komprimieren (720 px, q58 ≈ 60–125 KB)
  — Erst-Load fiel von 1.096 KB auf ~650 KB.

## Kosten (Ist)

| Posten | Menge | Ist |
|---|---|---|
| Nano Banana 2 (Baustellenfotos 1K 4:3) | 6 Renders (5 final + 1 Retake) | 0,30 € |
| Gemini Flash (`/api/ask`, Tests + Live-E2E) | ~10 Calls | ~0,01 € |
| **Gesamt** | | **~0,31 €** (Budget 10 €, Konzept-Schätzung ≤2 €) |
