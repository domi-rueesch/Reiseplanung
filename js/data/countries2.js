/*
 * Weitere Länder im kompakten Format (gleiche Bedeutung der Felder wie in countries.js).
 *
 * K(iso, name, region, hub, währung, kosten, klima, touristen, klimaNotiz,
 *   "aktivität aktivität …", "Highlight|Highlight|…", "Tipp|Tipp|…",
 *   [visumTyp, tage, gebührUSD, hinweis], sicherheit, sicherheitsNotiz,
 *   [gelbfieber, malaria, gesundheitsHinweis], [[extra, usd], …], {zusatzfelder})
 */
window.K = function (iso, name, region, hub, currency, cost, clim, crowd, cn, acts, sights, tips, visa, safety, sn, health, extras, more) {
  COUNTRIES.push(Object.assign({
    iso, name, region, hub, currency, cost, clim, crowd, cn,
    acts: acts.split(" ").filter(Boolean),
    sights: sights.split("|"),
    tips: tips.split("|"),
    visa: { t: visa[0], d: visa[1], fee: visa[2], n: visa[3] },
    safety, sn,
    health: { yf: health[0], mal: health[1], n: health[2] },
    extras: (extras || []).map(([n, usd]) => ({ n, usd })),
  }, more || {}));
};

const SCHENGEN = ["frei", 90, 0, "Schengen – Identitätskarte genügt"];
const UK_ETA = ["eta", 180, 20, "ETA (Electronic Travel Authorisation) online vor Abreise, ca. GBP 16. Reisepass nötig."];
const NONE = [0, 0];
const GBR = { parent: "GBR" };

// ───────────────────────── Grossbritannien (Landesteile) ─────────────────────────
K("ENG", "England", "Europa", [51.47, -0.45], "GBP", [85, 160, 300], "SSSOGGGGOSSS", "111223332111",
  "Mai–Sep am angenehmsten. Regen ist jederzeit möglich, Sommer selten heiss.",
  "wandern velo kultur roadtrip kajak surfen strand",
  "Lake District|Peak District|South West Coast Path (Cornwall)|Jurassic Coast|Yorkshire Dales|London",
  "Railcard und frühe Buchung machen die Bahn deutlich günstiger|Coast to Coast Walk quer durch Nordengland|Viele Museen in London sind gratis",
  UK_ETA, 1, "Sicher. Erhöhte Terrorwarnstufe in Grossstädten, Taschendiebstahl in London.", NONE, [], GBR);
K("SCT", "Schottland", "Europa", [55.95, -3.37], "GBP", [80, 150, 280], "SSSOGGGOOSSS", "111123332111",
  "Mai/Juni oft am trockensten. Jul–Sep Mücken (Midges) im Westen. Winter kurz und stürmisch.",
  "wandern trekking berge kajak velo roadtrip kultur",
  "Isle of Skye|West Highland Way|Ben Nevis & Glencoe|Cairngorms NP|Äussere Hebriden|Edinburgh",
  "Wildcampen erlaubt (Scottish Outdoor Access Code)|Mückenschutz gegen Midges mitnehmen|North Coast 500 als Roadtrip",
  UK_ETA, 1, "Sehr sicher. Wetterumschwünge in den Highlands.", NONE, [], GBR);
K("WLS", "Wales", "Europa", [51.4, -3.34], "GBP", [75, 140, 260], "SSSOGGGGOSSS", "111123332111",
  "Mai–Sep ideal. Atlantisches Klima, viel Regen in den Bergen.",
  "wandern klettern surfen kajak velo kultur strand",
  "Eryri (Snowdonia)|Pembrokeshire Coast Path|Bannau Brycheiniog (Brecon Beacons)|Wales Coast Path|Halbinsel Llŷn|Conwy & Caernarfon (Burgen)",
  "Wales Coast Path: 1400 km entlang der ganzen Küste|Klettern, Zipline und Mountainbike in Nordwales|Günstiger als England, besonders ausserhalb der Ferien",
  UK_ETA, 1, "Sehr sicher.", NONE, [], GBR);
K("NIR", "Nordirland", "Europa", [54.66, -6.22], "GBP", [75, 140, 250], "SSSOGGGGOSSS", "111123332111",
  "Mai–Sep ideal, mild und wechselhaft.",
  "wandern kultur roadtrip kajak velo",
  "Giant's Causeway|Causeway Coastal Route|Mourne Mountains|Belfast|Fermanagh Lakelands|Dark Hedges",
  "Keine Grenzkontrollen zu Irland, die ETA ist trotzdem nötig|Bezahlt wird in Pfund, nicht in Euro|Gut mit einer Irland-Reise kombinierbar",
  UK_ETA, 1, "Sicher. Gelegentlich Spannungen rund um die Paraden im Juli.", NONE, [], GBR);

// ───────────────────────── Europa ─────────────────────────
K("CHE", "Schweiz", "Europa", [47.46, 8.55], "CHF", [110, 200, 380], "OOOOGGGGGOSO", "232112332212",
  "Sommer zum Wandern, Winter zum Skifahren. Nebelsaison im Mittelland Nov–Feb.",
  "wandern trekking berge klettern velo kajak wintersport",
  "Berner Oberland|Zermatt & Matterhorn|Engadin & Nationalpark|Via Alpina|Tessin|Aletschgletscher",
  "Halbtax und Sparbillette für den ÖV|SAC-Hütten früh reservieren|Gut als Probelauf für Ausrüstung vor der grossen Reise",
  ["frei", 0, 0, "Heimatland"], 1, "Sehr sicher.", NONE, []);
K("DEU", "Deutschland", "Europa", [50.04, 8.56], "EUR", [70, 130, 250], "SSOOGGGGGOSS", "111122333112",
  "Mai–Sep ideal. Dezember: Weihnachtsmärkte.",
  "wandern velo kultur kajak klettern",
  "Sächsische Schweiz (Malerweg)|Bayerische Alpen & Zugspitze|Schwarzwald|Berlin|Rügen & Ostsee|Moselsteig",
  "Deutschlandticket für Nahverkehr (ca. EUR 58/Monat)|Fernbusse günstiger als ICE|Klettern im Elbsandstein mit strengen Regeln",
  SCHENGEN, 1, "Sicher. Erhöhtes Terrorrisiko an Grossanlässen.", NONE, []);
K("FRA", "Frankreich", "Europa", [49.01, 2.55], "EUR", [75, 140, 280], "OOOGGGGOGGSO", "212223332111",
  "Alpen und Pyrenäen Jun–Sep, Süden ideal im Frühling/Herbst. August = Ferienzeit, alles voll.",
  "wandern trekking klettern berge velo kajak surfen strand kultur wintersport",
  "Tour du Mont Blanc|GR20 (Korsika)|Gorges du Verdon|Pyrenäen|Bretagne & Atlantikküste|Paris",
  "GR-Fernwanderwege perfekt markiert|Surfen in Biarritz und Hossegor|August meiden – Ferien der Franzosen",
  SCHENGEN, 1, "Sicher. Erhöhtes Terrorrisiko, Demonstrationen in Paris.", NONE, []);
K("AUT", "Österreich", "Europa", [48.11, 16.57], "EUR", [75, 140, 270], "OOOOGGGGGOSO", "332112332113",
  "Sommer zum Wandern (Jun–Sep), Winter ideal zum Skifahren.",
  "wandern trekking berge klettern velo kajak wintersport kultur",
  "Hohe Tauern & Grossglockner|Zillertal|Salzkammergut|Wien|Dachstein|Adlerweg (Tirol)",
  "Alpenvereinsmitgliedschaft lohnt sich für Hütten|Klimaticket für ÖV|Vignette für Autobahn",
  SCHENGEN, 1, "Sehr sicher.", NONE, []);
K("NLD", "Niederlande", "Europa", [52.31, 4.77], "EUR", [80, 150, 280], "SSOGGGGGOOSS", "111322332111",
  "April: Tulpenblüte. Sommer angenehm, Winter grau.",
  "velo kultur kajak strand",
  "Amsterdam|Keukenhof (Tulpen)|Wattenmeer & Inseln|Kinderdijk|Hoge Veluwe NP|Utrecht",
  "Alles mit dem Velo erreichbar|Inseln im Wattenmeer für Ruhe|Unterkünfte in Amsterdam sehr teuer",
  SCHENGEN, 1, "Sicher. Velodiebstahl häufig.", NONE, []);
K("BEL", "Belgien", "Europa", [50.9, 4.48], "EUR", [75, 140, 260], "SSOOGGGGOOSS", "111122332111",
  "Mai–Sep ideal.",
  "kultur velo wandern kajak",
  "Brügge|Gent|Brüssel|Ardennen|Antwerpen|Hohes Venn",
  "Ardennen für Kajak und Wandern|Zugtickets am Wochenende günstiger|Gut als Wochenendtrip",
  SCHENGEN, 1, "Sicher.", NONE, []);
K("LUX", "Luxemburg", "Europa", [49.63, 6.21], "EUR", [85, 160, 300], "SSOOGGGGGOSS", "111122332111",
  "Mai–Sep ideal.",
  "wandern velo kultur",
  "Mullerthal Trail|Stadt Luxemburg|Vianden|Ösling (Ardennen)|Moseltal",
  "Öffentlicher Verkehr im ganzen Land gratis|Mullerthal Trail: «Kleine Luxemburger Schweiz»",
  SCHENGEN, 1, "Sehr sicher.", NONE, []);
K("IRL", "Irland", "Europa", [53.42, -6.27], "EUR", [85, 160, 300], "SSSOGGGGOSSS", "111123332111",
  "Mai–Sep ideal. Immer mit Regen rechnen.",
  "wandern surfen roadtrip kultur kajak velo",
  "Wild Atlantic Way|Cliffs of Moher|Connemara|Ring of Kerry|Dingle|Wicklow Mountains",
  "Mietauto ideal für den Wild Atlantic Way|Pubs mit Live-Musik|Unterkünfte im Sommer früh buchen",
  ["frei", 90, 0, "EU, nicht Schengen – Identitätskarte genügt"], 1, "Sicher.", NONE, []);
K("DNK", "Dänemark", "Europa", [55.62, 12.65], "DKK", [95, 170, 320], "SSSOGGGGOSSS", "111123332111",
  "Jun–Aug ideal, lange Tage.",
  "velo kultur strand kajak surfen",
  "Kopenhagen|Skagen|Bornholm|Møns Klint|Klitmøller (Cold Hawaii)|Aarhus",
  "Velowege überall|Teuer – Supermärkte nutzen|Kitesurfen an der Westküste",
  SCHENGEN, 1, "Sehr sicher.", NONE, []);
K("SWE", "Schweden", "Europa", [59.65, 17.92], "SEK", [85, 160, 300], "OOOSOGGGOSSO", "211112332111",
  "Sommer (Jun–Aug) zum Wandern und Kanufahren. Winter: Nordlicht und Hundeschlitten in Lappland.",
  "wandern trekking kajak berge wintersport roadtrip",
  "Kungsleden|Sarek NP|Schärengarten Stockholm|Stockholm|Värmland (Flossfahrt)|Abisko (Nordlicht)",
  "Jedermannsrecht – Wildcampen erlaubt|Kanutouren in Värmland und Dalsland|Bargeld wird kaum akzeptiert",
  SCHENGEN, 1, "Sehr sicher.", NONE, []);
K("FIN", "Finnland", "Europa", [60.32, 24.96], "EUR", [85, 160, 300], "OOOSOGGGOSSO", "221112332113",
  "Sommer: Seen, Mitternachtssonne. Winter: Lappland mit Schnee und Nordlicht.",
  "wandern trekking kajak wintersport velo",
  "Lappland (Saariselkä, Levi)|Finnische Seenplatte|Karhunkierros-Trail|Helsinki|Nuuksio NP|Åland-Inseln",
  "Wildnishütten (autiotupa) gratis nutzbar|Sauna ist Kultur|Lappland im Dezember teuer und voll",
  SCHENGEN, 1, "Sehr sicher.", NONE, []);
K("EST", "Estland", "Europa", [59.41, 24.83], "EUR", [55, 100, 190], "SSSOGGGGOSSS", "111122332111",
  "Mai–Sep ideal.",
  "wandern kajak kultur velo",
  "Tallinn (Altstadt)|Lahemaa NP|Soomaa NP (Moore, Kanu)|Saaremaa|Tartu",
  "Moorwanderungen auf Holzstegen|Sehr digital, überall WLAN|Fähre nach Helsinki",
  SCHENGEN, 1, "Sicher.", NONE, []);
K("LVA", "Lettland", "Europa", [56.92, 23.97], "EUR", [50, 95, 180], "SSSOGGGGOSSS", "111122332111",
  "Mai–Sep ideal.",
  "wandern kajak kultur strand",
  "Riga|Gauja NP|Kurische Küste & Kap Kolka|Kuldīga|Jūrmala",
  "Gauja NP: Kanu und Wandern|Riga günstiger als Tallinn|Baltic Coastal Hiking (E9) entlang der Küste",
  SCHENGEN, 1, "Sicher.", NONE, []);
K("LTU", "Litauen", "Europa", [54.64, 25.28], "EUR", [50, 90, 170], "SSSOGGGGOSSS", "111122332111",
  "Mai–Sep ideal.",
  "kultur strand velo kajak",
  "Kurische Nehrung (Dünen)|Vilnius|Trakai|Berg der Kreuze|Aukštaitija NP",
  "Velotour auf der Kurischen Nehrung|Vilnius: günstige und schöne Altstadt",
  SCHENGEN, 1, "Sicher.", NONE, []);
K("POL", "Polen", "Europa", [52.17, 20.97], "PLN", [45, 90, 170], "SSSOGGGGGOSS", "111122332111",
  "Mai–Sep ideal, Tatra Jul–Sep. Winter: Ski in Zakopane.",
  "wandern berge kultur kajak velo wintersport",
  "Hohe Tatra (Zakopane)|Krakau|Białowieża-Urwald (Wisente)|Masuren|Danzig|Bieszczady",
  "Sehr gutes Preis-Leistungs-Verhältnis|Masuren: Kanu und Segeln|Tatra im Sommer sehr voll – früh starten",
  SCHENGEN, 1, "Sicher.", NONE, []);
K("CZE", "Tschechien", "Europa", [50.1, 14.26], "CZK", [50, 95, 180], "SSOOGGGGGOSS", "111222332112",
  "Mai–Sep ideal.",
  "wandern klettern kultur velo kajak",
  "Prag|Böhmische Schweiz|Český Krumlov|Riesengebirge|Böhmisches Paradies (Felsenstädte)|Mähren (Wein)",
  "Felsenstädte zum Wandern und Klettern|Ausserhalb Prags deutlich günstiger|Moldau-Kanutouren",
  SCHENGEN, 1, "Sicher.", NONE, []);
K("SVK", "Slowakei", "Europa", [48.17, 17.21], "EUR", [45, 90, 170], "OOSOGGGGGOSO", "221122332112",
  "Sommer zum Wandern, Winter Ski in der Tatra.",
  "wandern trekking berge klettern wintersport",
  "Hohe Tatra (slowakische Seite)|Slowakisches Paradies (Leitern & Schluchten)|Bratislava|Niedere Tatra|Bojnice",
  "Slowakisches Paradies: Wandern über Leitern|Hütten günstig|Weniger voll als die polnische Tatra",
  SCHENGEN, 1, "Sicher. Bergrettung kostet – Versicherung prüfen.", NONE, []);
K("HUN", "Ungarn", "Europa", [47.44, 19.26], "HUF", [45, 90, 180], "SSOGGGOOGGSS", "111222332111",
  "Frühling und Herbst ideal, Sommer heiss.",
  "kultur velo kajak",
  "Budapest (Thermalbäder)|Balaton|Eger|Hortobágy NP|Pécs|Donauknie",
  "Thermalbäder in Budapest|Velo rund um den Balaton|Forint mitnehmen, Euro schlecht umgerechnet",
  SCHENGEN, 1, "Sicher.", NONE, []);
K("BGR", "Bulgarien", "Europa", [42.7, 23.41], "EUR", [35, 70, 140], "OOOOGGGGGOSO", "221112332111",
  "Berge Jun–Sep, Küste Jun–Sep, Ski Dez–Mär.",
  "wandern trekking berge kultur strand wintersport",
  "Rila-Gebirge & Sieben Rila-Seen|Pirin NP|Rila-Kloster|Plowdiw|Schwarzmeerküste|Bansko",
  "Eines der günstigsten EU-Länder|Kopfnicken heisst «nein»|Rila- und Pirin-Hütten sehr günstig",
  SCHENGEN, 1, "Sicher.", NONE, []);
K("SRB", "Serbien", "Europa", [44.82, 20.31], "RSD", [40, 75, 150], "SSOGGGOOGGSS", "111122222111",
  "Frühling und Herbst ideal, Sommer heiss.",
  "wandern kultur kajak",
  "Belgrad|Tara NP & Drina|Novi Sad|Đerdap NP (Eisernes Tor)|Uvac-Schlucht (Gänsegeier)|Kopaonik",
  "Belgrads Nachtleben auf Flussflössen|Tara NP: Kanu auf der Drina|Sehr günstig",
  ["frei", 90, 0, "Visumfrei 90 Tage, ID genügt"], 1, "Sicher. Grenzgebiet zu Kosovo: Spannungen möglich.", NONE, []);
K("BIH", "Bosnien und Herzegowina", "Europa", [43.82, 18.33], "BAM", [35, 70, 140], "SSOGGGGOGGSS", "111122332111",
  "Mai–Okt ideal. Winter kalt in den Bergen.",
  "wandern trekking kajak berge kultur",
  "Mostar|Sarajevo|Sutjeska NP (Maglić)|Kravica-Wasserfälle|Una NP (Rafting)|Via Dinarica",
  "Via Dinarica: Fernwanderweg durch den Balkan|Rafting auf Una und Neretva|Minen: markierte Wege nie verlassen",
  ["frei", 90, 0, "Visumfrei 90 Tage, ID genügt"], 2, "Minen abseits der Wege in ländlichen Gebieten. Sonst sicher.", NONE, []);
K("MKD", "Nordmazedonien", "Europa", [41.96, 21.62], "MKD", [35, 65, 130], "SSOGGGGOGGSS", "111122332111",
  "Mai–Okt ideal.",
  "wandern trekking kultur kajak",
  "Ohrid & Ohridsee|Mavrovo NP|Matka-Schlucht|Skopje|Pelister NP|Galičica NP",
  "Ohridsee: Baden und Altstadt|Kajak in der Matka-Schlucht|Kombinierbar mit Albanien",
  ["frei", 90, 0, "Visumfrei 90 Tage, ID genügt"], 1, "Sicher.", NONE, []);
K("KOS", "Kosovo", "Europa", [42.57, 21.04], "EUR", [30, 60, 120], "SSOOGGGGGOSS", "111112222111",
  "Mai–Okt ideal, Rugova-Schlucht im Sommer.",
  "wandern trekking klettern kultur",
  "Rugova-Schlucht & Peja|Prizren|Pristina|Peaks of the Balkans Trail|Bjeshkët e Nemuna NP",
  "Teil des Peaks of the Balkans Trails|Viele Schweiz-Kosovaren – Deutsch wird oft verstanden|Bezahlt wird in Euro",
  ["frei", 90, 0, "Visumfrei 90 Tage, ID genügt"], 2, "Allgemein sicher. Spannungen im Norden (Mitrovica, Grenze zu Serbien).", NONE, []);
K("MDA", "Moldau", "Europa", [46.93, 28.93], "MDL", [30, 60, 120], "SSOGGGOOGGSS", "111112222211",
  "Frühling und Herbst (Weinlese) ideal.",
  "kultur velo",
  "Weinkeller Mileștii Mici & Cricova|Chișinău|Orheiul Vechi (Höhlenkloster)|Soroca",
  "Weinregion günstig und kaum touristisch|Transnistrien nicht bereisen",
  ["frei", 90, 0, "Visumfrei 90 Tage, Reisepass empfohlen"], 3, "Transnistrien und Grenzgebiet zur Ukraine meiden.", NONE, []);
K("UKR", "Ukraine", "Europa", [50.34, 30.89], "UAH", [35, 70, 140], "SSOOGGGGGOSS", "111111111111",
  "Vor dem Krieg: Mai–Sep ideal, Karpaten im Sommer.",
  "wandern kultur berge",
  "Kiew|Lwiw|Karpaten|Odessa",
  "Derzeit keine touristischen Reisen möglich",
  ["frei", 90, 0, "Visumfrei, aber Krieg"], 4, "Krieg seit 2022: Von Reisen wird abgeraten.", NONE, []);
K("BLR", "Belarus", "Europa", [53.88, 28.03], "BYN", [35, 70, 140], "SSSOGGGGOSSS", "111111111111",
  "Mai–Sep ideal.",
  "kultur wandern kajak",
  "Minsk|Białowieża-Urwald|Brest-Festung|Mir & Neswish (Schlösser)",
  "Kreditkarten westlicher Banken funktionieren nicht",
  ["frei", 30, 0, "Visumfrei 30 Tage (befristete Regelung)"], 4, "Autoritäres Regime, Gefahr willkürlicher Festnahmen; Nähe zum Krieg. Von Reisen wird abgeraten.", NONE, []);
K("RUS", "Russland", "Europa", [55.97, 37.41], "RUB", [45, 90, 200], "SSSOGGGGOSSS", "111111111111",
  "Vor dem Krieg: Mai–Sep ideal, Baikal auch im Winter.",
  "kultur trekking vulkane wandern",
  "Moskau|St. Petersburg|Baikalsee|Kamtschatka|Transsibirische Eisenbahn|Altai",
  "Westliche Kreditkarten funktionieren nicht|Derzeit keine Reisen empfohlen",
  ["visum", 0, 100, "Visum vorab nötig (e-Visum möglich)"], 4, "Krieg gegen die Ukraine, Gefahr willkürlicher Festnahmen. Von Reisen wird abgeraten.", NONE, []);
K("CYP", "Zypern", "Europa", [34.88, 33.62], "EUR", [60, 110, 220], "OOGGGOSSGGGO", "112223333221",
  "Frühling und Herbst ideal, Sommer sehr heiss. Winter mild.",
  "wandern strand tauchen kultur velo",
  "Troodos-Gebirge|Akamas-Halbinsel & Avakas-Schlucht|Zenobia-Wrack (Tauchen)|Paphos|Nikosia|Karpaz-Halbinsel (Norden)",
  "Linksverkehr|Zenobia: eines der besten Wracks im Mittelmeer|Nordteil nur über offizielle Übergänge besuchen",
  ["frei", 90, 0, "EU, nicht vollständig Schengen – ID genügt"], 1, "Sicher. Pufferzone zwischen Nord und Süd nicht betreten.", NONE, []);
K("MLT", "Malta", "Europa", [35.86, 14.48], "EUR", [65, 120, 230], "OOGGGGOOGGOO", "111223332211",
  "Frühling und Herbst ideal, Sommer heiss und voll.",
  "tauchen klettern strand kultur wandern",
  "Valletta|Gozo|Comino (Blue Lagoon)|Mdina|Dingli Cliffs|Wracktauchen",
  "Einer der besten Tauchspots im Mittelmeer|Klettern an den Küstenklippen|Busse günstig",
  SCHENGEN, 1, "Sicher.", NONE, []);
K("AND", "Andorra", "Europa", [42.51, 1.52], "EUR", [70, 130, 250], "OOOOOGGGGOSO", "332112332113",
  "Sommer zum Wandern, Winter zum Skifahren.",
  "wandern trekking berge velo wintersport",
  "Coma Pedrosa|Vall de Madriu (UNESCO)|Grandvalira|Estany de Juclar",
  "Kein Flughafen – über Barcelona oder Toulouse|Hütten (refugis) meist gratis",
  ["frei", 90, 0, "Nicht Schengen, aber nur über Schengen erreichbar – ID genügt"], 1, "Sehr sicher.", NONE, []);
K("ARM", "Armenien", "Europa", [40.15, 44.4], "AMD", [35, 70, 140], "SSOOGGGGGGSS", "111122332211",
  "Mai–Okt ideal, Sommer in Jerewan heiss.",
  "wandern trekking kultur berge",
  "Transcaucasian Trail|Kloster Tatev & Seilbahn|Sewansee|Jerewan|Garni & Geghard|Aragaz",
  "Transcaucasian Trail mit Georgien kombinierbar|Viele Klöster in spektakulärer Lage|Grenze zu Aserbaidschan geschlossen",
  ["frei", 180, 0, "Visumfrei bis 180 Tage pro Jahr"], 2, "Grenzgebiete zu Aserbaidschan meiden.", NONE, []);
K("AZE", "Aserbaidschan", "Europa", [40.47, 50.05], "AZN", [40, 80, 170], "SSOOGGGOGGSS", "111122222211",
  "Frühling und Herbst ideal.",
  "wandern kultur berge",
  "Baku|Scheki|Gobustan (Schlammvulkane, Felszeichnungen)|Xınalıq (Bergdorf)|Lahıc",
  "e-Visum über ASAN online|Landgrenzen teils geschlossen – Einreise per Flug",
  ["evisa", 30, 30, "e-Visum online (ca. USD 26)"], 2, "Grenzgebiet zu Armenien meiden. Politische Äusserungen vermeiden.", NONE, []);
K("GRL", "Grönland", "Europa", [64.19, -51.68], "DKK", [150, 250, 450], "OOOOOGGGOSSS", "112212332111",
  "Jun–Aug: Wandern, Eisberge, Mitternachtssonne. Feb–Apr: Hundeschlitten und Nordlicht.",
  "wandern trekking kajak berge wintersport",
  "Ilulissat-Eisfjord|Arctic Circle Trail|Ostgrönland (Tasiilaq)|Nuuk|Disko-Bucht|Narsaq & Südgrönland",
  "Flüge teuer (ab Kopenhagen oder Reykjavik)|Arctic Circle Trail: 160 km Wildnis|Kein Strassennetz zwischen Orten",
  ["frei", 90, 0, "Dänisches Gebiet, nicht Schengen – Reisepass empfohlen"], 1, "Sicher. Extreme Wildnis und Wetter.", NONE,
  [["Flug Kopenhagen–Nuuk (Aufpreis)", 900]]);

// ───────────────────────── Naher Osten ─────────────────────────
K("ISR", "Israel", "Naher Osten", [32.0, 34.87], "ILS", [80, 150, 300], "OOGGGOSSOGGO", "113321222331",
  "Frühling und Herbst ideal. Sommer heiss, Winter mild mit Regen im Norden.",
  "wandern kultur wueste tauchen strand",
  "Jerusalem|Totes Meer & Masada|Negev (Makhtesh Ramon)|Israel National Trail|Eilat (Rotes Meer)|Galiläa",
  "Schabbat: Freitagabend bis Samstagabend kaum ÖV|Sehr teuer|Stempel kann Einreise in andere Länder erschweren",
  ["eta", 90, 7, "ETA-IL online vor Abreise (ca. ILS 25)"], 3, "Lage seit 2023 sehr volatil (Gaza-Krieg, Raketenbeschuss, Grenzgebiete). Aktuelle EDA-Hinweise zwingend prüfen.", NONE, []);
K("PSE", "Palästina", "Naher Osten", [31.9, 35.2], "ILS", [50, 90, 180], "OOGGGOSSOGGO", "111111111111",
  "Frühling und Herbst ideal.",
  "kultur wandern",
  "Bethlehem|Jericho|Hebron|Ramallah|Masar Ibrahim (Wanderweg)",
  "Einreise nur über Israel oder Jordanien",
  ["frei", 90, 0, "Einreise über israelische Grenzkontrolle"], 4, "Westjordanland und Gaza: Von Reisen wird abgeraten.", NONE, []);
K("LBN", "Libanon", "Naher Osten", [33.82, 35.49], "LBP", [55, 110, 220], "OOGGGGOOGGOO", "111111111111",
  "Frühling und Herbst ideal, Winter Ski möglich.",
  "wandern kultur berge",
  "Baalbek|Byblos|Qadisha-Tal|Lebanon Mountain Trail|Beirut|Zedern von Gott",
  "Derzeit keine Reisen empfohlen",
  ["voa", 30, 0, "Visum bei Ankunft (kostenlos)"], 4, "Konflikt mit Israel, Süden und Grenzgebiete umkämpft. Von Reisen wird abgeraten.", NONE, []);
K("SYR", "Syrien", "Naher Osten", [33.41, 36.51], "SYP", [40, 80, 160], "OOGGGOSSOGGO", "111111111111",
  "Frühling und Herbst ideal.",
  "kultur",
  "Damaskus|Palmyra|Krak des Chevaliers|Aleppo|Bosra",
  "Derzeit keine Reisen empfohlen",
  ["visum", 0, 0, "Visum nötig"], 4, "Nach dem Umsturz 2024 weiterhin instabil: Gewalt, Terror, Blindgänger.", NONE, []);
K("IRQ", "Irak", "Naher Osten", [36.24, 43.96], "IQD", [40, 80, 170], "GGGOOSSSSOGG", "111111111111",
  "Okt–Apr angenehm, Sommer extrem heiss (50 °C).",
  "kultur wandern berge",
  "Babylon|Zitadelle von Erbil|Mesopotamische Marschen|Ur|Kurdische Berge (Amadiya)",
  "Region Kurdistan (Erbil) etwas stabiler",
  ["voa", 60, 80, "Visum bei Ankunft oder e-Visum"], 4, "Terror und bewaffnete Konflikte. Von Reisen wird abgeraten (auch Region Kurdistan: erhöhte Vorsicht).", NONE, []);
K("IRN", "Iran", "Naher Osten", [35.42, 51.15], "IRR", [30, 60, 140], "OOGGGOSSGGGO", "111111111111",
  "Frühling und Herbst ideal.",
  "kultur wueste trekking berge",
  "Isfahan|Persepolis & Shiraz|Yazd|Dasht-e Lut|Damavand|Kaluts",
  "Westliche Kreditkarten funktionieren nicht|Derzeit keine Reisen empfohlen",
  ["visum", 30, 75, "Visum vorab oder bei Ankunft"], 4, "Hohe Gefahr willkürlicher Festnahmen von Ausländern, Konflikt 2025. Von Reisen wird abgeraten.", NONE, []);
K("YEM", "Jemen", "Naher Osten", [15.48, 44.22], "YER", [40, 80, 160], "GGGOOSSSSOGG", "111111111111",
  "Okt–Apr angenehm.",
  "kultur tauchen",
  "Sokotra|Altstadt Sanaa|Shibam (Lehmhochhäuser)",
  "Derzeit keine Reisen möglich",
  ["visum", 0, 0, "Visum nötig"], 4, "Bürgerkrieg, Terror, Entführungen. Von Reisen wird abgeraten.", [0, 1], []);
K("SAU", "Saudi-Arabien", "Naher Osten", [24.96, 46.7], "SAR", [80, 150, 300], "GGGOSSSSSOGG", "222111111222",
  "Nov–Mär angenehm, Sommer extrem heiss. Asir-Gebirge auch im Sommer mild.",
  "wueste wandern tauchen kultur roadtrip",
  "AlUla & Hegra|Edge of the World|Rotes Meer (Tauchen)|Altstadt Jeddah|Asir-Gebirge (Abha)|Riad",
  "Mietauto fast unverzichtbar|Strenge Kleidervorschriften gelockert, aber Zurückhaltung empfohlen|AlUla teuer, früh buchen",
  ["evisa", 90, 130, "e-Visum (ca. SAR 480 inkl. Versicherung), 1 Jahr gültig"], 2, "Grenzgebiet zu Jemen meiden. Strenge Gesetze.", [0, 1], []);
K("ARE", "Vereinigte Arabische Emirate", "Naher Osten", [25.25, 55.36], "AED", [90, 170, 350], "GGGOSSSSSOGG", "333211111233",
  "Nov–Mär angenehm, Sommer 45 °C+.",
  "wueste wandern kultur strand tauchen",
  "Dubai|Abu Dhabi (Scheich-Zayid-Moschee)|Hajar-Berge (Jebel Jais)|Liwa-Wüste|Hatta|Fujairah (Tauchen)",
  "Guter Zwischenstopp nach Asien|Metro in Dubai günstig|Wandern in Ras al-Khaimah",
  ["frei", 90, 0, "Visumfrei 90 Tage"], 1, "Sicher. Regionale Lage verfolgen.", NONE, []);
K("QAT", "Katar", "Naher Osten", [25.27, 51.61], "QAR", [100, 180, 350], "GGGOSSSSSOGG", "222211111122",
  "Nov–Mär angenehm.",
  "wueste kultur strand kajak",
  "Doha (Souq Waqif, Museum für Islamische Kunst)|Khor Al Adaid (Binnenmeer)|Al Zubarah|Purple Island (Mangroven-Kajak)",
  "Guter Zwischenstopp|Gratis-Stopover-Programme der Airline prüfen",
  ["frei", 90, 0, "Visumfrei 90 Tage"], 1, "Sicher.", NONE, []);
K("KWT", "Kuwait", "Naher Osten", [29.24, 47.97], "KWD", [90, 160, 300], "GGGOSSSSSOGG", "111111111111",
  "Nov–Mär angenehm.",
  "kultur strand",
  "Kuwait Towers|Souq Al-Mubarakiya|Insel Failaka|Grosse Moschee",
  "Kaum touristisch",
  ["evisa", 90, 10, "e-Visum oder Visum bei Ankunft"], 1, "Sicher.", NONE, []);
K("BHR", "Bahrain", "Naher Osten", [26.27, 50.63], "BHD", [90, 160, 300], "GGGOSSSSSOGG", "111111111111",
  "Nov–Mär angenehm.",
  "kultur strand tauchen",
  "Qal'at al-Bahrain|Tree of Life|Souq Manama|Perlenroute (UNESCO)",
  "Klein – 2 bis 3 Tage genügen",
  ["evisa", 14, 15, "e-Visum oder Visum bei Ankunft"], 1, "Sicher.", NONE, []);

// ───────────────────────── Asien ─────────────────────────
K("KAZ", "Kasachstan", "Asien", [43.35, 77.04], "KZT", [40, 80, 170], "SSSOGGGGGOSS", "111112332111",
  "Mai–Sep ideal. Winter sehr kalt, aber Ski bei Almaty.",
  "wandern trekking berge roadtrip wintersport wueste",
  "Almaty & Big Almaty Lake|Kolsai- & Kaindy-Seen|Charyn-Canyon|Altyn-Emel NP|Mangystau (Bozzhyra)|Astana",
  "Almaty als Basis für Tagestouren in die Berge|Grosse Distanzen – Nachtzüge|Gut mit Kirgistan kombinierbar",
  ["frei", 30, 0, "Visumfrei 30 Tage"], 1, "Sicher.", NONE, []);
K("TJK", "Tadschikistan", "Asien", [38.54, 68.82], "TJS", [35, 70, 150], "SSSOGGGGGOSS", "111112332111",
  "Jun–Sep ideal für den Pamir. Winter: Pässe oft gesperrt.",
  "trekking berge roadtrip wandern",
  "Pamir Highway|Fan-Gebirge (Iskanderkul, Sieben Seen)|Wakhan-Korridor|Bartang-Tal|Duschanbe",
  "GBAO-Permit für den Pamir mit dem e-Visum beantragen|Pamir Highway per Jeep, Velo oder Motorrad|Homestays statt Hotels",
  ["evisa", 60, 50, "e-Visum + GBAO-Permit für den Pamir"], 2, "Grenzgebiet zu Afghanistan meiden. Abgelegene Regionen ohne Versorgung.", NONE,
  [["Pamir Highway mit Fahrer (10 Tage)", 1200]]);
K("TKM", "Turkmenistan", "Asien", [37.99, 58.36], "TMT", [60, 110, 220], "SSGGGSSSGGOS", "111111111111",
  "Apr–Mai und Sep–Okt ideal. Sommer extrem heiss.",
  "wueste kultur",
  "Darvaza-Gaskrater («Tor zur Hölle»)|Aschgabat (Marmorstadt)|Merw|Konye-Urgench|Yangykala-Canyon",
  "Touristenvisum nur mit Einladung (LOI) über Agentur|Transitvisum 5 Tage für Seidenstrassen-Reisende",
  ["visum", 10, 100, "Visum nur mit Einladungsbrief (LOI) über Agentur"], 2, "Sehr restriktiver Staat, starke Überwachung.", NONE,
  [["Einladungsbrief & Pflicht-Tour (3 Tage)", 400]]);
K("AFG", "Afghanistan", "Asien", [34.57, 69.21], "AFN", [40, 80, 160], "SSOGGGGGGOSS", "111111111111",
  "Frühling und Herbst ideal.",
  "kultur berge trekking",
  "Bamiyan|Band-e-Amir NP|Herat|Wakhan-Korridor",
  "Derzeit keine Reisen möglich",
  ["visum", 0, 0, "Visum nötig"], 4, "Taliban-Herrschaft, Terror, Entführungen; keine Schweizer Vertretung. Von Reisen wird abgeraten.", [0, 1], []);
K("PAK", "Pakistan", "Asien", [33.55, 72.83], "PKR", [25, 55, 130], "OOGGGGOOGGGO", "111122332211",
  "Norden (Karakorum) Mai–Okt, Süden und Lahore Nov–Mär. Monsun Jul–Aug.",
  "trekking berge wandern kultur roadtrip",
  "Karakorum Highway|Hunza-Tal|K2-Basislager & Concordia|Fairy Meadows (Nanga Parbat)|Skardu & Deosai-Plateau|Lahore",
  "Gastfreundschaft legendär|Trekking im Karakorum mit lizenzierter Agentur|Inlandflüge nach Skardu wetterabhängig",
  ["evisa", 90, 60, "e-Visum online"], 3, "Belutschistan, Teile von Khyber Pakhtunkhwa und Grenzgebiete meiden. Terrorrisiko.", [0, 1],
  [["K2-Basislager-Trek (Agentur, Permit)", 2500]]);
K("BGD", "Bangladesch", "Asien", [23.84, 90.4], "BDT", [25, 50, 110], "GGGOSSSSSOGG", "222111111222",
  "Nov–Feb trocken und angenehm. Monsun Jun–Sep, Zyklone möglich.",
  "dschungel kultur strand kajak",
  "Sundarbans (Mangroven, Tiger)|Srimangal (Teeplantagen)|Bandarban (Hill Tracts)|Altstadt Dhaka|Cox's Bazar|Sonargaon",
  "Kaum Touristen – sehr authentisch|Bootstouren in die Sundarbans|Rocket-Dampfer auf den Flüssen",
  ["voa", 30, 51, "Visum bei Ankunft (USD 51) oder e-Visum"], 2, "Politische Unruhen. Chittagong Hill Tracts nur mit Genehmigung.", [0, 1], []);
K("MMR", "Myanmar", "Asien", [16.91, 96.13], "MMK", [35, 70, 150], "GGGOSSSSSOGG", "111111111111",
  "Vor dem Konflikt: Nov–Feb ideal.",
  "kultur trekking wandern",
  "Bagan|Inle-See|Mandalay|Shwedagon-Pagode (Yangon)|Hpa-An|Ngapali",
  "Derzeit keine Reisen empfohlen",
  ["evisa", 28, 50, "e-Visum"], 4, "Bürgerkrieg seit dem Militärputsch 2021. Von Reisen wird abgeraten.", [0, 1], []);
K("PRK", "Nordkorea", "Asien", [39.22, 125.67], "KPW", [250, 300, 400], "SOGGGOSSGGOS", "111111111111",
  "Frühling und Herbst ideal.",
  "kultur",
  "Pjöngjang|Demilitarisierte Zone (DMZ)|Myohyang-Berge|Paektusan",
  "Nur organisierte Gruppenreisen",
  ["visum", 0, 50, "Nur über spezialisierte Agentur in Gruppen"], 4, "Hohe Gefahr willkürlicher Festnahmen. Von Reisen wird abgeraten.", NONE, []);
K("TLS", "Osttimor", "Asien", [-8.55, 125.52], "USD", [50, 90, 180], "SSSOGGGGGGOS", "111112222111",
  "Trockenzeit Mai–Nov ideal.",
  "tauchen wandern strand berge",
  "Atauro (Tauchen, Riffe)|Mount Ramelau|Jaco Island|Dili|Maubisse",
  "Einige der artenreichsten Riffe der Welt|Bezahlt wird in USD|Kaum Tourismus, einfache Infrastruktur",
  ["voa", 30, 30, "Visum bei Ankunft (USD 30)"], 2, "Allgemein ruhig, Kleinkriminalität. Strassen schlecht.", [0, 1], []);
K("BRN", "Brunei", "Asien", [4.94, 114.93], "BND", [60, 110, 220], "OOGGGGGGGOSS", "111111111111",
  "Feb–Sep etwas trockener, ganzjährig tropisch.",
  "dschungel kultur",
  "Ulu Temburong NP (Canopy Walk)|Kampong Ayer (Wasserdorf)|Sultan-Omar-Ali-Saifuddin-Moschee|Labi-Regenwald",
  "Alkoholverkauf verboten|Gut mit Sabah/Sarawak kombinierbar",
  ["frei", 90, 0, "Visumfrei 90 Tage"], 1, "Sicher. Strenge Scharia-Gesetze.", NONE, []);
K("SGP", "Singapur", "Asien", [1.36, 103.99], "SGD", [80, 150, 300], "OGGOOOOOOOOO", "222222232223",
  "Ganzjährig heiss und feucht, Nov–Jan mehr Regen.",
  "kultur wandern",
  "Gardens by the Bay|Marina Bay|MacRitchie Reservoir (Treetop Walk)|Hawker Centres|Pulau Ubin|Chinatown & Little India",
  "Hawker Centres: günstig und Michelin-prämiert|Guter Stopover nach Asien und Australien|Strenge Regeln (Kaugummi, Littering)",
  ["frei", 90, 0, "Visumfrei 90 Tage + SG Arrival Card online"], 1, "Sehr sicher. Sehr strenge Drogengesetze.", NONE, []);

// ───────────────────────── Ozeanien ─────────────────────────
K("PNG", "Papua-Neuguinea", "Ozeanien", [-9.44, 147.22], "PGK", [80, 150, 300], "OOOOGGGGGGOO", "111112221111",
  "Mai–Okt trockener. Ganzjährig tropisch, im Hochland kühl.",
  "trekking tauchen kultur dschungel vulkane",
  "Kokoda Track|Mount-Hagen-Show & Goroka-Show|Sepik-Fluss|Kimbe Bay (Tauchen)|Tufi-Fjorde|Rabaul (Vulkane)",
  "Reisen am besten organisiert|Kokoda Track nur mit lizenziertem Anbieter|Teuer trotz einfacher Standards",
  ["evisa", 60, 0, "e-Visum vor Abreise (für Touristen kostenlos)"], 3, "Hohe Gewaltkriminalität (v.a. Port Moresby, Lae), Stammeskonflikte im Hochland.", [0, 2],
  [["Kokoda-Track (Anbieter, 9 Tage)", 2500]]);
K("SLB", "Salomonen", "Ozeanien", [-9.43, 160.05], "SBD", [70, 130, 250], "SSSOGGGGGGOS", "111112222111",
  "Mai–Okt trockener. Zyklone Nov–Apr.",
  "tauchen kajak strand kultur",
  "Marovo-Lagune|Gizo (Wracktauchen)|Iron Bottom Sound|Honiara",
  "Wracks aus dem 2. Weltkrieg|Sehr einfacher Tourismus",
  ["frei", 90, 0, "Visitor Permit bei Ankunft (kostenlos)"], 2, "Gelegentlich Unruhen in Honiara.", [0, 2], []);
K("VUT", "Vanuatu", "Ozeanien", [-17.7, 168.32], "VUV", [70, 130, 260], "SSSOGGGGGGOS", "111122332111",
  "Mai–Okt trocken und angenehm. Zyklone Nov–Apr.",
  "vulkane tauchen strand wandern kultur",
  "Mount Yasur (Tanna)|SS President Coolidge (Wracktauchen)|Espiritu Santo (Champagne Beach, Blue Holes)|Port Vila|Pentecost (Landtauchen Apr–Jun)",
  "Am Kraterrand des Yasur stehen|Inlandflüge zwischen den Inseln|Kava probieren",
  ["frei", 30, 0, "Visumfrei 30 Tage"], 1, "Sicher. Zyklone und Erdbeben.", [0, 1], []);
K("NCL", "Neukaledonien", "Ozeanien", [-22.01, 166.21], "XPF", [100, 180, 350], "OOOOGGGGGGGO", "211122332221",
  "Mai–Nov angenehm und trockener. Zyklone Jan–Mär.",
  "tauchen strand wandern kajak",
  "Lagune (UNESCO)|Île des Pins|Loyalitätsinseln (Lifou, Ouvéa)|GR NC1 Fernwanderweg|Nouméa|Parc de la Rivière Bleue",
  "Französisches Preisniveau|GR NC1: 120 km durch den Süden|Mietauto für die Grande Terre",
  ["frei", 90, 0, "Französisches Überseegebiet – visumfrei, Pass empfohlen"], 2, "Unruhen seit 2024 – Lage verfolgen.", NONE, []);
K("WSM", "Samoa", "Ozeanien", [-13.83, -172.01], "WST", [60, 110, 230], "SSSOGGGGGGOS", "111122332111",
  "Mai–Okt trocken. Zyklone Nov–Apr.",
  "strand tauchen surfen wandern",
  "To Sua Ocean Trench|Lalomanu Beach|Savai'i (Lavafelder, Blowholes)|Papapapaitai-Fälle|Apia",
  "Strand-Fales (offene Hütten) günstig|Sonntag ist Ruhetag|Fähre nach Savai'i",
  ["frei", 90, 0, "Visitor Permit bei Ankunft"], 1, "Sicher.", NONE, []);
K("TON", "Tonga", "Ozeanien", [-21.24, -175.15], "TOP", [70, 120, 240], "SSSOGGGGGGOS", "111123332111",
  "Mai–Nov trocken. Jul–Okt Buckelwale.",
  "tauchen strand kajak wandern",
  "Vava'u (Schwimmen mit Buckelwalen)|Ha'apai|Tongatapu (Blowholes)|'Eua (Wandern)",
  "Schwimmen mit Walen nur in Tonga und wenigen anderen Orten|Kajak zwischen den Inseln von Vava'u",
  ["frei", 31, 0, "Visitor Visa bei Ankunft"], 1, "Sicher.", NONE, [["Schwimmen mit Buckelwalen (Tagestour)", 200]]);
K("PYF", "Französisch-Polynesien", "Ozeanien", [-17.55, -149.61], "XPF", [130, 230, 450], "OOOOGGGGGGOO", "222122332222",
  "Mai–Okt trockener und angenehmer. Nov–Apr feucht und heiss.",
  "tauchen strand wandern kajak surfen",
  "Moorea|Bora Bora|Rangiroa & Fakarava (Tauchen)|Tahiti (Teahupo'o)|Marquesas|Huahine",
  "Pensions statt Overwater-Bungalows|Air-Tahiti-Inselpass|Weltklasse-Tauchen mit Haien in Fakarava",
  ["frei", 90, 0, "Französisches Überseegebiet – visumfrei"], 1, "Sicher.", NONE, [["Air-Tahiti-Inselpass", 700]]);
K("COK", "Cookinseln", "Ozeanien", [-21.2, -159.81], "NZD", [90, 160, 300], "OOOOGGGGGGOO", "222122332222",
  "Mai–Okt trockener. Zyklone Dez–Mär.",
  "strand tauchen kajak wandern",
  "Aitutaki-Lagune|Rarotonga Cross-Island Track|Muri Lagoon|Atiu (Höhlen)",
  "Roller mieten auf Rarotonga|Aitutaki: eine der schönsten Lagunen der Welt",
  ["frei", 31, 0, "Visumfrei 31 Tage"], 1, "Sehr sicher.", NONE, []);
K("PLW", "Palau", "Ozeanien", [7.37, 134.54], "USD", [100, 180, 350], "GGGGOSSSSOOG", "222211111122",
  "Feb–Apr am trockensten. Taifune Jul–Okt (selten direkt).",
  "tauchen kajak strand",
  "Rock Islands|Jellyfish Lake|Blue Corner (Tauchen)|German Channel (Mantas)|Ngardmau-Wasserfall",
  "Weltklasse-Tauchen|Palau Pledge bei Einreise unterschreiben|Teuer – Tauchpakete vergleichen",
  ["frei", 30, 100, "Visum bei Ankunft kostenlos; Pristine Paradise Fee USD 100"], 1, "Sicher.", NONE, []);
