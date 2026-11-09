# Chaos Cup Website: Build Spec

This is the full spec for rebuilding thechaoscup.com. Read it top to bottom before writing code, then build in the phases at the end, stopping after each phase for review.

## 1. Stack (already installed and verified to build)

- Astro 7, `output: 'server'`, adapter `@astrojs/vercel` 11 with ISR (`expiration: 300`, `/studio` excluded). See `astro.config.mjs`.
- Sanity 6 Studio embedded at `/studio` through `@sanity/astro` 3.
- `@sanity/client` 8, `@sanity/image-url` 2, React 19 (Studio only, the public site ships no React unless a component truly needs it).
- Node 22.12 or newer.
- Env: `PUBLIC_SANITY_PROJECT_ID`, `PUBLIC_SANITY_DATASET`. Add `SANITY_API_READ_TOKEN` (server only) for draft preview and `SANITY_API_WRITE_TOKEN` (local only) for the seed script.

Why server output: tournament status depends on today's date. Every page works out status at request time, and ISR keeps it fast. Never hard-code status.

## 2. Design source of truth

`design-reference/` holds the approved page designs as HTML (`*.dc.html`) with every image in `design-reference/assets/`. Rebuild them faithfully in Astro components. Ignore the `<x-dc>`, `<helmet>`, `<sc-if>`, `<sc-for>` and `data-dc-script` wrappers; they come from the design tool. Take the markup, inline styles, colors, spacing, fonts and copy.

| Design file | Becomes |
|---|---|
| `Main.dc.html` | Home page `/` |
| `TurkeyTakedown.dc.html` | Tournament page template, upcoming and live states |
| `FrostbiteFrenzy.dc.html` | Same template, second example (turf surface, all shoes allowed) |
| `MonsterMash.dc.html` | Tournament page template, past (recap) state |
| `Rulebook.dc.html` | `/rules` |
| `Development.dc.html` | `/why-3v3` |

Design tokens (put them in one shared CSS file as custom properties):
- Background `#0A0A12`, raised `#0F0F19`, card `#14141F`, border `#2A2A3C`, text `#F4F3F8`, muted `#C9C8D8`, faint `#A9A8BA`.
- Brand magenta `#F90EE7` (hover `#FB5AEE`), brand blue `#2EA9F6`.
- Redmond banner blue `#00A6CE`. SmugMug panel `#F2FAE8` with green `#2F5A00` / `#4E8F00`.
- Fonts: Archivo Black (display) and Archivo 400 to 800 (body) from Google Fonts.
- Buttons: pill, min height 52px (44px small), dark text on colored fills.
- Each tournament also has its own primary and accent color (Turkey `#DF6902` / `#DB8943`, Frostbite `#3CA8E4` / `#7CC4EC`) used for its buttons, badges and borders.

Writing rule for all site copy: no em dashes.

## 3. Sanity content model

Put each type in `src/sanity/schemaTypes/` and register it in `index.ts`. Use `defineType` / `defineField`, validation, helpful descriptions, `preview` configs and field groups so the Studio is easy for a non-developer. Every image field uses `options: { hotspot: true }` and an `alt` text subfield.

### 3.1 `siteSettings` (singleton)
- Site logo (main Chaos Cup logo), tagline.
- Nav links (label + internal page or URL), and the primary "Register a Team" button label and default register URL.
- Announcement bar: enabled, text, link label, link (optional "auto" mode that announces the latest past event).
- Footer columns and links, Instagram URL, contact email.
- "Coming soon" hero: headline, text, image, optional email signup URL.
- Sponsorship prospectus PDF (file) for the "Become a Sponsor" button.
- Default SEO title, description, share image.

### 3.2 `tournament` (document, one page per tournament)
Groups: Basics, Dates and status, Venue and surface, Registration and pricing, Links, Supporting school, Game day, Recap, SEO.
- `title`, `slug` (from title), `seriesLabel` (e.g. "Holiday Series, Event 2 of 3"), `presentingSponsor` (reference to sponsor, optional, e.g. Redmond Re-Lyte), `logo`, `primaryColor`, `accentColor`.
- `heroImage`, `heroVideo` (URL to an external host such as Mux or Vercel Blob, with poster image), `cardImage`.
- `startDate`, `endDate` (date only), `registrationCloseDate` (date), `statusOverride` (`auto` default, `postponed`, `cancelled`, `live`, `past`), `overrideNote` (text shown when postponed or cancelled).
- `venue`: name, address, Google Maps URL, parking and check-in text, venue photo.
- `surface`: type (`hardwood`, `turf`, other), headline (e.g. "Hardwood basketball court"), area name, photo, intro line.
- `shoes`: array of `{ name, rating: best | allowed | notAllowed, image, note }`. Render Best first with the magenta star style, then Allowed, then Not allowed, exactly like the design.
- `divisions`: text (e.g. "U7 to U18") plus `rosterSize` text.
- `pricing`: `regularPrice`, `earlyBirdPrice`, `earlyBirdDeadline`, `bundleNote`, `bundleSavings`.
- `links`: `registerUrl` (falls back to site default), `individualSignupUrl`, `divisionLinks` (array of `{ label, url }` pointing to each PlayMetrics division standings page), `resultsUrl`, `smugmugGalleryUrl`.
- `beneficiary`: school name, program name, logo, donate URL.
- `checklist`: array of strings (game day checklist).
- `recap`: cover image, short recap text, champions photos (array of image + caption).
- `seo` object.

### 3.3 `sponsor` (document)
- `name`, `tier` (`primary` or `secondary`), `order` (number, or use an orderable list), `designation` (e.g. "Official Photo Sharing Partner", "Title sponsor").
- `logoOnDark` and `logoOnLight` images (never recolor a sponsor logo in code, the SmugMug contract forbids altering it). `tileStyle` (`light` or `dark`).
- `url` (may be an affiliate link), `linkEnabled` (MAC d33p has no link).
- `contractStart`, `contractEnd` (dates). A sponsor is shown only while today is inside this window. If `contractEnd` passes, it disappears from every page automatically.
- `banner` (shown only for `primary`): eyebrow, headline, body, image, QR code image, button label, button URL, background color, text color (`light` or `dark`), fine print (e.g. "Offer for adults 18+. Subject to the terms on SmugMug's offer page."), promo code (optional, shown in the dashed code box).
- `tournaments` (references) when the sponsor is tied to specific events.

### 3.4 `ruleSection` (document) and rules
- `title`, `order`, `rules`: array of `rule` objects `{ title, body (Portable Text), diagram, key }`. Drag to reorder.
- Rule numbers are never typed. Section number = position of the section, rule number = position inside the section, rendered as `4.2`.
- Cross references inside rule text use a Portable Text annotation that references another rule by its `_key`. Render it as "rule 4.2" with a link to `#rule-<key>`, so numbers update when rules move.
- `diagram`: string list of coded diagram components: `none`, `whereToStand`, `kickIn`, `freeKicks`, `noOffside`, `threeFoulKick`. Diagrams are Astro components with inline SVG, copied from `Rulebook.dc.html`.
- `ruleGroup` (object array on the section): `{ eyebrow, headline, intro, rules (array of rule keys), diagramSet }`. Renders the magenta "explained" boxes: Goal Zone (4.4 to 4.6) and 3-Foul Rule (5.5 to 5.6). The box label reads "Goal Zone · Rules 4.4-4.6 explained" with the range generated automatically.
- Add a `rulebookPage` singleton for the page title, intro text, PDF download and the field image at the top of Section 02.

### 3.5 Page singletons
- `homePage`: every text block on the home page (what is it section, quick facts, rules in 60 seconds tiles, reels section with video URLs and posters, SmugMug section text if not driven by the sponsor banner, final call to action).
- `developmentPage` (`/why-3v3`): hero image, benefit cards (icon choice + title + text), chart data (each chart: title, unit, note, rows of `{ label, value, highlight }`), stat boxes, comparison table rows, "lifelong players" points, photos, sources text.
- `pastEventsPage`: title and intro.

Use Sanity's Structure tool to pin singletons (Settings, Home, Rulebook, Why 3v3, Past Events) at the top, then Tournaments, Sponsors (split into Primary and Secondary lists), Rule sections.

## 4. Tournament status logic

Create `src/lib/status.ts` with one function used everywhere:

```ts
type Status = 'upcoming' | 'live' | 'past' | 'postponed' | 'cancelled';
getStatus(t, now = new Date()): Status
```
- All date math in `America/Denver`. Convert `now` to the Denver calendar date before comparing.
- `statusOverride` other than `auto` wins.
- Before `startDate` → `upcoming`. From 00:00 on `startDate` through 23:59 on `endDate` → `live`. After → `past`.
- Also export `isRegistrationOpen(t, now)` (before `registrationCloseDate`, or true if unset), `isEarlyBird(t, now)` and `currentPrice(t, now)`.
- Preview helper: when the request has `?date=YYYY-MM-DD` and preview mode is on (or in dev), use that date as `now`. This lets us test live and past states without waiting.
- Write unit tests (Vitest) covering the Denver day boundary, multi-day events, overrides and the early bird switch.

## 5. Pages and behavior

### `/` Home
Hero picks, in order:
1. A tournament that is `live` now (if several, the earliest start). Show a pulsing "LIVE NOW" badge, the event name and dates, one button per `divisionLinks` item ("U10 Boys standings", etc., opening PlayMetrics), and a "Tournament details and checklist" button to the tournament page.
2. Else the next `upcoming` tournament (earliest start). Show the current design: video background, badges, name, date and venue, early bird line if active, "Register Your Team" (hidden and replaced by "Registration closed, view details" after `registrationCloseDate`), "Event Details", solo signup and donate links.
3. Else the "Coming soon" hero from siteSettings ("Stay tuned, the next Chaos Cup is coming soon"), with Instagram and email signup links.

Other sections (from `Main.dc.html`): quick facts, what is it, reels, upcoming tournaments cards (all `upcoming` and `live` tournaments, each card in its own colors with logo over photo, price, beneficiary, register and donate buttons; hide the section when empty), bundle banner (only if there are 2 or more upcoming events), primary sponsor banners (each primary sponsor renders its own full banner; keep them separated by other sections exactly as the design does: Redmond after tournaments, SmugMug after past events), rules in 60 seconds, past tournaments (latest 3 `past` events plus "See all past events"), sponsors section, final call to action, footer.

### `/tournaments/[slug]`
- `upcoming` or `live`: layout from `TurkeyTakedown.dc.html`. Hero with logo top right on desktop (stacks, centered, full width on phones), pills (dates, venue, divisions, surface plus best shoe), registration box, playing surface and shoe cards, event details, getting there, game day checklist, rules callout, photo strip, SmugMug strip, sponsors. When `live`, the registration box becomes a "Live now" box with the division standings buttons.
- `past`: layout from `MonsterMash.dc.html`. Large photo with event logo, SmugMug "Check it out" panel linking to `smugmugGalleryUrl`, "View Tournament Results" button to `resultsUrl`, next-up card (next upcoming event), sponsors.
- `postponed` or `cancelled`: upcoming layout with a clear banner showing `overrideNote`; hide registration.
- 404 for unknown slugs.

### `/past-events`
Grid of all `past` tournaments, newest first, each card linking to its tournament page, with "Photos" (SmugMug) and "Results" buttons.

### `/rules`
From `Rulebook.dc.html`: table of contents built from sections, section anchors, auto-numbered rules with `id="rule-<key>"`, single-rule diagrams directly under their rule, rule-group boxes, field image, register call to action, sponsors.

### `/why-3v3`
From `Development.dc.html`, driven by `developmentPage`. Charts are plain HTML bars (no chart library), each bar with its value printed, highlight bar magenta, others gray `#8A8AA0`.

### `/studio`
Embedded Sanity Studio.

### Shared
- Header with logo, nav and mobile hamburger menu (below 900px) exactly like the design, with an accessible button (`aria-expanded`, `aria-controls`). Close the menu after tapping a link.
- Sponsors section on every page, rendered from active sponsors (primary first as a feature card, then the secondary logo grid).
- Footer.

## 6. Editing experience

- Add the Presentation tool (`sanity/presentation`) with Astro visual editing from `@sanity/astro` so editors can click any text on the live preview and jump to the field. Use `SANITY_API_READ_TOKEN` for drafts.
- Document actions: "View page" link on tournaments.
- Initial value templates: a new tournament starts with the standard checklist, `statusOverride: auto`, division and roster defaults, and the default shoe list for its surface type.
- Validation: endDate on or after startDate; slug required and unique; primary sponsors require a banner; images require alt text.

## 7. Content seeding

Write `scripts/seed.ts` (runs with `npx sanity exec scripts/seed.ts --with-user-token`) that uploads images from `design-reference/assets/` and creates:
- siteSettings, homePage, rulebookPage, developmentPage, pastEventsPage with the copy from the design files.
- Tournaments: Monster Mash (past, Oct 17 2026, Salt Lake Academy West Campus, Herriman, results `https://playmetricssports.com/g/leagues/1327-2438-663366d5/league_view.html`, gallery `https://chaoscupphotos.smugmug.com/Events/Monster-Mash`), Turkey Takedown (Nov 20 to 21 2026, West Lake High School, 99 N 200 W Saratoga Springs, hardwood, early bird $238.50 through Nov 9, $265 after, donate `https://donate.stripe.com/28EaEXaVqbBjb1bgUj8Ra00`, presenting sponsor Redmond Re-Lyte), Frostbite Frenzy (Jan 8 to 9 2027, Brighton High School, 2220 Bengal Blvd Cottonwood Heights, indoor turf, early bird through Dec 27, donate `https://donate.stripe.com/6oU3cvaVqbBjedn0Vl8Ra01`).
- Shared links: register `https://playmetrics.com/signup?clubToken=U2lnbnVwLkdCLlYyLTEzMjctVGhlIENoYW9zIEN1cC1odHRwczovL2FwaS5nYi5wbGF5bWV0cmljcy5jb20vcHVibGljL2dicy8xMzI3L2xvZ28tMTc4NTYxMDkyN3xpT3RYS2IxVDV1di9GMUlCWVlmQkZoNlNTU0VtWVMwWDlWNk0yTjZJUE9FPQ==&program_id=2525`, solo signup `https://atomicathletics.fillout.com/t/i56zmzhtvUus`, Instagram `https://www.instagram.com/atomic_chaoscup/`.
- Sponsors. Primary: Redmond Re-Lyte (affiliate link `https://glnk.io/oq72y/atomic-athletics-soccer`, banner blue `#00A6CE`, white logo and text, QR code `relyte-qr.png`, image `relyte-kids.jpg`); SmugMug ("Official Photo Sharing Partner", link `https://www.smugmug.com/signup?coupon=Chaos2026`, code Chaos2026, QR `smugmug-qr.png`, contract end date after the series plus room for recap content, fine print about adults 18+). Secondary: KeyBank `https://www.key.com/personal/index.html`, One Stop Insurance `https://onestopinsurance.com/`, Klingler & Associates `https://klinglercpa.com/`, JC Laker Jewelry `https://jclaker.jewelershowcase.com/`, D1 Training `https://d1training.com/`, MAC d33p (no link), Pro GJDJ `https://www.progjdj.com/`.
- Every rule section and rule from `Rulebook.dc.html`, with diagrams and both rule groups. Leave any text that contains [CONFIRM] or other square-bracket placeholders as-is so they are easy to find.
- Make the seed idempotent (fixed `_id`s, `createOrReplace`).

Videos (`hero.mp4`, reels) are too large for a nice Sanity experience; upload them to Vercel Blob (or Mux) in the seed script or document the manual step, and store the URLs.

## 8. SmugMug contract requirements (see `design-reference/smugmug-sponsorship-agreement.txt`)

- Always use the exact designation "Official Photo Sharing Partner".
- Never alter SmugMug's logo (no CSS filters or recolors). Use the files they provide.
- The promo offer must say it is for adults and governed by SmugMug's terms.
- Every past tournament page links to its SmugMug gallery. No competing photo platform anywhere.
- Branding removal within 30 days after the term: handled by `contractEnd`.

## 9. Quality bar

- Accessible: real buttons and links, alt text, focus styles, color contrast at least 4.5:1 for body text, `prefers-reduced-motion` respected for the hero video and live badge.
- Responsive at 360px, 768px, 1280px and 1440px with no horizontal scroll.
- Images through Sanity's CDN with `auto=format`, width-based `srcset`, and hotspot crops.
- Lighthouse 90+ on performance and accessibility for `/`.
- SEO: per-page titles and descriptions, Open Graph image, `sitemap.xml`, `robots.txt`.
- Redirects in `vercel.json`: `/get-involved/` and `/contact-2/` to their new homes; keep any other old WordPress URLs from search results working.

## 10. Build phases (stop after each one for review)

1. **Schemas and Studio.** All types from section 3, Structure tool layout, initial value templates, validation. Studio runs at `/studio`.
2. **Status logic.** `src/lib/status.ts` plus Vitest tests, including the `?date=` preview override.
3. **Seed.** `scripts/seed.ts` and asset upload. After it runs, the Studio shows all content.
4. **Shared layout.** Tokens, fonts, header with hamburger, footer, sponsors section, buttons.
5. **Home page** with all three hero states.
6. **Tournament template** (upcoming, live, past, postponed or cancelled) and `/past-events`.
7. **Rules page** with auto-numbering, cross references, diagrams and rule groups.
8. **Why 3v3 page.**
9. **Visual editing and preview** (Presentation tool).
10. **Launch prep.** SEO, redirects, Lighthouse pass, README with editor instructions.
