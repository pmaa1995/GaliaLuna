export const STORE_TIME_ZONE = "America/Santo_Domingo";

// D1 stores CURRENT_TIMESTAMP as "YYYY-MM-DD HH:MM:SS" in UTC without a zone marker.
export function parseStoredDate(value: string) {
  const hasZone = /(?:z|[+-]\d{2}:?\d{2})$/i.test(value);
  return new Date(hasZone ? value : `${value.replace(" ", "T")}Z`);
}

// "2026-09-18 08:23" in store time, sortable in spreadsheets.
export function formatStoreDateTimeISO(value: string) {
  const date = parseStoredDate(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("sv-SE", { timeZone: STORE_TIME_ZONE, dateStyle: "short", timeStyle: "short" }).format(date);
}

// "2026-10" → "octubre 2026"
export function formatMonthLabel(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("es-DO", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, monthIndex - 1, 1)));
}
