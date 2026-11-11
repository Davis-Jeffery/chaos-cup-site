/**
 * Preview mode is a signed, expiring cookie. Only /api/draft-mode/enable sets
 * it, after Sanity's Presentation tool proves the request came from a
 * logged-in Studio user. Without a valid signature nobody sees drafts.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

export const PREVIEW_COOKIE = 'chaos-preview';
export const PREVIEW_HOURS = 8;

const sign = (payload: string, secret: string) => createHmac('sha256', secret).update(payload).digest('hex');

export function signPreviewCookie(secret: string, now = Date.now()): string {
  const exp = String(now + PREVIEW_HOURS * 3600_000);
  return `${exp}.${sign(exp, secret)}`;
}

export function verifyPreviewCookie(value: string | undefined, secret: string | undefined, now = Date.now()): boolean {
  if (!value || !secret) return false;
  const [exp, sig] = value.split('.');
  if (!exp || !sig || !/^\d+$/.test(exp) || Number(exp) < now) return false;
  const expected = Buffer.from(sign(exp, secret));
  const given = Buffer.from(sig);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** The field name a stega source path ends in, skipping array indexes and keys. */
export function stegaFilterKey(path: unknown[]): string | undefined {
  for (let i = path.length - 1; i >= 0; i--) {
    if (typeof path[i] === 'string') return path[i] as string;
  }
  return undefined;
}

/**
 * Fields whose text gets invisible click-to-edit markers in preview. Only
 * display text: never dates, slugs, colors, URLs, option values or anything
 * the code compares or parses (school names, addresses, divisions).
 */
export const STEGA_FIELDS = new Set([
  'title',
  'headline',
  'eyebrow',
  'text',
  'intro',
  'heroText',
  'body',
  'label',
  'note',
  'subtitle',
  'caption',
  'name',
  'value',
  'tagline',
  'designation',
  'seriesLabel',
  'buttonLabel',
  'primaryLabel',
  'secondaryLabel',
  'instagramLabel',
  'registerLabel',
  'stripText',
  'stripButtonLabel',
  'galleryOfferText',
  'finePrint',
  'promoCode',
  'qrLabel',
  'points',
  'checklist',
  'schoolProvides',
  'weProvide',
  'parking',
  'areaName',
  'scheduleNote',
  'venueNote',
  'divisionsNote',
  'formatHeadline',
  'formatText',
  'overrideNote',
  'sources',
  'columnA',
  'columnB',
  'a',
  'b',
]);

/**
 * A redirect target that can only stay on this site. Browsers read "/\x" and
 * "/<tab>/x" as "//x" (another site), so anything but a plain path goes home.
 */
export function safeRedirectPath(target: string | null | undefined): string {
  if (!target || !target.startsWith('/')) return '/';
  if (/[\\\s\u0000-\u001f]/.test(target) || target.startsWith('//')) return '/';
  try {
    const url = new URL(target, 'https://example.invalid');
    return url.origin === 'https://example.invalid' ? `${url.pathname}${url.search}${url.hash}` : '/';
  } catch {
    return '/';
  }
}
