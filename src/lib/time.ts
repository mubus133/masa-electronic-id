export type ZonedParts = {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  second: string;
};

export function zonedParts(date: Date, timeZone: string): ZonedParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const read = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
  const hour = read("hour") === "24" ? "00" : read("hour");
  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour,
    minute: read("minute"),
    second: read("second"),
  };
}

export function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string,
) {
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const shown = zonedParts(guess, timeZone);
  const shownUtc = Date.UTC(
    Number(shown.year),
    Number(shown.month) - 1,
    Number(shown.day),
    Number(shown.hour),
    Number(shown.minute),
    Number(shown.second),
  );
  return new Date(guess.getTime() - (shownUtc - guess.getTime()));
}

export function endOfZonedDay(isoDate: string, timeZone: string) {
  const [year, month, day] = isoDate.slice(0, 10).split("-").map(Number);
  return zonedTimeToUtc(year, month, day, 23, 59, 59, timeZone);
}

export function todayIso(timeZone: string, now = new Date()) {
  const parts = zonedParts(now, timeZone);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function weekdayName(isoDate: string, timeZone: string) {
  const [year, month, day] = isoDate.slice(0, 10).split("-").map(Number);
  const noon = zonedTimeToUtc(year, month, day, 12, 0, 0, timeZone);
  return new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone }).format(noon);
}

export function parseZonedDateTime(value: string, timeZone: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!match) throw new Error("Enter a valid date and time.");
  const [, year, month, day, hour, minute] = match;
  return zonedTimeToUtc(Number(year), Number(month), Number(day), Number(hour), Number(minute), 0, timeZone);
}

export function formatWhen(value: Date | string | null | undefined, timeZone: string) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatDate(value: Date | string | null | undefined, timeZone: string) {
  if (!value) return "—";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    const noon = zonedTimeToUtc(year, month, day, 12, 0, 0, timeZone);
    return new Intl.DateTimeFormat("en-GB", { timeZone, dateStyle: "medium" }).format(noon);
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", { timeZone, dateStyle: "medium" }).format(date);
}
