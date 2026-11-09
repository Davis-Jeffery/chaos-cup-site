import { defineField } from 'sanity';

// Alt text is required whenever an image has been uploaded.
export const altField = defineField({
  name: 'alt',
  title: 'Alt text',
  type: 'string',
  description: 'Describe the image for people using screen readers.',
  validation: (rule) =>
    rule.custom((alt, context) => {
      const parent = context.parent as { asset?: unknown } | undefined;
      return parent?.asset && !alt ? 'Add alt text for this image.' : true;
    }),
});

type ImageFieldOptions = {
  name: string;
  title: string;
  description?: string;
  group?: string | string[];
  required?: boolean;
  fields?: ReturnType<typeof defineField>[];
  hidden?: any;
};

// Every image on the site uses hotspot cropping and an alt text subfield.
export function imageField({ name, title, description, group, required, fields = [], hidden }: ImageFieldOptions) {
  return defineField({
    name,
    title,
    type: 'image',
    description,
    group,
    hidden,
    options: { hotspot: true },
    fields: [altField, ...fields],
    validation: required ? (rule) => rule.required() : undefined,
  });
}

// Plain-text "YYYY-MM-DD" dates compare correctly as strings.
export const dateOptions = { dateFormat: 'MMM D, YYYY' };
