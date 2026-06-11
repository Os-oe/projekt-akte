/* Projekt-Akte — fiktiver Korpus „Praxisumbau Dr. Hartmann" (Weber Ausbau GmbH).
 * Single Source of Truth: Browser (window.AKTE) UND /api/ask (module.exports).
 * Alle Personen, Firmen, Adressen und Dokumente sind frei erfunden.
 *
 * Konsistenz-Anker (tools/check-konsistenz.cjs prüft sie):
 *   Angebot v1  103.400 € netto   ·  Angebot v2  94.800 € netto (−8.600)
 *   Nachtrag N1 +12.300 € netto   ·  Schlussrechnung 107.100 € netto (94.800+12.300)
 *   Zahlungsplan 30/40/30 (§16 VOB/B): 28.440 / 37.920 / 28.440
 *   AR1 28.440 (brutto 33.843,60) · AR2 37.920 (brutto 45.124,80)
 *   SR brutto 127.449,00 − 78.968,40 Abschläge = Restforderung 48.480,60
 *   Wochen W1–W10: Mo 02.03.2026 – So 10.05.2026
 */
(function (root) {
  "use strict";

  var AKTE = {

    projekt: {
      name: "Praxisumbau Dr. Hartmann",
      auftragnehmer: "Weber Ausbau GmbH (Generalunternehmer)",
      auftraggeber: "Praxis Dr. med. Julia Hartmann",
      umfang: "Umbau 180 m² Praxisfläche — Empfang, 3 Behandlungsräume, barrierefreies WC",
      vertrag: "VOB/B vereinbart",
      summe_v2: "94.800 € netto",
      zeitraum: "W1–W10 · 02.03.–10.05.2026"
    },

    wochen: [
      { w: 1,  label: "Woche 1",  range: "02.–08.03.2026" },
      { w: 2,  label: "Woche 2",  range: "09.–15.03.2026" },
      { w: 3,  label: "Woche 3",  range: "16.–22.03.2026" },
      { w: 4,  label: "Woche 4",  range: "23.–29.03.2026" },
      { w: 5,  label: "Woche 5",  range: "30.03.–05.04.2026" },
      { w: 6,  label: "Woche 6",  range: "06.–12.04.2026" },
      { w: 7,  label: "Woche 7",  range: "13.–19.04.2026" },
      { w: 8,  label: "Woche 8",  range: "20.–26.04.2026" },
      { w: 9,  label: "Woche 9",  range: "27.04.–03.05.2026" },
      { w: 10, label: "Woche 10", range: "04.–10.05.2026" }
    ],

    artefakte: [

      /* ---------- WOCHE 1 ---------- */
      {
        id: "A01", typ: "mail", icon: "✉️", woche: 1,
        datum: "2026-03-02", datumText: "Mo, 02.03.2026",
        titel: "Anfrage Praxisumbau",
        von: "Dr. med. Julia Hartmann <praxis@dr-hartmann.example>",
        an: "Weber Ausbau GmbH <info@weber-ausbau.example>",
        betreff: "Anfrage: Umbau unserer Praxisräume (ca. 180 m²)",
        body: [
          { t: "Sehr geehrter Herr Weber," },
          { t: "wir planen den Umbau unserer Hausarztpraxis im 1. OG, Lindenplatz 12 in Ludwigsburg — insgesamt ca. 180 m². Konkret: neuer Empfangsbereich, drei Behandlungsräume, ein barrierefreies Patienten-WC, neue Böden und Anstrich.", anchor: "a01-umfang" },
          { t: "Das Gebäude ist ein Altbau (Baujahr 1978). Wichtig wäre uns ein Start ab Mitte/Ende März, da wir den Praxisbetrieb in dieser Zeit in unsere Zweigstelle verlagern.", anchor: "a01-baujahr" },
          { t: "Könnten Sie zeitnah zu einem Ortstermin kommen und uns ein Angebot erstellen?" },
          { t: "Mit freundlichen Grüßen\nDr. med. Julia Hartmann" }
        ]
      },
      {
        id: "A02", typ: "notiz", icon: "📝", woche: 1,
        datum: "2026-03-05", datumText: "Do, 05.03.2026",
        titel: "Ortstermin-Notiz: Verdacht alte Elektrik",
        meta: "Notiz T. Weber · Ortstermin Lindenplatz 12, 14:00–15:30 Uhr",
        body: [
          { t: "Begehung mit Dr. Hartmann. Fläche bestätigt: ca. 180 m², 1. OG, Aufzug vorhanden. Empfang + 4 Räume + 2 WCs, davon 1 zum barrierefreien WC umbauen." },
          { t: "ACHTUNG: Unterverteilung sieht original aus (Bj. 1978, Schraubsicherungen, kein FI). Verdacht auf Aluminium-Verkabelung — bei Altbauten dieser Zeit üblich. Vor Angebotsabgabe nicht zu öffnen, Wände verkleidet. Risiko im Angebot als Hinweis aufnehmen, Befund erst nach Demontage möglich.", anchor: "a02-elektrik" },
          { t: "Maße aufgenommen, Fotos gemacht. Grundriss fehlt noch — Frau Dr. Hartmann reicht ihn nach." },
          { t: "Estrich in Raum 2 klingt teilweise hohl → einplanen: Ausgleichsmasse. Fenster bleiben." }
        ]
      },
      {
        id: "A03", typ: "mail", icon: "✉️", woche: 1,
        datum: "2026-03-06", datumText: "Fr, 06.03.2026",
        titel: "Grundriss-Nachreichung",
        von: "Dr. med. Julia Hartmann <praxis@dr-hartmann.example>",
        an: "Thomas Weber <t.weber@weber-ausbau.example>",
        betreff: "AW: Ortstermin — Grundriss + Raumliste",
        body: [
          { t: "Sehr geehrter Herr Weber," },
          { t: "anbei wie besprochen der Grundriss (Bestandsplan 1:100 vom Architekturbüro, Stand 2019) sowie die Raumliste mit den gewünschten Nutzungen.", anchor: "a03-anlagen" },
          { t: "Anlagen: Grundriss_1OG_Bestand.pdf · Raumliste_Praxis.xlsx" },
          { t: "Beste Grüße, Julia Hartmann" }
        ]
      },

      /* ---------- WOCHE 2 ---------- */
      {
        id: "A04", typ: "dokument", icon: "📄", woche: 2,
        datum: "2026-03-10", datumText: "Di, 10.03.2026",
        titel: "Angebot v1 — 103.400 € netto",
        meta: "Angebot Nr. AN-2026-041 · Weber Ausbau GmbH",
        kopf: "brief",
        betreff: "Angebot Nr. AN-2026-041 — Umbau Praxisräume Dr. Hartmann, Lindenplatz 12, Ludwigsburg",
        body: [
          { t: "Sehr geehrte Frau Dr. Hartmann, für die Umbauarbeiten Ihrer Praxisräume (ca. 180 m²) bieten wir Ihnen gemäß Ortstermin vom 05.03.2026 wie folgt an:" },
          { table: {
              cols: ["Pos.", "Leistung", "netto"],
              rows: [
                ["1", "Baustelleneinrichtung, Demontage- und Entsorgungsarbeiten", "7.400,00 €"],
                ["2", "Trockenbauarbeiten (Wände, Decken, Schallschutz Behandlungsräume)", "21.800,00 €"],
                ["3", "Elektroinstallation Praxis-Standard inkl. Netzwerkverkabelung", "18.900,00 €"],
                ["4", "Sanitärinstallation inkl. barrierefreiem Patienten-WC", "14.200,00 €"],
                ["5", "Anpassung Heizung / Lüftung", "6.300,00 €"],
                ["6", "Malerarbeiten, Oberflächengüte Q3", "9.800,00 €"],
                ["7", "Bodenbelagsarbeiten: Eiche-Parkett inkl. Ausgleichsmasse", "12.600,00 €"],
                ["8", "Innentüren (Stiltüren mit Blockzargen) inkl. Schreinerarbeiten", "9.100,00 €"],
                ["9", "Planung, Bauleitung, Koordination der Gewerke", "3.300,00 €"]
              ],
              foot: [["", "Angebotssumme netto", "103.400,00 €"], ["", "zzgl. 19 % USt.", "19.646,00 €"], ["", "Angebotssumme brutto", "123.046,00 €"]],
              anchorFoot: "a04-summe"
          } },
          { t: "Hinweis: Der Zustand der vorhandenen Elektroinstallation (Bj. 1978) ist ohne Öffnung der Wände nicht abschließend beurteilbar. Sollte sich nach Demontage ein nicht regelkonformer Bestand zeigen, sind die erforderlichen Mehrleistungen nicht Bestandteil dieses Angebots und werden als Nachtrag angeboten.", anchor: "a04-vorbehalt" },
          { t: "Ausführungsgrundlage: VOB/B. Bindefrist: 4 Wochen. Bauzeit: ca. 6 Wochen ab Baufreigabe." }
        ]
      },
      {
        id: "A05", typ: "mail", icon: "✉️", woche: 2,
        datum: "2026-03-12", datumText: "Do, 12.03.2026",
        titel: "Rückfragen zum Angebot — Budgetgrenze",
        von: "Dr. med. Julia Hartmann <praxis@dr-hartmann.example>",
        an: "Thomas Weber <t.weber@weber-ausbau.example>",
        betreff: "AW: Angebot AN-2026-041 — Rückfragen",
        body: [
          { t: "Sehr geehrter Herr Weber," },
          { t: "vielen Dank für das ausführliche Angebot. Inhaltlich passt es sehr gut — allerdings liegt unsere Finanzierungszusage der Bank bei rund 95.000 € netto. Gibt es Positionen, bei denen wir ohne Qualitätsverlust sparen können?", anchor: "a05-budget" },
          { t: "Mir kämen die Böden in den Sinn (muss es Parkett sein?) und eventuell die Türen. Das Ausräumen der Möbel könnten wir auch mit dem Praxisteam selbst übernehmen." },
          { t: "Können wir dazu kurz telefonieren?\nBeste Grüße, Julia Hartmann" }
        ]
      },
      {
        id: "A06", typ: "notiz", icon: "📝", woche: 2,
        datum: "2026-03-13", datumText: "Fr, 13.03.2026",
        titel: "Telefonat-Notiz: Nachverhandlung −8.600 €",
        meta: "Notiz T. Weber · Telefonat Dr. Hartmann, 11:20 Uhr, ca. 25 Min.",
        body: [
          { t: "Einigung auf drei Änderungen gegenüber Angebot v1:" },
          { t: "1) Boden: Vinyl-Designbelag statt Eiche-Parkett → −4.300 €  (Pos. 7: 12.600 → 8.300)\n2) Türen: Standard-Innentüren mit Stahlzargen statt Stiltüren → −2.800 €  (Pos. 8: 9.100 → 6.300)\n3) Eigenleistung: Ausräumen/Möbeldemontage durch Praxisteam → −1.500 €  (Pos. 1: 7.400 → 5.900)", anchor: "a06-aenderungen" },
          { t: "Summe Einsparung: 8.600 € → neue Angebotssumme 94.800 € netto. Angebot v2 bis Montag zusagen.", anchor: "a06-summe" },
          { t: "Frau Dr. Hartmann will nach Erhalt v2 direkt beauftragen. Wunsch-Baustart: Mo 23.03." }
        ]
      },

      /* ---------- WOCHE 3 ---------- */
      {
        id: "A07", typ: "dokument", icon: "📄", woche: 3,
        datum: "2026-03-16", datumText: "Mo, 16.03.2026",
        titel: "Angebot v2 — 94.800 € netto",
        meta: "Angebot Nr. AN-2026-041-v2 · Weber Ausbau GmbH",
        kopf: "brief",
        betreff: "Angebot Nr. AN-2026-041-v2 — Umbau Praxisräume (überarbeitete Fassung gem. Telefonat 13.03.)",
        body: [
          { t: "Sehr geehrte Frau Dr. Hartmann, wie telefonisch besprochen erhalten Sie unser überarbeitetes Angebot:" },
          { table: {
              cols: ["Pos.", "Leistung", "netto"],
              rows: [
                ["1", "Baustelleneinrichtung, Demontage/Entsorgung (Ausräumen in Eigenleistung AG)", "5.900,00 €"],
                ["2", "Trockenbauarbeiten (Wände, Decken, Schallschutz Behandlungsräume)", "21.800,00 €"],
                ["3", "Elektroinstallation Praxis-Standard inkl. Netzwerkverkabelung", "18.900,00 €"],
                ["4", "Sanitärinstallation inkl. barrierefreiem Patienten-WC", "14.200,00 €"],
                ["5", "Anpassung Heizung / Lüftung", "6.300,00 €"],
                ["6", "Malerarbeiten, Oberflächengüte Q3", "9.800,00 €"],
                ["7", "Bodenbelagsarbeiten: Vinyl-Designbelag inkl. Ausgleichsmasse", "8.300,00 €"],
                ["8", "Innentüren Standard (Röhrenspan, Stahlzargen) inkl. Montage", "6.300,00 €"],
                ["9", "Planung, Bauleitung, Koordination der Gewerke", "3.300,00 €"]
              ],
              foot: [["", "Angebotssumme netto", "94.800,00 €"], ["", "zzgl. 19 % USt.", "18.012,00 €"], ["", "Angebotssumme brutto", "112.812,00 €"]],
              anchorFoot: "a07-summe"
          } },
          { t: "Der Hinweis zur Elektroinstallation aus Angebot v1 gilt unverändert fort.", anchor: "a07-vorbehalt" },
          { t: "Ausführungsgrundlage: VOB/B. Bauzeit: ca. 6 Wochen ab Baufreigabe, Baubeginn 23.03.2026 möglich." }
        ]
      },
      {
        id: "A08", typ: "dokument", icon: "📄", woche: 3,
        datum: "2026-03-18", datumText: "Mi, 18.03.2026",
        titel: "Auftragserteilung (unterschrieben)",
        meta: "Auftrag · Praxis Dr. Hartmann an Weber Ausbau GmbH",
        kopf: "brief",
        absender: "hartmann",
        betreff: "Auftragserteilung — Umbau Praxisräume gemäß Angebot AN-2026-041-v2",
        body: [
          { t: "Sehr geehrter Herr Weber," },
          { t: "hiermit erteile ich der Weber Ausbau GmbH den Auftrag für den Umbau der Praxisräume Lindenplatz 12, 71634 Ludwigsburg, gemäß Ihrem Angebot Nr. AN-2026-041-v2 vom 16.03.2026 zur Auftragssumme von 94.800,00 € netto.", anchor: "a08-auftrag" },
          { t: "Vertragsgrundlage ist die VOB/B in der bei Vertragsschluss geltenden Fassung. Baubeginn: 23.03.2026.", anchor: "a08-vob" },
          { t: "Mit freundlichen Grüßen\ngez. Dr. med. Julia Hartmann   (Unterschrift liegt vor)" }
        ]
      },
      {
        id: "A09", typ: "dokument", icon: "📄", woche: 3,
        datum: "2026-03-19", datumText: "Do, 19.03.2026",
        titel: "Auftragsbestätigung + Zahlungsplan 30/40/30",
        meta: "AB Nr. AB-2026-027 · Weber Ausbau GmbH",
        kopf: "brief",
        betreff: "Auftragsbestätigung AB-2026-027 — Zahlungsplan gemäß § 16 VOB/B",
        body: [
          { t: "Sehr geehrte Frau Dr. Hartmann, wir bestätigen Ihren Auftrag vom 18.03.2026 (Auftragssumme 94.800,00 € netto) und vereinbaren folgenden Zahlungsplan für Abschlagszahlungen gemäß § 16 Abs. 1 VOB/B:", anchor: "a09-intro" },
          { table: {
              cols: ["Rate", "Fällig nach", "Anteil", "netto"],
              rows: [
                ["1. Abschlag", "Abschluss Demontage + Beginn Rohinstallation", "30 %", "28.440,00 €"],
                ["2. Abschlag", "Abschluss Trockenbau + Rohinstallation Elektro/Sanitär", "40 %", "37.920,00 €"],
                ["Schlusszahlung", "Abnahme und Schlussrechnung (§ 16 Abs. 3 VOB/B)", "30 %", "28.440,00 €"]
              ],
              anchorFoot: "a09-plan"
          } },
          { t: "Sicherheitsleistung: Für Mängelansprüche wird eine Gewährleistungsbürgschaft in Höhe von 5 % der Abrechnungssumme gemäß § 17 VOB/B vereinbart; Stellung nach Abnahme.", anchor: "a09-buergschaft" },
          { t: "Zahlungsziel Abschlagsrechnungen: 21 Kalendertage nach Zugang (§ 16 Abs. 1 Nr. 3 VOB/B)." }
        ]
      },
      {
        id: "A10", typ: "termin", icon: "📅", woche: 3,
        datum: "2026-03-20", datumText: "Fr, 20.03.2026",
        titel: "Bauzeitenplan — 6 Wochen, Abnahme 30.04.",
        meta: "Bauzeitenplan v1 · Weber Ausbau GmbH",
        body: [
          { table: {
              cols: ["KW", "Zeitraum", "Gewerk / Meilenstein"],
              rows: [
                ["KW 13", "23.–27.03.", "Demontage, Entkernung, Schutt"],
                ["KW 14", "30.03.–03.04.", "Rohinstallation Elektro + Sanitär"],
                ["KW 15", "06.–10.04.", "Trockenbau Wände + Decken"],
                ["KW 16", "13.–17.04.", "Trockenbau Fertigstellung, Estrich-Ausgleich"],
                ["KW 17", "20.–24.04.", "Maler, Bodenbelag"],
                ["KW 18", "27.–30.04.", "Türen, Endmontage, Feininstallation — Abnahme Do 30.04.2026"]
              ],
              anchorRows: { 5: "a10-abnahme" }
          } },
          { t: "Bauzeit 6 Wochen ab Baubeginn 23.03.2026. Abnahmetermin (geplant): Donnerstag, 30.04.2026.", anchor: "a10-plan" }
        ]
      },

      /* ---------- WOCHE 4 ---------- */
      {
        id: "A11", typ: "whatsapp", icon: "💬", woche: 4,
        datum: "2026-03-23", datumText: "Mo, 23.03.2026",
        titel: "WhatsApp: Demontage gestartet (Foto)",
        meta: "WhatsApp · Baustellen-Gruppe „Praxis Hartmann“",
        foto: "assets/img/foto-demontage.jpg",
        fotoAlt: "Baustellenfoto: entkernter Empfangsbereich mit Bauschutt",
        chat: [
          { wer: "weber", zeit: "08:42", t: "Guten Morgen Frau Dr. Hartmann, wir haben pünktlich angefangen. Empfang ist schon raus, läuft nach Plan. 👍", anchor: "a11-start" },
          { wer: "weber", zeit: "08:43", foto: true, t: "📷 Foto: Empfangsbereich nach Demontage" },
          { wer: "hartmann", zeit: "09:10", t: "Super, danke für das Foto! Sieht ja schon ganz anders aus 😊" }
        ]
      },
      {
        id: "A12", typ: "whatsapp", icon: "💬", woche: 4,
        datum: "2026-03-24", datumText: "Di, 24.03.2026",
        titel: "WhatsApp: Leitungsfund beim Stemmen (Foto)",
        meta: "WhatsApp · Baustellen-Gruppe „Praxis Hartmann“",
        foto: "assets/img/foto-leitungsfund.jpg",
        fotoAlt: "Baustellenfoto: aufgestemmte Wand mit freigelegten alten Leitungen",
        chat: [
          { wer: "weber", zeit: "13:55", t: "Frau Dr. Hartmann, beim Stemmen für die neuen Dosen sind wir auf die alten Leitungen gestoßen. Die sehen nicht gut aus — sehr alte Isolierung, Adern wirken nicht wie Kupfer. Wir legen morgen weiter frei und holen unseren Elektromeister dazu.", anchor: "a12-fund" },
          { wer: "weber", zeit: "13:56", foto: true, t: "📷 Foto: freigelegte Altleitungen in der Wandschlitzung" },
          { wer: "hartmann", zeit: "14:30", t: "Oh je. Heißt das Mehrkosten? Bitte halten Sie mich auf dem Laufenden." },
          { wer: "weber", zeit: "14:41", t: "Erst Befund abwarten — morgen wissen wir mehr. Falls es die Alu-Verkabelung ist, melden wir uns offiziell." }
        ]
      },
      {
        id: "A13", typ: "whatsapp", icon: "💬", woche: 4,
        datum: "2026-03-25", datumText: "Mi, 25.03.2026",
        titel: "WhatsApp: Aluverkabelung bestätigt (Foto)",
        meta: "WhatsApp · Baustellen-Gruppe „Praxis Hartmann“",
        foto: "assets/img/foto-alu.jpg",
        fotoAlt: "Baustellenfoto: geöffnete Verteilerdose mit Aluminium-Adern",
        chat: [
          { wer: "weber", zeit: "10:12", t: "Befund ist da: Unser Elektromeister hat die Verteilerdosen geöffnet — es ist durchgehend Aluminium-Verkabelung von 1978. Entspricht nicht den heutigen Anforderungen der DIN VDE 0100, an den Klemmstellen besteht Brandgefahr. An diesen Bestand dürfen wir die neue Praxiselektrik nicht anschließen.", anchor: "a13-befund" },
          { wer: "weber", zeit: "10:13", foto: true, t: "📷 Foto: geöffnete Verteilerdose, Alu-Adern sichtbar" },
          { wer: "weber", zeit: "10:15", t: "Sie bekommen dazu heute noch unsere schriftliche Bedenkenanzeige und bis Anfang nächster Woche ein Nachtragsangebot für die komplette Neuverkabelung." },
          { wer: "hartmann", zeit: "11:02", t: "Verstanden. Dann lieber jetzt richtig machen — ich warte auf Ihr Angebot." }
        ]
      },
      {
        id: "A14", typ: "dokument", icon: "📄", woche: 4,
        datum: "2026-03-26", datumText: "Do, 26.03.2026",
        titel: "Bedenkenanzeige § 4 Abs. 3 VOB/B (schriftlich)",
        meta: "Einschreiben + E-Mail-Vorab · Weber Ausbau GmbH",
        kopf: "brief",
        betreff: "Bedenkenanzeige gemäß § 4 Abs. 3 VOB/B — vorhandene Elektroinstallation, BV Praxisumbau Dr. Hartmann",
        body: [
          { t: "Sehr geehrte Frau Dr. Hartmann," },
          { t: "bei den Demontage- und Stemmarbeiten wurde die vorhandene Elektroinstallation freigelegt. Unser Elektrofachbetrieb hat festgestellt: durchgehende Aluminium-Verkabelung (Baujahr 1978), Unterverteilung ohne Fehlerstromschutz, Klemmstellen mit Übergangswiderständen. Der Bestand entspricht nicht den allgemein anerkannten Regeln der Technik (DIN VDE 0100)." },
          { t: "Hiermit melden wir gemäß § 4 Abs. 3 VOB/B schriftlich Bedenken gegen die vorgesehene Art der Ausführung an, soweit die neue Elektroinstallation an den vorhandenen Bestand angeschlossen werden soll. Bei Anschluss an die Alt-Verkabelung bestehen Brandgefahr und Gefährdung des Praxisbetriebs; eine Gewährleistung für diese Ausführung können wir nicht übernehmen.", anchor: "a14-kern" },
          { t: "Wir empfehlen die vollständige Erneuerung der Elektroinstallation im Umbaubereich und unterbreiten Ihnen hierzu kurzfristig ein Nachtragsangebot gemäß § 2 Abs. 6 VOB/B. Bis zu Ihrer Entscheidung stellen wir die Elektroarbeiten in den betroffenen Bereichen zurück.", anchor: "a14-empfehlung" },
          { t: "Mit freundlichen Grüßen\nThomas Weber, Geschäftsführer" }
        ]
      },

      /* ---------- WOCHE 5 ---------- */
      {
        id: "A15", typ: "dokument", icon: "📄", woche: 5,
        datum: "2026-03-30", datumText: "Mo, 30.03.2026",
        titel: "Nachtragsangebot N1 — +12.300 € netto",
        meta: "Nachtrag N1 zu AN-2026-041-v2 · § 2 Abs. 6 VOB/B",
        kopf: "brief",
        betreff: "Nachtragsangebot N1 gemäß § 2 Abs. 6 VOB/B — vollständige Erneuerung der Elektroinstallation",
        body: [
          { t: "Sehr geehrte Frau Dr. Hartmann, auf Grundlage unserer Bedenkenanzeige vom 26.03.2026 bieten wir die vollständige Erneuerung der Elektroinstallation im Umbaubereich wie folgt an:" },
          { table: {
              cols: ["Pos.", "Leistung", "netto"],
              rows: [
                ["N1.1", "Demontage und Entsorgung der Altverkabelung (Aluminium) im Umbaubereich", "2.100,00 €"],
                ["N1.2", "Neuverlegung Kupferleitungen NYM-J, ca. 480 m, inkl. Dosen und Klemmstellen", "6.400,00 €"],
                ["N1.3", "Unterverteilung neu inkl. FI/LS-Schutzschaltern und Dokumentation", "2.600,00 €"],
                ["N1.4", "Zusätzliche Stemm- und Schließarbeiten über das beauftragte Maß hinaus", "1.200,00 €"]
              ],
              foot: [["", "Nachtragssumme N1 netto", "12.300,00 €"], ["", "zzgl. 19 % USt.", "2.337,00 €"], ["", "Nachtragssumme N1 brutto", "14.637,00 €"]],
              anchorFoot: "a15-summe",
              anchorRows: { 3: "a15-stemm" }
          } },
          { t: "Hinweis gemäß § 2 Abs. 6 VOB/B: Der Anspruch auf besondere Vergütung wurde dem Grunde nach vor Beginn der Ausführung angekündigt (Bedenkenanzeige 26.03.2026). Terminauswirkung: voraussichtlich +1 Woche Bauzeit; eine gesonderte Mitteilung folgt.", anchor: "a15-ankuendigung" }
        ]
      },
      {
        id: "A16", typ: "mail", icon: "✉️", woche: 5,
        datum: "2026-04-01", datumText: "Mi, 01.04.2026",
        titel: "Nachtrag N1 beauftragt",
        von: "Dr. med. Julia Hartmann <praxis@dr-hartmann.example>",
        an: "Thomas Weber <t.weber@weber-ausbau.example>",
        betreff: "AW: Nachtragsangebot N1 — Beauftragung",
        body: [
          { t: "Sehr geehrter Herr Weber," },
          { t: "nach Rücksprache mit meiner Bank beauftrage ich hiermit den Nachtrag N1 (vollständige Erneuerung der Elektroinstallation) gemäß Ihrem Nachtragsangebot vom 30.03.2026 zur Summe von 12.300,00 € netto.", anchor: "a16-beauftragung" },
          { t: "Die angekündigte Bauzeitverlängerung von einer Woche habe ich zur Kenntnis genommen — bitte senden Sie mir den angepassten Terminplan zu." },
          { t: "Mit freundlichen Grüßen\nDr. med. Julia Hartmann" }
        ]
      },
      {
        id: "A17", typ: "dokument", icon: "📄", woche: 5,
        datum: "2026-04-03", datumText: "Fr, 03.04.2026",
        titel: "1. Abschlagsrechnung — 28.440 € netto",
        meta: "Rechnung Nr. AR-2026-088 · 1. Abschlag (30 %)",
        kopf: "brief",
        betreff: "1. Abschlagsrechnung Nr. AR-2026-088 gemäß § 16 Abs. 1 VOB/B — BV Praxisumbau Dr. Hartmann",
        body: [
          { t: "Leistungsstand: Demontage und Entkernung abgeschlossen, Rohinstallation Elektro/Sanitär begonnen (Rate 1 gemäß Zahlungsplan AB-2026-027)." },
          { table: {
              cols: ["", ""],
              rows: [
                ["1. Abschlag (30 % der Auftragssumme 94.800,00 €)", "28.440,00 €"],
                ["zzgl. 19 % USt.", "5.403,60 €"]
              ],
              foot: [["Rechnungsbetrag brutto", "33.843,60 €"]],
              anchorFoot: "a17-summe"
          } },
          { t: "Zahlbar innerhalb von 21 Kalendertagen nach Zugang (§ 16 Abs. 1 Nr. 3 VOB/B) auf das unten genannte Konto.", anchor: "a17-ziel" }
        ]
      },

      /* ---------- WOCHE 6 ---------- */
      {
        id: "A18", typ: "mail", icon: "✉️", woche: 6,
        datum: "2026-04-07", datumText: "Di, 07.04.2026",
        titel: "Terminverschiebung +1 Woche — Freigabe Dr. Hartmann",
        von: "Thomas Weber <t.weber@weber-ausbau.example>",
        an: "Dr. med. Julia Hartmann <praxis@dr-hartmann.example>",
        betreff: "Terminverschiebung um eine Woche — neuer Abnahmetermin Fr 08.05.2026",
        body: [
          { t: "Sehr geehrte Frau Dr. Hartmann," },
          { t: "durch die Erneuerung der Elektroinstallation (Nachtrag N1) verschiebt sich der Bauablauf um eine Woche. Die Unterbrechung bis zu Ihrer Nachtragsfreigabe stellt eine Behinderung im Sinne des § 6 Abs. 1 VOB/B dar; wir behalten uns vor, dies förmlich anzuzeigen, gehen aber von einer einvernehmlichen Lösung aus.", anchor: "a18-behinderung" },
          { t: "Neuer Abnahmetermin: Freitag, 08.05.2026 (statt 30.04.2026). Alle übrigen Meilensteine verschieben sich entsprechend. Bitte bestätigen Sie uns die Terminverschiebung kurz." },
          { t: "— Antwort —" },
          { t: "Von: Dr. med. Julia Hartmann · Mi, 08.04.2026, 09:14 Uhr\n„Sehr geehrter Herr Weber, die Terminverschiebung um eine Woche ist hiermit freigegeben — neuer Abnahmetermin 08.05.2026 passt für uns. Die Praxis-Wiedereröffnung planen wir entsprechend auf den 18.05. Mit freundlichen Grüßen, Julia Hartmann“", anchor: "a18-freigabe" }
        ]
      },
      {
        id: "A19", typ: "whatsapp", icon: "💬", woche: 6,
        datum: "2026-04-09", datumText: "Do, 09.04.2026",
        titel: "WhatsApp: Materiallieferung + Maßfrage Tür (Foto)",
        meta: "WhatsApp · Baustellen-Gruppe „Praxis Hartmann“",
        foto: "assets/img/foto-material.jpg",
        fotoAlt: "Baustellenfoto: gestapelte Gipskartonplatten und Trockenbauprofile",
        chat: [
          { wer: "weber", zeit: "07:58", t: "Material für den Trockenbau ist komplett da (Platten, Profile, Dämmung). Wir starten heute mit den Wänden im Behandlungsbereich.", anchor: "a19-material" },
          { wer: "weber", zeit: "07:59", foto: true, t: "📷 Foto: Materiallieferung Trockenbau im Empfangsbereich" },
          { wer: "weber", zeit: "12:31", t: "Frage zur Tür vom Flur zum Empfang: Die Zarge, die der Lieferant vorschlägt, ergäbe 88,5 cm lichte Breite. Reicht Ihnen das?" },
          { wer: "hartmann", zeit: "12:48", t: "Die Tür muss barrierefrei sein — was ist da vorgeschrieben?" },
          { wer: "weber", zeit: "13:05", t: "Für barrierefreie Praxen gilt DIN 18040-1: mindestens 90 cm lichte Durchgangsbreite. 88,5 cm reicht also NICHT — wir bestellen das nächstgrößere Zargenmaß, lichte Breite dann 98,5 cm. Kein Aufpreis, nur 3 Tage Lieferzeit.", anchor: "a19-tuer" },
          { wer: "hartmann", zeit: "13:12", t: "Perfekt, danke fürs Mitdenken! 👍" }
        ]
      },

      /* ---------- WOCHE 7 ---------- */
      {
        id: "A20", typ: "mail", icon: "✉️", woche: 7,
        datum: "2026-04-13", datumText: "Mo, 13.04.2026",
        titel: "Brandschutz: T30-Tür zum Treppenhaus",
        von: "Thomas Weber <t.weber@weber-ausbau.example>",
        an: "Dr. med. Julia Hartmann <praxis@dr-hartmann.example>",
        betreff: "Brandschutz — Tür zum Treppenhaus muss T30 ausgeführt werden",
        body: [
          { t: "Sehr geehrte Frau Dr. Hartmann," },
          { t: "bei der Schlussabstimmung mit dem Brandschutzplaner des Gebäudeeigentümers wurde festgelegt: Die Tür von Ihrer Praxis zum Treppenhaus liegt im ersten Rettungsweg und muss als feuerhemmende Tür T30-RS (mit Rauchschutz und Obentürschließer) ausgeführt werden. Die bisher vorgesehene Standardtür ist dort nicht zulässig.", anchor: "a20-t30" },
          { t: "Die Mehrkosten trägt laut Eigentümer die Hausverwaltung (Bestandsschutz-Thema des Gebäudes) — für Sie entstehen keine Zusatzkosten. Wir koordinieren die Bestellung; der Fluchtweg bleibt während der Bauzeit jederzeit frei.", anchor: "a20-kosten" },
          { t: "Mit freundlichen Grüßen\nThomas Weber" }
        ]
      },

      /* ---------- WOCHE 8 ---------- */
      {
        id: "A21", typ: "dokument", icon: "📄", woche: 8,
        datum: "2026-04-20", datumText: "Mo, 20.04.2026",
        titel: "2. Abschlagsrechnung — 37.920 € netto",
        meta: "Rechnung Nr. AR-2026-101 · 2. Abschlag (40 %)",
        kopf: "brief",
        betreff: "2. Abschlagsrechnung Nr. AR-2026-101 gemäß § 16 Abs. 1 VOB/B — BV Praxisumbau Dr. Hartmann",
        body: [
          { t: "Leistungsstand: Trockenbau abgeschlossen, Rohinstallation Elektro (inkl. Nachtrag N1) und Sanitär abgeschlossen (Rate 2 gemäß Zahlungsplan AB-2026-027)." },
          { table: {
              cols: ["", ""],
              rows: [
                ["2. Abschlag (40 % der Auftragssumme 94.800,00 €)", "37.920,00 €"],
                ["zzgl. 19 % USt.", "7.204,80 €"]
              ],
              foot: [["Rechnungsbetrag brutto", "45.124,80 €"]],
              anchorFoot: "a21-summe"
          } },
          { t: "Zahlbar innerhalb von 21 Kalendertagen nach Zugang (§ 16 Abs. 1 Nr. 3 VOB/B). Die Abrechnung des Nachtrags N1 erfolgt mit der Schlussrechnung." }
        ]
      },

      /* ---------- WOCHE 9 ---------- */
      {
        id: "A22", typ: "notiz", icon: "📝", woche: 9,
        datum: "2026-04-29", datumText: "Mi, 29.04.2026",
        titel: "Mängelliste Vorbegehung — 3 Punkte",
        meta: "Notiz T. Weber · Vorbegehung mit Dr. Hartmann, 16:00 Uhr",
        body: [
          { t: "Gemeinsame Vorbegehung vor Abnahme. Gesamteindruck sehr gut, drei Punkte aufgenommen:" },
          { t: "M1 — Silikonfuge am barrierefreien WC unsauber gezogen (Waschtisch-Anschluss) → Fuge erneuern.\nM2 — Kratzer im Türblatt Behandlungsraum 2 (vermutlich Transport) → Türblatt tauschen.\nM3 — Doppelsteckdose am Empfangstresen ohne Funktion → Anschluss in UV prüfen.", anchor: "a22-liste" },
          { t: "Alle drei Punkte bis bzw. kurz nach Abnahme beheben; Rest sieht abnahmefähig aus. Abnahmetermin bleibt Fr 08.05." }
        ]
      },

      /* ---------- WOCHE 10 ---------- */
      {
        id: "A23", typ: "dokument", icon: "📄", woche: 10,
        datum: "2026-05-08", datumText: "Fr, 08.05.2026",
        titel: "Abnahmeprotokoll § 12 Abs. 4 VOB/B",
        meta: "Förmliche Abnahme · beide Parteien anwesend",
        kopf: "brief",
        betreff: "Abnahmeprotokoll — förmliche Abnahme gemäß § 12 Abs. 4 VOB/B, BV Praxisumbau Dr. Hartmann",
        foto: "assets/img/foto-fertig.jpg",
        fotoAlt: "Foto-Anlage: fertiggestellter Empfangsbereich der Praxis",
        body: [
          { t: "Datum: 08.05.2026, 10:00 Uhr · Anwesend: Dr. med. Julia Hartmann (AG), Thomas Weber (AN). Die Leistung wird förmlich abgenommen. Die Abnahme erfolgt unter Vorbehalt der nachstehenden Restpunkte:" },
          { t: "R1 — Silikonfuge barrierefreies WC: erneuert am 05.05., abgenommen. ✓ erledigt\nR2 — Türblatt Behandlungsraum 2: Austausch erfolgt, abgenommen. ✓ erledigt\nR3 — Doppelsteckdose Empfangstresen: weiterhin ohne Funktion. OFFEN — Nachbesserung bis 22.05.2026 zugesagt.", anchor: "a23-restpunkte" },
          { t: "Gewährleistung: Es gilt die Verjährungsfrist für Mängelansprüche von 4 Jahren gemäß § 13 Abs. 4 Nr. 1 VOB/B, beginnend mit dem heutigen Tag (bis 08.05.2030).", anchor: "a23-gewaehrleistung" },
          { t: "Bemerkungen: AG kündigt die Prüfung der Position N1.4 (zusätzliche Stemm- und Schließarbeiten, 1.200,00 €) im Rahmen der Schlussrechnungsprüfung an. Die Gewährleistungsbürgschaft (5 %, § 17 VOB/B) ist noch nicht gestellt. Anlage: Foto Empfangsbereich (fertiggestellt).", anchor: "a23-bemerkungen" },
          { t: "Unterschriften: gez. Dr. J. Hartmann · gez. T. Weber" }
        ]
      },
      {
        id: "A24", typ: "dokument", icon: "📄", woche: 10,
        datum: "2026-05-08", datumText: "Fr, 08.05.2026",
        titel: "Schlussrechnung — 107.100 € netto",
        meta: "Rechnung Nr. SR-2026-114 · Schlussrechnung",
        kopf: "brief",
        betreff: "Schlussrechnung Nr. SR-2026-114 — BV Praxisumbau Dr. Hartmann (übergeben zur Abnahme)",
        body: [
          { table: {
              cols: ["", ""],
              rows: [
                ["Hauptauftrag gemäß Angebot AN-2026-041-v2", "94.800,00 €"],
                ["Nachtrag N1 (Erneuerung Elektroinstallation, beauftragt 01.04.2026)", "12.300,00 €"]
              ],
              foot: [
                ["Abrechnungssumme netto", "107.100,00 €"],
                ["zzgl. 19 % USt.", "20.349,00 €"],
                ["Abrechnungssumme brutto", "127.449,00 €"],
                ["abzügl. 1. Abschlagszahlung (AR-2026-088, brutto)", "−33.843,60 €"],
                ["abzügl. 2. Abschlagszahlung (AR-2026-101, brutto)", "−45.124,80 €"],
                ["Restforderung brutto", "48.480,60 €"]
              ],
              anchorFoot: "a24-summe"
          } },
          { t: "Fälligkeit: 30 Tage nach Zugang der prüfbaren Schlussrechnung gemäß § 16 Abs. 3 Nr. 1 VOB/B.", anchor: "a24-faelligkeit" },
          { t: "Wir bedanken uns für die vertrauensvolle Zusammenarbeit und stehen für die Schlussrechnungsprüfung gern zur Verfügung." }
        ]
      }
    ],

    /* ---------- Die 5 kuratierten Frage-Chips ---------- */
    chips: [
      {
        id: "c1",
        frage: "Haben wir die Bedenken zur Elektrik schriftlich angezeigt?",
        antwort: "Ja — und zwar rechtzeitig und formgerecht. Am 26.03.2026 ging die schriftliche Bedenkenanzeige nach § 4 Abs. 3 VOB/B an Dr. Hartmann raus (Einschreiben + E-Mail-Vorab), einen Tag nachdem der Elektromeister die Aluverkabelung von 1978 bestätigt hatte. Damit ist die Haftungsfrage für die Alt-Elektrik sauber dokumentiert.",
        quellen: [
          { art: "A14", anchor: "a14-kern", snippet: "Hiermit melden wir gemäß § 4 Abs. 3 VOB/B schriftlich Bedenken gegen die vorgesehene Art der Ausführung an …" },
          { art: "A13", anchor: "a13-befund", snippet: "… durchgehend Aluminium-Verkabelung von 1978. Entspricht nicht den heutigen Anforderungen der DIN VDE 0100 …" }
        ],
        unbekannt: false
      },
      {
        id: "c2",
        frage: "Was war im Nachtrag N1 — und ist er beauftragt?",
        antwort: "Nachtrag N1 umfasst die vollständige Erneuerung der Elektroinstallation: Demontage der Alu-Altverkabelung, ca. 480 m neue Kupferleitungen, neue Unterverteilung mit FI/LS sowie zusätzliche Stemmarbeiten — zusammen 12.300 € netto (§ 2 Abs. 6 VOB/B). Beauftragt ist er: Dr. Hartmann hat am 01.04.2026 per Mail schriftlich beauftragt.",
        quellen: [
          { art: "A15", anchor: "a15-summe", snippet: "Nachtragssumme N1 netto: 12.300,00 €" },
          { art: "A16", anchor: "a16-beauftragung", snippet: "… beauftrage ich hiermit den Nachtrag N1 … zur Summe von 12.300,00 € netto." }
        ],
        unbekannt: false
      },
      {
        id: "c3",
        frage: "Welche Restpunkte sind im Abnahmeprotokoll vorbehalten?",
        antwort: "Im Abnahmeprotokoll vom 08.05.2026 sind drei Restpunkte dokumentiert: Die Silikonfuge im barrierefreien WC und das zerkratzte Türblatt in Behandlungsraum 2 waren zur Abnahme bereits behoben. Offen ist nur noch die Doppelsteckdose am Empfangstresen — Nachbesserung bis 22.05.2026 zugesagt. Die Punkte stammen aus der Vorbegehung vom 29.04.",
        quellen: [
          { art: "A23", anchor: "a23-restpunkte", snippet: "R3 — Doppelsteckdose Empfangstresen: weiterhin ohne Funktion. OFFEN — Nachbesserung bis 22.05.2026 zugesagt." },
          { art: "A22", anchor: "a22-liste", snippet: "M1 — Silikonfuge … M2 — Kratzer im Türblatt … M3 — Doppelsteckdose am Empfangstresen ohne Funktion …" }
        ],
        unbekannt: false
      },
      {
        id: "c4",
        frage: "Wer hat die Terminverschiebung freigegeben?",
        antwort: "Dr. Hartmann selbst — schriftlich per Mail am 08.04.2026: „Die Terminverschiebung um eine Woche ist hiermit freigegeben — neuer Abnahmetermin 08.05.2026 passt für uns.“ Anlass war die Bauzeitverlängerung durch Nachtrag N1; eine Behinderung nach § 6 VOB/B war in der Mail vom 07.04. bereits angedeutet.",
        quellen: [
          { art: "A18", anchor: "a18-freigabe", snippet: "„… die Terminverschiebung um eine Woche ist hiermit freigegeben — neuer Abnahmetermin 08.05.2026 passt für uns.“" }
        ],
        unbekannt: false
      },
      {
        id: "c5",
        frage: "Wurde die Schlussrechnung schon bezahlt?",
        antwort: "Dazu steht nichts in der Akte. Die Schlussrechnung vom 08.05.2026 über 107.100 € netto ist dokumentiert — ein Zahlungseingang ist es nicht. Ein Projektgedächtnis behauptet nichts, was es nicht belegen kann.",
        quellen: [],
        unbekannt: true
      }
    ],

    /* ---------- Offene Punkte (Stand nach Abnahme, 08.05.2026) ---------- */
    offenePunkte: [
      {
        titel: "Doppelsteckdose Empfangstresen ohne Funktion",
        detail: "Restpunkt R3 aus der Abnahme — Nachbesserung bis 22.05.2026 zugesagt. Frist läuft.",
        status: "frist",
        quelle: { art: "A23", anchor: "a23-restpunkte" }
      },
      {
        titel: "Schlussrechnung in Prüfung — Stemmposition strittig",
        detail: "Dr. Hartmann hat die Prüfung der Position N1.4 (zusätzliche Stemm- und Schließarbeiten, 1.200 €) angekündigt. Restforderung: 48.480,60 € brutto, fällig 30 Tage nach Zugang (§ 16 Abs. 3 VOB/B).",
        status: "pruefung",
        quelle: { art: "A23", anchor: "a23-bemerkungen" }
      },
      {
        titel: "Gewährleistungsbürgschaft 5 % noch nicht gestellt",
        detail: "Laut Auftragsbestätigung nach Abnahme zu stellen (§ 17 VOB/B, 5 % der Abrechnungssumme) — im Abnahmeprotokoll als offen vermerkt.",
        status: "offen",
        quelle: { art: "A09", anchor: "a09-buergschaft" }
      }
    ],

    /* ---------- Wochen-Brief (Beispiel Woche 6) ---------- */
    wochenbrief: {
      woche: 6,
      range: "06.–12.04.2026",
      titel: "Wochen-Brief · Praxisumbau Dr. Hartmann · Woche 6",
      passiert: [
        { t: "Terminverschiebung um eine Woche von Dr. Hartmann freigegeben — neuer Abnahmetermin Fr, 08.05.2026.", quelle: { art: "A18", anchor: "a18-freigabe" } },
        { t: "Trockenbau-Material vollständig geliefert, Wände im Behandlungsbereich gestartet.", quelle: { art: "A19", anchor: "a19-material" } },
        { t: "Türmaß Empfang geklärt: 88,5 cm reichen nicht — barrierefrei braucht ≥ 90 cm (DIN 18040-1), größeres Zargenmaß bestellt.", quelle: { art: "A19", anchor: "a19-tuer" } }
      ],
      ansteht: [
        { t: "Trockenbau Fertigstellung + Estrich-Ausgleich (verschobene KW 16/17).", quelle: { art: "A10", anchor: "a10-plan" } },
        { t: "Elektro-Neuverkabelung gemäß Nachtrag N1 läuft parallel weiter.", quelle: { art: "A16", anchor: "a16-beauftragung" } }
      ],
      wartet: [
        { t: "Weber Ausbau wartet auf Zahlung der 1. Abschlagsrechnung (33.843,60 € brutto, gestellt 03.04., Ziel 21 Tage).", quelle: { art: "A17", anchor: "a17-summe" } },
        { t: "Dr. Hartmann wartet auf den angepassten Terminplan.", quelle: { art: "A16", anchor: "a16-beauftragung" } }
      ]
    }
  };

  /* Plaintext-Ableitung eines Artefakts — für /api/ask (Korpus-Kontext). */
  function artefaktText(a) {
    var lines = [a.id + " · " + a.titel + " · " + a.datumText + " (Woche " + a.woche + ")"];
    if (a.von) lines.push("Von: " + a.von + " — An: " + a.an);
    if (a.betreff) lines.push("Betreff: " + a.betreff);
    if (a.meta) lines.push(a.meta);
    (a.body || []).forEach(function (seg) {
      if (seg.t) lines.push(seg.t);
      if (seg.table) {
        seg.table.rows.forEach(function (r) { lines.push(r.join(" | ")); });
        (seg.table.foot || []).forEach(function (r) { lines.push(r.join(" | ")); });
      }
    });
    (a.chat || []).forEach(function (m) {
      lines.push((m.wer === "weber" ? "Weber Ausbau" : "Dr. Hartmann") + " (" + m.zeit + "): " + m.t);
    });
    if (a.foto) lines.push("[Foto-Anlage: " + (a.fotoAlt || "Baustellenfoto") + "]");
    return lines.join("\n");
  }

  AKTE.korpusText = function () {
    return AKTE.artefakte.map(artefaktText).join("\n\n---\n\n");
  };

  if (typeof module !== "undefined" && module.exports) module.exports = AKTE;
  if (root) root.AKTE = AKTE;

})(typeof window !== "undefined" ? window : null);
