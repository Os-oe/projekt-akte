/* /api/ask — Freitext-Frage an die fiktive Projektakte, EIN Gemini-Flash-Call.
 *
 * Kernregel (Halluzinations-Lektion): NUR aus dem Korpus antworten, Quellen-IDs
 * (A01–A24) zitieren — sonst unbekannt:true → „Dazu steht nichts in der Akte."
 *
 * Schutzschicht (CONCEPT §4, erprobt im Angebots-Blitz):
 *  - Origin/Referer-Lock auf eigene Domains (sonst 403)
 *  - Caps: 30/Tag global + 5/IP (In-Memory pro Function-Instanz — dokumentierter
 *    Kompromiss; der Gemini-Key hat zusätzlich ein niedriges Quota als zweite Leine)
 *  - Frage max. 240 Zeichen; nichts wird gespeichert
 *  - Frontend fällt bei Cap/Fehler graceful auf die kuratierten Frage-Chips zurück
 *
 * Gemini-Falle: Request-Felder camelCase (inlineData/responseMimeType) —
 * snake_case wird stillschweigend ignoriert.
 */

const AKTE = require("../assets/js/data.js");

const ALLOWED_HOSTS = [
  "projekt-akte.demo.osai.solutions",
  "localhost",
  "127.0.0.1"
];
const VERCEL_RE = /^projekt-akte[a-z0-9-]*\.vercel\.app$/;

const MODELS = ["gemini-3.5-flash", "gemini-2.5-flash"]; // Fallback-Kette
const MAX_FRAGE = 240;
const DAILY_CAP = Number(process.env.PA_DAILY_CAP || 30);
const IP_CAP = Number(process.env.PA_IP_CAP || 5);

const state = { day: "", count: 0, perIp: new Map() };

const GUELTIGE_IDS = new Set(AKTE.artefakte.map(a => a.id));

const PROMPT_KOPF = `Du bist das Projektgedächtnis der Bauakte "Praxisumbau Dr. Hartmann" (Weber Ausbau GmbH, fiktives Demoprojekt).
Du beantwortest Fragen AUSSCHLIESSLICH aus der unten stehenden Akte (24 Dokumente, A01-A24).

EISERNE REGELN:
1. Antworte NUR mit Informationen, die wörtlich oder sinngemäß in der Akte stehen. NIEMALS etwas erfinden, schätzen oder aus Allgemeinwissen ergänzen.
2. Jede Antwort nennt ihre Belege: Feld "quellen" = Liste der Dokument-IDs (z. B. ["A14","A13"]), maximal 3, nach Relevanz sortiert.
3. Steht die Antwort NICHT in der Akte, setze "unbekannt": true, "quellen": [] und beginne die Antwort mit "Dazu steht nichts in der Akte." (gern + 1 Satz, was stattdessen dokumentiert ist).
4. Antworte auf Deutsch, 1-4 Sätze, konkret mit Daten und Beträgen aus der Akte. Sieze.
5. Bei Fragen ohne Bezug zum Projekt (Smalltalk, Politik, andere Themen): "unbekannt": true und freundlich erklären, dass diese Akte nur das Bauprojekt kennt.

DIE AKTE:
`;

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    antwort: { type: "STRING" },
    quellen: { type: "ARRAY", items: { type: "STRING" } },
    unbekannt: { type: "BOOLEAN" }
  },
  required: ["antwort", "quellen", "unbekannt"]
};

function hostOf(value) {
  try { return new URL(value).hostname; } catch (e) { return ""; }
}
function originAllowed(req) {
  const src = req.headers.origin || req.headers.referer || "";
  const host = hostOf(src);
  return ALLOWED_HOSTS.includes(host) || VERCEL_RE.test(host);
}
function capExceeded(req) {
  const today = new Date().toISOString().slice(0, 10);
  if (state.day !== today) { state.day = today; state.count = 0; state.perIp.clear(); }
  const ip = (req.headers["x-forwarded-for"] || "?").split(",")[0].trim();
  const ipCount = state.perIp.get(ip) || 0;
  if (state.count >= DAILY_CAP || ipCount >= IP_CAP) return true;
  state.count += 1;
  state.perIp.set(ip, ipCount + 1);
  return false;
}

async function callGemini(apiKey, model, frage) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const body = {
    contents: [{ parts: [{ text: PROMPT_KOPF + AKTE.korpusText() + "\n\nFRAGE: " + frage }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.2
    }
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    const err = new Error(`Gemini ${model} HTTP ${res.status}: ${errText.slice(0, 300)}`);
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini: leere Antwort");
  return JSON.parse(text);
}

function bereinige(a) {
  if (!a || typeof a !== "object" || typeof a.antwort !== "string" || !a.antwort.trim()) return null;
  const quellen = Array.isArray(a.quellen)
    ? a.quellen.map(q => String(q).toUpperCase().trim()).filter(q => GUELTIGE_IDS.has(q)).slice(0, 3)
    : [];
  const unbekannt = !!a.unbekannt || quellen.length === 0;
  // Eiserne Regel serverseitig nachgezogen: keine Quelle → ehrliche Grenze statt Behauptung.
  if (unbekannt && !/Dazu steht nichts in der Akte|liegt .*nichts vor|kennt nur/i.test(a.antwort)) {
    return { antwort: "Dazu steht nichts in der Akte.", quellen: [], unbekannt: true };
  }
  return { antwort: a.antwort.trim().slice(0, 900), quellen: unbekannt ? [] : quellen, unbekannt };
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Nur POST" });
  }
  if (!originAllowed(req)) {
    return res.status(403).json({ ok: false, error: "Zugriff nur über die Demo-Seite" });
  }

  const apiKey = process.env.GOOGLE_AI_STUDIO;
  if (!apiKey) {
    return res.status(503).json({ ok: false, fallback: true, error: "Die Live-Funktion ist gerade nicht konfiguriert" });
  }

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = null; } }
  const frage = body && typeof body.frage === "string" ? body.frage.trim() : "";

  if (!frage) {
    return res.status(400).json({ ok: false, error: "Keine Frage empfangen" });
  }
  if (frage.length > MAX_FRAGE) {
    return res.status(413).json({ ok: false, fallback: true, error: "Die Frage ist zu lang (max. 240 Zeichen)" });
  }
  if (capExceeded(req)) {
    return res.status(429).json({ ok: false, fallback: true, error: "Das Tages-Limit der Live-Demo ist erreicht" });
  }

  let lastErr = null;
  for (const model of MODELS) {
    try {
      const roh = await callGemini(apiKey, model, frage);
      const antwort = bereinige(roh);
      if (!antwort) throw new Error("Gemini: unbrauchbares Antwort-Objekt");
      return res.status(200).json({ ok: true, antwort });
    } catch (e) {
      lastErr = e;
      if (e.status && e.status < 500 && e.status !== 429 && e.status !== 404) break;
    }
  }
  console.error("ask-error:", lastErr && lastErr.message);
  return res.status(502).json({ ok: false, fallback: true, error: "Die Live-Funktion ist gerade nicht erreichbar" });
};
