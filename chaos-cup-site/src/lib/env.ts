/**
 * Server-only settings: read at request time on Vercel (process.env), and
 * from .env locally. Astro only fills in private .env values that are written
 * out literally, so each one is listed by name here.
 */
const fromDotEnv = {
  SANITY_API_READ_TOKEN: import.meta.env.SANITY_API_READ_TOKEN as string | undefined,
  VERCEL_ISR_BYPASS_TOKEN: import.meta.env.VERCEL_ISR_BYPASS_TOKEN as string | undefined,
};

export function serverEnv(name: keyof typeof fromDotEnv): string | undefined {
  return process.env[name] || fromDotEnv[name] || undefined;
}
