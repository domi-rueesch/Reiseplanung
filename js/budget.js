/*
 * Budget-Berechnung für einen Reiseplan.
 * Alle Ergebnisse in CHF. Es handelt sich um grobe Schätzungen.
 */
RP.budget = (function () {
  // Preisniveau für Flüge je Region (1 = Durchschnitt)
  const FLIGHT_FACTOR = {
    "Europa": 0.85, "Afrika": 1.3, "Naher Osten": 1.0, "Asien": 0.8,
    "Ozeanien": 1.1, "Nordamerika": 1.0, "Mittelamerika": 1.0, "Karibik": 1.1, "Südamerika": 1.1,
    "Antarktis": 1.2,
  };
  // Saisonzuschlag auf Tageskosten nach Touristenaufkommen
  const SEASON_FACTOR = { 1: 0.92, 2: 1.0, 3: 1.1 };

  function homePlace(plan) {
    const a = RP.AIRPORTS[plan.airport] || RP.AIRPORTS.ZRH;
    return { iso: "HOME", name: a.name, pos: a.pos, region: "Europa" };
  }

  function place(iso) {
    const c = RP.byIso[iso];
    return { iso, name: c.name, pos: c.hub, region: c.region };
  }

  /* Schätzung für eine Teilstrecke. Gleiche Region und kurze Distanz → Bus/Zug, sonst Flug. */
  function estimateLeg(from, to, airport) {
    const km = RP.km(from.pos, to.pos);
    if (from.region === to.region && km < 1300) {
      const perKm = from.region === "Europa" ? 0.09 : 0.04;
      return { mode: "Bus / Zug", km, cost: Math.round((15 + perKm * km) / 5) * 5 };
    }
    let factor = ((FLIGHT_FACTOR[from.region] || 1) + (FLIGHT_FACTOR[to.region] || 1)) / 2;
    const involvesHome = from.iso === "HOME" || to.iso === "HOME";
    if (involvesHome && airport === "BSL") {
      // Basel: viele Billigflüge in Europa, Langstrecke meist mit Umsteigen
      const other = from.iso === "HOME" ? to : from;
      factor *= other.region === "Europa" ? 0.85 : 1.05;
    }
    const cost = (50 + 0.055 * km) * factor;
    return { mode: "Flug", km, cost: Math.round(cost / 10) * 10 };
  }

  /* Tageskosten CHF für ein Land in einem bestimmten Monat */
  function dailyCost(country, style, month) {
    const usd = country.cost[style];
    return usd * RP.live.rate() * SEASON_FACTOR[country.crowd[month]];
  }

  /* Impfungen & Medikamente – grobe Schätzung anhand der Länder und Reisedauer */
  function healthCosts(stops, totalDays) {
    const countries = stops.map((s) => RP.byIso[s.iso]);
    const nonEurope = countries.some((c) => c.region !== "Europa");
    const items = [];
    if (!nonEurope) return items;
    items.push({ n: "Basisimpfungen auffrischen (Hepatitis A/B, Tetanus …)", chf: 250 });
    if (countries.some((c) => ["Asien", "Afrika"].includes(c.region))) items.push({ n: "Typhus-Impfung", chf: 60 });
    if (countries.some((c) => c.health.yf > 0)) items.push({ n: "Gelbfieber-Impfung", chf: 90 });
    if (totalDays >= 30) items.push({ n: "Tollwut-Vorimpfung (3 Dosen)", chf: 450 });
    const seAsia = stops.filter((s) => ["THA", "VNM", "LAO", "KHM", "MYS", "IDN", "PHL", "IND", "NPL"].includes(s.iso));
    if (seAsia.reduce((t, s) => t + s.days, 0) >= 30) items.push({ n: "Japanische Enzephalitis (bei längerem Aufenthalt auf dem Land)", chf: 300 });
    const malDays = stops.reduce((t, s) => t + (RP.byIso[s.iso].health.mal === 2 ? s.days : 0), 0);
    if (countries.some((c) => c.health.mal > 0)) items.push({ n: "Malaria-Notfallmedikament (Standby)", chf: 60 });
    if (malDays > 0) items.push({ n: "Malaria-Prophylaxe (" + malDays + " Tage)", chf: Math.round(malDays * 3) });
    return items;
  }

  /*
   * Berechnet den kompletten Plan.
   * plan = { start, airport, returnHome, reservePct, insurancePerMonth, equipment, includeHealth,
   *          stops: [{ iso, days, style, extras: [index], legCost }] }
   */
  function compute(plan) {
    const stops = [];
    const legs = [];
    const home = homePlace(plan);
    let t = RP.parseDate(plan.start);
    let prev = home;

    plan.stops.forEach((s, i) => {
      const c = RP.byIso[s.iso];
      if (!c) return;
      const cur = place(s.iso);
      const est = estimateLeg(prev, cur, plan.airport);
      const legCost = s.legCost != null && s.legCost !== "" ? Number(s.legCost) : est.cost;
      legs.push({ from: prev, to: cur, mode: est.mode, km: est.km, estimate: est.cost, cost: legCost, overridden: legCost !== est.cost, stopIndex: i });

      const days = Math.max(1, Number(s.days) || 1);
      const start = t;
      let cost = 0;
      const weather = { G: 0, O: 0, S: 0 };
      const crowd = { 1: 0, 2: 0, 3: 0 };
      const months = [];
      for (let d = 0; d < days; d++) {
        const m = RP.monthOf(start + d * RP.DAY_MS);
        cost += dailyCost(c, s.style, m);
        weather[c.clim[m]]++;
        crowd[c.crowd[m]]++;
        if (!months.includes(m)) months.push(m);
      }
      const extras = (s.extras || []).map((idx) => c.extras[idx]).filter(Boolean)
        .map((e) => ({ n: e.n, chf: e.usd * RP.live.rate() }));
      const visaFee = (c.visa.fee || 0) * RP.live.rate();

      const warnings = [];
      if (c.visa.d && days > c.visa.d) warnings.push("Aufenthalt (" + days + " T.) länger als visumfrei/Visum erlaubt (" + c.visa.d + " T.) – Verlängerung oder Aus-/Wiedereinreise nötig.");
      if (weather.S > days / 2) warnings.push("Mehr als die Hälfte der Zeit ungünstiges Reisewetter.");
      const safety = RP.live.safety(c);
      if (safety >= 3) warnings.push("Sicherheitslage: " + RP.SAFETY_LABEL[safety] + " – Reisehinweise prüfen.");

      stops.push({
        ...s, country: c, days, start, end: start + (days - 1) * RP.DAY_MS, cost, weather, crowd, months,
        extras, extrasCost: extras.reduce((a, e) => a + e.chf, 0), visaFee, warnings, safety,
      });
      t = start + days * RP.DAY_MS;
      prev = cur;
    });

    if (plan.returnHome && stops.length) {
      const est = estimateLeg(prev, home, plan.airport);
      const legCost = plan.returnLegCost != null && plan.returnLegCost !== "" ? Number(plan.returnLegCost) : est.cost;
      legs.push({ from: prev, to: home, mode: est.mode, km: est.km, estimate: est.cost, cost: legCost, overridden: legCost !== est.cost, stopIndex: -1 });
    }

    const totalDays = stops.reduce((a, s) => a + s.days, 0);
    const health = plan.includeHealth ? healthCosts(stops, totalDays) : [];
    const sums = {
      stay: stops.reduce((a, s) => a + s.cost, 0),
      transport: legs.reduce((a, l) => a + l.cost, 0),
      extras: stops.reduce((a, s) => a + s.extrasCost, 0),
      visa: stops.reduce((a, s) => a + s.visaFee, 0),
      insurance: (Number(plan.insurancePerMonth) || 0) * Math.ceil(totalDays / 30),
      equipment: Number(plan.equipment) || 0,
      health: health.reduce((a, h) => a + h.chf, 0),
    };
    sums.subtotal = Object.values(sums).reduce((a, b) => a + b, 0);
    sums.reserve = sums.subtotal * ((Number(plan.reservePct) || 0) / 100);
    sums.total = sums.subtotal + sums.reserve;

    return {
      stops, legs, health, sums, totalDays,
      start: RP.parseDate(plan.start),
      end: RP.parseDate(plan.start) + Math.max(0, totalDays - 1) * RP.DAY_MS,
      perDay: totalDays ? sums.total / totalDays : 0,
    };
  }

  return { compute, estimateLeg, dailyCost, place, homePlace };
})();
