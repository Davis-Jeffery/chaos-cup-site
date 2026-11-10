import { DocumentTextIcon } from '@sanity/icons/DocumentText';
import { LinkIcon } from '@sanity/icons/Link';
import { defineArrayMember, defineField, defineType } from 'sanity';
import { RuleInSectionInput, RuleRefInput } from '../../components/RuleKeyInputs';
import { imageField } from '../../lib/fields';

// Coded diagrams, drawn as SVG on the site. Editors pick one, they never upload it.
export const diagramOptions = [
  { title: 'None', value: 'none' },
  { title: 'Where to stand', value: 'whereToStand' },
  { title: 'Kick-in', value: 'kickIn' },
  { title: 'Free kicks', value: 'freeKicks' },
  { title: 'No offside', value: 'noOffside' },
  { title: '3-foul kick', value: 'threeFoulKick' },
  { title: 'After a goal (animated)', value: 'afterGoal' },
];

const ruleBody = defineField({
  name: 'body',
  title: 'Rule text',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [{ title: 'Normal', value: 'normal' }],
      lists: [{ title: 'Bullet', value: 'bullet' }],
      marks: {
        decorators: [
          { title: 'Bold', value: 'strong' },
          { title: 'Italic', value: 'em' },
        ],
        annotations: [
          {
            name: 'ruleRef',
            title: 'Link to another rule',
            type: 'object',
            icon: LinkIcon,
            description: 'Shows as "rule 4.2" and updates on its own when rules move.',
            fields: [
              defineField({
                name: 'ruleKey',
                title: 'Rule',
                type: 'string',
                components: { input: RuleRefInput },
                validation: (rule) => rule.required(),
              }),
            ],
          },
          {
            name: 'link',
            title: 'Web link',
            type: 'object',
            fields: [defineField({ name: 'href', title: 'Web address', type: 'url', validation: (rule) => rule.required() })],
          },
        ],
      },
    }),
  ],
});

export const ruleSection = defineType({
  name: 'ruleSection',
  title: 'Rule section',
  type: 'document',
  icon: DocumentTextIcon,
  fields: [
    defineField({ name: 'title', title: 'Section title', type: 'string', validation: (rule) => rule.required() }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Sections are numbered by this order, lowest first. The number itself is never shown.',
      validation: (rule) => rule.required(),
    }),
    imageField({
      name: 'image',
      title: 'Section image',
      description: 'Optional photo under the section title, like the inflatable field in The Field.',
      fields: [defineField({ name: 'caption', title: 'Caption', type: 'string' })],
    }),
    defineField({
      name: 'rules',
      title: 'Rules',
      type: 'array',
      description: 'Drag to reorder. Rule numbers update on their own.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'rule',
          fields: [
            defineField({ name: 'title', title: 'Rule title', type: 'string', validation: (rule) => rule.required() }),
            ruleBody,
            defineField({
              name: 'diagram',
              title: 'Diagram',
              type: 'string',
              description: 'Shown directly under this rule.',
              options: { list: diagramOptions },
              initialValue: 'none',
            }),
          ],
          preview: {
            select: { title: 'title', diagram: 'diagram' },
            prepare: ({ title, diagram }) => ({
              title,
              subtitle: diagram && diagram !== 'none' ? `Diagram: ${diagramOptions.find((d) => d.value === diagram)?.title}` : undefined,
            }),
          },
        }),
      ],
    }),
    defineField({
      name: 'ruleGroups',
      title: 'Rule groups',
      type: 'array',
      description: 'The magenta "explained" boxes, like Goal Zone (rules 4.4 to 4.6). The rule range in the label is generated.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'ruleGroup',
          fields: [
            defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string', description: 'For example "Goal Zone".' }),
            defineField({ name: 'headline', title: 'Headline', type: 'string', validation: (rule) => rule.required() }),
            defineField({
              name: 'intro',
              title: 'Intro',
              type: 'text',
              rows: 3,
              description: 'Wrap words in *asterisks* to make them bold.',
            }),
            defineField({
              name: 'rules',
              title: 'Rules in this group',
              type: 'array',
              description: 'Pick rules from this section, next to each other. The box appears where the first one is, with these rules inside it.',
              of: [defineArrayMember({ type: 'string', components: { input: RuleInSectionInput } })],
              validation: (rule) => rule.min(1),
            }),
            defineField({
              name: 'diagramSet',
              title: 'Diagrams',
              type: 'string',
              options: {
                list: [
                  { title: 'Goal Zone', value: 'goalZone' },
                  { title: '3-Foul Rule', value: 'threeFoul' },
                  { title: 'None', value: 'none' },
                ],
              },
              initialValue: 'none',
            }),
          ],
          preview: { select: { title: 'headline', subtitle: 'eyebrow' } },
        }),
      ],
    }),
    defineField({
      name: 'callout',
      title: 'Callout',
      type: 'object',
      description: 'Optional box at the end of the section, like "Why the walls matter: ..."',
      fields: [
        defineField({ name: 'label', title: 'Bold start', type: 'string', description: 'Shown in magenta, like "Why the walls matter:"' }),
        defineField({ name: 'text', title: 'Text', type: 'text', rows: 2 }),
      ],
    }),
    defineField({
      name: 'button',
      title: 'Button',
      type: 'object',
      description: 'Optional button at the end of the section, like "Standings on PlayMetrics".',
      fields: [
        defineField({ name: 'label', title: 'Label', type: 'string' }),
        defineField({ name: 'url', title: 'Link', type: 'url' }),
      ],
    }),
  ],
  orderings: [{ title: 'Section order', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    select: { title: 'title', order: 'order', rules: 'rules' },
    prepare: ({ title, rules }) => ({ title, subtitle: `${rules?.length ?? 0} rules` }),
  },
});
