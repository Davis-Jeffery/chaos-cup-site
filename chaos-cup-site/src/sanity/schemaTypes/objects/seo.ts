import { defineField, defineType } from 'sanity';
import { imageField } from '../../lib/fields';

export const seo = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  description: 'Leave blank to use the defaults from Site settings.',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({
      name: 'title',
      title: 'Page title',
      type: 'string',
      description: 'Shown in the browser tab and search results. Aim for under 60 characters.',
      validation: (rule) => rule.max(70).warning('Long titles get cut off in search results.'),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      description: 'Shown under the title in search results. Aim for under 160 characters.',
      validation: (rule) => rule.max(200).warning('Long descriptions get cut off in search results.'),
    }),
    imageField({ name: 'image', title: 'Share image', description: 'Shown when the page is shared on social media. 1200 x 630 works best.' }),
  ],
});
