import { defineMiddleware } from 'astro:middleware';
import { serverEnv } from './lib/env';
import { PREVIEW_COOKIE, verifyPreviewCookie } from './lib/preview-cookie';

/** Works out preview mode once per request and keeps preview pages out of every cache. */
export const onRequest = defineMiddleware(async (context, next) => {
  const isStudio = context.url.pathname.startsWith('/studio');
  context.locals.preview =
    !isStudio && verifyPreviewCookie(context.cookies.get(PREVIEW_COOKIE)?.value, serverEnv('VERCEL_ISR_BYPASS_TOKEN'));

  const response = await next();
  // Basic hardening. frame-ancestors 'self' lets the Studio's live preview
  // frame the site while stopping other sites from framing it.
  if (!isStudio) response.headers.set('Content-Security-Policy', "frame-ancestors 'self'");
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (context.locals.preview) response.headers.set('Cache-Control', 'private, no-store');
  return response;
});
