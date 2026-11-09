import { LaunchIcon } from '@sanity/icons/Launch';
import type { DocumentActionComponent, DocumentActionsResolver } from 'sanity';
import { singletonTypes } from './schemaTypes';

const ViewPageAction: DocumentActionComponent = ({ draft, published }) => {
  const slug = ((draft ?? published) as { slug?: { current?: string } } | null)?.slug?.current;
  return {
    label: 'View page',
    icon: LaunchIcon,
    disabled: !slug,
    title: slug ? undefined : 'Add a page address first',
    onHandle: () => window.open(`/tournaments/${slug}`, '_blank', 'noopener'),
  };
};

// Singletons can only be published or discarded, never duplicated or deleted.
const singletonActions = new Set(['publish', 'discardChanges', 'restore']);

export const actions: DocumentActionsResolver = (previous, { schemaType }) => {
  if (singletonTypes.has(schemaType)) return previous.filter(({ action }) => action && singletonActions.has(action));
  if (schemaType === 'tournament') return [...previous, ViewPageAction];
  return previous;
};
