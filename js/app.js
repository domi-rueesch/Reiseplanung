/*
 * Hauptlogik der Oberfläche: Weltkarte, Länderdetails, Reiseplaner, Checkliste.
 */
(function () {
  const $ = (id) => document.getElementById(id);
  const live = RP.live;

  // ───────────── Zustand ─────────────
  const nextMonthStart = () => {
    const n = new Date();
    return RP.isoDate(Date.UTC(n.getFullYear(), n.getMonth() + 1, 1));
  };
  const DEFAULT_PLAN = {
    name: "", start: nextMonthStart(), airport: "ZRH", style: 0, returnHome: true,
    reservePct: 10, insurancePerMonth: 60, equipment: 500, includeHealth: true, stops: [], returnLegCost: null,
  };
  const DEFAULT_FILTERS = {
    month: (new Date().getMonth() + 1) % 12, color: "match", maxCost: 300, region: "",
    acts: [], weather: false, crowd: false, visa: false, safety: 3,
  };
  const plan = Object.assign({}, DEFAULT_PLAN, RP.store.get("plan", {}));
  // Ältere Pläne: Grossbritannien ist jetzt in Landesteile aufgeteilt; unbekannte Länder entfernen
  plan.stops = plan.stops
    .map((s) => (s.iso === "GBR" ? Object.assign({}, s, { iso: "ENG", extras: [] }) : s))
    .filter((s) => RP.byIso[s.iso]);
  const filters = Object.assign({}, DEFAULT_FILTERS, RP.store.get("filters", {}));
  const checked = RP.store.get("checked", {});
  let selectedIso = null;
  let result = null;

  const savePlan = () => RP.store.set("plan", plan);
  const saveFilters = () => RP.store.set("filters", filters);

  function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => (t.hidden = true), 3500);
  }

  // ───────────── Farben ─────────────
  const COL = {
    G: "#2f9e44", O: "#f0b429", S: "#e03131",
    crowd: { 1: "#a5d8ff", 2: "#4dabf7", 3: "#1864ab" },
    safety: { 1: "#2f9e44", 2: "#fcc419", 3: "#ff922b", 4: "#e03131" },
    nodata: "#e9ecef", fail: "#f1f3f5",
  };
  const COST_STEPS = [[35, "#2f9e44"], [50, "#94d82d"], [70, "#fcc419"], [100, "#ff922b"], [Infinity, "#e03131"]];
  const costColor = (chf) => COST_STEPS.find(([max]) => chf < max)[1];

  // ───────────── Tabs ─────────────
  document.querySelectorAll(".tab").forEach((btn) =>
    btn.addEventListener("click", () => showView(btn.dataset.view)));

  function showView(view) {
    document.querySelectorAll(".tab").forEach((b) => b.classList.toggle("active", b.dataset.view === view));
    document.querySelectorAll(".view").forEach((v) => v.classList.toggle("active", v.id === "view-" + view));
    if (view === "map") setTimeout(() => map.invalidateSize(), 0);
    if (view === "plan") setTimeout(() => { planMap.invalidateSize(); drawPlanMap(); }, 0);
  }

  // ───────────── Datenstatus ─────────────
  function renderStatus(busy) {
    const s = live.state;
    let txt;
    if (busy) txt = "Aktualisiere Live-Daten …";
    else if (!s.fetchedAt) txt = "Eingebaute Daten · 1 USD ≈ " + live.rate().toFixed(2) + " CHF";
    else txt = "Live-Daten vom " + RP.fmtDate(s.fetchedAt) + " · 1 USD = " + live.rate().toFixed(3) + " CHF";
    $("data-status").innerHTML = RP.esc(txt) + (busy ? "" : ' <button id="refresh-btn" title="Wechselkurs und Reisewarnungen jetzt neu laden">↻ Aktualisieren</button>');
    const b = $("refresh-btn");
    if (b) b.addEventListener("click", () => refreshLive(true));
  }

  async function refreshLive(manual) {
    renderStatus(true);
    const r = await live.refresh();
    renderStatus(false);
    if (r.rate || r.warnings) {
      if (manual) toast("Aktualisiert: " + [r.rate && "Wechselkurs", r.warnings && "Reisewarnungen"].filter(Boolean).join(" und "));
      renderAll();
    } else if (manual) {
      toast("Keine Verbindung – es werden die zuletzt gespeicherten Daten verwendet.");
    }
  }

  // ───────────── Filter ─────────────
  function initFilters() {
    $("f-month").innerHTML = RP.MONTHS.map((m, i) => `<option value="${i}">${m}</option>`).join("");
    $("f-region").innerHTML += REGIONS.map((r) => `<option>${r}</option>`).join("");
    $("f-acts").innerHTML = Object.entries(ACTIVITIES).map(([k, v]) => `<button class="chip" data-act="${k}">${v}</button>`).join("");
    syncFilterInputs();

    $("f-month").addEventListener("change", (e) => { filters.month = +e.target.value; onFilter(); });
    $("f-color").addEventListener("change", (e) => { filters.color = e.target.value; onFilter(); });
    $("f-cost").addEventListener("input", (e) => { filters.maxCost = +e.target.value; onFilter(); });
    $("f-region").addEventListener("change", (e) => { filters.region = e.target.value; onFilter(); });
    $("f-weather").addEventListener("change", (e) => { filters.weather = e.target.checked; onFilter(); });
    $("f-crowd").addEventListener("change", (e) => { filters.crowd = e.target.checked; onFilter(); });
    $("f-visa").addEventListener("change", (e) => { filters.visa = e.target.checked; onFilter(); });
    $("f-safety").addEventListener("change", (e) => { filters.safety = +e.target.value; onFilter(); });
    $("f-acts").addEventListener("click", (e) => {
      const k = e.target.dataset && e.target.dataset.act;
      if (!k) return;
      filters.acts = filters.acts.includes(k) ? filters.acts.filter((a) => a !== k) : filters.acts.concat(k);
      onFilter();
    });
    $("f-reset").addEventListener("click", () => {
      Object.assign(filters, DEFAULT_FILTERS, { month: filters.month });
      onFilter();
    });
  }

  function syncFilterInputs() {
    $("f-month").value = filters.month;
    $("f-color").value = filters.color;
    $("f-cost").value = filters.maxCost;
    $("f-cost-label").textContent = filters.maxCost >= 300 ? "egal" : "CHF " + filters.maxCost;
    $("f-region").value = filters.region;
    $("f-weather").checked = filters.weather;
    $("f-crowd").checked = filters.crowd;
    $("f-visa").checked = filters.visa;
    $("f-safety").value = filters.safety;
    document.querySelectorAll("#f-acts .chip").forEach((c) => c.classList.toggle("on", filters.acts.includes(c.dataset.act)));
  }

  function onFilter() {
    saveFilters();
    syncFilterInputs();
    styleMap();
    renderResults();
    renderLegend();
    if (selectedIso) renderPanel(selectedIso);
  }

  const backpackerChf = (c, m) => RP.budget.dailyCost(c, 0, m);

  function passes(c) {
    const m = filters.month;
    if (filters.region && c.region !== filters.region) return false;
    if (filters.maxCost < 300 && backpackerChf(c, m) > filters.maxCost) return false;
    if (!filters.acts.every((a) => c.acts.includes(a))) return false;
    if (filters.weather && c.clim[m] !== "G") return false;
    if (filters.crowd && c.crowd[m] === "3") return false;
    if (filters.visa && !["frei", "eta"].includes(c.visa.t)) return false;
    if (live.safety(c) > filters.safety) return false;
    return true;
  }

  function score(c) {
    const m = filters.month;
    return { G: 4, O: 2, S: 0 }[c.clim[m]] + (3 - Number(c.crowd[m])) + (4 - live.safety(c)) * 0.5 - backpackerChf(c, m) / 100;
  }

  function renderResults() {
    const list = COUNTRIES.filter(passes).sort((a, b) => score(b) - score(a));
    $("result-count").textContent = "(" + list.length + ")";
    $("results").innerHTML = list.map((c) => `
      <li data-iso="${c.iso}">
        <span class="dot" style="background:${COL[c.clim[filters.month]]}" title="Wetter: ${RP.CLIM_LABEL[c.clim[filters.month]]}"></span>
        <span class="name">${RP.esc(c.name)}</span>
        <span class="price">${RP.chf(backpackerChf(c, filters.month))}/Tag</span>
      </li>`).join("") || '<li class="empty">Kein Land passt – Filter lockern.</li>';
  }
  $("results").addEventListener("click", (e) => {
    const li = e.target.closest("li[data-iso]");
    if (li) selectCountry(li.dataset.iso, true);
  });

  // ───────────── Weltkarte ─────────────
  const map = L.map("map", { worldCopyJump: true, minZoom: 2, maxZoom: 7, zoomSnap: 0.25, attributionControl: false })
    .fitBounds([[-50, -150], [72, 170]]);
  L.control.attribution({ prefix: false }).addAttribution("Grenzen: Natural Earth").addTo(map);

  function countryFill(c) {
    if (!c) return COL.nodata;
    const m = filters.month;
    switch (filters.color) {
      case "climate": return COL[c.clim[m]];
      case "crowd": return COL.crowd[c.crowd[m]];
      case "cost": return costColor(backpackerChf(c, m));
      case "safety": return COL.safety[live.safety(c)];
      default: {
        if (!passes(c)) return COL.fail;
        const s = score(c);
        return s >= 6 ? "#2b8a3e" : s >= 4.5 ? "#51cf66" : "#b2f2bb";
      }
    }
  }

  function featureStyle(feature) {
    const c = RP.lookup(feature.properties.iso);
    const sel = c && c.iso === selectedIso;
    return {
      fillColor: countryFill(c), fillOpacity: c ? 0.9 : 0.6,
      color: sel ? "#1f3a5f" : "#ffffff", weight: sel ? 2.5 : 0.7,
    };
  }

  function tooltip(c, fallbackName) {
    if (!c) return RP.esc(fallbackName) + "<br><small>keine Daten</small>";
    const m = filters.month;
    return `<strong>${RP.esc(c.name)}</strong><br>${RP.MONTHS[m]}: Wetter ${RP.CLIM_LABEL[c.clim[m]]}, Touristen ${RP.CROWD_LABEL[c.crowd[m]]}<br>ab ${RP.chf(backpackerChf(c, m))} pro Tag`;
  }

  const geoLayer = L.geoJSON(WORLD_GEO, {
    style: featureStyle,
    onEachFeature(feature, layer) {
      const c = RP.lookup(feature.properties.iso);
      layer.bindTooltip(() => tooltip(c, feature.properties.name), { sticky: true });
      if (c) layer.on("click", () => selectCountry(c.iso));
      layer.on("mouseover", () => layer.setStyle({ fillOpacity: 1, weight: Math.max(1.5, featureStyle(feature).weight) }));
      layer.on("mouseout", () => geoLayer.resetStyle(layer));
    },
  }).addTo(map);

  // Kleine Länder ohne Umriss in den Kartendaten als Punkt darstellen
  const withShape = new Set(WORLD_GEO.features.map((f) => f.properties.iso));
  const dotMarkers = COUNTRIES.filter((c) => !withShape.has(c.iso)).map((c) => {
    const mk = L.circleMarker(c.hub, { radius: 7, weight: 2, color: "#fff", fillOpacity: 1 }).addTo(map);
    mk.bindTooltip(() => tooltip(c), { sticky: true });
    mk.on("click", () => selectCountry(c.iso));
    mk.country = c;
    return mk;
  });

  function styleMap() {
    geoLayer.setStyle(featureStyle);
    dotMarkers.forEach((mk) => mk.setStyle({ fillColor: countryFill(mk.country), color: mk.country.iso === selectedIso ? "#1f3a5f" : "#fff" }));
  }

  function renderLegend() {
    let rows;
    switch (filters.color) {
      case "climate": rows = [[COL.G, "ideal"], [COL.O, "okay / Zwischensaison"], [COL.S, "ungünstig"]]; break;
      case "crowd": rows = [[COL.crowd[1], "wenig Touristen"], [COL.crowd[2], "mittel"], [COL.crowd[3], "Hochsaison"]]; break;
      case "cost": rows = [["#2f9e44", "unter CHF 35"], ["#94d82d", "CHF 35–50"], ["#fcc419", "CHF 50–70"], ["#ff922b", "CHF 70–100"], ["#e03131", "über CHF 100"]]; break;
      case "safety": rows = [1, 2, 3, 4].map((l) => [COL.safety[l], RP.SAFETY_LABEL[l]]); break;
      default: rows = [["#2b8a3e", "passt sehr gut"], ["#51cf66", "passt gut"], ["#b2f2bb", "passt"], [COL.fail, "passt nicht zu den Filtern"]];
    }
    const title = { climate: "Wetter im " + RP.MONTHS[filters.month], crowd: "Touristen im " + RP.MONTHS[filters.month], cost: "Backpacker pro Tag", safety: "Sicherheit", match: "Passend im " + RP.MONTHS[filters.month] }[filters.color];
    $("legend").innerHTML = `<strong>${title}</strong>` + rows.map(([c, l]) => `<div><span class="sw" style="background:${c}"></span>${l}</div>`).join("") +
      `<div><span class="sw" style="background:${COL.nodata}"></span>keine Daten</div>`;
  }

  // ───────────── Länderdetails ─────────────
  function selectCountry(iso, pan) {
    selectedIso = iso;
    styleMap();
    renderPanel(iso);
    if (pan) map.panTo(RP.byIso[iso].hub);
  }

  function renderPanel(iso) {
    const c = RP.byIso[iso];
    const panel = $("country-panel");
    if (!c) { panel.hidden = true; return; }
    const m = filters.month;
    const rate = live.rate();
    const safety = live.safety(c);
    const w = live.warning(c);
    const inPlan = plan.stops.filter((s) => s.iso === iso);

    const monthsHtml = RP.MONTHS_SHORT.map((name, i) => `
      <div class="m ${i === m ? "sel" : ""}" title="${RP.MONTHS[i]}: Wetter ${RP.CLIM_LABEL[c.clim[i]]}, Touristen ${RP.CROWD_LABEL[c.crowd[i]]}">
        <div class="c" style="background:${COL[c.clim[i]]}"></div>
        <div class="p" style="opacity:${[0, 0.25, 0.6, 1][c.crowd[i]]}"></div>
        ${name}
      </div>`).join("");

    const yf = ["", "Gelbfieberimpfung empfohlen", "Gelbfieberimpfung Pflicht"][c.health.yf];
    const mal = ["Kein Malariarisiko", "Malaria nur regional – Mückenschutz, ggf. Notfallmedikament", "Malaria-Prophylaxe empfohlen"][c.health.mal];

    $("country-panel").innerHTML = `
      <div class="panel-head">
        <div><h2>${RP.esc(c.name)}</h2><div class="region">${c.region} · Währung ${c.currency}</div></div>
        <button class="close" id="panel-close" title="Schliessen">×</button>
      </div>

      <div class="facts">
        <div class="fact"><div class="k">Backpacker / Tag</div><div class="v">${RP.chf(backpackerChf(c, m))}</div></div>
        <div class="fact"><div class="k">Mittelklasse</div><div class="v">${RP.chf(RP.budget.dailyCost(c, 1, m))}</div></div>
        <div class="fact"><div class="k">Komfort</div><div class="v">${RP.chf(RP.budget.dailyCost(c, 2, m))}</div></div>
      </div>
      <div class="hint">Preise für ${RP.MONTHS[m]} inkl. Saisonzuschlag, Unterkunft, Essen, lokalem Transport und einfachen Aktivitäten (Basis USD ${c.cost.join(" / ")}).</div>

      <h3>Reisewetter & Touristen</h3>
      <div class="months">${monthsHtml}</div>
      <div class="months-legend">Farbe = Wetter (grün ideal, gelb okay, rot ungünstig) · grauer Balken = Touristenandrang</div>
      <p>${RP.esc(c.cn)}</p>

      <h3>Aktivitäten</h3>
      <div class="chips">${c.acts.map((a) => `<span class="chip static ${filters.acts.includes(a) ? "on" : ""}">${ACTIVITIES[a]}</span>`).join("")}</div>

      <h3>Sehenswürdigkeiten & Highlights</h3>
      <ul>${c.sights.map((s) => `<li>${RP.esc(s)}</li>`).join("")}</ul>

      <h3>Tipps</h3>
      <ul>${c.tips.map((s) => `<li>${RP.esc(s)}</li>`).join("")}</ul>

      <h3>Einreise mit Schweizer Pass</h3>
      <div class="box info"><strong>${RP.VISA_LABEL[c.visa.t]}${c.visa.d ? " · bis " + c.visa.d + " Tage" : ""}${c.visa.fee ? " · ca. " + RP.chf(c.visa.fee * rate) : ""}</strong><br>${RP.esc(c.visa.n)}</div>

      <h3>Sicherheit</h3>
      <div class="box s${safety}">
        <strong>${RP.SAFETY_LABEL[safety]}</strong><br>${RP.esc(c.sn)}
        ${w ? `<br><br><strong>Live (Auswärtiges Amt DE):</strong> ${RP.esc(w.label)}` : ""}
        <br><br><a href="https://www.eda.admin.ch/eda/de/home/vertretungen-und-reisehinweise.html" target="_blank" rel="noopener">Aktuelle Reisehinweise des EDA ↗</a>
      </div>

      <h3>Gesundheit</h3>
      <div class="box info">${[yf, mal, c.health.n].filter(Boolean).map(RP.esc).join("<br>")}</div>

      ${c.extras.length ? `<h3>Typische Zusatzkosten</h3><ul>${c.extras.map((e) => `<li>${RP.esc(e.n)}: ca. ${RP.chf(e.usd * rate)}</li>`).join("")}</ul>` : ""}

      <div class="add-box">
        <input type="number" id="panel-days" min="1" value="14"> Tage
        <button class="btn" id="panel-add">+ Zum Plan hinzufügen</button>
      </div>
      ${inPlan.length ? `<p class="hint">Bereits im Plan: ${inPlan.map((s) => s.days + " Tage").join(", ")}</p>` : ""}
      <p class="hint">Alle Angaben ohne Gewähr – vor der Reise offizielle Quellen prüfen.</p>`;
    panel.hidden = false;
    setTimeout(() => map.invalidateSize(), 0);

    $("panel-close").addEventListener("click", () => {
      selectedIso = null;
      panel.hidden = true;
      styleMap();
      setTimeout(() => map.invalidateSize(), 0);
    });
    $("panel-add").addEventListener("click", () => {
      addStop(iso, +$("panel-days").value || 14);
      renderPanel(iso);
    });
  }

  // ───────────── Reiseplan ─────────────
  function addStop(iso, days) {
    plan.stops.push({ iso, days: Math.max(1, days), style: plan.style, extras: [], legCost: null });
    savePlan();
    renderPlan();
    toast(RP.byIso[iso].name + " zum Plan hinzugefügt (" + days + " Tage)");
  }

  function clearLegOverrides() {
    const had = plan.stops.some((s) => s.legCost != null) || plan.returnLegCost != null;
    plan.stops.forEach((s) => (s.legCost = null));
    plan.returnLegCost = null;
    return had;
  }

  function initPlanForm() {
    $("p-add-country").innerHTML = COUNTRIES.slice().sort((a, b) => a.name.localeCompare(b.name, "de"))
      .map((c) => `<option value="${c.iso}">${RP.esc(c.name)}</option>`).join("");
    const bind = (id, key, conv) => $(id).addEventListener("change", (e) => {
      plan[key] = conv(e.target);
      savePlan();
      renderPlan();
    });
    bind("p-name", "name", (t) => t.value);
    bind("p-start", "start", (t) => t.value || nextMonthStart());
    bind("p-airport", "airport", (t) => t.value);
    bind("p-style", "style", (t) => +t.value);
    bind("p-return", "returnHome", (t) => t.checked);
    bind("p-insurance", "insurancePerMonth", (t) => Math.max(0, +t.value || 0));
    bind("p-equipment", "equipment", (t) => Math.max(0, +t.value || 0));
    bind("p-reserve", "reservePct", (t) => Math.max(0, +t.value || 0));
    bind("p-health", "includeHealth", (t) => t.checked);
    $("p-add").addEventListener("click", () => addStop($("p-add-country").value, +$("p-add-days").value || 14));
    $("p-clear").addEventListener("click", () => {
      if (!plan.stops.length || confirm("Alle Länder aus dem Plan entfernen?")) {
        plan.stops = [];
        plan.returnLegCost = null;
        savePlan();
        renderPlan();
      }
    });
    $("p-pdf").addEventListener("click", () => {
      if (!plan.stops.length) return toast("Füge zuerst Länder zum Plan hinzu.");
      try {
        RP.pdf.exportPlan(plan, result, checked);
      } catch (e) {
        console.error(e);
        toast("PDF konnte nicht erstellt werden: " + e.message);
      }
    });

    // Routen-Änderungen über Event-Delegation
    const stopsEl = $("stops");
    stopsEl.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      const i = +btn.dataset.i;
      const a = btn.dataset.action;
      if (a === "up" || a === "down") {
        const j = a === "up" ? i - 1 : i + 1;
        [plan.stops[i], plan.stops[j]] = [plan.stops[j], plan.stops[i]];
        if (clearLegOverrides()) toast("Eigene Transportkosten wurden wegen der neuen Reihenfolge zurückgesetzt.");
      } else if (a === "remove") {
        plan.stops.splice(i, 1);
        clearLegOverrides();
      } else if (a === "show") {
        showView("map");
        selectCountry(plan.stops[i].iso, true);
        return;
      } else return;
      savePlan();
      renderPlan();
    });
    stopsEl.addEventListener("change", (e) => {
      const t = e.target;
      const i = +t.dataset.i;
      const f = t.dataset.field;
      if (!f) return;
      if (f === "days") plan.stops[i].days = Math.max(1, +t.value || 1);
      if (f === "style") plan.stops[i].style = +t.value;
      if (f === "extra") {
        const idx = +t.dataset.x;
        const ex = plan.stops[i].extras || [];
        plan.stops[i].extras = t.checked ? ex.concat(idx) : ex.filter((x) => x !== idx);
      }
      if (f === "leg") {
        const v = t.value.trim() === "" ? null : Math.max(0, +t.value);
        if (i === -1) plan.returnLegCost = v; else plan.stops[i].legCost = v;
      }
      savePlan();
      renderPlan();
    });

    // Optimierer
    const wLabels = ["egal", "etwas", "wichtig", "sehr wichtig"];
    const syncO = () => {
      $("o-weather-label").textContent = wLabels[$("o-weather").value];
      $("o-crowd-label").textContent = wLabels[$("o-crowd").value];
    };
    $("o-weather").addEventListener("input", syncO);
    $("o-crowd").addEventListener("input", syncO);
    syncO();
    const weights = () => ({ weather: [0, 0.5, 1, 2][$("o-weather").value], crowd: [0, 0.5, 1, 2][$("o-crowd").value] });

    $("o-run").addEventListener("click", () => {
      if (plan.stops.length < 2) return toast("Für die Optimierung braucht es mindestens 2 Länder.");
      const opt = RP.optimizer.optimize(plan, weights());
      showOptResult([{ start: plan.start, stops: opt.stops }], "Optimierte Reihenfolge");
    });
    $("o-month").addEventListener("click", () => {
      if (!plan.stops.length) return toast("Füge zuerst Länder zum Plan hinzu.");
      const res = RP.optimizer.bestStartMonth(plan, weights());
      showOptResult(res.slice(0, 3), "Beste Startmonate (mit jeweils optimaler Reihenfolge)");
    });
  }

  function compareText(candidate) {
    const test = Object.assign({}, plan, {
      start: candidate.start, returnLegCost: null,
      stops: candidate.stops.map((s) => Object.assign({}, s, { legCost: null })),
    });
    const r = RP.budget.compute(test);
    const good = r.stops.reduce((a, s) => a + s.weather.G, 0);
    const bad = r.stops.reduce((a, s) => a + s.weather.S, 0);
    return { r, good, bad };
  }

  function showOptResult(candidates, title) {
    const cur = compareText({ start: plan.start, stops: plan.stops });
    const html = candidates.map((cand, k) => {
      const { r, good, bad } = compareText(cand);
      const startLabel = RP.MONTHS[RP.monthOf(RP.parseDate(cand.start))] + " " + new Date(RP.parseDate(cand.start)).getUTCFullYear();
      return `<div class="opt-result">
        <strong>${candidates.length > 1 ? (k + 1) + ". Start im " + startLabel : title}</strong>
        <ol>${cand.stops.map((s) => `<li>${RP.esc(RP.byIso[s.iso].name)} (${s.days} T.)</li>`).join("")}</ol>
        Transport: ${RP.chf(r.sums.transport)} <span class="hint">(aktuell ${RP.chf(cur.r.sums.transport)})</span><br>
        Tage mit idealem Wetter: ${good} von ${r.totalDays} <span class="hint">(aktuell ${cur.good})</span>, ungünstig: ${bad} <span class="hint">(aktuell ${cur.bad})</span><br>
        Gesamtbudget: ${RP.chf(r.sums.total)} <span class="hint">(aktuell ${RP.chf(cur.r.sums.total)})</span>
        <div class="btn-row" style="margin-top:8px"><button class="btn small" data-apply="${k}">Übernehmen</button></div>
      </div>`;
    }).join("");
    $("o-result").innerHTML = (candidates.length > 1 ? `<p><strong>${title}</strong></p>` : "") + html;
    $("o-result").querySelectorAll("[data-apply]").forEach((b) => b.addEventListener("click", () => {
      const cand = candidates[+b.dataset.apply];
      plan.start = cand.start;
      plan.stops = cand.stops.map((s) => Object.assign({}, s));
      clearLegOverrides();
      savePlan();
      $("o-result").innerHTML = "";
      renderPlan();
      toast("Route übernommen.");
    }));
  }

  function weatherBar(s) {
    const pct = (n) => (100 * n) / s.days + "%";
    return `<div class="weather-bar" title="Wetter: ${s.weather.G} Tage ideal, ${s.weather.O} okay, ${s.weather.S} ungünstig">
      <div style="width:${pct(s.weather.G)};background:${COL.G}"></div>
      <div style="width:${pct(s.weather.O)};background:${COL.O}"></div>
      <div style="width:${pct(s.weather.S)};background:${COL.S}"></div></div>`;
  }

  function legHtml(l, i) {
    const icon = l.mode === "Flug" ? "✈" : "🚌";
    return `<li class="leg">${icon} ${RP.esc(l.from.name)} → ${RP.esc(l.to.name)} · ${l.mode} · ${Math.round(l.km).toLocaleString("de-CH")} km ·
      CHF <input type="number" min="0" step="10" data-field="leg" data-i="${i}" value="${l.overridden ? l.cost : ""}" placeholder="${l.estimate}" class="${l.overridden ? "overridden" : ""}" title="Geschätzt: CHF ${l.estimate}. Eigenen Preis eintragen, z.B. nach einer Flugsuche.">
      ${l.overridden ? "" : '<span class="hint">geschätzt</span>'}</li>`;
  }

  function renderPlan() {
    result = RP.budget.compute(plan);
    $("plan-count").textContent = plan.stops.length;

    $("p-name").value = plan.name;
    $("p-start").value = plan.start;
    $("p-airport").value = plan.airport;
    $("p-style").value = plan.style;
    $("p-return").checked = plan.returnHome;
    $("p-insurance").value = plan.insurancePerMonth;
    $("p-equipment").value = plan.equipment;
    $("p-reserve").value = plan.reservePct;
    $("p-health").checked = plan.includeHealth;

    $("stops-empty").hidden = plan.stops.length > 0;
    const n = result.stops.length;
    let html = "";
    result.stops.forEach((s, i) => {
      html += legHtml(result.legs[i], i);
      const c = s.country;
      html += `<li class="stop">
        <div class="stop-top">
          <span class="stop-num">${i + 1}</span>
          <span class="stop-name" data-action="show" data-i="${i}" title="Auf der Karte anzeigen">${RP.esc(c.name)}</span>
          <span class="stop-dates">${RP.fmtDate(s.start)} – ${RP.fmtDate(s.end)}</span>
        </div>
        <div class="stop-controls">
          <input type="number" min="1" value="${s.days}" data-field="days" data-i="${i}"> Tage
          <select data-field="style" data-i="${i}">${RP.STYLES.map((st, k) => `<option value="${k}" ${k === s.style ? "selected" : ""}>${st}</option>`).join("")}</select>
          <button class="icon-btn" data-action="up" data-i="${i}" ${i === 0 ? "disabled" : ""} title="Nach oben">↑</button>
          <button class="icon-btn" data-action="down" data-i="${i}" ${i === n - 1 ? "disabled" : ""} title="Nach unten">↓</button>
          <button class="icon-btn" data-action="remove" data-i="${i}" title="Entfernen">✕</button>
          <span class="stop-cost" title="Aufenthaltskosten">${RP.chf(s.cost)}</span>
        </div>
        ${weatherBar(s)}
        ${c.extras.length ? `<div class="stop-extras">${c.extras.map((e, x) => `
          <label><input type="checkbox" data-field="extra" data-i="${i}" data-x="${x}" ${(plan.stops[i].extras || []).includes(x) ? "checked" : ""}>
          ${RP.esc(e.n)} (ca. ${RP.chf(e.usd * live.rate())})</label>`).join("")}</div>` : ""}
        ${s.warnings.map((w) => `<div class="warn">${RP.esc(w)}</div>`).join("")}
      </li>`;
    });
    if (plan.returnHome && n) html += legHtml(result.legs[n], -1);
    $("stops").innerHTML = html;

    renderSummary();
    drawPlanMap();
    renderChecklist();
  }

  function renderSummary() {
    const r = result;
    const s = r.sums;
    $("summary").innerHTML = r.stops.length ? `
      <div class="sub">Geschätztes Gesamtbudget</div>
      <div class="total">${RP.chf(Math.round(s.total / 10) * 10)}</div>
      <div class="sub">${RP.fmtDate(r.start)} – ${RP.fmtDate(r.end)} · ${r.totalDays} Tage · ${r.stops.length} ${r.stops.length === 1 ? "Land" : "Länder"}</div>
      <div class="kpis">
        <div class="fact"><div class="k">pro Tag</div><div class="v">${RP.chf(r.perDay)}</div></div>
        <div class="fact"><div class="k">pro Monat</div><div class="v">${RP.chf(r.perDay * 30)}</div></div>
        <div class="fact"><div class="k">Ideales Wetter</div><div class="v">${Math.round((100 * r.stops.reduce((a, x) => a + x.weather.G, 0)) / r.totalDays)} %</div></div>
      </div>` : '<div class="sub">Füge Länder hinzu, um dein Budget zu sehen.</div>';

    const rows = [
      ["Unterkunft, Essen, lokaler Transport", s.stay],
      ["Flüge & Fernverkehr", s.transport],
      ["Touren, Permits & Extras", s.extras],
      ["Visa-Gebühren", s.visa],
      ["Reiseversicherung", s.insurance],
      ["Ausrüstung", s.equipment],
      ["Impfungen & Medikamente", s.health],
      ["Reserve (" + plan.reservePct + " %)", s.reserve],
    ];
    const max = Math.max(1, ...rows.map((x) => x[1]));
    $("breakdown").innerHTML = `<h2>Kostenaufstellung</h2>
      <table class="breakdown-table">
        ${rows.map(([l, v]) => `<tr><td>${l}</td><td class="bar-cell"><div class="mini-bar" style="width:${(100 * v) / max}%"></div></td><td>${RP.chf(v)}</td></tr>`).join("")}
        <tr class="total"><td>Total</td><td></td><td>${RP.chf(s.total)}</td></tr>
      </table>
      ${result.health.length ? `<p class="hint">Impfungen: ${result.health.map((h) => RP.esc(h.n)).join(", ")}</p>` : ""}
      <p class="hint">Grobe Schätzung. Flugpreise basieren auf der Distanz – für genaue Werte eine Flugsuche machen und den Preis bei der Teilstrecke eintragen.</p>`;
  }

  // Routenkarte im Planer
  const planMap = L.map("plan-map", { worldCopyJump: false, minZoom: 1, zoomSnap: 0.25, attributionControl: false }).setView([20, 20], 1.5);
  // Welt dreimal nebeneinander, damit Routen über die Datumsgrenze (z.B. Südamerika → Neuseeland) korrekt aussehen
  [-360, 0, 360].forEach((off) => L.geoJSON(WORLD_GEO, {
    style: (f) => ({ fillColor: RP.lookup(f.properties.iso) ? "#dbe4ee" : "#eceff3", fillOpacity: 1, color: "#fff", weight: 0.5 }),
    coordsToLatLng: (c) => L.latLng(c[1], c[0] + off),
  }).addTo(planMap));
  const routeLayer = L.layerGroup().addTo(planMap);

  function drawPlanMap() {
    routeLayer.clearLayers();
    if (!result || !result.stops.length) return;
    const home = RP.budget.homePlace(plan);
    const pts = [home.pos].concat(result.stops.map((s) => s.country.hub));
    if (plan.returnHome) pts.push(home.pos);
    // Längengrade "entfalten", damit Linien über die Datumsgrenze den kurzen Weg nehmen
    const path = [pts[0].slice()];
    for (let i = 1; i < pts.length; i++) {
      let lng = pts[i][1];
      const prev = path[i - 1][1];
      while (lng - prev > 180) lng -= 360;
      while (lng - prev < -180) lng += 360;
      path.push([pts[i][0], lng]);
    }
    L.polyline(path, { color: "#2c5282", weight: 2.5, dashArray: "6 5" }).addTo(routeLayer);
    L.circleMarker(path[0], { radius: 6, color: "#fff", weight: 2, fillColor: "#e03131", fillOpacity: 1 })
      .bindTooltip("Start: " + home.name).addTo(routeLayer);
    result.stops.forEach((s, i) => {
      L.marker(path[i + 1], {
        icon: L.divIcon({ className: "", html: `<div class="stop-num">${i + 1}</div>`, iconSize: [24, 24], iconAnchor: [12, 12] }),
      }).bindTooltip(`${i + 1}. ${RP.esc(s.country.name)} – ${s.days} Tage`).addTo(routeLayer);
    });
    if (document.getElementById("view-plan").classList.contains("active")) {
      planMap.fitBounds(L.latLngBounds(path).pad(0.25), { maxZoom: 5 });
    }
  }

  // ───────────── Checkliste ─────────────
  function renderChecklist() {
    const groups = RP.checklist.build(result);
    const items = groups.flatMap((g) => g.items);
    const done = items.filter((it) => checked[it.id]).length;
    $("check-bar").style.width = items.length ? (100 * done) / items.length + "%" : "0";
    $("check-progress").textContent = done + " / " + items.length + " erledigt";
    $("check-intro").textContent = result.stops.length
      ? "Zugeschnitten auf " + result.totalDays + " Tage in " + result.stops.map((s) => s.country.name).join(", ") + ". Die Liste passt sich an, wenn du den Plan änderst."
      : "Allgemeine Punkte – füge im Reiseplan Länder hinzu, dann wird die Liste auf Dauer und Länder zugeschnitten.";
    $("checklist").innerHTML = groups.map((g) => `
      <div class="card check-group"><h3>${g.title}</h3>
        ${g.items.map((it) => `<label class="item ${checked[it.id] ? "done" : ""}">
          <input type="checkbox" data-check="${it.id}" ${checked[it.id] ? "checked" : ""}><span>${RP.esc(it.text)}</span></label>`).join("")}
      </div>`).join("");
  }
  $("checklist").addEventListener("change", (e) => {
    const id = e.target.dataset.check;
    if (!id) return;
    if (e.target.checked) checked[id] = true; else delete checked[id];
    RP.store.set("checked", checked);
    renderChecklist();
  });

  // ───────────── Start ─────────────
  function renderAll() {
    styleMap();
    renderLegend();
    renderResults();
    renderPlan();
    if (selectedIso) renderPanel(selectedIso);
  }

  initFilters();
  initPlanForm();
  renderStatus(false);
  renderAll();
  if (live.needsRefresh()) refreshLive(false);

  // Für Tests und Konsole
  window.RP.app = { plan, filters, selectCountry, showView, renderAll };
})();
