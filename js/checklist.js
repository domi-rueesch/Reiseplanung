/*
 * Checkliste vor und während der Reise – abhängig von Reisedauer und Ländern.
 */
RP.checklist = (function () {
  const GROUPS = [
    "3 Monate oder früher vorher",
    "1–2 Monate vorher",
    "Letzte Woche",
    "Packliste",
    "Unterwegs",
  ];

  const ARRIVAL_FORMS = {
    THA: "Thailand: Digital Arrival Card (TDAC) max. 3 Tage vor Ankunft",
    MYS: "Malaysia: MDAC max. 3 Tage vor Ankunft",
    PHL: "Philippinen: eTravel max. 3 Tage vor Ankunft",
    MDV: "Malediven: IMUGA-Formular 96 h vor Ankunft",
    COL: "Kolumbien: Check-MIG 72 h vor Ankunft",
    IDN: "Indonesien: All Indonesia / e-CD Zollformular",
    SGP: "Singapur: SG Arrival Card max. 3 Tage vor Ankunft",
    DOM: "Dominikanische Republik: e-Ticket vor Ein- und Ausreise",
    CUB: "Kuba: D'Viajeros-Formular vor Ankunft",
    CPV: "Kap Verde: EASE-Vorabregistrierung mind. 5 Tage vor Ankunft",
    PLW: "Palau: Online-Einreiseformular und Palau Pledge",
  };

  const HIGH_ALTITUDE = ["NPL", "BTN", "PER", "BOL", "ECU", "KGZ", "CHL", "TZA", "PAK", "TJK", "ETH", "LSO"];

  /* Kontext aus dem berechneten Plan ableiten */
  function context(result) {
    const countries = result.stops.map((s) => s.country);
    const isos = countries.map((c) => c.iso);
    const has = (fn) => countries.some(fn);
    return {
      days: result.totalDays,
      countries, isos,
      nonEurope: has((c) => c.region !== "Europa"),
      yf: has((c) => c.health.yf > 0),
      malaria: has((c) => c.health.mal > 0),
      tropical: has((c) => ["Asien", "Afrika", "Mittelamerika", "Karibik", "Südamerika", "Ozeanien"].includes(c.region)),
      visa: countries.filter((c) => c.visa.t !== "frei"),
      diving: has((c) => c.acts.includes("tauchen")),
      trekking: has((c) => c.acts.includes("trekking")),
      altitude: isos.some((i) => HIGH_ALTITUDE.includes(i)),
      roadtrip: has((c) => c.acts.includes("roadtrip") && c.region !== "Europa"),
      usa: isos.includes("USA"),
      extras: result.stops.flatMap((s) => s.extras.map((e) => e.n + " (" + s.country.name + ")")),
      forms: isos.filter((i) => ARRIVAL_FORMS[i]).map((i) => ARRIVAL_FORMS[i]),
      overstay: result.stops.filter((s) => s.country.visa.d && s.days > s.country.visa.d),
    };
  }

  /* g = Gruppe, id = stabil für gespeicherte Häkchen, when = Bedingung */
  const ITEMS = [
    // 3 Monate vorher
    { g: 0, id: "pass", when: (c) => c.nonEurope, text: "Reisepass prüfen: mind. 6 Monate über das Rückreisedatum gültig, genügend leere Seiten (neuer Pass ca. 10 Arbeitstage)" },
    { g: 0, id: "tropenarzt", when: (c) => c.nonEurope, text: "Reisemedizinische Beratung buchen (Tropeninstitut oder Hausarzt) – manche Impfserien dauern Monate" },
    { g: 0, id: "gelbfieber", when: (c) => c.yf, text: "Gelbfieberimpfung (nur in zugelassenen Impfzentren, Zertifikat in den Impfausweis)" },
    { g: 0, id: "tollwut", when: (c) => c.nonEurope && c.days >= 30, text: "Tollwut-Vorimpfung starten (3 Dosen über ca. 3–4 Wochen)" },
    { g: 0, id: "versicherung", when: () => true, text: "Reiseversicherung abschliessen: weltweite Heilungskosten, Rücktransport, Annullierung – auf Höchstdauer pro Reise achten" },
    { g: 0, id: "kk", when: (c) => c.days >= 60, text: "Krankenkasse: Deckung im Ausland bei langer Abwesenheit klären (Grundversicherung zahlt im Ausland höchstens das Doppelte des Schweizer Tarifs)" },
    { g: 0, id: "permits", when: (c) => c.extras.length > 0, text: (c) => "Kontingentierte Permits und Touren früh buchen: " + c.extras.join(", ") },
    { g: 0, id: "job", when: (c) => c.days >= 90, text: "Job: Sabbatical/Kündigung und Fristen klären" },
    { g: 0, id: "wohnung", when: (c) => c.days >= 90, text: "Wohnung: Untermiete (Zustimmung Vermieter) oder Kündigung organisieren" },
    { g: 0, id: "abmelden", when: (c) => c.days >= 180, text: "Abmeldung bei der Gemeinde prüfen – Folgen für Krankenkasse, AHV und Steuern abklären" },
    { g: 0, id: "ahv", when: (c) => c.days >= 180, text: "AHV: Beitragslücken vermeiden (Beiträge als Nichterwerbstätige/r bei der Ausgleichskasse)" },
    { g: 0, id: "steuern", when: (c) => c.days >= 180, text: "Steuern: Steuererklärung und Zahlungen während der Abwesenheit regeln" },

    // 1–2 Monate vorher
    { g: 1, id: "visa", when: (c) => c.visa.length > 0, text: (c) => "Visa/Einreisegenehmigungen organisieren: " + c.visa.map((x) => x.name + " (" + RP.VISA_LABEL[x.visa.t] + ")").join(", ") },
    { g: 1, id: "overstay", when: (c) => c.overstay.length > 0, text: (c) => "Aufenthaltsdauer prüfen – länger als erlaubt in: " + c.overstay.map((s) => s.country.name + " (" + s.days + " von " + s.country.visa.d + " T.)").join(", ") },
    { g: 1, id: "impfungen", when: (c) => c.nonEurope, text: "Basisimpfungen auffrischen (Hepatitis A/B, Tetanus, Diphtherie, ggf. Typhus)" },
    { g: 1, id: "malaria", when: (c) => c.malaria, text: "Malaria: Prophylaxe oder Notfallmedikament mit Arzt besprechen" },
    { g: 1, id: "fuehrerschein", when: (c) => c.roadtrip, text: "Internationaler Führerschein (beim TCS, ca. CHF 30)" },
    { g: 1, id: "karten", when: () => true, text: "Zwei verschiedene Kreditkarten (Visa + Mastercard) und eine Karte ohne Fremdwährungsgebühren (z.B. Revolut, Wise, Neon)" },
    { g: 1, id: "bank", when: () => true, text: "Bank: Kartenlimiten prüfen, E-Banking-Login für die Reise vorbereiten (SMS-Code an CH-Nummer?)" },
    { g: 1, id: "handy", when: (c) => c.days >= 30, text: "Handyabo reduzieren/pausieren (Nummer behalten für SMS-Codes), eSIM-Anbieter prüfen (z.B. Airalo)" },
    { g: 1, id: "vollmacht", when: (c) => c.days >= 60, text: "Vollmachten für eine Vertrauensperson (Post, Bank)" },
    { g: 1, id: "post", when: (c) => c.days >= 30, text: "Post umleiten oder zurückbehalten lassen (Post.ch)" },
    { g: 1, id: "zahnarzt", when: (c) => c.days >= 60, text: "Zahnarzt-Kontrolle vor der Abreise" },
    { g: 1, id: "flug", when: (c) => c.nonEurope, text: "Ersten Flug buchen – manche Länder verlangen ein Weiter-/Rückreiseticket bei Einreise" },
    { g: 1, id: "tauchschein", when: (c) => c.diving, text: "Falls du tauchst: Tauchschein, Logbuch und ggf. Tauchversicherung (z.B. DAN)" },
    { g: 1, id: "hoehe", when: (c) => c.altitude, text: "Höhenkrankheit: Akklimatisierung einplanen, Notfallmedikament mit Arzt besprechen" },

    // Letzte Woche
    { g: 2, id: "traveladmin", when: () => true, text: "App «Travel Admin» des EDA installieren und Reise registrieren" },
    { g: 2, id: "kopien", when: () => true, text: "Kopien von Pass, Versicherungspolice und Impfausweis digital speichern" },
    { g: 2, id: "notfall", when: () => true, text: "Notfallnummern notieren: Versicherung, Kartensperrung, Schweizer Vertretungen" },
    { g: 2, id: "offline", when: () => true, text: "Offline-Karten (Organic Maps, Google Maps) und Übersetzer herunterladen" },
    { g: 2, id: "formulare", when: (c) => c.forms.length > 0, text: (c) => "Einreiseformulare online ausfüllen: " + c.forms.join("; ") },
    { g: 2, id: "bargeld", when: (c) => c.nonEurope, text: "Etwas Bargeld in USD/EUR als Reserve" },
    { g: 2, id: "eda", when: () => true, text: "Aktuelle Reisehinweise des EDA für alle Länder lesen" },

    // Packliste
    { g: 3, id: "apotheke", when: () => true, text: "Reiseapotheke: Durchfall, Schmerzen, Desinfektion, Pflaster, Blasenpflaster" },
    { g: 3, id: "muecken", when: (c) => c.tropical || c.malaria, text: "Mückenschutz (DEET/Icaridin), ggf. imprägniertes Moskitonetz" },
    { g: 3, id: "wasser", when: (c) => c.nonEurope, text: "Wasserfilter oder Entkeimung (z.B. Filterflasche, UV-Stift)" },
    { g: 3, id: "schuhe", when: () => true, text: "Eingelaufene Wanderschuhe und Regenjacke" },
    { g: 3, id: "warm", when: (c) => c.altitude || c.trekking, text: "Warme Schicht (Daunenjacke, Mütze, Handschuhe) für Höhe und kalte Nächte" },
    { g: 3, id: "schlafsack", when: (c) => c.trekking, text: "Schlafsack oder Inlett für Hütten und Trekking-Lodges" },
    { g: 3, id: "lampe", when: () => true, text: "Stirnlampe" },
    { g: 3, id: "adapter", when: (c) => c.nonEurope, text: "Universal-Reiseadapter" },
    { g: 3, id: "rucksack", when: (c) => c.days >= 30, text: "Rucksack max. 40–50 l – weniger ist mehr" },
    { g: 3, id: "schnorchel", when: (c) => c.diving, text: "Eigene Schnorchelmaske" },

    // Unterwegs
    { g: 4, id: "ausgaben", when: () => true, text: "Ausgaben laufend erfassen (z.B. App TravelSpend) und mit dem Plan vergleichen" },
    { g: 4, id: "hinweise", when: () => true, text: "Reisehinweise vor jedem Grenzübertritt neu prüfen" },
    { g: 4, id: "backup", when: (c) => c.days >= 30, text: "Fotos und Dokumente regelmässig in die Cloud sichern" },
    { g: 4, id: "fristen", when: (c) => c.visa.length > 0 || c.overstay.length > 0, text: "Visa-Fristen im Blick behalten, Verlängerungen rechtzeitig beantragen" },
  ];

  function build(result) {
    const ctx = context(result);
    return GROUPS.map((title, g) => ({
      title,
      items: ITEMS.filter((it) => it.g === g && it.when(ctx)).map((it) => ({
        id: it.id,
        text: typeof it.text === "function" ? it.text(ctx) : it.text,
      })),
    })).filter((grp) => grp.items.length);
  }

  return { build };
})();
