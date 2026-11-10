import { describe, expect, it } from 'vitest';
import { bestShoeLabel, bundlePartner, currentAndUpcoming, pastEvents, pickHero, seriesShort, shoeSummary, type Shoe } from './tournaments';

const at = (date: string) => new Date(`${date}T12:00:00-07:00`);

const mash = { _id: 'mash', startDate: '2026-10-17', endDate: '2026-10-17', statusOverride: 'auto' as const };
const turkey = { _id: 'turkey', startDate: '2026-11-20', endDate: '2026-11-21', statusOverride: 'auto' as const };
const frost = { _id: 'frost', startDate: '2027-01-08', endDate: '2027-01-09', statusOverride: 'auto' as const };
const all = [frost, mash, turkey];

describe('pickHero', () => {
  it('picks the next upcoming event', () => {
    const hero = pickHero(all, at('2026-11-09'));
    expect(hero.state).toBe('upcoming');
    expect(hero.state !== 'comingSoon' && hero.tournament._id).toBe('turkey');
  });
  it('picks a live event over upcoming ones', () => {
    const hero = pickHero(all, at('2026-11-21'));
    expect(hero.state).toBe('live');
    expect(hero.state !== 'comingSoon' && hero.tournament._id).toBe('turkey');
  });
  it('moves on the day after an event ends', () => {
    const hero = pickHero(all, at('2026-11-22'));
    expect(hero.state !== 'comingSoon' && hero.tournament._id).toBe('frost');
  });
  it('picks the earliest of several live events', () => {
    const other = { _id: 'other', startDate: '2026-11-19', endDate: '2026-11-22', statusOverride: 'auto' as const };
    const hero = pickHero([...all, other], at('2026-11-20'));
    expect(hero.state !== 'comingSoon' && hero.tournament._id).toBe('other');
  });
  it('falls back to coming soon', () => {
    expect(pickHero(all, at('2027-02-01')).state).toBe('comingSoon');
  });
  it('skips cancelled and postponed events', () => {
    const cancelled = { ...turkey, statusOverride: 'cancelled' as const };
    const hero = pickHero([mash, cancelled, frost], at('2026-11-09'));
    expect(hero.state !== 'comingSoon' && hero.tournament._id).toBe('frost');
  });
});

describe('lists', () => {
  it('orders live then upcoming', () => {
    expect(currentAndUpcoming(all, at('2026-11-20')).map((t) => t._id)).toEqual(['turkey', 'frost']);
  });
  it('orders past events newest first', () => {
    expect(pastEvents(all, at('2027-02-01')).map((t) => t._id)).toEqual(['frost', 'turkey', 'mash']);
  });
});

describe('card text', () => {
  const shoe = (name: string, rating: Shoe['rating']): Shoe => ({ name, rating });
  it('summarizes hardwood shoes', () => {
    expect(
      shoeSummary([shoe('Cleats of any kind', 'notAllowed'), shoe('Tennis shoes', 'allowed'), shoe('Futsal flats', 'best')]),
    ).toBe('Futsal flats or tennis shoes only');
  });
  it('summarizes turf shoes', () => {
    expect(shoeSummary([shoe('Cleats / turf shoes', 'best'), shoe('Futsal flats', 'allowed')])).toBe(
      'All shoe types allowed, cleats included',
    );
  });
  it('reads the short series label', () => {
    expect(seriesShort({ seriesLabel: 'Holiday Series · Event 3 of 3' })).toBe('Event 3 of 3');
    expect(seriesShort({})).toBeUndefined();
  });
});

describe('event page helpers', () => {
  it('names the best shoe', () => {
    expect(bestShoeLabel([{ name: 'Cleats / turf shoes', rating: 'best' }])).toBe('Cleats or turf shoes best');
    expect(bestShoeLabel([{ name: 'Futsal flats', rating: 'best' }])).toBe('Futsal flats best');
    expect(bestShoeLabel([])).toBeUndefined();
  });
  it('finds the bundle partner', () => {
    const b = (t: typeof turkey) => ({ ...t, pricing: { bundleSavings: 50.35 } });
    const list = [b(mash), b(turkey), b(frost)];
    expect(bundlePartner(list[1], list, at('2026-11-09'))?._id).toBe('frost');
    expect(bundlePartner(list[2], list, at('2026-11-09'))?._id).toBe('turkey');
    // After Turkey Takedown there is nothing left to bundle with.
    expect(bundlePartner(list[2], list, at('2026-11-22'))).toBeUndefined();
    expect(bundlePartner({ ...turkey, pricing: { bundleSavings: 0 } }, list, at('2026-11-09'))).toBeUndefined();
  });
});
