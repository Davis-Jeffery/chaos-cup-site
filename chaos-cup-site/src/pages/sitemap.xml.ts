/** Every public page, including one per tournament, built from Sanity on request. */
import type { APIRoute } from 'astro';
import { sanityFetch } from '../lib/sanity';

const STATIC_PAGES = ['/', '/why-3v3', '/rules', '/past-events', '/get-involved', '/contact'];

export const GET: APIRoute = async ({ site, url }) => {
  const origin = (site ?? url).origin;
  const tournaments = await sanityFetch<{ slug: string; updated: string }[]>(
    `*[_type == "tournament" && defined(slug.current) && !(_id in path("drafts.**"))]{ "slug": slug.current, "updated": _updatedAt }`,
  );
  const entries = [
    ...STATIC_PAGES.map((path) => ({ loc: `${origin}${path === '/' ? '/' : path}` })),
    ...tournaments.map((t) => ({ loc: `${origin}/tournaments/${t.slug}`, lastmod: t.updated.slice(0, 10) })),
  ];
  const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map((e) => `  <url><loc>${escape(e.loc)}</loc>${'lastmod' in e && e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ''}</url>`).join('\n')}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
