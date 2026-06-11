#!/usr/bin/env node
/* Korpus-Konsistenz-Check (Gate 1):
 * Summen (103.400 / 94.800 / 12.300 / 28.440 / 37.920 / 107.100 + Brutto-Kette),
 * Daten W1–W10 aufsteigend + im Wochenfenster, §§-Zitate, Anker-Referenzen. */
const AKTE = require("../assets/js/data.js");

let fail = 0;
function check(name, cond, detail) {
  console.log((cond ? "  ✓ " : "  ✗ ") + name + (cond ? "" : "  [" + (detail || "") + "]"));
  if (!cond) fail++;
}
function eur(s) { return Number(String(s).replace(/[€\s.−-]/g, "").replace(",", ".")); }
function art(id) { return AKTE.artefakte.find(a => a.id === id); }
function sumRows(a) {
  const t = (a.body || []).map(s => s.table).find(Boolean);
  return t.rows.reduce((acc, r) => acc + eur(r[r.length - 1]), 0);
}
function allText(a) {
  let out = [a.titel, a.betreff, a.meta].filter(Boolean).join("\n");
  (a.body || []).forEach(s => {
    if (s.t) out += "\n" + s.t;
    if (s.table) out += "\n" + s.table.rows.concat(s.table.foot || []).map(r => r.join(" ")).join("\n");
  });
  (a.chat || []).forEach(m => { out += "\n" + m.t; });
  return out;
}
function anchorsOf(a) {
  const set = new Set();
  (a.body || []).forEach(s => {
    if (s.anchor) set.add(s.anchor);
    if (s.table) {
      if (s.table.anchorFoot) set.add(s.table.anchorFoot);
      Object.values(s.table.anchorRows || {}).forEach(x => set.add(x));
    }
  });
  (a.chat || []).forEach(m => { if (m.anchor) set.add(m.anchor); });
  return set;
}

console.log("— Struktur —");
check("24 Artefakte", AKTE.artefakte.length === 24, String(AKTE.artefakte.length));
const ids = AKTE.artefakte.map(a => a.id);
check("IDs A01–A24 lückenlos", ids.join() === Array.from({ length: 24 }, (_, i) => "A" + String(i + 1).padStart(2, "0")).join());
check("Wochen 1–10 alle belegt", new Set(AKTE.artefakte.map(a => a.woche)).size === 10);

console.log("— Daten / Chronologie —");
const W1 = new Date("2026-03-02");
let asc = true, inWeek = true;
let prev = "";
AKTE.artefakte.forEach(a => {
  if (a.datum < prev) asc = false;
  prev = a.datum;
  const off = Math.floor((new Date(a.datum) - W1) / 864e5);
  if (Math.floor(off / 7) + 1 !== a.woche) { inWeek = false; console.log("    !", a.id, a.datum, "≠ Woche", a.woche); }
});
check("Daten aufsteigend", asc);
check("jedes Datum liegt in seiner Woche (W1=02.03.2026)", inWeek);

console.log("— Summen —");
check("Angebot v1 Positionen = 103.400", sumRows(art("A04")) === 10340000 / 100, String(sumRows(art("A04"))));
check("Angebot v2 Positionen = 94.800", sumRows(art("A07")) === 94800);
check("v1 − v2 = 8.600 (Telefonat-Notiz)", sumRows(art("A04")) - sumRows(art("A07")) === 8600 && /8\.600/.test(allText(art("A06"))));
check("Nachtrag N1 Positionen = 12.300", sumRows(art("A15")) === 12300);
check("Zahlungsplan 30/40/30 = 28.440 + 37.920 + 28.440 = 94.800",
  28440 + 37920 + 28440 === 94800 &&
  /28\.440,00/.test(allText(art("A09"))) && /37\.920,00/.test(allText(art("A09"))));
check("AR1: 28.440 netto → 33.843,60 brutto", Math.round(28440 * 1.19 * 100) === 3384360 && /33\.843,60/.test(allText(art("A17"))));
check("AR2: 37.920 netto → 45.124,80 brutto", Math.round(37920 * 1.19 * 100) === 4512480 && /45\.124,80/.test(allText(art("A21"))));
const srT = allText(art("A24"));
check("SR: 94.800 + 12.300 = 107.100 netto", /107\.100,00/.test(srT) && 94800 + 12300 === 107100);
check("SR: brutto 127.449,00", Math.round(107100 * 1.19 * 100) === 12744900 && /127\.449,00/.test(srT));
check("SR: Rest 48.480,60 = 127.449 − 33.843,60 − 45.124,80",
  Math.round((127449 - 33843.6 - 45124.8) * 100) === 4848060 && /48\.480,60/.test(srT));

console.log("— §§-Zitate (VOB/B) —");
check("A14: § 4 Abs. 3 VOB/B", /§ 4 Abs\. 3 VOB\/B/.test(allText(art("A14"))));
check("A15: § 2 Abs. 6 VOB/B", /§ 2 Abs\. 6 VOB\/B/.test(allText(art("A15"))));
check("A09: § 16 + § 17 VOB/B", /§ 16/.test(allText(art("A09"))) && /§ 17 VOB\/B/.test(allText(art("A09"))));
check("A17/A21: § 16 Abs. 1", /§ 16 Abs\. 1/.test(allText(art("A17"))) && /§ 16 Abs\. 1/.test(allText(art("A21"))));
check("A18: § 6 (Behinderung)", /§ 6 Abs\. 1 VOB\/B/.test(allText(art("A18"))));
check("A23: § 12 Abs. 4 + § 13 Abs. 4 (4 Jahre)", /§ 12 Abs\. 4 VOB\/B/.test(allText(art("A23"))) && /4 Jahren gemäß § 13 Abs\. 4/.test(allText(art("A23"))));
check("A24: § 16 Abs. 3 (Fälligkeit)", /§ 16 Abs\. 3/.test(allText(art("A24"))));
check("A19: DIN 18040-1 (≥ 90 cm)", /DIN 18040-1/.test(allText(art("A19"))) && /90 cm/.test(allText(art("A19"))));
check("A13/A14: DIN VDE 0100", /VDE 0100/.test(allText(art("A13"))) && /VDE 0100/.test(allText(art("A14"))));

console.log("— Baujahr —");
const korpusAll = AKTE.artefakte.map(allText).join("\n") +
  "\n" + AKTE.chips.map(c => [c.frage, c.antwort, (c.quellen || []).map(q => q.snippet).join(" ")].join(" ")).join("\n");
check("Baujahr durchgängig 1972 (kein 1978)", !/1978/.test(korpusAll));
check("1972 belegt in A01/A02/A04/A14", ["A01", "A02", "A04", "A14"].every(id => /1972/.test(allText(art(id)))));

console.log("— Referenzen (Chips / Offene Punkte / Wochen-Brief) —");
const anchorMap = new Map(AKTE.artefakte.map(a => [a.id, anchorsOf(a)]));
let refOk = true;
function checkRef(where, q) {
  if (!q) return;
  const a = anchorMap.get(q.art);
  if (!a) { refOk = false; console.log("    !", where, "unbekanntes Artefakt", q.art); return; }
  if (q.anchor && !a.has(q.anchor)) { refOk = false; console.log("    !", where, q.art, "fehlender Anker", q.anchor); }
}
AKTE.chips.forEach(c => (c.quellen || []).forEach(q => checkRef("Chip " + c.id, q)));
AKTE.offenePunkte.forEach((p, i) => checkRef("Offener Punkt " + (i + 1), p.quelle));
["passiert", "ansteht", "wartet"].forEach(k => AKTE.wochenbrief[k].forEach((e, i) => checkRef("Wochenbrief." + k + "[" + i + "]", e.quelle)));
check("alle Quellen-Referenzen (Artefakt + Anker) existieren", refOk);
check("5 Chips, Chip 5 = unbekannt ohne Quellen", AKTE.chips.length === 5 && AKTE.chips[4].unbekannt === true && AKTE.chips[4].quellen.length === 0);
check("Chip 5 antwortet „Dazu steht nichts in der Akte“", /Dazu steht nichts in der Akte/.test(AKTE.chips[4].antwort));
const allAnchors = [];
anchorMap.forEach(set => set.forEach(x => allAnchors.push(x)));
check("Anker global eindeutig", new Set(allAnchors).size === allAnchors.length);
check("korpusText() > 8.000 Zeichen", AKTE.korpusText().length > 8000, String(AKTE.korpusText().length));

console.log(fail === 0 ? "\nKONSISTENZ OK" : "\nFEHLER: " + fail);
process.exit(fail === 0 ? 0 : 1);
