import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site, url }) => {
  const origin = (site ?? url).origin;
  return new Response(
    ['User-agent: *', 'Allow: /', 'Disallow: /studio', 'Disallow: /api/', '', `Sitemap: ${origin}/sitemap.xml`, ''].join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
};
