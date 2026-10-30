export const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh";

const numberFormatter = new Intl.NumberFormat("vi-VN");

export function formatNumber(value) {
  const number = Number(value ?? 0);
  return numberFormatter.format(Number.isFinite(number) ? number : 0);
}

export function formatMoney(value, { suffix = "đ" } = {}) {
  return `${formatNumber(value)}${suffix}`;
}

function validCalendarDate(value) {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function parseDate(value) {
  if (value === null || value === undefined || value === "") return null;
  let input = value;
  // Legacy database timestamps without an offset represent Vietnam local time.
  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/.test(input)) {
    input = `${input.replace(" ", "T")}+07:00`;
  }
  const date = input instanceof Date ? input : new Date(input);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function formatDate(value, { fallback = "---", padded = false } = {}) {
  const text = String(value ?? "");
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    if (!validCalendarDate(text)) return fallback;
    return text.split("-").reverse().join("/");
  }
  const date = parseDate(value);
  return date ? date.toLocaleDateString("vi-VN", {
    timeZone: VIETNAM_TIME_ZONE,
    ...(padded ? { day: "2-digit", month: "2-digit", year: "numeric" } : {}),
  }) : fallback;
}

export function formatTime(value, { fallback = "--:--", seconds = false } = {}) {
  const match = String(value ?? "").match(/^(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?$/);
  if (match) {
    if (Number(match[1]) > 23 || Number(match[2]) > 59 || Number(match[3] || 0) > 59) return fallback;
    return `${match[1]}:${match[2]}${seconds ? `:${match[3] || "00"}` : ""}`;
  }
  const date = parseDate(value);
  return date ? date.toLocaleTimeString("vi-VN", {
    timeZone: VIETNAM_TIME_ZONE, hour: "2-digit", minute: "2-digit",
    ...(seconds ? { second: "2-digit" } : {}),
  }) : fallback;
}

export function formatDateTime(value, { fallback = "---" } = {}) {
  const date = parseDate(value);
  return date ? date.toLocaleString("vi-VN", {
    timeZone: VIETNAM_TIME_ZONE, day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }) : fallback;
}

export function vietnamToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: VIETNAM_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const part = type => parts.find(item => item.type === type).value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
