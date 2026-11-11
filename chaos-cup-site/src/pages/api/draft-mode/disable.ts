/** Turns preview off and returns to the page the editor was on. */
import type { APIRoute } from 'astro';
import { PREVIEW_COOKIE, safeRedirectPath } from '../../../lib/preview-cookie';

export const prerender = false;

export const GET: APIRoute = ({ cookies, redirect, url }) => {
  cookies.delete(PREVIEW_COOKIE, { path: '/' });
  cookies.delete('__prerender_bypass', { path: '/' });
  return redirect(safeRedirectPath(url.searchParams.get('redirect')), 307);
};
