# Chaos Cup website

The site for thechaoscup.com. Content lives in Sanity and is edited in the Studio at **/studio**. Pages are built by Astro and hosted on Vercel.

- [Editing the site](#editing-the-site) (for anyone updating content)
- [Developer setup](#developer-setup)
- [Launch checklist](#launch-checklist)

---

## Editing the site

Open **thechaoscup.com/studio** and sign in with your Sanity account.

### Preview before you publish

Click **Live preview** at the top of the Studio. You see the real site with your unpublished changes.

- Turn on **Edit** (top left), hover over any text and click it to open the field that holds it.
- Changes show in the preview as you type. Nobody else sees them until you press **Publish**.
- Type a page address in the preview's address bar (like `/rules`) to preview another page.
- Add `?date=2026-11-21` to an address in preview to see the site as it will look on that day (useful for checking a tournament's "Live now" or recap view).

Published changes reach the public site within about 5 minutes.

### Tournaments

**Content > Tournaments.** To add one, click **+** and pick **Tournament on hardwood** or **Tournament on turf**. Both start with the standard checklist, shoe list and event details.

The site works out each tournament's state from its dates, in Mountain time. You never switch it by hand:

| When | The site shows |
|---|---|
| Before the start date | Upcoming: registration, pricing, shoe check, checklist |
| On the event days | Live now: one button per **Division standings link** (add these under *Links* before game day) |
| After the end date | Recap: photo, SmugMug gallery, results, next event |

- **Early bird**: set the early bird price and the last early bird day under *Registration and pricing*. The price, strikethrough and "ends Nov 15" lines all switch automatically the next day.
- **Registration closes**: set a date and the register buttons change to "Registration closed".
- **Postponed or cancelled**: set *Status* to Postponed or Cancelled and write a short note. A red notice shows the note and registration is hidden. Leave *Status* on Automatic otherwise.
- **After the event**: add the **SmugMug gallery link** (the SmugMug contract requires it on every past event) and the **Results link**.
- **Colors**: the primary color is used for buttons and badges, the accent for highlights. Use hex values like `#DF6902`.

### Sponsors

**Content > Sponsors.** Each sponsor shows from its **Contract start** through its **Contract end**, then disappears from every page automatically.

- **Primary** sponsors get a full banner on the home page. **Secondary** sponsors appear in the logo grid on every page.
- **Logo tile**: choose Light or Dark to match the logo. Upload logos exactly as the sponsor provides them; the site never recolors them.
- SmugMug must always be called exactly "Official Photo Sharing Partner", and its offer must mention adults 18+ and SmugMug's terms.

### Rules

**Content > Rule sections.** Drag rules to reorder them; every number on the site (1.1, 4.2 ...) updates on its own.

- To mention another rule, select the text, click the link icon (**Link to another rule**) and pick the rule. It always shows the rule's current number.
- **Rule groups** are the magenta "explained" boxes. Pick rules that sit next to each other; the box appears where the first one is, and its "Rules 4.4-4.6" label is generated.
- **Diagrams** are chosen from a list. The drawings themselves are part of the site's code.

### Pages and settings

- **Site settings**: logo, menu links, register links, announcement bar, footer, contact email, sponsorship PDF, default share image.
- **Home page, Rulebook page, Why 3v3 page, Past events page, Get involved page, Contact page**: the text for each page.
- **Highlighting words**: in headlines, wrap words in `*asterisks*` to color them, like `Bring the *chaos.*`.
- **Videos**: upload the MP4 in Vercel (Storage > `chaos-cup-media` > Upload) and paste its address into the video field. The Get involved page video also accepts YouTube or Vimeo links.
- **Images**: every image needs alt text (a short description for people using screen readers). Drag the focus circle onto the important part of a photo so crops keep it in view.

---

## Developer setup

Requires Node 22.12 or newer.

```bash
npm install
cp .env.example .env   # then fill in the values (see comments in the file)
npm run dev            # http://localhost:4321 and http://localhost:4321/studio
```

| Command | What it does |
|---|---|
| `npm run dev` | Dev server. `?date=YYYY-MM-DD` works on every page here. |
| `npm test` | Unit tests (status, formatting, rules, charts, preview cookie, video links) |
| `npm run build` | Production build for Vercel |
| `npm run preview:prod` | Builds a Node server version and runs it locally, for testing speed and Lighthouse |
| `npm run seed` | Loads all starter content into Sanity. **It overwrites Studio edits to the seeded documents**, so don't run it once editors have started. |

Key files:

- `src/lib/status.ts`: tournament status (upcoming, live, past) in America/Denver time. All status decisions go through it.
- `src/lib/rules.ts`: rule numbering, group placement and cross references.
- `src/lib/sanity.ts`: `sanityFetch`, the one way pages read Sanity (switches to drafts in preview).
- `src/middleware.ts`, `src/pages/api/draft-mode/*`: preview mode (a signed, expiring cookie set only after Sanity validates the Studio's preview link).
- `src/sanity/`: Studio schemas, structure, templates and the Live preview setup.
- `design-reference/`: the approved designs.

Copy rule: no em dashes anywhere in site copy.

---

## Launch checklist

### Vercel

1. Import the GitHub repo in Vercel. Root directory: `chaos-cup-site`. Framework: Astro (detected).
2. **Settings > Environment Variables**, for Production and Preview:
   - `PUBLIC_SANITY_PROJECT_ID`
   - `PUBLIC_SANITY_DATASET`
   - `SANITY_API_READ_TOKEN`
   - `VERCEL_ISR_BYPASS_TOKEN`

   Copy the values from your local `.env`. `BLOB_READ_WRITE_TOKEN` isn't needed on Vercel.
3. Connect the `chaos-cup-media` Blob store to the project (Storage tab), so its videos stay with the project.
4. Deploy, then test the Vercel preview address before switching the domain.

### Sanity

At **sanity.io/manage > API > CORS origins**, add each address the Studio runs on, with **Allow credentials** checked:

- `https://thechaoscup.com`
- `https://www.thechaoscup.com` if used
- the Vercel preview address, for testing

### Domain

Point thechaoscup.com at Vercel (Settings > Domains). The old WordPress addresses keep working:

| Old address | Goes to |
|---|---|
| `/get-involved/` | the new Get involved page |
| `/contact-2/` | `/contact` |
| `/wp-content/uploads/...pdf` | the current sponsorship PDF from Site settings |
| `/hello-world/`, `/category/...`, `/author/...`, `/feed/` | home page |

### Before going live

- Replace the placeholders still on the site: `[CONFIRM]` in rules 3.5, 4.4 and 8.4, `[YOUR REFUND POLICY]` in 11.1, and `[SCHEDULE RELEASE DATE]`, `[PARKING LOT]`, `[CHECK-IN LOCATION]` on the tournament pages.
- Upload the rulebook PDF (Rulebook page > Rulebook PDF) to show the Download PDF button.
- Add the Get involved video when it is ready.
- Submit `https://thechaoscup.com/sitemap.xml` in Google Search Console.
