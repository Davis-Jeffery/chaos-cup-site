/**
 * Data every page needs for the shared layout: site settings, sponsors and
 * the slim tournament list the sponsors card uses.
 */
import { sanityFetch } from './sanity';
import { denverDate, getStatus, type TournamentDates } from './status';

// Image projection with the metadata SanityImage uses for width and height.
export const IMAGE = `{ ..., asset->{ _id, url, metadata { dimensions, lqip } } }`;

export interface Link {
  _key?: string;
  label: string;
  kind?: 'internal' | 'external';
  path?: string;
  url?: string;
}

export interface Sponsor {
  _id: string;
  name: string;
  tier: 'primary' | 'secondary';
  order?: number;
  designation?: string;
  url?: string;
  linkEnabled?: boolean;
  logoOnDark: any;
  logoOnLight?: any;
  tileStyle?: 'light' | 'dark';
  contractStart: string;
  contractEnd: string;
  banner?: Record<string, any>;
}

export interface TournamentSummary extends TournamentDates {
  _id: string;
  title: string;
  slug: string;
  presentingSponsorId?: string;
}

export interface SiteSettings {
  logo: any;
  tagline?: string;
  sponsorshipPdfUrl?: string;
  navLinks?: Link[];
  registerLabel?: string;
  registerUrl: string;
  individualSignupUrl?: string;
  announcement?: Record<string, any>;
  comingSoon?: Record<string, any>;
  footerColumns?: { _key: string; heading: string; links?: Link[] }[];
  instagramUrl?: string;
  contactEmail?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoImage?: any;
}

export interface LayoutData {
  settings: SiteSettings;
  sponsors: Sponsor[];
  tournaments: TournamentSummary[];
}

const LAYOUT_QUERY = `{
  "settings": *[_id == "siteSettings"][0]{
    ...,
    logo ${IMAGE},
    seoImage ${IMAGE},
    "sponsorshipPdfUrl": sponsorshipPdf.asset->url
  },
  "sponsors": *[_type == "sponsor" && !(_id in path("drafts.**"))] | order(order asc, name asc){
    ...,
    logoOnDark ${IMAGE},
    logoOnLight ${IMAGE},
    banner { ..., image ${IMAGE}, qrCode ${IMAGE} }
  },
  "tournaments": *[_type == "tournament" && !(_id in path("drafts.**"))] | order(startDate asc){
    _id, title, "slug": slug.current, startDate, endDate, registrationCloseDate, statusOverride,
    "presentingSponsorId": presentingSponsor._ref
  }
}`;

export async function getLayoutData(preview = false): Promise<LayoutData> {
  const data = await sanityFetch<LayoutData>(LAYOUT_QUERY, { preview });
  return { settings: data.settings, sponsors: data.sponsors ?? [], tournaments: data.tournaments ?? [] };
}

/** href for a `link` object. */
export function linkHref(link: Link): string {
  return (link.kind === 'external' ? link.url : link.path) ?? '#';
}

export function isExternal(href: string): boolean {
  return /^https?:\/\//.test(href);
}

/** Sponsors show from contractStart through contractEnd (inclusive, Denver date). */
export function isSponsorActive(s: Pick<Sponsor, 'contractStart' | 'contractEnd'>, now: Date): boolean {
  const today = denverDate(now);
  if (s.contractStart && today < s.contractStart) return false;
  if (s.contractEnd && today > s.contractEnd) return false;
  return true;
}

export function activeSponsors(sponsors: Sponsor[], now: Date): Sponsor[] {
  return sponsors.filter((s) => isSponsorActive(s, now));
}

/**
 * The event a sponsor's feature card names, as in "Title sponsor · Turkey Takedown".
 * On the page of a live or upcoming tournament that sponsor presents, it is that tournament. Otherwise it
 * is the next live or upcoming tournament the sponsor presents.
 */
export function featuredEventFor(
  sponsor: Sponsor,
  tournaments: TournamentSummary[],
  now: Date,
  currentTournamentId?: string,
): TournamentSummary | undefined {
  const presented = tournaments.filter((t) => t.presentingSponsorId === sponsor._id);
  const rank = { live: 0, upcoming: 1 } as Record<string, number>;
  // A past event's page names the next event instead, like the Monster Mash design.
  const current = presented.find((t) => t._id === currentTournamentId);
  if (current && getStatus(current, now) in rank) return current;
  return presented
    .filter((t) => getStatus(t, now) in rank)
    .sort((a, b) => rank[getStatus(a, now)] - rank[getStatus(b, now)] || a.startDate.localeCompare(b.startDate))[0];
}
