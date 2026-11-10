import { StarIcon } from '@sanity/icons/Star';
import { defineArrayMember, defineField, defineType } from 'sanity';
import { dateOptions, imageField } from '../../lib/fields';

const isPrimary = (document: any) => document?.tier === 'primary';

export const sponsor = defineType({
  name: 'sponsor',
  title: 'Sponsor',
  type: 'document',
  icon: StarIcon,
  groups: [
    { name: 'basics', title: 'Basics', default: true },
    { name: 'logos', title: 'Logos' },
    { name: 'contract', title: 'Contract dates' },
    { name: 'banner', title: 'Banner (primary only)' },
  ],
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', group: 'basics', validation: (rule) => rule.required() }),
    defineField({
      name: 'tier',
      title: 'Tier',
      type: 'string',
      group: 'basics',
      description: 'Primary sponsors get a full banner on the home page and the feature card in the sponsors section.',
      options: {
        list: [
          { title: 'Primary', value: 'primary' },
          { title: 'Secondary', value: 'secondary' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'secondary',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      group: 'basics',
      description: 'Lower numbers show first.',
      initialValue: 10,
    }),
    defineField({
      name: 'designation',
      title: 'Designation',
      type: 'string',
      group: 'basics',
      description: 'For example "Title sponsor" or "Official Photo Sharing Partner". SmugMug must always use exactly "Official Photo Sharing Partner".',
    }),
    defineField({
      name: 'url',
      title: 'Link',
      type: 'url',
      group: 'basics',
      description: 'Affiliate links are fine.',
      hidden: ({ document }) => document?.linkEnabled === false,
      validation: (rule) =>
        rule.custom((url, context) =>
          context.document?.linkEnabled !== false && !url ? 'Add a link, or turn off "Link the logo".' : true,
        ),
    }),
    defineField({
      name: 'linkEnabled',
      title: 'Link the logo',
      type: 'boolean',
      group: 'basics',
      description: 'Turn off for sponsors without a website.',
      initialValue: true,
    }),
    defineField({
      name: 'tournaments',
      title: 'Tied to tournaments',
      type: 'array',
      group: 'basics',
      description: 'Leave empty if this sponsor supports the whole series.',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'tournament' }] })],
    }),

    imageField({
      name: 'logoOnDark',
      title: 'Logo for dark backgrounds',
      group: 'logos',
      required: true,
      description: 'Upload the file exactly as the sponsor provides it. Logos are never recolored on the site.',
    }),
    imageField({ name: 'logoOnLight', title: 'Logo for light backgrounds', group: 'logos' }),
    defineField({
      name: 'tileStyle',
      title: 'Logo tile',
      type: 'string',
      group: 'logos',
      description: 'The background behind the logo in the sponsors grid.',
      options: {
        list: [
          { title: 'Light', value: 'light' },
          { title: 'Dark', value: 'dark' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'dark',
    }),

    defineField({
      name: 'contractStart',
      title: 'Contract start',
      type: 'date',
      group: 'contract',
      options: dateOptions,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'contractEnd',
      title: 'Contract end',
      type: 'date',
      group: 'contract',
      options: dateOptions,
      description: 'After this date the sponsor disappears from every page automatically.',
      validation: (rule) =>
        rule.required().custom((end, context) => {
          const start = context.document?.contractStart as string | undefined;
          return end && start && end < start ? 'Contract end must be on or after the start.' : true;
        }),
    }),

    defineField({
      name: 'banner',
      title: 'Banner',
      type: 'object',
      group: 'banner',
      hidden: ({ document }) => !isPrimary(document),
      validation: (rule) =>
        rule.custom((banner: any, context) =>
          isPrimary(context.document) && !banner?.headline ? 'Primary sponsors need a banner with a headline.' : true,
        ),
      fields: [
        defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string', description: 'Small text above the headline.' }),
        defineField({
          name: 'headline',
          title: 'Headline',
          type: 'string',
          description: 'Wrap words in *asterisks* to color them with the accent color, like "Save *25%* on your family photo site."',
        }),
        defineField({ name: 'body', title: 'Body', type: 'text', rows: 3 }),
        imageField({ name: 'image', title: 'Image' }),
        imageField({ name: 'qrCode', title: 'QR code' }),
        defineField({ name: 'qrLabel', title: 'QR code label', type: 'string', initialValue: 'Scan with your phone' }),
        defineField({ name: 'buttonLabel', title: 'Button label', type: 'string' }),
        defineField({ name: 'buttonUrl', title: 'Button link', type: 'url', description: 'Leave blank to use the sponsor link.' }),
        defineField({
          name: 'backgroundColor',
          title: 'Background color',
          type: 'string',
          description: 'A hex color like #00A6CE.',
          validation: (rule) => rule.regex(/^#[0-9a-fA-F]{6}$/, { name: 'hex color' }),
        }),
        defineField({
          name: 'textColor',
          title: 'Text color',
          type: 'string',
          options: {
            list: [
              { title: 'Light text', value: 'light' },
              { title: 'Dark text', value: 'dark' },
            ],
            layout: 'radio',
            direction: 'horizontal',
          },
          initialValue: 'light',
        }),
        defineField({
          name: 'accentColor',
          title: 'Accent color',
          type: 'string',
          description: 'Optional hex color for the eyebrow and highlighted headline words. Leave blank to use the text color.',
          validation: (rule) => rule.regex(/^#[0-9a-fA-F]{6}$/, { name: 'hex color' }),
        }),
        defineField({ name: 'promoCode', title: 'Promo code', type: 'string', description: 'Shown in the dashed code box.' }),
        defineField({
          name: 'stripText',
          title: 'Short offer (tournament pages)',
          type: 'text',
          rows: 2,
          description: 'One line for the strip under the photos on upcoming tournament pages.',
        }),
        defineField({ name: 'stripButtonLabel', title: 'Short offer button label', type: 'string' }),
        defineField({
          name: 'galleryOfferText',
          title: 'Offer link text (past tournament pages)',
          type: 'string',
          description: 'Shown under the gallery button on past tournament pages.',
        }),
        defineField({
          name: 'finePrint',
          title: 'Fine print',
          type: 'text',
          rows: 2,
          description: 'SmugMug offers must say they are for adults and governed by SmugMug terms.',
        }),
      ],
    }),
  ],
  orderings: [
    {
      title: 'Display order',
      name: 'displayOrder',
      by: [
        { field: 'order', direction: 'asc' },
        { field: 'name', direction: 'asc' },
      ],
    },
  ],
  preview: {
    select: { title: 'name', designation: 'designation', tier: 'tier', end: 'contractEnd', media: 'logoOnDark' },
    prepare: ({ title, designation, tier, end, media }) => {
      const expired = end && end < new Date().toISOString().slice(0, 10);
      const parts = [tier === 'primary' ? 'Primary' : 'Secondary', designation, expired ? 'Contract ended' : null];
      return { title, subtitle: parts.filter(Boolean).join(' · '), media };
    },
  },
});
