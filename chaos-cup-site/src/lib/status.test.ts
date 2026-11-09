import { describe, expect, it } from 'vitest';
import {
  currentPrice,
  denverDate,
  getStatus,
  isEarlyBird,
  isRegistrationOpen,
  resolveNow,
  type TournamentDates,
} from './status';

// Turkey Takedown from the seed data: Nov 20 to 21 2026 (MST, UTC-7).
const turkey: TournamentDates = {
  startDate: '2026-11-20',
  endDate: '2026-11-21',
  registrationCloseDate: '2026-11-15',
  statusOverride: 'auto',
  pricing: { regularPrice: 265, earlyBirdPrice: 238.5, earlyBirdDeadline: '2026-11-09' },
};

const at = (iso: string) => new Date(iso);

describe('denverDate', () => {
  it('uses the Denver calendar date, not UTC', () => {
    // 05:30 UTC on Nov 20 is still 10:30pm Nov 19 in Denver.
    expect(denverDate(at('2026-11-20T05:30:00Z'))).toBe('2026-11-19');
    expect(denverDate(at('2026-11-20T07:00:00Z'))).toBe('2026-11-20');
  });

  it('handles daylight time (UTC-6)', () => {
    // Monster Mash, Oct 17 2026. Midnight MDT is 06:00 UTC.
    expect(denverDate(at('2026-10-17T05:59:59Z'))).toBe('2026-10-16');
    expect(denverDate(at('2026-10-17T06:00:00Z'))).toBe('2026-10-17');
  });
});

describe('getStatus', () => {
  it('is upcoming until midnight Denver on the start date', () => {
    expect(getStatus(turkey, at('2026-11-20T06:59:59Z'))).toBe('upcoming'); // 11:59:59pm Nov 19
    expect(getStatus(turkey, at('2026-11-20T07:00:00Z'))).toBe('live'); // 12:00am Nov 20
  });

  it('stays live across every day of a multi-day event', () => {
    expect(getStatus(turkey, at('2026-11-20T19:00:00Z'))).toBe('live');
    expect(getStatus(turkey, at('2026-11-21T19:00:00Z'))).toBe('live');
    expect(getStatus(turkey, at('2026-11-22T06:59:59Z'))).toBe('live'); // 11:59:59pm Nov 21
  });

  it('is past from midnight Denver after the end date', () => {
    expect(getStatus(turkey, at('2026-11-22T07:00:00Z'))).toBe('past');
  });

  it('is not fooled by UTC already being the next day', () => {
    // 6pm Nov 21 Denver = 01:00 Nov 22 UTC. Still the last day.
    expect(getStatus(turkey, at('2026-11-22T01:00:00Z'))).toBe('live');
  });

  it('treats a missing end date as a one-day event', () => {
    const oneDay: TournamentDates = { startDate: '2026-10-17' };
    expect(getStatus(oneDay, at('2026-10-17T20:00:00Z'))).toBe('live');
    expect(getStatus(oneDay, at('2026-10-18T06:00:00Z'))).toBe('past');
  });

  it('lets any override other than auto win', () => {
    const before = at('2026-11-01T18:00:00Z');
    const after = at('2026-12-01T18:00:00Z');
    expect(getStatus({ ...turkey, statusOverride: 'postponed' }, before)).toBe('postponed');
    expect(getStatus({ ...turkey, statusOverride: 'cancelled' }, after)).toBe('cancelled');
    expect(getStatus({ ...turkey, statusOverride: 'live' }, before)).toBe('live');
    expect(getStatus({ ...turkey, statusOverride: 'past' }, before)).toBe('past');
  });

  it('treats a missing or null override as auto', () => {
    const before = at('2026-11-01T18:00:00Z');
    expect(getStatus({ ...turkey, statusOverride: undefined }, before)).toBe('upcoming');
    expect(getStatus({ ...turkey, statusOverride: null }, before)).toBe('upcoming');
  });
});

describe('isRegistrationOpen', () => {
  it('stays open through the whole close date, Denver time', () => {
    expect(isRegistrationOpen(turkey, at('2026-11-16T06:59:59Z'))).toBe(true); // 11:59:59pm Nov 15
    expect(isRegistrationOpen(turkey, at('2026-11-16T07:00:00Z'))).toBe(false);
  });

  it('is always open when no close date is set', () => {
    const { registrationCloseDate, ...noClose } = turkey;
    expect(isRegistrationOpen(noClose, at('2030-01-01T00:00:00Z'))).toBe(true);
  });
});

describe('early bird', () => {
  it('switches to the regular price the day after the deadline, Denver time', () => {
    const lastEarlyMinute = at('2026-11-10T06:59:59Z'); // 11:59:59pm Nov 9
    const firstRegular = at('2026-11-10T07:00:00Z'); // 12:00am Nov 10
    expect(isEarlyBird(turkey, lastEarlyMinute)).toBe(true);
    expect(currentPrice(turkey, lastEarlyMinute)).toBe(238.5);
    expect(isEarlyBird(turkey, firstRegular)).toBe(false);
    expect(currentPrice(turkey, firstRegular)).toBe(265);
  });

  it('is off when the early bird price or deadline is missing', () => {
    const early = at('2026-11-01T18:00:00Z');
    const noDeadline = { ...turkey, pricing: { regularPrice: 265, earlyBirdPrice: 238.5 } };
    const noEarlyPrice = { ...turkey, pricing: { regularPrice: 265, earlyBirdDeadline: '2026-11-09' } };
    expect(isEarlyBird(noDeadline, early)).toBe(false);
    expect(currentPrice(noDeadline, early)).toBe(265);
    expect(isEarlyBird(noEarlyPrice, early)).toBe(false);
  });

  it('returns undefined when no price is set', () => {
    expect(currentPrice({ startDate: '2026-11-20' }, at('2026-11-01T18:00:00Z'))).toBeUndefined();
    expect(currentPrice({ startDate: '2026-11-20', pricing: null })).toBeUndefined();
  });

  it('keeps an early bird price of 0', () => {
    const free = { ...turkey, pricing: { regularPrice: 265, earlyBirdPrice: 0, earlyBirdDeadline: '2026-11-09' } };
    expect(currentPrice(free, at('2026-11-01T18:00:00Z'))).toBe(0);
  });
});

describe('resolveNow (?date= preview)', () => {
  const real = at('2026-11-09T18:00:00Z');
  const url = (q: string) => new URL(`https://thechaoscup.com/tournaments/turkey-takedown${q}`);

  it('uses the real time without a date param', () => {
    expect(resolveNow(url(''), { allowOverride: true }, real)).toBe(real);
  });

  it('ignores ?date= when preview is not allowed', () => {
    expect(resolveNow(url('?date=2026-11-20'), { allowOverride: false }, real)).toBe(real);
  });

  it('lands on the requested Denver date when allowed', () => {
    const now = resolveNow(url('?date=2026-11-20'), { allowOverride: true }, real);
    expect(denverDate(now)).toBe('2026-11-20');
    expect(getStatus(turkey, now)).toBe('live');
    expect(getStatus(turkey, resolveNow(url('?date=2026-11-22'), { allowOverride: true }, real))).toBe('past');
  });

  it('lands on the right date in daylight time too', () => {
    const now = resolveNow(url('?date=2026-07-04'), { allowOverride: true }, real);
    expect(denverDate(now)).toBe('2026-07-04');
  });

  it('ignores bad dates', () => {
    for (const bad of ['?date=tomorrow', '?date=2026-13-01', '?date=2026-02-30', '?date=2026-1-5', '?date=']) {
      expect(resolveNow(url(bad), { allowOverride: true }, real)).toBe(real);
    }
  });
});
