# 🌍 Reiseplanung

Web-App zur Planung einer längeren Reise: Weltkarte mit Länderinfos, Budgetplaner mit Routenoptimierung, Checkliste und PDF-Export.
Läuft komplett im Browser, ohne Installation und ohne Server.

## Starten

`index.html` im Browser öffnen (Doppelklick genügt). Am besten mit Chrome, Edge oder Firefox auf dem Laptop.

Der Plan, die Filter und die abgehakten Punkte der Checkliste werden automatisch im Browser gespeichert.

## Funktionen

**Weltkarte**
- Länder eingefärbt nach: «passt zu meinen Filtern», Reisewetter im Monat, Touristenandrang, Kosten pro Tag oder Sicherheit
- Filter: Reisemonat, max. Tageskosten, Region, Aktivitäten (Wandern, Trekking, Tauchen, Safari …), nur gutes Wetter, wenig Touristen, einfache Einreise, Sicherheitsstufe
- Klick auf ein Land zeigt: Tageskosten (Backpacker / Mittelklasse / Komfort), Wetter und Touristen Monat für Monat, Aktivitäten, Highlights, Tipps, Einreise mit Schweizer Pass, Sicherheit, Gesundheit, typische Zusatzkosten

**Reiseplan**
- Länder mit Anzahl Tagen und Reisestil pro Land
- Abflug ab Zürich, Basel oder Genf, Rückflug optional
- Budget: Aufenthalt (mit Saisonzuschlag), Flüge/Busse (geschätzt nach Distanz, eigener Preis eintragbar), Touren & Permits, Visa, Versicherung, Ausrüstung, Impfungen, Reserve
- Hinweise, wenn ein Aufenthalt die erlaubte Visumsdauer überschreitet oder das Wetter ungünstig ist
- **Routenoptimierer**: beste Reihenfolge nach Transportkosten, Wetter und Touristenandrang, und Suche nach dem besten Startmonat
- **PDF-Export** mit Route, Budget, Einreise/Sicherheit und Checkliste

**Checkliste**
- Passt sich der Reisedauer und den Ländern an (z.B. Gelbfieber, Malaria, Visa, Einreiseformulare, AHV/Abmeldung bei langen Reisen)

## Daten und Aktualisierung

- Die Länderdaten (Kosten, Klima, Sehenswürdigkeiten, Visa, Sicherheit) sind kuratiert in `js/data/countries.js`, `countries2.js` und `countries3.js` – 197 Länder und Gebiete, also die ganze Weltkarte inkl. Antarktis (Stand Herbst 2026).
- Grossbritannien ist aufgeteilt in England, Schottland, Wales und Nordirland. Kleine Inselstaaten (z.B. Malediven, Mauritius, Karibikinseln) erscheinen auf der Karte als Punkt.
- Länder mit Reisewarnung (z.B. Afghanistan, Sudan) sind enthalten, werden aber mit dem Standardfilter «ohne Reise nicht empfohlen» ausgeblendet.
- **Alle 14 Tage beim Öffnen** werden automatisch aktualisiert:
  - Wechselkurs USD → CHF (Frankfurter / EZB)
  - Reisewarnungen (Open Data des Auswärtigen Amts DE – das EDA bietet keine maschinenlesbare Schnittstelle). Die strengere Einstufung aus kuratierten Daten und Live-Daten wird angezeigt.
- Ohne Internet werden die zuletzt geladenen bzw. eingebauten Werte verwendet. Über «↻ Aktualisieren» oben rechts lässt sich jederzeit neu laden.

> Alle Angaben ohne Gewähr. Vor der Reise immer die [Reisehinweise des EDA](https://www.eda.admin.ch/eda/de/home/vertretungen-und-reisehinweise.html) und die offiziellen Einreisebestimmungen prüfen.

## Weitere Länder hinzufügen

In `js/data/countries3.js` mit `K(...)` einen Eintrag nach dem Muster der bestehenden Länder ergänzen (Felder sind oben in `countries.js` und `countries2.js` erklärt). Der `iso`-Code (ISO 3166 Alpha-3) verbindet den Eintrag mit der Karte.

## Technik

Reines HTML/CSS/JavaScript ohne Build-Schritt. Bibliotheken liegen lokal in `vendor/`: [Leaflet](https://leafletjs.com) (Karte), [jsPDF](https://github.com/parallax/jsPDF) + AutoTable (PDF). Ländergrenzen: [Natural Earth](https://www.naturalearthdata.com) (Public Domain).
