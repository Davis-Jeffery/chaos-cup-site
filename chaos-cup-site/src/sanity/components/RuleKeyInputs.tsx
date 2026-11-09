import { useEffect, useState } from 'react';
import { Select } from '@sanity/ui';
import { set, unset, useClient, useFormValue, type StringInputProps } from 'sanity';

type Rule = { _key: string; title?: string };
type Option = { key: string; label: string };

// Rule numbers are never stored. They come from position: section 4, rule 2 is "4.2".
const label = (section: number, index: number, title?: string) => `${section}.${index + 1}  ${title ?? 'Untitled rule'}`;

function RuleSelect({ props, options }: { props: StringInputProps; options: Option[] }) {
  const { value, onChange, elementProps } = props;
  const missing = value && !options.some((o) => o.key === value);
  return (
    <Select
      {...elementProps}
      value={value ?? ''}
      onChange={(event) => {
        const next = event.currentTarget.value;
        onChange(next ? set(next) : unset());
      }}
    >
      <option value="">Pick a rule</option>
      {missing && <option value={value}>Rule not found (it may have been deleted)</option>}
      {options.map((o) => (
        <option key={o.key} value={o.key}>
          {o.label}
        </option>
      ))}
    </Select>
  );
}

// Lists the rules in the section being edited. Used by rule groups.
export function RuleInSectionInput(props: StringInputProps) {
  const rules = (useFormValue(['rules']) as Rule[] | undefined) ?? [];
  const options = rules.map((r, i) => ({ key: r._key, label: `Rule ${i + 1}  ${r.title ?? 'Untitled rule'}` }));
  return <RuleSelect props={props} options={options} />;
}

// Lists every rule in every section. Used by cross references inside rule text.
export function RuleRefInput(props: StringInputProps) {
  const client = useClient({ apiVersion: '2026-11-01' });
  const [options, setOptions] = useState<Option[]>([]);

  useEffect(() => {
    let active = true;
    client
      .fetch<{ _id: string; order?: number; rules?: Rule[] }[]>(
        `*[_type == "ruleSection"]{_id, order, rules[]{_key, title}}`,
      )
      .then((docs) => {
        // Prefer the draft over the published copy of the same section.
        const byId = new Map<string, (typeof docs)[number]>();
        for (const doc of docs) {
          const id = doc._id.replace(/^drafts\./, '');
          if (doc._id.startsWith('drafts.') || !byId.has(id)) byId.set(id, doc);
        }
        const sections = [...byId.values()].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        const next = sections.flatMap((s, si) => (s.rules ?? []).map((r, ri) => ({ key: r._key, label: label(si + 1, ri, r.title) })));
        if (active) setOptions(next);
      });
    return () => {
      active = false;
    };
  }, [client]);

  return <RuleSelect props={props} options={options} />;
}
