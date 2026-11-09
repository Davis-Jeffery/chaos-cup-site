/**
 * Tournament status, registration and pricing.
 *
 * Every page asks this file for status. Never hard-code it.
 *
 * All comparisons happen on calendar dates in America/Denver. Sanity stores
 * `date` fields as 'YYYY-MM-DD' strings, so once "now" is converted to the
 * Denver calendar date we can compare plain strings: '2026-11-20' < '2026-11-21'.
 */

export const TIME_ZONE = 'America/Denver';

export type Status = 'upcoming' | 'live' | 'past' | 'postponed' | 'cancelled';
export type StatusOverride = 'auto' | Exclude<Status, 'upcoming'>;

/** The tournament fields this file reads. Matches the Sanity `tournament` schema. */
export interface TournamentDates {
  startDate: string;
  endDate?: string;
  registrationCloseDate?: string;
  statusOverride?: StatusOverride | null;
  pricing?: {
    regularPrice?: number;
    earlyBirdPrice?: number;
    earlyBirdDeadline?: string;
  } | null;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// en-CA formats dates as YYYY-MM-DD.
const denverFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** The calendar date in Denver at the moment `now`, as 'YYYY-MM-DD'. */
export function denverDate(now: Date = new Date()): string {
  return denverFormatter.format(now);
}

export function getStatus(t: TournamentDates, now: Date = new Date()): Status {
  const override = t.statusOverride;
  if (override && override !== 'auto') return override;

  const today = denverDate(now);
  const end = t.endDate || t.startDate;
  if (today < t.startDate) return 'upcoming';
  if (today <= end) return 'live';
  return 'past';
}

/** Open through the end of `registrationCloseDate` (Denver). Always open when unset. */
export function isRegistrationOpen(t: TournamentDates, now: Date = new Date()): boolean {
  if (!t.registrationCloseDate) return true;
  return denverDate(now) <= t.registrationCloseDate;
}

/** Early bird runs through the end of `earlyBirdDeadline` (Denver), the last early bird day. */
export function isEarlyBird(t: TournamentDates, now: Date = new Date()): boolean {
  const p = t.pricing;
  if (!p || p.earlyBirdPrice == null || !p.earlyBirdDeadline) return false;
  return denverDate(now) <= p.earlyBirdDeadline;
}

/** The price a team pays today, or undefined when no price is set. */
export function currentPrice(t: TournamentDates, now: Date = new Date()): number | undefined {
  if (isEarlyBird(t, now)) return t.pricing!.earlyBirdPrice;
  return t.pricing?.regularPrice ?? undefined;
}

/**
 * Preview helper: works out "now" for a request.
 *
 * With `?date=YYYY-MM-DD` and preview allowed (preview mode on, or the dev
 * server), returns noon Denver time on that date, so pages can be checked in
 * their live or past state ahead of time. Otherwise returns the real time.
 */
export function resolveNow(
  url: URL,
  { allowOverride }: { allowOverride: boolean },
  realNow: Date = new Date(),
): Date {
  if (!allowOverride) return realNow;
  const param = url.searchParams.get('date');
  if (!param || !ISO_DATE.test(param)) return realNow;

  // Noon UTC-7 is noon MST. In MDT (UTC-6) it is 1pm. Either way it is the
  // same Denver calendar date, well clear of midnight.
  const preview = new Date(`${param}T12:00:00-07:00`);
  if (Number.isNaN(preview.getTime()) || denverDate(preview) !== param) return realNow;
  return preview;
}

/**
 * What pages call: `const now = nowForRequest(Astro.url, { preview })`.
 * `?date=` is honored on the dev server always, and in production only when
 * preview mode is on (wired up in Phase 9).
 */
export function nowForRequest(url: URL, { preview = false }: { preview?: boolean } = {}): Date {
  return resolveNow(url, { allowOverride: import.meta.env.DEV || preview });
}
