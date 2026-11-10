import { BookIcon } from '@sanity/icons/Book';
import { HomeIcon } from '@sanity/icons/Home';
import { ArchiveIcon } from '@sanity/icons/Archive';
import { BarChartIcon } from '@sanity/icons/BarChart';
import { UsersIcon } from '@sanity/icons/Users';
import { defineArrayMember, defineField, defineType } from 'sanity';
import { imageField } from '../../lib/fields';

const sectionHeading = [
  defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string', description: 'Small text above the headline.' }),
  defineField({
    name: 'headline',
    title: 'Headline',
    type: 'string',
    description: 'Wrap words in *asterisks* to color them, like "Bring the *chaos.*"',
  }),
];

const titleText = (name: string, title: string) =>
  defineArrayMember({
    type: 'object',
    name,
    title,
    fields: [
      defineField({ name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required() }),
      defineField({ name: 'text', title: 'Text', type: 'text', rows: 3 }),
    ],
  });

const seoField = defineField({ name: 'seo', title: 'SEO', type: 'seo', group: 'seo' });

const photosField = (description?: string) =>
  defineField({
    name: 'photos',
    title: 'Photos',
    type: 'array',
    description,
    of: [
      defineArrayMember({
        type: 'image',
        options: { hotspot: true },
        fields: [defineField({ name: 'alt', title: 'Alt text', type: 'string', validation: (rule) => rule.required() })],
      }),
    ],
  });

// ---------- Rulebook ----------
export const rulebookPage = defineType({
  name: 'rulebookPage',
  title: 'Rulebook page',
  type: 'document',
  icon: BookIcon,
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow',
      type: 'string',
      group: 'content',
      description: 'Small text above the title, like "Official rules · Holiday Series 2026-27".',
    }),
    defineField({ name: 'title', title: 'Page title', type: 'string', group: 'content', validation: (rule) => rule.required() }),
    defineField({ name: 'intro', title: 'Intro', type: 'text', rows: 3, group: 'content' }),
    defineField({ name: 'pdf', title: 'Rulebook PDF', type: 'file', group: 'content', options: { accept: 'application/pdf' } }),
    seoField,
  ],
  preview: { prepare: () => ({ title: 'Rulebook page' }) },
});

// ---------- Past events ----------
export const pastEventsPage = defineType({
  name: 'pastEventsPage',
  title: 'Past events page',
  type: 'document',
  icon: ArchiveIcon,
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({ name: 'title', title: 'Page title', type: 'string', group: 'content', validation: (rule) => rule.required() }),
    defineField({ name: 'intro', title: 'Intro', type: 'text', rows: 3, group: 'content' }),
    seoField,
  ],
  preview: { prepare: () => ({ title: 'Past events page' }) },
});

// ---------- Home ----------
export const homePage = defineType({
  name: 'homePage',
  title: 'Home page',
  type: 'document',
  icon: HomeIcon,
  description: 'The hero comes from the live or next tournament, so it is edited on the tournament.',
  groups: [
    { name: 'intro', title: 'Facts and intro', default: true },
    { name: 'reels', title: 'Reels' },
    { name: 'tournaments', title: 'Tournaments' },
    { name: 'rules', title: 'Rules in 60 seconds' },
    { name: 'past', title: 'Past tournaments' },
    { name: 'cta', title: 'Final call to action' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'heroText',
      title: 'Hero intro line',
      type: 'text',
      rows: 2,
      group: 'intro',
      description: 'Shown under the event name in the home hero, like "Fast 3v3 soccer inside inflatable walled fields."',
    }),
    defineField({
      name: 'quickFacts',
      title: 'Quick facts',
      type: 'array',
      group: 'intro',
      description: 'The strip under the hero, like "4 Games / Guaranteed, plus a title game".',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'quickFact',
          fields: [
            defineField({ name: 'value', title: 'Big text', type: 'string', validation: (rule) => rule.required() }),
            defineField({ name: 'label', title: 'Small text', type: 'string' }),
          ],
          preview: { select: { title: 'value', subtitle: 'label' } },
        }),
      ],
    }),
    defineField({
      name: 'whatIs',
      title: 'What is the Chaos Cup',
      type: 'object',
      group: 'intro',
      fields: [
        ...sectionHeading,
        defineField({ name: 'body', title: 'Body', type: 'text', rows: 4 }),
        defineField({ name: 'points', title: 'Points', type: 'array', of: [defineArrayMember({ type: 'string' })] }),
        { ...photosField('The design shows 3: one large, two small.'), validation: (rule: any) => rule.max(3) },
      ],
    }),

    defineField({
      name: 'reels',
      title: 'Reels section',
      type: 'object',
      group: 'reels',
      fields: [
        ...sectionHeading,
        defineField({ name: 'instagramLabel', title: 'Instagram button label', type: 'string', initialValue: 'More on Instagram' }),
        defineField({
          name: 'videos',
          title: 'Videos',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'reel',
              fields: [
                defineField({ name: 'title', title: 'Title', type: 'string', description: 'For screen readers.' }),
                defineField({ name: 'videoUrl', title: 'Video address', type: 'url', description: 'An MP4 hosted on Vercel Blob or Mux.', validation: (rule) => rule.required() }),
                imageField({ name: 'poster', title: 'Poster image', required: true }),
              ],
              preview: { select: { title: 'title', media: 'poster' } },
            }),
          ],
        }),
      ],
    }),

    defineField({
      name: 'upcoming',
      title: 'Upcoming tournaments section',
      type: 'object',
      group: 'tournaments',
      description: 'Hidden when no tournaments are coming up.',
      fields: [...sectionHeading, defineField({ name: 'intro', title: 'Intro', type: 'text', rows: 3 })],
    }),
    defineField({
      name: 'bundle',
      title: 'Bundle banner',
      type: 'object',
      group: 'tournaments',
      description: 'Shown only when 2 or more tournaments are coming up.',
      fields: [
        defineField({ name: 'headline', title: 'Headline', type: 'string' }),
        defineField({ name: 'text', title: 'Text', type: 'text', rows: 3 }),
        defineField({ name: 'buttonLabel', title: 'Button label', type: 'string' }),
      ],
    }),

    defineField({
      name: 'rulesSection',
      title: 'Rules in 60 seconds',
      type: 'object',
      group: 'rules',
      fields: [
        ...sectionHeading,
        defineField({
          name: 'tiles',
          title: 'Tiles',
          type: 'array',
          description: 'Numbered automatically in this order.',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'ruleTile',
              fields: [
                defineField({ name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required() }),
                defineField({ name: 'text', title: 'Text', type: 'text', rows: 3 }),
                defineField({ name: 'linkLabel', title: 'Link label', type: 'string' }),
                defineField({ name: 'linkPath', title: 'Link', type: 'string', description: 'For example /rules#rule-goal-zone' }),
              ],
            }),
          ],
        }),
        defineField({ name: 'buttonLabel', title: 'Button label', type: 'string', initialValue: 'Read the Full Rulebook' }),
      ],
    }),

    defineField({
      name: 'past',
      title: 'Past tournaments section',
      type: 'object',
      group: 'past',
      fields: [...sectionHeading],
    }),

    defineField({
      name: 'finalCta',
      title: 'Final call to action',
      type: 'object',
      group: 'cta',
      fields: [
        ...sectionHeading,
        defineField({ name: 'text', title: 'Text', type: 'text', rows: 3 }),
        defineField({ name: 'primaryLabel', title: 'Main button label', type: 'string', initialValue: 'Register Your Team' }),
        defineField({ name: 'secondaryLabel', title: 'Second button label', type: 'string', initialValue: 'Register as an Individual' }),
      ],
    }),
    seoField,
  ],
  preview: { prepare: () => ({ title: 'Home page' }) },
});

// ---------- Why 3v3 ----------
export const benefitIcons = [
  { title: 'More touches', value: 'touches' },
  { title: 'Decisions', value: 'decisions' },
  { title: 'Freedom', value: 'freedom' },
  { title: 'Scoring', value: 'scoring' },
  { title: '1v1', value: 'oneVOne' },
  { title: 'Teammates', value: 'teammates' },
  { title: 'Attack and defend', value: 'attackDefend' },
  { title: 'Always moving', value: 'moving' },
];

export const developmentPage = defineType({
  name: 'developmentPage',
  title: 'Why 3v3 page',
  type: 'document',
  icon: BarChartIcon,
  groups: [
    { name: 'hero', title: 'Hero', default: true },
    { name: 'benefits', title: 'Benefits' },
    { name: 'research', title: 'Research' },
    { name: 'comparison', title: 'Comparison' },
    { name: 'lifelong', title: 'Lifelong players' },
    { name: 'cta', title: 'Call to action' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'hero',
      title: 'Hero',
      type: 'object',
      group: 'hero',
      fields: [...sectionHeading, defineField({ name: 'text', title: 'Text', type: 'text', rows: 3 }), imageField({ name: 'image', title: 'Image' })],
    }),

    defineField({
      name: 'benefits',
      title: 'Benefits',
      type: 'object',
      group: 'benefits',
      fields: [
        ...sectionHeading,
        defineField({ name: 'intro', title: 'Intro', type: 'text', rows: 3 }),
        defineField({
          name: 'cards',
          title: 'Cards',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'benefitCard',
              fields: [
                defineField({ name: 'icon', title: 'Icon', type: 'string', options: { list: benefitIcons } }),
                defineField({ name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required() }),
                defineField({ name: 'text', title: 'Text', type: 'text', rows: 4 }),
              ],
            }),
          ],
        }),
        photosField('The photo strip under the cards.'),
      ],
    }),

    defineField({
      name: 'research',
      title: 'Research',
      type: 'object',
      group: 'research',
      fields: [
        ...sectionHeading,
        defineField({ name: 'intro', title: 'Intro', type: 'text', rows: 3 }),
        defineField({
          name: 'charts',
          title: 'Charts',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'chart',
              fields: [
                defineField({ name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required() }),
                defineField({ name: 'subtitle', title: 'Subtitle', type: 'string' }),
                defineField({ name: 'unit', title: 'Unit', type: 'string', description: 'Printed after each value, like % or x. Leave blank for plain numbers.' }),
                defineField({
                  name: 'rows',
                  title: 'Bars',
                  type: 'array',
                  of: [
                    defineArrayMember({
                      type: 'object',
                      name: 'chartRow',
                      fields: [
                        defineField({ name: 'label', title: 'Label', type: 'string', validation: (rule) => rule.required() }),
                        defineField({ name: 'value', title: 'Value', type: 'number', validation: (rule) => rule.required() }),
                        defineField({ name: 'highlight', title: 'Highlight in magenta', type: 'boolean', initialValue: false }),
                      ],
                      preview: {
                        select: { title: 'label', value: 'value', highlight: 'highlight' },
                        prepare: ({ title, value, highlight }) => ({ title, subtitle: `${value}${highlight ? ' · highlighted' : ''}` }),
                      },
                    }),
                  ],
                }),
                defineField({ name: 'note', title: 'Note', type: 'text', rows: 2 }),
              ],
            }),
          ],
        }),
        defineField({
          name: 'statBoxes',
          title: 'Stat boxes',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'statBox',
              fields: [
                defineField({ name: 'value', title: 'Big number', type: 'string', validation: (rule) => rule.required() }),
                defineField({ name: 'label', title: 'Label', type: 'string' }),
                defineField({ name: 'text', title: 'Text', type: 'text', rows: 3 }),
              ],
              preview: { select: { title: 'value', subtitle: 'label' } },
            }),
          ],
        }),
        defineField({ name: 'sources', title: 'Sources', type: 'text', rows: 4 }),
      ],
    }),

    defineField({
      name: 'comparison',
      title: 'Comparison table',
      type: 'object',
      group: 'comparison',
      fields: [
        ...sectionHeading,
        defineField({ name: 'columnA', title: 'First column heading', type: 'string', initialValue: 'Chaos Cup 3v3' }),
        defineField({ name: 'columnB', title: 'Second column heading', type: 'string', initialValue: '11v11' }),
        defineField({
          name: 'rows',
          title: 'Rows',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'comparisonRow',
              fields: [
                defineField({ name: 'label', title: 'Row label', type: 'string', validation: (rule) => rule.required() }),
                defineField({ name: 'a', title: 'First column', type: 'string' }),
                defineField({ name: 'b', title: 'Second column', type: 'string' }),
              ],
              preview: { select: { title: 'label', subtitle: 'a' } },
            }),
          ],
        }),
      ],
    }),

    defineField({
      name: 'lifelong',
      title: 'Lifelong players',
      type: 'object',
      group: 'lifelong',
      fields: [
        ...sectionHeading,
        defineField({ name: 'intro', title: 'Intro', type: 'text', rows: 3 }),
        defineField({ name: 'points', title: 'Points', type: 'array', of: [titleText('point', 'Point')] }),
        defineField({
          name: 'photos',
          title: 'Photos',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'image',
              options: { hotspot: true },
              fields: [defineField({ name: 'alt', title: 'Alt text', type: 'string', validation: (rule) => rule.required() })],
            }),
          ],
        }),
      ],
    }),

    defineField({
      name: 'cta',
      title: 'Call to action',
      type: 'object',
      group: 'cta',
      fields: [
        defineField({
          name: 'headline',
          title: 'Headline',
          type: 'string',
          description: 'Wrap words in *asterisks* to color them, like "More fun. *More soccer.*"',
        }),
        defineField({ name: 'text', title: 'Text', type: 'text', rows: 2 }),
      ],
    }),
    seoField,
  ],
  preview: { prepare: () => ({ title: 'Why 3v3 page' }) },
});

const pathFields = [
  ...sectionHeading,
  defineField({ name: 'text', title: 'Text', type: 'text', rows: 3 }),
  defineField({ name: 'buttonLabel', title: 'Button label', type: 'string' }),
  defineField({
    name: 'buttonUrl',
    title: 'Button link',
    type: 'string',
    description: 'A page path like /contact, a full web address, or mailto:you@example.com.',
  }),
];

export const getInvolvedPage = defineType({
  name: 'getInvolvedPage',
  title: 'Get involved page',
  type: 'document',
  icon: UsersIcon,
  groups: [
    { name: 'hero', title: 'Hero', default: true },
    { name: 'video', title: 'Video' },
    { name: 'schools', title: 'Schools' },
    { name: 'partners', title: 'Sponsors' },
    { name: 'cta', title: 'Call to action' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'hero',
      title: 'Hero',
      type: 'object',
      group: 'hero',
      fields: [...sectionHeading, defineField({ name: 'text', title: 'Text', type: 'text', rows: 3 }), imageField({ name: 'image', title: 'Image' })],
    }),
    defineField({
      name: 'video',
      title: 'How it works video',
      type: 'object',
      group: 'video',
      description: 'Until a video address is added, the page shows a placeholder box.',
      fields: [
        ...sectionHeading,
        defineField({ name: 'text', title: 'Text', type: 'text', rows: 3 }),
        defineField({
          name: 'videoUrl',
          title: 'Video address',
          type: 'url',
          description: 'An MP4 on Vercel Blob or Mux, or a YouTube or Vimeo link.',
        }),
        imageField({ name: 'poster', title: 'Poster image', description: 'Shown before the video plays.' }),
      ],
    }),
    defineField({
      name: 'schools',
      title: 'For school programs',
      type: 'object',
      group: 'schools',
      fields: [
        ...pathFields,
        defineField({ name: 'schoolProvides', title: 'The school brings', type: 'array', of: [defineArrayMember({ type: 'string' })] }),
        defineField({ name: 'weProvide', title: 'Chaos Cup handles', type: 'array', of: [defineArrayMember({ type: 'string' })] }),
        imageField({ name: 'image', title: 'Image' }),
      ],
    }),
    defineField({
      name: 'partners',
      title: 'For community partners',
      type: 'object',
      group: 'partners',
      fields: [
        ...pathFields.filter((f) => f.name !== 'buttonUrl'),
        defineField({
          name: 'steps',
          title: 'Steps',
          type: 'array',
          of: [titleText('step', 'Step')],
          description: 'Numbered on the page in this order.',
        }),
        imageField({ name: 'image', title: 'Image' }),
      ],
      description: 'The button opens the sponsorship PDF from Site settings.',
    }),
    defineField({
      name: 'cta',
      title: 'Call to action',
      type: 'object',
      group: 'cta',
      fields: pathFields,
    }),
    seoField,
  ],
  preview: { prepare: () => ({ title: 'Get involved page' }) },
});
