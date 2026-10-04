/*
 * Routenoptimierer: findet eine gute Reihenfolge der Länder.
 * Bewertet werden Transportkosten (Schätzung) und – je nach Gewichtung – Wetter und Touristenandrang
 * während des Aufenthalts. Bis 8 Länder werden alle Reihenfolgen geprüft, darüber eine Heuristik.
 */
RP.optimizer = (function () {
  const WEATHER_PENALTY = { G: 0, O: 8, S: 30 }; // CHF-Äquivalent pro Tag
  const CROWD_PENALTY = { 1: 0, 2: 2, 3: 6 };

  function prepare(plan, weights) {
    const stops = plan.stops.filter((s) => RP.byIso[s.iso]);
    const n = stops.length;
    const home = RP.budget.homePlace(plan);
    const places = stops.map((s) => RP.budget.place(s.iso));
    const totalDays = stops.reduce((a, s) => a + Math.max(1, Number(s.days) || 1), 0);

    // Transportkosten-Matrix; Index n = Zuhause
    const all = places.concat([home]);
    const cost = all.map((a) => all.map((b) => (a === b ? 0 : RP.budget.estimateLeg(a, b, plan.airport).cost)));

    return { stops, n, totalDays, cost, weights, returnHome: plan.returnHome };
  }

  /* Präfixsummen der Tages-Strafpunkte pro Land ab einem Startdatum */
  function dayPenalties(prep, startTs) {
    const len = prep.totalDays + 1;
    const months = new Array(len);
    for (let d = 0; d < len; d++) months[d] = RP.monthOf(startTs + d * RP.DAY_MS);
    return prep.stops.map((s) => {
      const c = RP.byIso[s.iso];
      const p = new Float64Array(len + 1);
      for (let d = 0; d < len; d++) {
        const m = months[d];
        p[d + 1] = p[d] + prep.weights.weather * WEATHER_PENALTY[c.clim[m]] + prep.weights.crowd * CROWD_PENALTY[c.crowd[m]];
      }
      return p;
    });
  }

  function score(order, prep, pen) {
    const { n, cost, stops } = prep;
    let total = 0, prev = n, offset = 0;
    for (const i of order) {
      total += cost[prev][i];
      const days = Math.max(1, Number(stops[i].days) || 1);
      total += pen[i][offset + days] - pen[i][offset];
      offset += days;
      prev = i;
    }
    if (prep.returnHome && order.length) total += cost[prev][n];
    return total;
  }

  function permutations(n, visit) {
    const a = [...Array(n).keys()];
    const c = new Array(n).fill(0);
    visit(a);
    let i = 0;
    while (i < n) {
      if (c[i] < i) {
        const k = i % 2 ? c[i] : 0;
        [a[k], a[i]] = [a[i], a[k]];
        visit(a);
        c[i]++;
        i = 0;
      } else {
        c[i] = 0;
        i++;
      }
    }
  }

  function best(prep, pen) {
    const { n } = prep;
    if (n <= 1) return { order: [...Array(n).keys()], score: score([...Array(n).keys()], prep, pen) };
    if (n <= 8) {
      let bestOrder = null, bestScore = Infinity;
      permutations(n, (a) => {
        const s = score(a, prep, pen);
        if (s < bestScore) { bestScore = s; bestOrder = a.slice(); }
      });
      return { order: bestOrder, score: bestScore };
    }
    // Heuristik: mehrere Zufallsstarts + Verbesserung durch Verschieben und Umdrehen von Abschnitten
    let bestOrder = null, bestScore = Infinity;
    for (let r = 0; r < 40; r++) {
      let order = [...Array(n).keys()];
      if (r > 0) for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
      let cur = score(order, prep, pen), improved = true;
      while (improved) {
        improved = false;
        for (let i = 0; i < n - 1; i++) {
          for (let j = i + 1; j < n; j++) {
            const rev = order.slice(0, i).concat(order.slice(i, j + 1).reverse(), order.slice(j + 1));
            const s1 = score(rev, prep, pen);
            if (s1 < cur - 0.01) { order = rev; cur = s1; improved = true; continue; }
            const moved = order.slice(); const [x] = moved.splice(i, 1); moved.splice(j, 0, x);
            const s2 = score(moved, prep, pen);
            if (s2 < cur - 0.01) { order = moved; cur = s2; improved = true; }
          }
        }
      }
      if (cur < bestScore) { bestScore = cur; bestOrder = order; }
    }
    return { order: bestOrder, score: bestScore };
  }

  /* Optimiert die Reihenfolge für das gegebene Startdatum */
  function optimize(plan, weights) {
    const prep = prepare(plan, weights);
    const pen = dayPenalties(prep, RP.parseDate(plan.start));
    const current = score([...Array(prep.n).keys()], prep, pen);
    const result = best(prep, pen);
    return { stops: result.order.map((i) => prep.stops[i]), before: current, after: result.score };
  }

  /* Probiert alle 12 Startmonate (jeweils am 1.) innerhalb der nächsten 12 Monate */
  function bestStartMonth(plan, weights) {
    const prep = prepare(plan, weights);
    const now = new Date();
    const results = [];
    for (let k = 1; k <= 12; k++) {
      const ts = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + k, 1);
      const pen = dayPenalties(prep, ts);
      const r = best(prep, pen);
      results.push({ start: RP.isoDate(ts), score: r.score, stops: r.order.map((i) => prep.stops[i]) });
    }
    results.sort((a, b) => a.score - b.score);
    return results;
  }

  return { optimize, bestStartMonth };
})();
