import { link } from './objects/link';
import { seo } from './objects/seo';
import { siteSettings } from './documents/siteSettings';
import { tournament } from './documents/tournament';
import { sponsor } from './documents/sponsor';
import { ruleSection } from './documents/ruleSection';
import { homePage, rulebookPage, developmentPage, pastEventsPage, getInvolvedPage, contactPage } from './documents/pages';

export const schemaTypes = [
  link,
  seo,
  siteSettings,
  homePage,
  rulebookPage,
  developmentPage,
  pastEventsPage,
  getInvolvedPage,
  contactPage,
  tournament,
  sponsor,
  ruleSection,
];

// One document each, with a fixed _id matching the type name.
export const singletonTypes = new Set(['siteSettings', 'homePage', 'rulebookPage', 'developmentPage', 'pastEventsPage', 'getInvolvedPage', 'contactPage']);
