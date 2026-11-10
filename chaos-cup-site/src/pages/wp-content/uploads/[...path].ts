/**
 * Old WordPress file links. The sponsorship PDF was shared widely, so any old
 * PDF link forwards to the current one in Site settings; anything else goes home.
 */
import type { APIRoute } from 'astro';
import { sanityFetch } from '../../../lib/sanity';

export const GET: APIRoute = async ({ params, redirect }) => {
  if (/\.pdf$/i.test(params.path ?? '')) {
    const pdf = await sanityFetch<string | null>(`*[_id == "siteSettings"][0].sponsorshipPdf.asset->url`);
    if (pdf) return redirect(pdf, 301);
  }
  return redirect('/', 301);
};
