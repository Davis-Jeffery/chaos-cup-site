import { CogIcon } from '@sanity/icons/Cog';
import { defineArrayMember, defineField, defineType } from 'sanity';
import { imageField } from '../../lib/fields';

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  icon: CogIcon,
  groups: [
    { name: 'brand', title: 'Brand', default: true },
    { name: 'nav', title: 'Navigation' },
    { name: 'announcement', title: 'Announcement bar' },
    { name: 'comingSoon', title: 'Coming soon hero' },
    { name: 'footer', title: 'Footer and contact' },
    { name: 'seo', title: 'SEO defaults' },
  ],
  fields: [
    imageField({ name: 'logo', title: 'Chaos Cup logo', group: 'brand', required: true }),
    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      group: 'brand',
      description: 'For example "Where freedom to play changes everything."',
    }),
    defineField({
      name: 'sponsorshipPdf',
      title: 'Sponsorship prospectus (PDF)',
      type: 'file',
      group: 'brand',
      description: 'Opened by the "Become a Sponsor" button.',
      options: { accept: 'application/pdf' },
    }),

    defineField({
      name: 'navLinks',
      title: 'Menu links',
      type: 'array',
      group: 'nav',
      of: [defineArrayMember({ type: 'link' })],
    }),
    defineField({
      name: 'registerLabel',
      title: 'Register button label',
      type: 'string',
      group: 'nav',
      initialValue: 'Register a Team',
    }),
    defineField({
      name: 'registerUrl',
      title: 'Default register link',
      type: 'url',
      group: 'nav',
      description: 'The PlayMetrics signup link. Tournaments use this unless they have their own.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'individualSignupUrl',
      title: 'Default solo signup link',
      type: 'url',
      group: 'nav',
      description: 'For players without a team.',
    }),

    defineField({
      name: 'announcement',
      title: 'Announcement bar',
      type: 'object',
      group: 'announcement',
      fields: [
        defineField({ name: 'enabled', title: 'Show the announcement bar', type: 'boolean', initialValue: false }),
        defineField({
          name: 'mode',
          title: 'What to announce',
          type: 'string',
          options: {
            list: [
              { title: 'Automatic: the latest past event, with a link to its photos and results', value: 'auto' },
              { title: 'Custom text and link', value: 'custom' },
            ],
            layout: 'radio',
          },
          initialValue: 'auto',
          hidden: ({ parent }) => !parent?.enabled,
        }),
        defineField({
          name: 'text',
          title: 'Text',
          type: 'string',
          hidden: ({ parent }) => !parent?.enabled || parent?.mode !== 'custom',
        }),
        defineField({
          name: 'linkLabel',
          title: 'Link label',
          type: 'string',
          hidden: ({ parent }) => !parent?.enabled || parent?.mode !== 'custom',
        }),
        defineField({
          name: 'link',
          title: 'Link',
          type: 'string',
          description: 'A page path like /past-events or a full web address.',
          hidden: ({ parent }) => !parent?.enabled || parent?.mode !== 'custom',
        }),
      ],
    }),

    defineField({
      name: 'comingSoon',
      title: 'Coming soon hero',
      type: 'object',
      group: 'comingSoon',
      description: 'Shown on the home page when no tournament is live or coming up.',
      fields: [
        defineField({ name: 'headline', title: 'Headline', type: 'string', initialValue: 'Stay tuned' }),
        defineField({
          name: 'text',
          title: 'Text',
          type: 'text',
          rows: 3,
          initialValue: 'The next Chaos Cup is coming soon.',
        }),
        imageField({ name: 'image', title: 'Background image' }),
        defineField({ name: 'emailSignupUrl', title: 'Email signup link', type: 'url' }),
      ],
    }),

    defineField({
      name: 'footerColumns',
      title: 'Footer columns',
      type: 'array',
      group: 'footer',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'footerColumn',
          fields: [
            defineField({ name: 'heading', title: 'Heading', type: 'string', validation: (rule) => rule.required() }),
            defineField({ name: 'links', title: 'Links', type: 'array', of: [defineArrayMember({ type: 'link' })] }),
          ],
          preview: { select: { title: 'heading' } },
        }),
      ],
    }),
    defineField({ name: 'instagramUrl', title: 'Instagram link', type: 'url', group: 'footer' }),
    defineField({
      name: 'contactEmail',
      title: 'Contact email',
      type: 'string',
      group: 'footer',
      validation: (rule) => rule.email(),
    }),

    defineField({ name: 'seoTitle', title: 'Default page title', type: 'string', group: 'seo' }),
    defineField({ name: 'seoDescription', title: 'Default description', type: 'text', rows: 3, group: 'seo' }),
    imageField({ name: 'seoImage', title: 'Default share image', group: 'seo', description: '1200 x 630 works best.' }),
  ],
  preview: { prepare: () => ({ title: 'Site settings' }) },
});
