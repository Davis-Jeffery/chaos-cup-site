import type { StructureResolver } from 'sanity/structure';
import { CalendarIcon } from '@sanity/icons/Calendar';
import { StarIcon } from '@sanity/icons/Star';
import { DocumentTextIcon } from '@sanity/icons/DocumentText';

const singleton = (S: Parameters<StructureResolver>[0], type: string, title: string) =>
  S.listItem().title(title).id(type).schemaType(type).child(S.document().schemaType(type).documentId(type).title(title));

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      singleton(S, 'siteSettings', 'Site settings'),
      singleton(S, 'homePage', 'Home page'),
      singleton(S, 'rulebookPage', 'Rulebook page'),
      singleton(S, 'developmentPage', 'Why 3v3 page'),
      singleton(S, 'pastEventsPage', 'Past events page'),
      S.divider(),
      S.listItem()
        .title('Tournaments')
        .icon(CalendarIcon)
        .child(
          S.documentTypeList('tournament')
            .title('Tournaments')
            .defaultOrdering([{ field: 'startDate', direction: 'desc' }]),
        ),
      S.listItem()
        .title('Sponsors')
        .icon(StarIcon)
        .child(
          S.list()
            .title('Sponsors')
            .items([
              S.listItem()
                .title('Primary sponsors')
                .child(
                  S.documentTypeList('sponsor')
                    .title('Primary sponsors')
                    .filter('_type == "sponsor" && tier == "primary"')
                    .initialValueTemplates([S.initialValueTemplateItem('sponsor-primary')])
                    .defaultOrdering([{ field: 'order', direction: 'asc' }]),
                ),
              S.listItem()
                .title('Secondary sponsors')
                .child(
                  S.documentTypeList('sponsor')
                    .title('Secondary sponsors')
                    .filter('_type == "sponsor" && tier == "secondary"')
                    .initialValueTemplates([S.initialValueTemplateItem('sponsor-secondary')])
                    .defaultOrdering([{ field: 'order', direction: 'asc' }]),
                ),
            ]),
        ),
      S.listItem()
        .title('Rule sections')
        .icon(DocumentTextIcon)
        .child(
          S.documentTypeList('ruleSection')
            .title('Rule sections')
            .defaultOrdering([{ field: 'order', direction: 'asc' }]),
        ),
    ]);
