/**
 * Tournament data and the choices pages make from it. Every status decision
 * goes through src/lib/status.ts.
 */
import { getStatus, isRegistrationOpen, type Status, type TournamentDates } from './status';

export interface Shoe {
  _key?: string;
  name: string;
  rating: 'best' | 'allowed' | 'notAllowed';
  note?: string;
  image?: any;
}

export interface Tournament extends TournamentDates {
  _id: string;
  title: string;
  slug: string;
  seriesLabel?: string;
  presentingSponsorName?: string;
  logo: any;
  primaryColor: string;
  accentColor?: string;
  heroImage?: any;
  heroVideo?: { url?: string; poster?: any };
  cardImage?: any;
  overrideNote?: string;
  venue?: { name: string; address?: string; mapsUrl?: string; parking?: string; photo?: any };
  surface?: { type?: string; headline?: string; areaName?: string; intro?: string; photo?: any };
  shoes?: Shoe[];
  divisions?: string;
  rosterSize?: string;
  links?: {
    registerUrl?: string;
    individualSignupUrl?: string;
    divisionLinks?: { _key: string; label: string; url: string }[];
    resultsUrl?: string;
    smugmugGalleryUrl?: string;
  };
  beneficiary?: { schoolName?: string; programName?: string; logo?: any; donateUrl?: string };
  checklist?: string[];
  recap?: { coverImage?: any; text?: string; championPhotos?: any[] };
  seo?: { title?: string; description?: string; image?: any };
}

const IMG = `{ ..., asset->{ _id, url, metadata { dimensions, lqip } } }`;

/** GROQ projection for a full tournament. */
export const TOURNAMENT_FIELDS = `
  ...,
  "slug": slug.current,
  "presentingSponsorName": presentingSponsor->name,
  logo ${IMG},
  heroImage ${IMG},
  heroVideo { url, poster ${IMG} },
  cardImage ${IMG},
  venue { ..., photo ${IMG} },
  surface { ..., photo ${IMG} },
  shoes[] { ..., image ${IMG} },
  beneficiary { ..., logo ${IMG} },
  recap { ..., coverImage ${IMG}, championPhotos[] ${IMG} },
  seo { ..., image ${IMG} }
`;

export const ALL_TOURNAMENTS_QUERY = `*[_type == "tournament" && defined(slug.current) && !(_id in path("drafts.**"))] | order(startDate asc) { ${TOURNAMENT_FIELDS} }`;

export const tournamentPath = (t: Pick<Tournament, 'slug'>) => `/tournaments/${t.slug}`;

type WithStatus<T> = T & { status: Status };

export function withStatus<T extends TournamentDates>(list: T[], now: Date): WithStatus<T>[] {
  return list.map((t) => ({ ...t, status: getStatus(t, now) }));
}

const byStart = (a: TournamentDates, b: TournamentDates) => a.startDate.localeCompare(b.startDate);

/** Live events first (earliest start), then upcoming (earliest start). */
export function currentAndUpcoming<T extends TournamentDates>(list: T[], now: Date): WithStatus<T>[] {
  const all = withStatus(list, now);
  return [
    ...all.filter((t) => t.status === 'live').sort(byStart),
    ...all.filter((t) => t.status === 'upcoming').sort(byStart),
  ];
}

/** Past events, newest first. */
export function pastEvents<T extends TournamentDates>(list: T[], now: Date): WithStatus<T>[] {
  return withStatus(list, now)
    .filter((t) => t.status === 'past')
    .sort((a, b) => byStart(b, a));
}

/** Home hero: a live event, else the next upcoming one, else nothing (coming soon). */
export function pickHero<T extends TournamentDates>(
  list: T[],
  now: Date,
): { state: 'live' | 'upcoming'; tournament: WithStatus<T> } | { state: 'comingSoon' } {
  const first = currentAndUpcoming(list, now)[0];
  if (!first) return { state: 'comingSoon' };
  return { state: first.status === 'live' ? 'live' : 'upcoming', tournament: first };
}

export function registerUrl(t: Tournament, defaultUrl: string): string {
  return t.links?.registerUrl || defaultUrl;
}

export function soloUrl(t: Tournament, defaultUrl?: string): string | undefined {
  return t.links?.individualSignupUrl || defaultUrl;
}

export function canRegister(t: Tournament, now: Date): boolean {
  return getStatus(t, now) === 'upcoming' && isRegistrationOpen(t, now);
}

/** "Redmond Re-Lyte Chaos Cup 3v3" */
export function presentedTitle(t: Pick<Tournament, 'presentingSponsorName'>): string {
  return t.presentingSponsorName ? `${t.presentingSponsorName} Chaos Cup 3v3` : 'Chaos Cup 3v3';
}

/** The part after the last "·" in the series label, like "Event 3 of 3". */
export function seriesShort(t: Pick<Tournament, 'seriesLabel'>): string | undefined {
  return t.seriesLabel?.split('·').pop()?.trim() || undefined;
}

const RATING_ORDER = { best: 0, allowed: 1, notAllowed: 2 } as const;

/** Best first, then Allowed, then Not allowed. */
export function sortedShoes(shoes: Shoe[] = []): Shoe[] {
  return [...shoes].sort((a, b) => RATING_ORDER[a.rating] - RATING_ORDER[b.rating]);
}

/**
 * One-line shoe summary for cards:
 * "Futsal flats or tennis shoes only" or "All shoe types allowed, cleats included".
 */
export function shoeSummary(shoes: Shoe[] = []): string | undefined {
  if (shoes.length === 0) return undefined;
  const ok = sortedShoes(shoes).filter((s) => s.rating !== 'notAllowed');
  if (ok.length === 0) return undefined;
  if (ok.length === shoes.length) {
    const cleats = ok.some((s) => /cleat/i.test(s.name));
    return cleats ? 'All shoe types allowed, cleats included' : 'All shoe types allowed';
  }
  const names = ok.map((s, i) => (i === 0 ? s.name : s.name.charAt(0).toLowerCase() + s.name.slice(1)));
  const list = names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} or ${names[names.length - 1]}`;
  return `${list} only`;
}
