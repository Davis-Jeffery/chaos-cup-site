import { CalendarIcon } from '@sanity/icons/Calendar';
import { defineArrayMember, defineField, defineType } from 'sanity';
import { dateOptions, imageField } from '../../lib/fields';

const hexColor = (rule: any) => rule.regex(/^#[0-9a-fA-F]{6}$/, { name: 'hex color' });

export const tournament = defineType({
  name: 'tournament',
  title: 'Tournament',
  type: 'document',
  icon: CalendarIcon,
  groups: [
    { name: 'basics', title: 'Basics', default: true },
    { name: 'dates', title: 'Dates and status' },
    { name: 'venue', title: 'Venue and surface' },
    { name: 'registration', title: 'Registration and pricing' },
    { name: 'links', title: 'Links' },
    { name: 'school', title: 'Supporting school' },
    { name: 'gameDay', title: 'Game day' },
    { name: 'recap', title: 'Recap' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    // Basics
    defineField({ name: 'title', title: 'Name', type: 'string', group: 'basics', validation: (rule) => rule.required() }),
    defineField({
      name: 'slug',
      title: 'Page address',
      type: 'slug',
      group: 'basics',
      description: 'The page lives at /tournaments/<this>. Click Generate to build it from the name.',
      options: { source: 'title', maxLength: 64 },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'seriesLabel', title: 'Series label', type: 'string', group: 'basics', description: 'For example "Holiday Series, Event 2 of 3".' }),
    defineField({
      name: 'presentingSponsor',
      title: 'Presenting sponsor',
      type: 'reference',
      group: 'basics',
      to: [{ type: 'sponsor' }],
    }),
    imageField({ name: 'logo', title: 'Event logo', group: 'basics', required: true }),
    defineField({ name: 'primaryColor', title: 'Primary color', type: 'string', group: 'basics', description: 'Hex color for buttons and badges, like #DF6902.', validation: (rule) => hexColor(rule).required() }),
    defineField({ name: 'accentColor', title: 'Accent color', type: 'string', group: 'basics', description: 'Hex color for borders and highlights, like #DB8943.', validation: (rule) => hexColor(rule) }),
    imageField({ name: 'heroImage', title: 'Hero image', group: 'basics' }),
    defineField({
      name: 'heroVideo',
      title: 'Hero video',
      type: 'object',
      group: 'basics',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: 'url', title: 'Video address', type: 'url', description: 'An MP4 hosted on Vercel Blob or Mux.' }),
        imageField({ name: 'poster', title: 'Poster image', description: 'Shown while the video loads.' }),
      ],
    }),
    imageField({ name: 'cardImage', title: 'Card image', group: 'basics', description: 'Used on tournament cards on the home page.' }),

    // Dates and status
    defineField({ name: 'startDate', title: 'Start date', type: 'date', group: 'dates', options: dateOptions, validation: (rule) => rule.required() }),
    defineField({
      name: 'endDate',
      title: 'End date',
      type: 'date',
      group: 'dates',
      options: dateOptions,
      validation: (rule) =>
        rule.required().custom((end, context) => {
          const start = context.document?.startDate as string | undefined;
          return end && start && end < start ? 'End date must be on or after the start date.' : true;
        }),
    }),
    defineField({ name: 'registrationCloseDate', title: 'Registration closes', type: 'date', group: 'dates', options: dateOptions }),
    defineField({
      name: 'statusOverride',
      title: 'Status',
      type: 'string',
      group: 'dates',
      description: 'Leave on Automatic. Status is worked out from the dates in Mountain time.',
      options: {
        list: [
          { title: 'Automatic (from dates)', value: 'auto' },
          { title: 'Postponed', value: 'postponed' },
          { title: 'Cancelled', value: 'cancelled' },
          { title: 'Force live', value: 'live' },
          { title: 'Force past', value: 'past' },
        ],
        layout: 'radio',
      },
      initialValue: 'auto',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'overrideNote',
      title: 'Postponed or cancelled note',
      type: 'text',
      rows: 2,
      group: 'dates',
      hidden: ({ document }) => !['postponed', 'cancelled'].includes(document?.statusOverride as string),
      validation: (rule) =>
        rule.custom((note, context) =>
          ['postponed', 'cancelled'].includes(context.document?.statusOverride as string) && !note
            ? 'Tell families what is happening.'
            : true,
        ),
    }),

    // Venue and surface
    defineField({
      name: 'venue',
      title: 'Venue',
      type: 'object',
      group: 'venue',
      fields: [
        defineField({ name: 'name', title: 'Name', type: 'string', validation: (rule) => rule.required() }),
        defineField({ name: 'address', title: 'Address', type: 'string' }),
        defineField({ name: 'mapsUrl', title: 'Google Maps link', type: 'url' }),
        defineField({ name: 'parking', title: 'Parking and check-in', type: 'text', rows: 3 }),
        imageField({ name: 'photo', title: 'Venue photo' }),
      ],
    }),
    defineField({
      name: 'surface',
      title: 'Playing surface',
      type: 'object',
      group: 'venue',
      fields: [
        defineField({
          name: 'type',
          title: 'Surface type',
          type: 'string',
          options: {
            list: [
              { title: 'Hardwood', value: 'hardwood' },
              { title: 'Turf', value: 'turf' },
              { title: 'Other', value: 'other' },
            ],
            layout: 'radio',
            direction: 'horizontal',
          },
        }),
        defineField({ name: 'headline', title: 'Headline', type: 'string', description: 'For example "Hardwood basketball court".' }),
        defineField({ name: 'areaName', title: 'Area name', type: 'string', description: 'For example "Indoor Main + AUX Gyms".' }),
        defineField({ name: 'intro', title: 'Intro line', type: 'string' }),
        imageField({ name: 'photo', title: 'Surface photo' }),
      ],
    }),
    defineField({
      name: 'shoes',
      title: 'Shoes',
      type: 'array',
      group: 'venue',
      description: 'The site always shows Best first, then Allowed, then Not allowed.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'shoe',
          fields: [
            defineField({ name: 'name', title: 'Name', type: 'string', validation: (rule) => rule.required() }),
            defineField({
              name: 'rating',
              title: 'Rating',
              type: 'string',
              options: {
                list: [
                  { title: 'Best', value: 'best' },
                  { title: 'Allowed', value: 'allowed' },
                  { title: 'Not allowed', value: 'notAllowed' },
                ],
                layout: 'radio',
                direction: 'horizontal',
              },
              validation: (rule) => rule.required(),
            }),
            defineField({ name: 'note', title: 'Note', type: 'string' }),
            imageField({ name: 'image', title: 'Image' }),
          ],
          preview: {
            select: { title: 'name', rating: 'rating', media: 'image' },
            prepare: ({ title, rating, media }) => ({
              title,
              subtitle: { best: 'Best', allowed: 'Allowed', notAllowed: 'Not allowed' }[rating as string],
              media,
            }),
          },
        }),
      ],
    }),

    // Registration and pricing
    defineField({ name: 'divisions', title: 'Divisions', type: 'string', group: 'registration', description: 'For example "U7 to U18".' }),
    defineField({ name: 'rosterSize', title: 'Roster size', type: 'string', group: 'registration', description: 'For example "Rosters of 3 to 6 players".' }),
    defineField({
      name: 'pricing',
      title: 'Pricing',
      type: 'object',
      group: 'registration',
      fields: [
        defineField({ name: 'regularPrice', title: 'Regular price per team', type: 'number', validation: (rule) => rule.min(0) }),
        defineField({ name: 'earlyBirdPrice', title: 'Early bird price per team', type: 'number', validation: (rule) => rule.min(0) }),
        defineField({ name: 'earlyBirdDeadline', title: 'Early bird ends', type: 'date', options: dateOptions, description: 'The last day of early bird pricing.' }),
        defineField({ name: 'bundleNote', title: 'Bundle note', type: 'text', rows: 2 }),
        defineField({ name: 'bundleSavings', title: 'Bundle savings', type: 'number', description: 'Dollars saved, like 50.35.' }),
      ],
    }),

    // Links
    defineField({
      name: 'links',
      title: 'Links',
      type: 'object',
      group: 'links',
      fields: [
        defineField({ name: 'registerUrl', title: 'Register link', type: 'url', description: 'Leave blank to use the default from Site settings.' }),
        defineField({ name: 'individualSignupUrl', title: 'Solo signup link', type: 'url' }),
        defineField({
          name: 'divisionLinks',
          title: 'Division standings links',
          type: 'array',
          description: 'One button per division on game day, like "U10 Boys standings".',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'divisionLink',
              fields: [
                defineField({ name: 'label', title: 'Label', type: 'string', validation: (rule) => rule.required() }),
                defineField({ name: 'url', title: 'PlayMetrics link', type: 'url', validation: (rule) => rule.required() }),
              ],
            }),
          ],
        }),
        defineField({ name: 'resultsUrl', title: 'Results link', type: 'url' }),
        defineField({ name: 'smugmugGalleryUrl', title: 'SmugMug gallery link', type: 'url', description: 'Required on every past tournament by the SmugMug contract.' }),
      ],
    }),

    // Supporting school
    defineField({
      name: 'beneficiary',
      title: 'Supporting school',
      type: 'object',
      group: 'school',
      fields: [
        defineField({ name: 'schoolName', title: 'School name', type: 'string' }),
        defineField({ name: 'programName', title: 'Program name', type: 'string', description: 'For example "Girls Soccer Program".' }),
        imageField({ name: 'logo', title: 'School logo' }),
        defineField({ name: 'donateUrl', title: 'Donate link', type: 'url' }),
      ],
    }),

    // Game day
    defineField({
      name: 'eventDetails',
      title: 'Event details',
      type: 'object',
      group: 'gameDay',
      description: 'The four "Event details" panels on the tournament page.',
      fields: [
        defineField({
          name: 'scheduleNote',
          title: 'Dates note',
          type: 'text',
          rows: 2,
          description: 'Under the dates, like "Your team plays within one ~5-hour block."',
        }),
        defineField({
          name: 'venueNote',
          title: 'Venue note',
          type: 'string',
          description: 'After the address, like "Indoor Main + AUX Gyms on hardwood."',
        }),
        defineField({
          name: 'divisionsNote',
          title: 'Divisions note',
          type: 'text',
          rows: 3,
          description: 'A "How placement works" link to the rulebook is added at the end.',
        }),
        defineField({ name: 'formatHeadline', title: 'Format headline', type: 'string', initialValue: '4 guaranteed games' }),
        defineField({ name: 'formatText', title: 'Format text', type: 'text', rows: 2 }),
      ],
    }),
    defineField({
      name: 'checklist',
      title: 'Game day checklist',
      type: 'array',
      group: 'gameDay',
      of: [defineArrayMember({ type: 'string' })],
    }),

    defineField({
      name: 'photoStrip',
      title: 'Photo strip',
      type: 'array',
      group: 'gameDay',
      description: 'The row of photos above the SmugMug strip. Four items fill the row; one can be a video.',
      validation: (rule) => rule.max(4),
      of: [
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [defineField({ name: 'alt', title: 'Alt text', type: 'string', validation: (rule) => rule.required() })],
        }),
        defineArrayMember({
          type: 'object',
          name: 'stripVideo',
          title: 'Video',
          fields: [
            defineField({ name: 'title', title: 'Title', type: 'string', description: 'For screen readers.', validation: (rule) => rule.required() }),
            defineField({ name: 'videoUrl', title: 'Video address', type: 'url', description: 'An MP4 hosted on Vercel Blob or Mux.' }),
            imageField({ name: 'poster', title: 'Poster image', required: true }),
          ],
          preview: { select: { title: 'title', media: 'poster' } },
        }),
      ],
    }),

    // Recap
    defineField({
      name: 'recap',
      title: 'Recap',
      type: 'object',
      group: 'recap',
      description: 'Shown once the tournament is over.',
      fields: [
        imageField({ name: 'coverImage', title: 'Cover image' }),
        defineField({ name: 'text', title: 'Recap text', type: 'text', rows: 4 }),
        defineField({
          name: 'championPhotos',
          title: 'Champions photos',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'image',
              options: { hotspot: true },
              fields: [
                defineField({ name: 'alt', title: 'Alt text', type: 'string', validation: (rule) => rule.required() }),
                defineField({ name: 'caption', title: 'Caption', type: 'string' }),
              ],
            }),
          ],
        }),
      ],
    }),

    defineField({ name: 'seo', title: 'SEO', type: 'seo', group: 'seo' }),
  ],
  orderings: [
    { title: 'Start date, newest first', name: 'startDesc', by: [{ field: 'startDate', direction: 'desc' }] },
    { title: 'Start date, oldest first', name: 'startAsc', by: [{ field: 'startDate', direction: 'asc' }] },
  ],
  preview: {
    select: { title: 'title', start: 'startDate', status: 'statusOverride', media: 'logo' },
    prepare: ({ title, start, status, media }) => ({
      title,
      subtitle: [start, status && status !== 'auto' ? status : null].filter(Boolean).join(' · '),
      media,
    }),
  },
});
