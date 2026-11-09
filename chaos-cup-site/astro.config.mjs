// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import react from '@astrojs/react';
import sanity from '@sanity/astro';
import { loadEnv } from 'vite';

const env = loadEnv(process.env.NODE_ENV ?? 'development', process.cwd(), '');

export default defineConfig({
  site: 'https://thechaoscup.com',
  // Pages render on the server so tournament status (upcoming / live / past)
  // is worked out from today's date on every request.
  output: 'server',
  adapter: vercel({
    // Vercel caches each page, then refreshes it in the background.
    // 300 seconds = edits in Sanity and status changes show up within ~5 minutes.
    isr: { expiration: 300, exclude: [/^\/studio/] },
  }),
  integrations: [
    sanity({
      projectId: env.PUBLIC_SANITY_PROJECT_ID,
      dataset: env.PUBLIC_SANITY_DATASET ?? 'production',
      apiVersion: '2026-11-01',
      useCdn: true,
      studioBasePath: '/studio',
    }),
    react(),
  ],
});
