const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function toKSTDate(date: Date) {
  return new Date(date.getTime() + KST_OFFSET_MS);
}

export function toKSTDateString(date: Date) {
  const kst = toKSTDate(date);
  const year = kst.getUTCFullYear();
  const month = pad2(kst.getUTCMonth() + 1);
  const day = pad2(kst.getUTCDate());
  return `${year}-${month}-${day}`;
}

export function getCurrentKSTDateString() {
  return toKSTDateString(new Date());
}

export function toKSTMonthString(date: Date) {
  const kst = toKSTDate(date);
  const year = kst.getUTCFullYear();
  const month = pad2(kst.getUTCMonth() + 1);
  return `${year}-${month}`;
}

export function getCurrentKSTMonthString() {
  return toKSTMonthString(new Date());
}

export function getCurrentKSTTimeString() {
  const kst = toKSTDate(new Date());
  const hours = pad2(kst.getUTCHours());
  const minutes = pad2(kst.getUTCMinutes());
  return `${hours}:${minutes}`;
}

export function parseMonthString(value: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isInteger(year) || !Number.isInteger(month)) return null;
  if (month < 1 || month > 12) return null;
  return { year, month };
}

function toISODateFromUTCParts(year: number, month: number, day: number) {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function getMonthRangeFromMonthString(monthString: string) {
  const parsed = parseMonthString(monthString);
  if (!parsed) return null;
  const first = new Date(Date.UTC(parsed.year, parsed.month - 1, 1));
  const last = new Date(Date.UTC(parsed.year, parsed.month, 0));

  const start = toISODateFromUTCParts(
    first.getUTCFullYear(),
    first.getUTCMonth() + 1,
    first.getUTCDate()
  );
  const end = toISODateFromUTCParts(
    last.getUTCFullYear(),
    last.getUTCMonth() + 1,
    last.getUTCDate()
  );
  return { start, end };
}

export function shiftISODate(isoDate: string, offsetDays: number) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return toISODateFromUTCParts(
    d.getUTCFullYear(),
    d.getUTCMonth() + 1,
    d.getUTCDate()
  );
}
