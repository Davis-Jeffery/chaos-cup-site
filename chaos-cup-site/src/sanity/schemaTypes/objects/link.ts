import { defineField, defineType } from 'sanity';

// A link to a page on this site or to any URL.
export const link = defineType({
  name: 'link',
  title: 'Link',
  type: 'object',
  fields: [
    defineField({ name: 'label', title: 'Label', type: 'string', validation: (rule) => rule.required() }),
    defineField({
      name: 'kind',
      title: 'Link to',
      type: 'string',
      options: {
        list: [
          { title: 'A page on this site', value: 'internal' },
          { title: 'A web address', value: 'external' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'internal',
    }),
    defineField({
      name: 'path',
      title: 'Page path',
      type: 'string',
      description: 'For example /rules or /past-events or /#tournaments',
      hidden: ({ parent }) => parent?.kind === 'external',
      validation: (rule) =>
        rule.custom((path, context) => {
          const parent = context.parent as { kind?: string } | undefined;
          if (parent?.kind === 'external') return true;
          if (!path) return 'Add a page path.';
          return path.startsWith('/') ? true : 'Page paths start with /';
        }),
    }),
    defineField({
      name: 'url',
      title: 'Web address',
      type: 'url',
      hidden: ({ parent }) => parent?.kind !== 'external',
      validation: (rule) =>
        rule.uri({ scheme: ['http', 'https', 'mailto'] }).custom((url, context) => {
          const parent = context.parent as { kind?: string } | undefined;
          return parent?.kind === 'external' && !url ? 'Add a web address.' : true;
        }),
    }),
  ],
  preview: {
    select: { title: 'label', path: 'path', url: 'url', kind: 'kind' },
    prepare: ({ title, path, url, kind }) => ({ title, subtitle: kind === 'external' ? url : path }),
  },
});
