/* Projekt-Akte — App: Timeline, Filter, Q&A-Choreografie (Tippen → Quellen-Chips →
 * Scroll + Passage-Glow), Auto-Demo, Bottom-Sheet (mobil), Freitext via /api/ask. */
(function () {
  "use strict";

  var A = window.AKTE;
  var FAST = /[?&]fast=1/.test(location.search);
  var NOAUTO = /[?&]noauto=1/.test(location.search);
  var tl = document.getElementById("timeline");
  var verlauf = document.getElementById("chat-verlauf");
  var chipsEl = document.getElementById("frage-chips");
  var filterEl = document.getElementById("filter-leiste");
  var form = document.getElementById("eingabe-form");
  var feld = document.getElementById("eingabe-feld");
  var senden = document.getElementById("eingabe-senden");
  var sheet = document.getElementById("sheet");
  var sheetBg = document.getElementById("sheet-hintergrund");

  /* Test-/Debug-Haken */
  var PA = window.__pa = { autoDemoRuns: 0, busy: false, lastQuellen: [], askChip: askChip, version: 1 };

  function byId(id) { return A.artefakte.find(function (a) { return a.id === id; }); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function isMobile() { return window.matchMedia("(max-width: 920px)").matches; }
  function warte(ms) { return new Promise(function (r) { setTimeout(r, FAST ? Math.min(ms, 10) : ms); }); }

  /* ---------- Artefakt-Rendering (Timeline-Karte UND Bottom-Sheet) ---------- */

  function briefkopf(a) {
    if (a.absender === "hartmann") {
      return '<div class="dok-briefkopf"><div class="dok-firma">Praxis Dr. med. Julia Hartmann' +
        '<small>Allgemeinmedizin · Lindenplatz 12 · 71634 Ludwigsburg</small></div><span class="dok-logo h">H</span></div>';
    }
    return '<div class="dok-briefkopf"><div class="dok-firma">Weber Ausbau GmbH' +
      '<small>Generalunternehmer Innenausbau · Gewerbering 14 · 71686 Remseck</small></div><span class="dok-logo">W</span></div>';
  }

  function segHtml(seg) {
    if (seg.t) {
      var inner = esc(seg.t).replace(/\n/g, "<br>");
      return seg.anchor
        ? '<p><span class="passage" data-anchor="' + seg.anchor + '">' + inner + "</span></p>"
        : "<p>" + inner + "</p>";
    }
    if (seg.table) {
      var t = seg.table, html = "";
      var openWrap = t.anchorFoot && !(t.foot && t.foot.length);
      if (openWrap) html += '<div class="passage" data-anchor="' + t.anchorFoot + '">';
      html += "<table><thead><tr>" + t.cols.map(function (c) { return "<th>" + esc(c) + "</th>"; }).join("") + "</tr></thead><tbody>";
      t.rows.forEach(function (r, i) {
        var anchor = (t.anchorRows || {})[i];
        html += "<tr" + (anchor ? ' class="passage" data-anchor="' + anchor + '"' : "") + ">" +
          r.map(function (c) { return "<td>" + esc(c) + "</td>"; }).join("") + "</tr>";
      });
      html += "</tbody>";
      if (t.foot && t.foot.length) {
        html += "<tfoot>";
        t.foot.forEach(function (r, i) {
          var anchor = i === 0 ? t.anchorFoot : null;
          var cells = r.filter(function (c) { return c !== ""; });
          var pad = t.cols.length - cells.length;
          html += "<tr" + (anchor ? ' class="passage" data-anchor="' + anchor + '"' : "") + ">" +
            (pad > 0 ? '<td colspan="' + pad + '"></td>' : "") +
            cells.map(function (c) { return "<td>" + esc(c) + "</td>"; }).join("") + "</tr>";
        });
        html += "</tfoot>";
      }
      html += "</table>";
      if (openWrap) html += "</div>";
      return html;
    }
    return "";
  }

  function fotoImg(a, klasse) {
    return '<img class="' + klasse + '" src="' + a.foto + '" alt="' + esc(a.fotoAlt || "Baustellenfoto") +
      '" loading="lazy" onerror="this.style.display=\'none\'">';
  }

  function artefaktHtml(a) {
    var html = "";
    if (a.typ === "whatsapp") {
      html += '<div class="wa">';
      (a.chat || []).forEach(function (m) {
        var wer = { weber: "Weber Ausbau · Thomas", monteur: "Weber Ausbau · Micha (Elektro)" }[m.wer] || "Dr. Hartmann";
        var inner = m.foto && a.foto ? fotoImg(a, "wa-foto") + '<em style="font-size:10.5px;color:#8a8170">' + esc(m.t) + "</em>"
          : (m.anchor ? '<span class="passage" data-anchor="' + m.anchor + '">' + esc(m.t) + "</span>" : esc(m.t));
        html += '<div class="wa-bubble ' + m.wer + '"><div class="wa-wer">' + wer + "</div>" + inner +
          '<span class="wa-zeit">' + m.zeit + "</span></div>";
      });
      html += "</div>";
    } else if (a.typ === "notiz") {
      html += '<div class="notiz"><div class="notiz-kopf">✎ ' + esc(a.meta || "Notiz") + "</div>" +
        (a.body || []).map(segHtml).join("") + "</div>";
    } else if (a.typ === "mail") {
      html += '<div class="dok"><div class="mail-kopf">' +
        "<div><b>Von:</b> " + esc(a.von) + "</div><div><b>An:</b> " + esc(a.an) + "</div>" +
        "<div><b>Datum:</b> " + esc(a.datumText) + "</div><div><b>Betreff:</b> " + esc(a.betreff) + "</div></div>" +
        (a.body || []).map(segHtml).join("") + "</div>";
    } else { /* dokument / termin → Briefkopf-Optik */
      html += '<div class="dok">' + briefkopf(a) +
        (a.betreff ? '<div class="dok-betreff">' + esc(a.betreff) + "</div>" : "") +
        '<p style="font-size:11px;color:#6b6254;margin:0 0 8px">' + esc(a.meta || "") + " · " + esc(a.datumText) + "</p>" +
        (a.body || []).map(segHtml).join("") +
        (a.foto ? fotoImg(a, "wa-foto") : "") + "</div>";
    }
    return html;
  }

  /* ---------- Timeline ---------- */

  var FILTER = [
    { id: "alle", label: "Alle", test: function () { return true; } },
    { id: "mail", label: "✉️ Mails", test: function (a) { return a.typ === "mail"; } },
    { id: "dokument", label: "📄 Dokumente", test: function (a) { return a.typ === "dokument" || a.typ === "termin"; } },
    { id: "whatsapp", label: "💬 WhatsApp", test: function (a) { return a.typ === "whatsapp"; } },
    { id: "notiz", label: "📝 Notizen", test: function (a) { return a.typ === "notiz"; } },
    { id: "foto", label: "📷 Fotos", test: function (a) { return !!a.foto; } }
  ];
  var aktivFilter = "alle";

  function renderFilter() {
    filterEl.innerHTML = FILTER.map(function (f) {
      return '<button class="filter-chip' + (f.id === aktivFilter ? " aktiv" : "") + '" data-filter="' + f.id + '" role="tab" aria-selected="' + (f.id === aktivFilter) + '">' + f.label + "</button>";
    }).join("");
  }
  filterEl.addEventListener("click", function (e) {
    var b = e.target.closest("[data-filter]");
    if (!b) return;
    setFilter(b.getAttribute("data-filter"));
  });
  function setFilter(id) {
    aktivFilter = id;
    renderFilter();
    var f = FILTER.find(function (x) { return x.id === id; });
    var sichtbarProWoche = {};
    A.artefakte.forEach(function (a) {
      var zeig = f.test(a);
      var el = tl.querySelector('[data-art="' + a.id + '"]');
      el.style.display = zeig ? "" : "none";
      if (zeig) sichtbarProWoche[a.woche] = true;
    });
    A.wochen.forEach(function (w) {
      var kopf = tl.querySelector('[data-woche="' + w.w + '"]');
      if (kopf) kopf.style.display = sichtbarProWoche[w.w] ? "" : "none";
    });
  }

  function renderTimeline() {
    var html = "";
    A.wochen.forEach(function (w) {
      var arts = A.artefakte.filter(function (a) { return a.woche === w.w; });
      if (!arts.length) return;
      html += '<div class="woche-kopf" data-woche="' + w.w + '"><b>' + w.label + "</b> " + w.range + "</div>";
      arts.forEach(function (a) {
        html += '<article class="karte" data-art="' + a.id + '" data-typ="' + a.typ + '">' +
          '<button class="karte-kopf" aria-expanded="false">' +
          '<span class="karte-icon">' + a.icon + "</span>" +
          "<div><div class='karte-titel'>" + esc(a.titel) + "</div>" +
          '<div class="karte-datum">' + esc(a.datumText) + (a.foto ? " · 📷" : "") + "</div></div>" +
          (a.foto ? fotoImg(a, "karte-foto-thumb") : "") +
          '<span class="karte-pfeil">▼</span></button>' +
          '<div class="karte-inhalt">' + artefaktHtml(a) + "</div></article>";
      });
    });
    tl.innerHTML = html;
    document.getElementById("akte-zaehler").textContent = A.artefakte.length + " Dokumente · 10 Wochen · alles fiktiv";
  }
  tl.addEventListener("click", function (e) {
    var kopf = e.target.closest(".karte-kopf");
    if (!kopf) return;
    var karte = kopf.closest(".karte");
    karte.classList.toggle("open");
    kopf.setAttribute("aria-expanded", karte.classList.contains("open"));
  });

  /* ---------- Quellen-Choreografie ---------- */

  var glowTimer = null;
  function zeigeQuelle(q, opts) {
    opts = opts || {};
    var art = byId(q.art);
    if (!art) return;
    if (isMobile()) { openSheet(art, q.anchor); return; }

    var f = FILTER.find(function (x) { return x.id === aktivFilter; });
    if (!f.test(art)) setFilter("alle");

    var karte = tl.querySelector('[data-art="' + q.art + '"]');
    if (!karte) return;
    tl.querySelectorAll(".karte.fokus").forEach(function (k) { k.classList.remove("fokus"); });
    tl.querySelectorAll(".passage-glow").forEach(function (p) { p.classList.remove("passage-glow"); });
    karte.classList.add("open", "fokus");
    karte.querySelector(".karte-kopf").setAttribute("aria-expanded", "true");

    if (opts.pageScroll) karte.scrollIntoView({ behavior: FAST ? "auto" : "smooth", block: "center" });

    requestAnimationFrame(function () {
      var ziel = karte;
      var passage = q.anchor ? karte.querySelector('[data-anchor="' + q.anchor + '"]') : null;
      var delta = (passage || ziel).getBoundingClientRect().top - tl.getBoundingClientRect().top;
      tl.scrollTo({ top: tl.scrollTop + delta - 110, behavior: FAST ? "auto" : "smooth" });
      if (passage) {
        setTimeout(function () { passage.classList.add("passage-glow"); }, FAST ? 0 : 350);
      }
      clearTimeout(glowTimer);
      glowTimer = setTimeout(function () {
        karte.classList.remove("fokus");
        if (passage) passage.classList.remove("passage-glow");
      }, 6500);
    });
  }

  /* ---------- Bottom-Sheet (mobil) ---------- */

  function openSheet(art, anchor) {
    document.getElementById("sheet-kopf").innerHTML =
      '<span class="karte-icon">' + art.icon + "</span>" +
      "<div><div class='karte-titel'>" + esc(art.titel) + "</div>" +
      '<div class="karte-datum">' + esc(art.datumText) + "</div></div>" +
      '<button class="sheet-zu" aria-label="Schließen">✕</button>';
    document.getElementById("sheet-inhalt").innerHTML = artefaktHtml(art);
    sheet.classList.add("offen");
    sheetBg.classList.add("offen");
    document.body.style.overflow = "hidden";
    if (anchor) {
      setTimeout(function () {
        var p = sheet.querySelector('[data-anchor="' + anchor + '"]');
        if (p) {
          p.classList.add("passage-glow");
          p.scrollIntoView({ behavior: FAST ? "auto" : "smooth", block: "center" });
        }
      }, FAST ? 30 : 420);
    }
  }
  function closeSheet() {
    sheet.classList.remove("offen");
    sheetBg.classList.remove("offen");
    document.body.style.overflow = "";
  }
  sheetBg.addEventListener("click", closeSheet);
  sheet.addEventListener("click", function (e) { if (e.target.closest(".sheet-zu")) closeSheet(); });

  /* ---------- Chat ---------- */

  function chatNachUnten() { verlauf.scrollTop = verlauf.scrollHeight; }

  function addMsg(klasse, html) {
    var div = document.createElement("div");
    div.className = "msg " + klasse;
    div.innerHTML = html;
    verlauf.appendChild(div);
    chatNachUnten();
    return div;
  }

  function typeText(el, text) {
    if (FAST) { el.textContent = text; return Promise.resolve(); }
    return new Promise(function (done) {
      var cursor = document.createElement("span");
      cursor.className = "tipp-cursor";
      el.appendChild(cursor);
      var i = 0;
      (function schritt() {
        var stueck = text.slice(i, i + 3);
        i += 3;
        cursor.insertAdjacentText("beforebegin", stueck);
        chatNachUnten();
        if (i < text.length) setTimeout(schritt, 18);
        else { cursor.remove(); done(); }
      })();
    });
  }

  function quelleChipHtml(q) {
    var art = byId(q.art);
    if (!art) return "";
    return '<button class="quelle-chip" data-art="' + q.art + '" data-anchor="' + (q.anchor || "") +
      '" data-snippet="' + esc(q.snippet || art.titel) + '">' +
      '<span class="q-icon">' + art.icon + "</span>" + esc(art.titel.length > 38 ? art.titel.slice(0, 36) + "…" : art.titel) +
      '<span class="q-datum">' + esc(art.datumText.replace(/^\w+, /, "")) + "</span></button>";
  }

  async function playAntwort(frage, antwort) {
    PA.busy = true;
    setEingabe(false);
    addMsg("user", esc(frage));
    await warte(420);

    var denk = addMsg("bot", '<span class="denkt"><i></i><i></i><i></i></span>');
    await warte(antwort.live ? 200 : 850);
    denk.remove();

    var msg = addMsg("bot" + (antwort.unbekannt ? " unbekannt" : ""), "");
    var textEl = document.createElement("span");
    msg.appendChild(textEl);
    await typeText(textEl, antwort.antwort);

    var quellen = (antwort.quellen || []).filter(function (q) { return byId(q.art); });
    PA.lastQuellen = quellen.map(function (q) { return q.art; });

    if (quellen.length) {
      var qWrap = document.createElement("div");
      qWrap.className = "quellen";
      qWrap.innerHTML = quellen.map(quelleChipHtml).join("");
      msg.appendChild(qWrap);
      var chips = qWrap.querySelectorAll(".quelle-chip");
      for (var i = 0; i < chips.length; i++) {
        await warte(260);
        chips[i].classList.add("pop");
        chatNachUnten();
      }
      await warte(520);
      if (!isMobile()) {
        chips[0].classList.add("aktiv");
        zeigeQuelle(quellen[0]);
      }
    }

    var spur = document.createElement("span");
    spur.className = "msg-spur";
    spur.innerHTML = antwort.unbekannt
      ? "<b>Ehrliche Grenze:</b> keine Quelle in der Akte — also keine Behauptung."
      : (antwort.live ? "✦ Live aus der Akte beantwortet — nur Belegtes, sonst nichts." : "✦ Beispielfrage · jede Aussage mit Quelle belegt.");
    msg.appendChild(spur);
    chatNachUnten();

    PA.busy = false;
    setEingabe(true);
  }

  verlauf.addEventListener("click", function (e) {
    var chip = e.target.closest(".quelle-chip");
    if (!chip) return;
    verlauf.querySelectorAll(".quelle-chip.aktiv").forEach(function (c) { c.classList.remove("aktiv"); });
    chip.classList.add("aktiv");
    zeigeQuelle({ art: chip.getAttribute("data-art"), anchor: chip.getAttribute("data-anchor") || null });
  });

  /* ---------- Frage-Chips ---------- */

  function renderChips() {
    chipsEl.innerHTML = A.chips.map(function (c) {
      return '<button class="frage-chip" data-chip="' + c.id + '">' + esc(c.frage) + "</button>";
    }).join("");
  }
  function setEingabe(an) {
    chipsEl.querySelectorAll(".frage-chip").forEach(function (b) { b.disabled = !an; });
    feld.disabled = !an;
    senden.disabled = !an;
  }
  function askChip(id) {
    var c = A.chips.find(function (x) { return x.id === id; });
    if (!c || PA.busy) return Promise.resolve(false);
    var btn = chipsEl.querySelector('[data-chip="' + id + '"]');
    if (btn) btn.classList.add("gefragt");
    return playAntwort(c.frage, c).then(function () { return true; });
  }
  chipsEl.addEventListener("click", function (e) {
    var b = e.target.closest("[data-chip]");
    if (!b || PA.busy) return;
    userActed = true;
    askChip(b.getAttribute("data-chip"));
  });

  /* ---------- Freitext → /api/ask ---------- */

  async function askLive(frage) {
    PA.busy = true;
    setEingabe(false);
    addMsg("user", esc(frage));
    var denk = addMsg("bot", '<span class="denkt"><i></i><i></i><i></i></span>');
    var data = null;
    try {
      var res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frage: frage })
      });
      data = await res.json();
    } catch (e) { data = null; }
    denk.remove();
    PA.busy = false;

    if (data && data.ok && data.antwort && data.antwort.antwort) {
      var quellen = (data.antwort.quellen || []).map(function (id) { return { art: String(id).toUpperCase() }; });
      // Wiederholungs-Schutz: playAntwort fügt die User-Bubble selbst hinzu — hier schon geschehen.
      return playAntwortOhneFrage({ antwort: data.antwort.antwort, quellen: quellen, unbekannt: !!data.antwort.unbekannt, live: true });
    }
    /* graceful → zurück zu den Chips */
    var grund = data && data.error ? data.error : "Die Live-Funktion ist gerade nicht erreichbar";
    addMsg("bot unbekannt", esc(grund) + ". Die Beispielfragen unten funktionieren immer — sie zeigen genau dieselbe Mechanik." +
      '<span class="msg-spur"><b>Tipp:</b> eine der vorbereiteten Fragen antippen.</span>');
    setEingabe(true);
  }

  async function playAntwortOhneFrage(antwort) {
    PA.busy = true;
    setEingabe(false);
    var msg = addMsg("bot" + (antwort.unbekannt ? " unbekannt" : ""), "");
    var textEl = document.createElement("span");
    msg.appendChild(textEl);
    await typeText(textEl, antwort.antwort);
    var quellen = (antwort.quellen || []).filter(function (q) { return byId(q.art); });
    PA.lastQuellen = quellen.map(function (q) { return q.art; });
    if (quellen.length) {
      var qWrap = document.createElement("div");
      qWrap.className = "quellen";
      qWrap.innerHTML = quellen.map(quelleChipHtml).join("");
      msg.appendChild(qWrap);
      var chips = qWrap.querySelectorAll(".quelle-chip");
      for (var i = 0; i < chips.length; i++) { await warte(260); chips[i].classList.add("pop"); chatNachUnten(); }
      await warte(520);
      if (!isMobile()) { chips[0].classList.add("aktiv"); zeigeQuelle(quellen[0]); }
    }
    var spur = document.createElement("span");
    spur.className = "msg-spur";
    spur.innerHTML = antwort.unbekannt
      ? "<b>Ehrliche Grenze:</b> dazu liegt in der Akte nichts vor — also keine Behauptung."
      : "✦ Live aus der Akte beantwortet — nur Belegtes, sonst nichts.";
    msg.appendChild(spur);
    chatNachUnten();
    PA.busy = false;
    setEingabe(true);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    userActed = true;
    var frage = feld.value.trim();
    if (!frage || PA.busy) return;
    feld.value = "";
    askLive(frage);
  });

  /* ---------- Panels ---------- */

  function quelleMini(q) {
    var art = byId(q.art);
    var kurz = art.titel.length > 26 ? art.titel.slice(0, 24) + "…" : art.titel;
    return '<button class="quelle-chip" data-panelquelle="1" data-art="' + q.art + '" data-anchor="' + (q.anchor || "") +
      '" data-snippet="' + esc(art.titel) + '"><span class="q-icon">' + art.icon + "</span>" + esc(kurz) +
      '<span class="q-datum">' + esc(art.datumText.replace(/^\w+, /, "")) + "</span></button>";
  }

  function renderPanels() {
    var wb = A.wochenbrief;
    function liste(einträge) {
      return "<ul>" + einträge.map(function (e) {
        return '<li><span class="b-icon">·</span><div>' + esc(e.t) + "<br>" + quelleMini(e.quelle) + "</div></li>";
      }).join("") + "</ul>";
    }
    document.getElementById("wochen-brief").innerHTML =
      '<div class="brief-meta">automatisch erstellt · jeden Freitag</div>' +
      "<h3>📨 " + esc(wb.titel) + "</h3>" +
      '<p class="brief-sub">' + esc(wb.range) + " · geht als Mail an alle Beteiligten</p>" +
      "<h4>Was diese Woche passiert ist</h4>" + liste(wb.passiert) +
      "<h4>Was als Nächstes ansteht</h4>" + liste(wb.ansteht) +
      "<h4>Wer wartet auf wen</h4>" + liste(wb.wartet);

    document.getElementById("offene-punkte").innerHTML =
      '<div class="brief-meta" style="padding-left:4px">offene Punkte · automatisch geführt</div>' +
      A.offenePunkte.map(function (p) {
        var label = { frist: "Frist läuft", pruefung: "in Prüfung", offen: "offen" }[p.status];
        return '<div class="punkt-karte"><span class="punkt-status ' + p.status + '">' + label + "</span>" +
          "<h3>" + esc(p.titel) + "</h3><p>" + esc(p.detail) + "</p>" + quelleMini(p.quelle) + "</div>";
      }).join("");
  }

  document.addEventListener("click", function (e) {
    var chip = e.target.closest("[data-panelquelle]");
    if (!chip) return;
    zeigeQuelle({ art: chip.getAttribute("data-art"), anchor: chip.getAttribute("data-anchor") || null }, { pageScroll: true });
  });

  /* ---------- Scroll-Reveals ---------- */

  var FORCE_REVEAL = !("IntersectionObserver" in window) || /[?&]reveal=1/.test(location.search);
  if (FORCE_REVEAL) {
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("sichtbar"); });
  } else {
    var io = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("sichtbar"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
  }

  /* ---------- Auto-Demo: erste Frage spielt nach Load genau 1× ---------- */

  var userActed = false;
  var autoDemoStarted = false;
  ["pointerdown", "keydown"].forEach(function (ev) {
    document.addEventListener(ev, function () { userActed = true; }, { once: true, capture: true });
  });
  function autoDemo() {
    if (NOAUTO || autoDemoStarted || userActed || PA.busy) return;
    autoDemoStarted = true;
    PA.autoDemoRuns += 1;
    askChip(A.chips[0].id);
  }

  /* ---------- Init ---------- */

  renderFilter();
  renderTimeline();
  renderChips();
  renderPanels();
  addMsg("bot", "Guten Tag! Ich bin das Gedächtnis dieser Akte: 24 Dokumente aus 10 Wochen Praxisumbau — Mails, Angebote, WhatsApp-Fotos, Protokolle. Fragen Sie mich etwas. Ich antworte nur, was ich belegen kann." +
    '<span class="msg-spur">⚖️ Demo — alle Personen, Firmen und Dokumente sind frei erfunden.</span>');

  /* Start erst, wenn der Chat wirklich im Blick ist — der Aha-Moment darf
   * nicht unsichtbar unterhalb des Folds ablaufen (v. a. mobil). */
  (function () {
    var chatEl = document.querySelector(".chat");
    if (!("IntersectionObserver" in window)) { setTimeout(autoDemo, FAST ? 150 : 1400); return; }
    var demoIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { demoIO.disconnect(); setTimeout(autoDemo, FAST ? 150 : 1200); }
      });
    }, { threshold: 0.35 });
    demoIO.observe(chatEl);
  })();

})();
