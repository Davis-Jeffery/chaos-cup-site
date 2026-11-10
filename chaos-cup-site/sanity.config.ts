import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { presentationTool } from 'sanity/presentation';
import { resolve } from './src/sanity/presentation';
import { schemaTypes, singletonTypes } from './src/sanity/schemaTypes';
import { structure } from './src/sanity/structure';
import { templates } from './src/sanity/templates';
import { actions } from './src/sanity/actions';

export default defineConfig({
  name: 'chaos-cup',
  title: 'Chaos Cup',
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID,
  dataset: import.meta.env.PUBLIC_SANITY_DATASET ?? 'production',
  plugins: [
    structureTool({ structure }),
    presentationTool({
      title: 'Live preview',
      resolve,
      previewUrl: {
        // The site runs on the same domain as the Studio.
        initial: '/',
        previewMode: { enable: '/api/draft-mode/enable', disable: '/api/draft-mode/disable' },
      },
    }),
    visionTool(),
  ],
  schema: {
    types: schemaTypes,
    // Singletons are opened from the sidebar, never created from "New document".
    templates: (previous) => templates(previous).filter((t) => !singletonTypes.has(t.schemaType)),
  },
  document: {
    actions,
    newDocumentOptions: (previous) => previous.filter((item) => !singletonTypes.has(item.templateId)),
  },
});
