/** Turns preview off and returns to the page the editor was on. */
import type { APIRoute } from 'astro';
import { PREVIEW_COOKIE } from '../../../lib/preview-cookie';

export const prerender = false;

export const GET: APIRoute = ({ cookies, redirect, url }) => {
  cookies.delete(PREVIEW_COOKIE, { path: '/' });
  cookies.delete('__prerender_bypass', { path: '/' });
  const back = url.searchParams.get('redirect') ?? '/';
  return redirect(back.startsWith('/') && !back.startsWith('//') ? back : '/', 307);
};
