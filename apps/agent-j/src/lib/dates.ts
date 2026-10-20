import type { ISODate, ISODateTime } from '@/api/types';

const WEEKDAYS_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const WEEKDAYS_LONG = [
  'Sonntag',
  'Montag',
  'Dienstag',
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag',
];
const MONTHS = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
];

const pad = (n: number) => String(n).padStart(2, '0');

/** Local calendar date as `YYYY-MM-DD`. */
export function toISODate(d: Date): ISODate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseISODate(s: ISODate): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Whole calendar days from `from` to `to` (negative if `to` is earlier). */
export function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / 86_400_000);
}

/** "Di, 20.10." */
export function formatDayShort(d: Date): string {
  return `${WEEKDAYS_SHORT[d.getDay()]}, ${pad(d.getDate())}.${pad(d.getMonth() + 1)}.`;
}

/** "Dienstag" */
export function formatWeekdayLong(d: Date): string {
  return WEEKDAYS_LONG[d.getDay()] ?? '';
}

/** "Donnerstag" for 4. */
export function weekdayName(weekday: number): string {
  return WEEKDAYS_LONG[weekday] ?? '';
}

/** "30. Oktober" */
export function formatDayMonthLong(d: Date): string {
  return `${d.getDate()}. ${MONTHS[d.getMonth()]}`;
}

/** "Oktober" */
export function formatMonth(d: Date): string {
  return MONTHS[d.getMonth()] ?? '';
}

/** The next date after `from` that falls on `weekday` (0 = Sunday), at least one day later. */
export function nextWeekday(from: Date, weekday: number): Date {
  const diff = (weekday - from.getDay() + 7) % 7 || 7;
  return addDays(startOfDay(from), diff);
}

/** Weekday index for a German weekday name or abbreviation ("Donnerstag", "do"), or undefined. */
export function parseWeekday(text: string): number | undefined {
  const low = text.toLowerCase();
  const i = WEEKDAYS_LONG.findIndex((w) => low.includes(w.toLowerCase()));
  return i >= 0 ? i : undefined;
}

/** ISO 8601 calendar week. */
export function isoWeek(d: Date): number {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

/** "HH:mm" */
export function formatTime(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Due date label relative to `now`: "Heute", "Morgen", "Do", "Fr, 30.10.", "überfällig seit Mo". */
export function formatDue(due: ISODate, now: Date, time?: string): string {
  const d = parseISODate(due);
  const diff = daysBetween(now, d);
  let label: string;
  if (diff < 0) label = `überfällig seit ${WEEKDAYS_SHORT[d.getDay()]}`;
  else if (diff === 0) label = 'Heute';
  else if (diff === 1) label = 'Morgen';
  else if (diff < 7) label = WEEKDAYS_SHORT[d.getDay()] ?? '';
  else label = formatDayShort(d);
  return time ? `${label}, ${time}` : label;
}

/** Relative time for past events: "vor 12 Minuten", "Heute, 07:00", "Gestern", "Fr, 16.10.". */
export function formatPast(at: ISODateTime, now: Date): string {
  const d = new Date(at);
  const minutes = Math.round((now.getTime() - d.getTime()) / 60_000);
  if (minutes >= 0 && minutes < 1) return 'gerade eben';
  if (minutes >= 0 && minutes < 60)
    return minutes === 1 ? 'vor 1 Minute' : `vor ${minutes} Minuten`;
  const days = daysBetween(d, now);
  if (days === 0) return `Heute, ${formatTime(d)}`;
  if (days === 1) return 'Gestern';
  return formatDayShort(d);
}

export type ChatAgeGroup = 'Heute' | 'Gestern' | 'Letzte Woche' | 'Älter';

export function chatAgeGroup(updatedAt: ISODateTime, now: Date): ChatAgeGroup {
  const days = daysBetween(new Date(updatedAt), now);
  if (days <= 0) return 'Heute';
  if (days === 1) return 'Gestern';
  if (days < 8) return 'Letzte Woche';
  return 'Älter';
}
