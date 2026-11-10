/**
 * Called by the Presentation tool with a short-lived secret it just created.
 * If Sanity confirms the secret, turn on preview and go to the requested page.
 */
import type { APIRoute } from 'astro';
import { validatePreviewUrl } from '@sanity/preview-url-secret';
import { sanityClient } from '../../../lib/sanity';
import { serverEnv } from '../../../lib/env';
import { PREVIEW_COOKIE, PREVIEW_HOURS, signPreviewCookie } from '../../../lib/preview-cookie';

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies, redirect, url }) => {
  const token = serverEnv('SANITY_API_READ_TOKEN');
  const secret = serverEnv('VERCEL_ISR_BYPASS_TOKEN');
  if (!token || !secret) return new Response('Preview is not configured.', { status: 500 });

  const client = sanityClient.withConfig({ token, useCdn: false });
  const { isValid, redirectTo = '/' } = await validatePreviewUrl(client, request.url);
  if (!isValid) return new Response('Invalid preview link.', { status: 401 });

  const options = {
    path: '/',
    httpOnly: true,
    secure: url.protocol === 'https:',
    sameSite: 'lax' as const,
    maxAge: PREVIEW_HOURS * 3600,
  };
  cookies.set(PREVIEW_COOKIE, signPreviewCookie(secret), options);
  // Vercel skips its page cache for requests carrying this cookie.
  cookies.set('__prerender_bypass', secret, options);

  // Only ever redirect within this site.
  const target = redirectTo.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : '/';
  return redirect(target, 307);
};
