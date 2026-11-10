import { describe, expect, it } from 'vitest';
import {
  cityFromAddress,
  dateRange,
  formatPrice,
  highlightParts,
  shortDate,
  shortSchool,
  streetAndCity,
  splitLastWord,
} from './format';

describe('dateRange', () => {
  it('formats a single day', () => {
    expect(dateRange('2026-10-17')).toBe('Oct 17, 2026');
    expect(dateRange('2026-10-17', '2026-10-17')).toBe('Oct 17, 2026');
    expect(dateRange('2026-10-17', undefined, { weekday: true })).toBe('Sat, Oct 17, 2026');
  });
  it('formats days in one month', () => {
    expect(dateRange('2026-11-20', '2026-11-21')).toBe('Nov 20-21, 2026');
    expect(dateRange('2026-11-20', '2026-11-21', { weekday: true })).toBe('Fri-Sat, Nov 20-21, 2026');
  });
  it('formats across months and years', () => {
    expect(dateRange('2026-11-30', '2026-12-01')).toBe('Nov 30-Dec 1, 2026');
    expect(dateRange('2026-12-31', '2027-01-01')).toBe('Dec 31, 2026-Jan 1, 2027');
  });
  it('can leave out the year', () => {
    expect(dateRange('2026-11-20', '2026-11-21', { year: false })).toBe('Nov 20-21');
  });
  it('never uses an em dash', () => {
    expect(dateRange('2026-12-31', '2027-01-01', { weekday: true })).not.toMatch(/—/);
  });
});

describe('shortDate', () => {
  it('formats month and day', () => {
    expect(shortDate('2026-11-09')).toBe('Nov 9');
    expect(shortDate('2026-12-27')).toBe('Dec 27');
  });
});

describe('formatPrice', () => {
  it('drops cents on whole dollars and keeps two places otherwise', () => {
    expect(formatPrice(265)).toBe('$265');
    expect(formatPrice(238.5)).toBe('$238.50');
    expect(formatPrice(50.35)).toBe('$50.35');
    expect(formatPrice(0)).toBe('$0');
  });
});

describe('addresses and names', () => {
  it('finds the city', () => {
    expect(cityFromAddress('99 N 200 W, Saratoga Springs, UT')).toBe('Saratoga Springs');
    expect(cityFromAddress('Herriman, UT')).toBe('Herriman');
    expect(cityFromAddress('Herriman')).toBe('Herriman');
    expect(cityFromAddress(undefined)).toBeUndefined();
  });
  it('drops the state', () => {
    expect(streetAndCity('99 N 200 W, Saratoga Springs, UT')).toBe('99 N 200 W, Saratoga Springs');
    expect(streetAndCity('2220 Bengal Blvd, Cottonwood Heights, UT')).toBe('2220 Bengal Blvd, Cottonwood Heights');
  });
  it('shortens school names', () => {
    expect(shortSchool('West Lake High School')).toBe('West Lake');
    expect(shortSchool('West Lake High School', 'HS')).toBe('West Lake HS');
    expect(shortSchool('Salt Lake Academy')).toBe('Salt Lake Academy');
  });
});

describe('headline highlights', () => {
  it('splits *marked* words', () => {
    expect(highlightParts('Bring the *chaos.*')).toEqual([
      { text: 'Bring the ', highlight: false },
      { text: 'chaos.', highlight: true },
    ]);
    expect(highlightParts('Save *25%* on it')).toEqual([
      { text: 'Save ', highlight: false },
      { text: '25%', highlight: true },
      { text: ' on it', highlight: false },
    ]);
  });
  it('leaves plain text alone', () => {
    expect(highlightParts('Plain')).toEqual([{ text: 'Plain', highlight: false }]);
    expect(highlightParts(undefined)).toEqual([]);
  });
  it('splits the last word of a title', () => {
    expect(splitLastWord('Turkey Takedown')).toEqual(['Turkey ', 'Takedown']);
    expect(splitLastWord('Monster')).toEqual(['', 'Monster']);
  });
});
