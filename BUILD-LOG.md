# BUILD-LOG — Projekt-Akte

> one-prompt-kit · Lauf 5 (autonom) · Station ② op-build · 2026-06-11
> Vertrag: `.planning/one-prompt/projekt-akte/CONCEPT.md`

## Phasen & Gates

| Phase | Gate | Ergebnis |
|---|---|---|
| 1 — Korpus + Akte | 24 Artefakte gerendert, Filter exakt, Dokument öffnet, Konsistenz-Skript | ⚑ GRÜN 2× (27/27) |
| 2 — Q&A-Choreografie | korrekte Artefakt-IDs je Chip, Passage-Glow-Class-Assertions, „nichts in der Akte“-Pfad, Auto-Demo genau 1×, Bottom-Sheet | ⚑ GRÜN 2× (35/35) |
| 3 — Live-Pfad + Panels | Fixture → Schema + Korpus-IDs, Origin 403, Cap graceful, 5 Fotos faktengecheckt | ⚑ GRÜN 2× (25/25) |
| 4 — Polish | 390px ohne Overflow, Erst-Load 1.096 KB < 1,2 MB, OG, Impressum/Datenschutz, Erklär-Sprache | ⚑ GRÜN 2× (25/25) |
| 5 — Ship | E2E live 2× inkl. echtem /api/ask | — |
| 6 — Excellence-Pass | 10 Schwächen, Top-5 gefixt, Suite 2× grün | — |

## Konsistenz-Anker (Skript-geprüft)

Angebot v1 103.400 → v2 94.800 (−8.600) · Nachtrag N1 +12.300 · Schlussrechnung
107.100 netto / 127.449 brutto · Abschläge 28.440 + 37.920 (30/40/30, § 16 VOB/B)
· Restforderung 48.480,60 · W1–W10 = 02.03.–10.05.2026 · §§ 2/4/6/12/13/16/17 VOB/B
· DIN VDE 0100 · DIN 18040-1 (≥ 90 cm).

## „Würde ein Geschäftsführer das sofort verstehen?“ — Urteil (Phase 4)

**Ja — aus drei Gründen:**

1. **Die Auto-Demo nimmt ihm die erste Hürde ab.** 1,4 s nach dem Laden stellt
   die Seite selbst die Frage, die jeder Bau-Geschäftsführer kennt („Haben wir
   die Bedenken schriftlich angezeigt?“) — und er SIEHT, wie die Antwort
   getippt wird, zwei Quellen-Chips aufpoppen und links in der Akte die exakte
   Passage der Bedenkenanzeige gelb aufleuchtet. Niemand muss erklären, was
   das Produkt tut; es führt sich selbst vor.
2. **Die Sprache ist seine Sprache.** Kein einziger Technik-Begriff auf der
   Seite (Skript-geprüft: kein RAG/LLM/Embedding/Vektor) — stattdessen
   „liest mit, merkt sich alles, antwortet mit Quelle“ und ein Korpus, der
   nach echter Baustelle riecht: VOB/B-Paragraphen, Abschlagsrechnungen,
   WhatsApp-Fotos, eine Behinderungsanzeige.
3. **Die ehrliche Grenze schafft Vertrauen.** Chip 5 („Wurde die
   Schlussrechnung schon bezahlt?“) antwortet sichtbar anders gestylt:
   „Dazu steht nichts in der Akte.“ Das beantwortet die ChatGPT-Frage
   („Wo ist der Unterschied?“) ohne sie zu stellen: Es behauptet nichts,
   es belegt.

**Restrisiko:** Wer die Akte links nie anschaut, könnte die Tiefe der 24
Dokumente übersehen — dafür zwingt die Auto-Demo den Blick einmal nach links.

## Kosten (Ist, Stand Phase 4)

| Posten | Menge | Ist |
|---|---|---|
| Nano Banana 2 (Baustellenfotos, 1K, 4:3) | 6 Renders (1 Retake: UI-Overlay) | 0,30 € |
| Gemini Flash Live-Calls (Tests) | ~6 Calls | ~0,01 € |
| **Summe** | | **~0,31 €** |

## Iteration 2 — externer Review (14 Findings) · 2026-06-11

> Vorgänger-Session am Limit gestorben; Sichtung ergab: 1 sauberer Teil-Fix
> (Chips-Wrapper in index.html), nichts Korruptes. Alle 14 Findings als
> atomare Commits umgesetzt (e07b520…b8ef222).

| # | Finding | Fix |
|---|---|---|
| 1 (P1) | Mobile Frage-Chips: nur 1 von 5 sichtbar | 2-zeiliger Umbruch + Peek (max-width 76%) + Fade-Kante (`hat-mehr` via JS) — alle 5 bei 390 px erreichbar, getestet |
| 2–4 (P2) | 3 Fotos epochen-inkonsistent | NB2-Re-Gens: Leitungsfund (Stemmschlitz, verzinkte Leitung, Estrich), Alu (PVC-Alu-Adern + Kunststoff-Lüsterklemmen, keine Keramik), Material (GK + CW-Profile im Bestandsraum, kein Rohbau); auf ~150 KB komprimiert (Erst-Load-Budget) |
| 5 (P2) | A11 08:42 unplausibel | → 15:20/15:21/15:47, Text „heute Morgen pünktlich angefangen“ |
| 6 (P2) | Baujahr 1978 | → durchgängig **1972** (BRD-Alu plausibel) + neuer Konsistenz-Check „kein 1978“ |
| 7 (P2) | A13 zu formal | Monteur-Bubble „Chef, schau dir das an — …“ + Weber-Bubble bündelt Formales (Anker/VDE bleiben) |
| 8 (P3) | Desktop-Filter clippt 📷 Fotos | gleiche Fade-Kanten-Mechanik (`filter-zeile`) + Test |
| 9 (P3) | A23-Einleitung | Vorbehalt nur R3; R1/R2 „bei Begehung bereits erledigt“ |
| 10 (P3) | A19 Türmaß | „Türblatt 985 mm, lichte Breite ca. 94 cm“ |
| 11 (P3) | Briefkopf | Ort/Datum rechtsbündig (`dok-datum`), doppelte AN-/SR-Nummern-Zeile entfällt (Meta-Dedupe) |
| 12 (P3) | Impressum „du“ | → Sie |
| 13 (P3) | /api/ask `model`-Feld | entfernt + Test |
| 14 (P3) | Footer-Erklärung | Inline-Aufklapper „Wie funktioniert das?“ (3 Sätze, Datenschutz-Link, kein 404) |

**Gates Iteration 2:** Konsistenz OK 2× · test_akte 27/27 2× · test_qa 35/35 2× ·
test_polish 35/35 2× (neu: 5 Chips mobil, Filter-Scroll, Footer-Aufklapper) ·
test_live 26/26 2× (neu: kein model-Feld) · E2E live 9/9 2×.
Screenshots: `/tmp/pa-fix2/shot-*.png`.

**Kosten Iteration 2:** 3 NB2-Renders (1K, 4:3, je 1 Versuch) ≈ 0,15 € ·
Gemini-Flash-Testcalls (test_live 2× + E2E 2×) ≈ 0,01 € → **≈ 0,16 €**.
