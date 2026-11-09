# Chaos Cup website

Astro 7 + Sanity 6 (Studio at /studio) + Vercel (server output with ISR).
The full spec is BUILD_SPEC.md. The approved design is in design-reference/ (HTML files plus assets/).

Rules for working in this repo:
- Follow BUILD_SPEC.md. Build one phase at a time and stop for review after each phase.
- Match the design files closely: colors, spacing, type, copy.
- Never put an em dash in site copy.
- Tournament status always comes from src/lib/status.ts, computed in America/Denver time. Never hard-code it.
- Never recolor or filter sponsor logos.
- Keep secrets in .env (never commit it).
