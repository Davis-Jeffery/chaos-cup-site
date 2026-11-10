/**
 * Presentation tool: live preview of the site inside the Studio, with
 * click-to-edit. `locations` shows "Used on" links in each document;
 * `mainDocuments` opens the right document for the page being previewed.
 */
import { defineDocuments, defineLocations, type PresentationPluginOptions } from 'sanity/presentation';

const home = { title: 'Home', href: '/' };

export const resolve: PresentationPluginOptions['resolve'] = {
  mainDocuments: defineDocuments([
    { route: '/', filter: `_id == "homePage"` },
    { route: '/tournaments/:slug', filter: `_type == "tournament" && slug.current == $slug` },
    { route: '/rules', filter: `_id == "rulebookPage"` },
    { route: '/why-3v3', filter: `_id == "developmentPage"` },
    { route: '/past-events', filter: `_id == "pastEventsPage"` },
    { route: '/get-involved', filter: `_id == "getInvolvedPage"` },
  ]),
  locations: {
    homePage: defineLocations({ message: 'The home page', locations: [home] }),
    rulebookPage: defineLocations({ locations: [{ title: 'Rulebook', href: '/rules' }] }),
    ruleSection: defineLocations({
      select: { title: 'title' },
      resolve: (doc) => ({ locations: [{ title: `Rulebook: ${doc?.title ?? 'section'}`, href: '/rules' }] }),
    }),
    developmentPage: defineLocations({ locations: [{ title: 'Why 3v3', href: '/why-3v3' }] }),
    pastEventsPage: defineLocations({ locations: [{ title: 'Past events', href: '/past-events' }] }),
    getInvolvedPage: defineLocations({ locations: [{ title: 'Get involved', href: '/get-involved' }] }),
    tournament: defineLocations({
      select: { title: 'title', slug: 'slug.current' },
      resolve: (doc) => ({
        locations: [
          ...(doc?.slug ? [{ title: doc.title ?? 'Tournament page', href: `/tournaments/${doc.slug}` }] : []),
          home,
          { title: 'Past events', href: '/past-events' },
        ],
      }),
    }),
    sponsor: defineLocations({
      message: 'Shown in the sponsors section on every page',
      locations: [home, { title: 'Rulebook', href: '/rules' }],
    }),
    siteSettings: defineLocations({ message: 'Used on every page', locations: [home] }),
  },
};
