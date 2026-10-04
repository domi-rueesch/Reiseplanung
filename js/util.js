/* Allgemeine Hilfsfunktionen */
window.RP = window.RP || {};

RP.MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
RP.MONTHS_SHORT = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
RP.STYLES = ["Backpacker", "Mittelklasse", "Komfort"];
RP.DAY_MS = 86400000;

RP.AIRPORTS = {
  ZRH: { name: "Zürich", pos: [47.46, 8.55] },
  BSL: { name: "Basel-Mulhouse", pos: [47.6, 7.53] },
  GVA: { name: "Genf", pos: [46.24, 6.11] },
};

RP.byIso = {};
COUNTRIES.forEach((c) => (RP.byIso[c.iso] = c));

/* Kartengebiete ohne eigene Daten, die einem Land zugeordnet werden */
RP.ALIAS = { CYN: "CYP", SOL: "SOM" };
RP.lookup = (iso) => RP.byIso[iso] || RP.byIso[RP.ALIAS[iso]] || null;

/* localStorage kann blockiert sein (privates Fenster) – deshalb immer abgesichert */
RP.store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem("reiseplanung." + key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem("reiseplanung." + key, JSON.stringify(value));
    } catch (e) {
      /* ignorieren */
    }
  },
};

RP.chf = function (n, decimals) {
  const v = Math.round(n * (decimals ? 100 : 1)) / (decimals ? 100 : 1);
  return "CHF " + v.toLocaleString("de-CH", { minimumFractionDigits: decimals || 0, maximumFractionDigits: decimals || 0 });
};

RP.km = function (a, b) {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (b[0] - a[0]) * rad, dLon = (b[1] - a[1]) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

/* Datum als "YYYY-MM-DD" (ohne Zeitzonen-Probleme, alles in UTC) */
RP.parseDate = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
RP.fmtDate = (t) => {
  const d = new Date(t);
  return String(d.getUTCDate()).padStart(2, "0") + "." + String(d.getUTCMonth() + 1).padStart(2, "0") + "." + d.getUTCFullYear();
};
RP.isoDate = (t) => new Date(t).toISOString().slice(0, 10);
RP.monthOf = (t) => new Date(t).getUTCMonth();

RP.esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

RP.VISA_LABEL = {
  frei: "Visumfrei",
  eta: "Online-Einreisegenehmigung",
  evisa: "e-Visum",
  voa: "Visum bei Ankunft",
  visum: "Visum vorab",
};

RP.SAFETY_LABEL = {
  1: "Normale Vorsicht",
  2: "Erhöhte Vorsicht",
  3: "Teile des Landes meiden",
  4: "Reise nicht empfohlen",
};

RP.CLIM_LABEL = { G: "ideal", O: "okay", S: "ungünstig" };
RP.CROWD_LABEL = { 1: "wenig", 2: "mittel", 3: "viel" };
