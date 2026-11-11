import { describe, expect, it } from 'vitest';
import { safeRedirectPath, signPreviewCookie, verifyPreviewCookie, stegaFilterKey } from './preview-cookie';

const secret = 'a'.repeat(64);
const now = Date.UTC(2026, 10, 10, 12);

describe('preview cookie', () => {
  it('accepts a cookie it signed, until it expires', () => {
    const value = signPreviewCookie(secret, now);
    expect(verifyPreviewCookie(value, secret, now + 60_000)).toBe(true);
    expect(verifyPreviewCookie(value, secret, now + 9 * 3600_000)).toBe(false);
  });
  it('rejects tampered, foreign or missing cookies', () => {
    const value = signPreviewCookie(secret, now);
    const [exp, sig] = value.split('.');
    expect(verifyPreviewCookie(`${Number(exp) + 999999}.${sig}`, secret, now)).toBe(false);
    expect(verifyPreviewCookie(value, 'b'.repeat(64), now)).toBe(false);
    expect(verifyPreviewCookie('1', secret, now)).toBe(false);
    expect(verifyPreviewCookie(undefined, secret, now)).toBe(false);
  });
  it('is off when no secret is configured', () => {
    expect(verifyPreviewCookie(signPreviewCookie(secret, now), undefined, now)).toBe(false);
  });
});

describe('stegaFilterKey', () => {
  it('finds the field name, skipping array indexes', () => {
    expect(stegaFilterKey(['hero', 'headline'])).toBe('headline');
    expect(stegaFilterKey(['checklist', 2])).toBe('checklist');
    expect(stegaFilterKey(['rules', { _key: 'a' }, 'title'])).toBe('title');
    expect(stegaFilterKey([])).toBeUndefined();
  });
});

describe('safeRedirectPath', () => {
  it('keeps paths on this site', () => {
    expect(safeRedirectPath('/rules?x=1#rule-a')).toBe('/rules?x=1#rule-a');
    expect(safeRedirectPath('/')).toBe('/');
  });
  it('sends anything that could leave the site home', () => {
    for (const bad of ['//evil.com', '/\\evil.com', '/\t/evil.com', 'https://evil.com', 'evil.com', '', null, undefined]) {
      expect(safeRedirectPath(bad)).toBe('/');
    }
  });
});
