export function browserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export function dayKeyInTimeZone(date: Date, timeZone: string) {
  const values = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date).reduce<Record<string, string>>((result, part) => ({ ...result, [part.type]: part.value }), {});
  return `${values.year}-${values.month}-${values.day}`;
}

export function shiftDayKey(day: string, amount: number) {
  const [year, month, date] = day.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, date + amount));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}-${String(shifted.getUTCDate()).padStart(2, "0")}`;
}

export function activityDayKeys(count: number, timeZone: string) {
  const today = dayKeyInTimeZone(new Date(), timeZone);
  return Array.from({ length: count }, (_, index) => shiftDayKey(today, index - (count - 1)));
}

export function streakFromActivityDates(activityDates: string[], timeZone: string) {
  const activeDays = new Set(activityDates); let streak = 0; let cursor = dayKeyInTimeZone(new Date(), timeZone);
  while (activeDays.has(cursor)) { streak += 1; cursor = shiftDayKey(cursor, -1); }
  return streak;
}
