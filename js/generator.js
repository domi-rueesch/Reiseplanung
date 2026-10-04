/*
 * Reise-Generator: erstellt zufällige, aber passende Reiserouten.
 *
 * Vorgehen: Es werden viele zufällige Routen gebaut. Jede Etappe wählt per gewichtetem Zufall ein Land,
 * das im jeweiligen Zeitraum zu Wetter-, Touristen- und Aktivitätswünschen passt und nicht zu weit von der
 * vorherigen Etappe entfernt liegt. Danach wird das Gesamtbudget berechnet; aus den besten Routen
 * innerhalb des Budgets werden zufällig einige Vorschläge ausgewählt.
 */
RP.generator = (function () {
  const PACE_DAYS = { gemuetlich: 21, ausgewogen: 14, schnell: 8 };
  const MIN_STOP_DAYS = 4;
  const ATTEMPTS = 400;

  /* Wie gut passt ein Land in einem Zeitfenster? null = passt nicht (harte Kriterien) */
  function evaluate(c, startTs, days, opts) {
    let G = 0, O = 0, S = 0, crowdSum = 0, high = 0, cost = 0;
    for (let d = 0; d < days; d++) {
      const m = RP.monthOf(startTs + d * RP.DAY_MS);
      const w = c.clim[m];
      if (w === "G") G++; else if (w === "O") O++; else S++;
      const cr = Number(c.crowd[m]);
      crowdSum += cr;
      if (cr === 3) high++;
      cost += RP.budget.dailyCost(c, opts.style, m);
    }
    if (opts.weather === "ideal" && (S > 0 || G < days * 0.6)) return null;
    if (opts.weather === "ok" && S > days * 0.25) return null;
    if (opts.crowd === "wenig" && high > days * 0.3) return null;

    const matches = opts.acts.filter((a) => c.acts.includes(a));
    if (opts.acts.length && !matches.length) return null;

    const weatherScore = (G + 0.5 * O) / days;
    const crowdScore = 1 - (crowdSum / days - 1) / 2; // 1 = wenig, 0 = viel
    const actScore = opts.acts.length ? matches.length / opts.acts.length : 0;
    const perDay = cost / days;
    const costPenalty = Math.max(0, perDay / opts.targetDaily - 1);
    // Bekanntheit: durchschnittlicher Touristenandrang übers Jahr (0 = Geheimtipp, 1 = Klassiker)
    const popularity = ([...c.crowd].reduce((a, x) => a + Number(x), 0) / 12 - 1) / 2;
    const score =
      (opts.weather === "egal" ? 0.5 : 3) * weatherScore +
      ({ egal: 0, lieber: 1.5, wenig: 2 }[opts.crowd] || 0) * crowdScore +
      2.5 * actScore -
      2.5 * costPenalty +
      ({ klassiker: 3, gemischt: 1.2, geheimtipp: -1.5 }[opts.kind] || 0) * popularity;
    return { score, G, O, S, matches, perDay };
  }

  function pickWeighted(items, rand) {
    const total = items.reduce((a, it) => a + it.w, 0);
    let r = rand() * total;
    for (const it of items) {
      r -= it.w;
      if (r <= 0) return it;
    }
    return items[items.length - 1];
  }

  /* Eine zufällige Route bauen */
  function buildRoute(opts, pool, rand) {
    const home = RP.AIRPORTS[opts.airport] || RP.AIRPORTS.ZRH;
    const maxStops = Math.max(1, Math.floor(opts.days / MIN_STOP_DAYS));
    const n = Math.min(maxStops, 15, Math.max(1, Math.round((opts.days / PACE_DAYS[opts.pace]) * (0.75 + 0.5 * rand()))));
    let remaining = opts.days;
    let t = RP.parseDate(opts.start);
    let pos = home.pos;
    const used = new Set();
    const stops = [];

    for (let i = 0; i < n; i++) {
      const left = n - i;
      let days;
      if (left === 1) days = remaining;
      else {
        const base = remaining / left;
        days = Math.round(base * (0.7 + 0.6 * rand()));
        days = Math.max(MIN_STOP_DAYS, Math.min(days, remaining - (left - 1) * MIN_STOP_DAYS));
      }
      const options = [];
      for (const c of pool) {
        if (used.has(c.iso)) continue;
        const ev = evaluate(c, t, days, opts);
        if (!ev) continue;
        const km = RP.km(pos, c.hub);
        // Erste Etappe: weltweit frei; danach stark nahe Länder bevorzugen (zusammenhängende Route)
        const near = i === 0 ? 0 : km / 1000;
        options.push({ c, ev, w: Math.exp(ev.score - near) });
      }
      if (!options.length) return null;
      options.sort((a, b) => b.w - a.w);
      const choice = pickWeighted(options.slice(0, 25), rand);
      stops.push({ iso: choice.c.iso, days, style: opts.style, extras: [], legCost: null, _ev: choice.ev });
      used.add(choice.c.iso);
      pos = choice.c.hub;
      t += days * RP.DAY_MS;
      remaining -= days;
    }
    return stops;
  }

  /* Zufallszahlen mit Startwert, damit «Neu würfeln» immer andere Ergebnisse liefert */
  function rng(seed) {
    let s = seed >>> 0 || 1;
    return () => {
      s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
      return (s >>> 0) / 4294967296;
    };
  }

  /*
   * opts = { start, days, budget, style, pace, weather: egal|ok|ideal, crowd: egal|lieber|wenig, kind,
   *          acts: [], regions: [], maxSafety, airport }
   * planSettings = Einstellungen aus dem Reiseplan (Versicherung, Reserve …) für die Budgetberechnung
   */
  function generate(opts, planSettings, count, seed) {
    const rand = rng(seed || Date.now());
    const pool = COUNTRIES.filter((c) =>
      c.iso !== "CHE" &&
      RP.live.safety(c) <= opts.maxSafety &&
      (!opts.regions.length || opts.regions.includes(c.region)));
    const o = Object.assign({}, opts, {
      // grober Anteil des Budgets für den Aufenthalt (Rest: Flüge, Versicherung, Reserve …)
      targetDaily: Math.max(10, (opts.budget * 0.65) / opts.days),
    });

    const candidates = [];
    const seen = new Set();
    for (let k = 0; k < ATTEMPTS; k++) {
      const stops = buildRoute(o, pool, rand);
      if (!stops) continue;
      const key = stops.map((s) => s.iso).join("-");
      if (seen.has(key)) continue;
      seen.add(key);
      const planLike = Object.assign({}, planSettings, {
        start: opts.start, airport: opts.airport, returnHome: true, returnLegCost: null,
        stops: stops.map(({ _ev, ...s }) => s),
      });
      const result = RP.budget.compute(planLike);
      // Passung der Länder minus Anteil der Transportkosten am Budget (viele Langstreckenflüge = schlechter)
      const avgScore = stops.reduce((a, s) => a + s._ev.score * s.days, 0) / opts.days -
        3 * (result.sums.transport / opts.budget);
      const matched = new Set(stops.flatMap((s) => s._ev.matches));
      candidates.push({
        stops: planLike.stops, result, score: avgScore, matched: [...matched],
        overBudget: result.sums.total > opts.budget,
      });
    }

    const within = candidates.filter((c) => !c.overBudget).sort((a, b) => b.score - a.score);
    let picks;
    if (within.length) {
      // aus den besten Routen zufällig auswählen – möglichst mit unterschiedlichen Ländern
      const top = within.slice(0, Math.max(count * 4, 12));
      picks = [];
      while (picks.length < count && top.length) {
        const idx = Math.floor(rand() * Math.min(top.length, 8));
        const cand = top.splice(idx, 1)[0];
        const isos = new Set(cand.stops.map((s) => s.iso));
        const overlap = picks.some((p) => p.stops.filter((s) => isos.has(s.iso)).length > p.stops.length / 2);
        if (!overlap || top.length < count) picks.push(cand);
      }
    } else {
      // nichts im Budget: die günstigsten Varianten zeigen
      picks = candidates.sort((a, b) => a.result.sums.total - b.result.sums.total).slice(0, count);
    }
    return { picks, tried: candidates.length, withinBudget: within.length };
  }

  return { generate, PACE_DAYS };
})();
