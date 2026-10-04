/*
 * PDF-Export des Reiseplans (jsPDF + AutoTable, lokal eingebunden).
 */
RP.pdf = (function () {
  // Standardschriften in jsPDF kennen nur Latin-1 – andere Zeichen ersetzen
  function clean(s) {
    return String(s)
      .replace(/→/g, "->").replace(/[–—]/g, "-").replace(/[„“”]/g, '"').replace(/[‘’]/g, "'").replace(/…/g, "...")
      .normalize("NFC")
      .split("").map((ch) => (ch.charCodeAt(0) <= 255 ? ch : ch.normalize("NFD")[0].charCodeAt(0) <= 255 ? ch.normalize("NFD")[0] : "?")).join("");
  }

  function money(n) {
    return "CHF " + Math.round(n).toLocaleString("de-CH");
  }

  function exportPlan(plan, result, checked) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const W = doc.internal.pageSize.getWidth();
    const M = 14;
    let y = 18;
    const head = { fillColor: [31, 58, 95], textColor: 255, fontStyle: "bold" };
    const table = (opts) => {
      doc.autoTable({ startY: y, margin: { left: M, right: M }, styles: { fontSize: 8.5, cellPadding: 1.6 }, headStyles: head, ...opts });
      y = doc.lastAutoTable.finalY + 8;
    };
    const heading = (txt) => {
      if (y > 260) { doc.addPage(); y = 18; }
      doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(31, 58, 95);
      doc.text(clean(txt), M, y); y += 4;
      doc.setTextColor(0);
    };

    doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.setTextColor(31, 58, 95);
    doc.text(clean(plan.name || "Mein Reiseplan"), M, y);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(100);
    y += 6;
    doc.text(clean("Erstellt am " + RP.fmtDate(Date.now()) + "  ·  Wechselkurs 1 USD = " + RP.live.rate().toFixed(3) + " CHF  ·  alle Beträge grobe Schätzungen"), M, y);
    y += 8;

    // Übersicht
    const s = result.sums;
    doc.setTextColor(0);
    table({
      theme: "plain",
      styles: { fontSize: 10, cellPadding: 1.2 },
      body: [
        ["Reisezeitraum", RP.fmtDate(result.start) + " - " + RP.fmtDate(result.end) + " (" + result.totalDays + " Tage)"],
        ["Abflug", RP.AIRPORTS[plan.airport].name + (plan.returnHome ? ", mit Rückflug" : ", ohne Rückflug")],
        ["Länder", clean(result.stops.map((x) => x.country.name).join(" -> "))],
        ["Gesamtbudget", money(s.total) + "  (ca. " + money(result.perDay) + " pro Tag)"],
      ],
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 40 } },
    });

    heading("Route & Aufenthaltskosten");
    table({
      head: [["#", "Land", "Zeitraum", "Tage", "Stil", "Wetter (gut/ok/schlecht)", "Kosten"]],
      body: result.stops.map((x, i) => [
        i + 1, clean(x.country.name), RP.fmtDate(x.start) + " - " + RP.fmtDate(x.end), x.days, RP.STYLES[x.style],
        x.weather.G + " / " + x.weather.O + " / " + x.weather.S, money(x.cost),
      ]),
      columnStyles: { 6: { halign: "right" } },
    });

    heading("Transport");
    table({
      head: [["Von", "Nach", "Art", "Distanz", "Kosten"]],
      body: result.legs.map((l) => [clean(l.from.name), clean(l.to.name), l.mode + (l.overridden ? " (eigener Wert)" : ""), Math.round(l.km).toLocaleString("de-CH") + " km", money(l.cost)]),
      columnStyles: { 4: { halign: "right" } },
    });

    heading("Budget-Zusammenfassung");
    const rows = [
      ["Unterkunft, Essen, lokaler Transport", money(s.stay)],
      ["Flüge & Fernverkehr", money(s.transport)],
      ["Touren, Permits & Extras", money(s.extras)],
      ["Visa-Gebühren", money(s.visa)],
      ["Reiseversicherung", money(s.insurance)],
      ["Ausrüstung", money(s.equipment)],
      ["Impfungen & Medikamente", money(s.health)],
      ["Reserve (" + (plan.reservePct || 0) + " %)", money(s.reserve)],
      [{ content: "Total", styles: { fontStyle: "bold" } }, { content: money(s.total), styles: { fontStyle: "bold" } }],
    ];
    table({ head: [["Posten", "Betrag"]], body: rows, columnStyles: { 1: { halign: "right" } } });

    const extras = result.stops.flatMap((x) => x.extras.map((e) => [clean(x.country.name), clean(e.n), money(e.chf)]))
      .concat(result.health.map((h) => ["Gesundheit", clean(h.n), money(h.chf)]));
    if (extras.length) {
      heading("Details Extras & Gesundheit");
      table({ head: [["Land", "Posten", "Betrag"]], body: extras, columnStyles: { 2: { halign: "right" } } });
    }

    heading("Einreise (Schweizer Pass) & Sicherheit");
    table({
      head: [["Land", "Einreise", "Sicherheit", "Gesundheit"]],
      body: result.stops.map((x) => {
        const c = x.country;
        const w = RP.live.warning(c);
        const health = [c.health.yf === 2 ? "Gelbfieber Pflicht" : c.health.yf === 1 ? "Gelbfieber empfohlen" : "", c.health.mal === 2 ? "Malaria-Prophylaxe" : c.health.mal === 1 ? "Malaria regional" : ""].filter(Boolean).join(", ") || "-";
        return [clean(c.name), clean(RP.VISA_LABEL[c.visa.t] + ": " + c.visa.n), clean(RP.SAFETY_LABEL[x.safety] + ". " + c.sn + (w && w.level ? " Auswärtiges Amt: " + w.label + "." : "")), clean(health)];
      }),
      columnStyles: { 0: { cellWidth: 26 }, 1: { cellWidth: 55 }, 3: { cellWidth: 30 } },
    });

    const warnings = result.stops.flatMap((x) => x.warnings.map((w) => [clean(x.country.name), clean(w)]));
    if (warnings.length) {
      heading("Hinweise zur Route");
      table({ head: [["Land", "Hinweis"]], body: warnings, columnStyles: { 0: { cellWidth: 30 } } });
    }

    heading("Checkliste");
    const groups = RP.checklist.build(result);
    table({
      head: [["", "Aufgabe"]],
      body: groups.flatMap((g) => [[{ content: clean(g.title), colSpan: 2, styles: { fontStyle: "bold", fillColor: [235, 240, 247] } }]]
        .concat(g.items.map((it) => [checked[it.id] ? "[x]" : "[ ]", clean(it.text)]))),
      columnStyles: { 0: { cellWidth: 9 } },
    });

    doc.setFontSize(8); doc.setTextColor(120);
    const note = "Alle Angaben ohne Gewähr. Kosten sind Richtwerte, Visa- und Sicherheitsinformationen können sich kurzfristig ändern - vor der Reise immer die Reisehinweise des EDA (eda.admin.ch) und die offiziellen Einreisebestimmungen prüfen.";
    if (y > 270) { doc.addPage(); y = 18; }
    doc.text(doc.splitTextToSize(clean(note), W - 2 * M), M, y);

    const pages = doc.getNumberOfPages();
    for (let p = 1; p <= pages; p++) {
      doc.setPage(p); doc.setFontSize(8); doc.setTextColor(150);
      doc.text("Seite " + p + " / " + pages, W - M, 290, { align: "right" });
    }
    doc.save("Reiseplan_" + RP.isoDate(result.start) + ".pdf");
  }

  return { exportPlan, clean };
})();
