/*
 * Live-Daten: Wechselkurs USD→CHF und Reisewarnungen.
 * Wird beim Öffnen der App geladen, wenn die letzte Aktualisierung älter als 14 Tage ist.
 * Fällt auf die zuletzt gespeicherten bzw. eingebauten Werte zurück, wenn kein Internet verfügbar ist.
 */
RP.live = (function () {
  const MAX_AGE_DAYS = 14;
  const FALLBACK_RATE = 0.8; // USD→CHF, Stand der eingebauten Daten

  const state = RP.store.get("live", null) || {
    rate: FALLBACK_RATE,
    rateDate: null,
    warnings: {}, // ISO3 → { level, label, updated }
    warningsDate: null,
    fetchedAt: null,
  };

  function ageDays() {
    return state.fetchedAt ? (Date.now() - state.fetchedAt) / RP.DAY_MS : Infinity;
  }

  async function fetchJson(url) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) throw new Error("HTTP " + res.status);
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  async function fetchRate() {
    const urls = [
      "https://api.frankfurter.dev/v1/latest?base=USD&symbols=CHF",
      "https://api.frankfurter.app/latest?from=USD&to=CHF",
    ];
    for (const url of urls) {
      try {
        const j = await fetchJson(url);
        if (j && j.rates && j.rates.CHF) return { rate: j.rates.CHF, date: j.date };
      } catch (e) {
        /* nächste Quelle probieren */
      }
    }
    throw new Error("Wechselkurs nicht erreichbar");
  }

  /* Offene Daten des deutschen Auswärtigen Amts (das EDA bietet keine maschinenlesbare Schnittstelle an) */
  async function fetchWarnings() {
    const j = await fetchJson("https://www.auswaertiges-amt.de/opendata/travelwarning");
    const root = (j && j.response) || j;
    const out = {};
    Object.values(root || {}).forEach((e) => {
      if (!e || typeof e !== "object") return;
      const iso = e.iso3CountryCode || e.iso3countrycode;
      if (!iso) return;
      let level = 0, label = "Keine Reisewarnung";
      if (e.warning) { level = 4; label = "Reisewarnung für das ganze Land"; }
      else if (e.situationWarning) { level = 4; label = "Von Reisen wird abgeraten"; }
      else if (e.partialWarning) { level = 3; label = "Teilreisewarnung"; }
      else if (e.situationPartWarning) { level = 3; label = "Für Teile des Landes wird abgeraten"; }
      out[iso.toUpperCase()] = { level, label, updated: e.lastModified || null, title: e.title || "" };
    });
    if (!Object.keys(out).length) throw new Error("Keine Reisewarnungen erhalten");
    return out;
  }

  async function refresh() {
    const result = { rate: false, warnings: false };
    const [r, w] = await Promise.allSettled([fetchRate(), fetchWarnings()]);
    if (r.status === "fulfilled") {
      state.rate = r.value.rate;
      state.rateDate = r.value.date;
      result.rate = true;
    }
    if (w.status === "fulfilled") {
      state.warnings = w.value;
      state.warningsDate = Date.now();
      result.warnings = true;
    }
    // Nur als "aktualisiert" markieren, wenn mindestens eine Quelle geklappt hat – sonst beim nächsten Öffnen erneut versuchen
    if (result.rate || result.warnings) state.fetchedAt = Date.now();
    RP.store.set("live", state);
    return result;
  }

  return {
    state,
    MAX_AGE_DAYS,
    needsRefresh: () => ageDays() >= MAX_AGE_DAYS,
    refresh,
    rate: () => state.rate || FALLBACK_RATE,
    warning: (iso) => state.warnings[iso] || null,
    /* Sicherheitsstufe: höherer Wert aus kuratierten Daten und Live-Warnung */
    safety(country) {
      const w = state.warnings[country.iso];
      return Math.max(country.safety, w ? w.level : 0);
    },
    nextRefresh: () => (state.fetchedAt ? state.fetchedAt + MAX_AGE_DAYS * RP.DAY_MS : null),
  };
})();
