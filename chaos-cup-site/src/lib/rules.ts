/**
 * Rulebook logic: numbering, layout and rendering of rule text.
 * Numbers come from position (section order, then rule order), so they update
 * on their own when editors reorder anything. Cross references store the rule
 * key and always print the current number.
 */

export interface RuleData {
  _key: string;
  title: string;
  body?: any[];
  diagram?: string;
}

export interface RuleGroupData {
  _key: string;
  eyebrow?: string;
  headline: string;
  intro?: string;
  rules?: string[];
  diagramSet?: string;
}

export interface RuleSectionData {
  _id: string;
  title: string;
  order: number;
  image?: any;
  rules?: RuleData[];
  ruleGroups?: RuleGroupData[];
  callout?: { label?: string; text?: string };
  button?: { label?: string; url?: string };
}

export type SectionBlock =
  | { kind: 'rules'; rules: RuleData[] }
  | { kind: 'diagram'; diagram: string; ruleKey: string }
  | { kind: 'group'; group: RuleGroupData; rules: RuleData[] };

/** Sorts sections and maps every rule key to its number, like "4.2". */
export function numberRules<T extends RuleSectionData>(sections: T[]) {
  const ordered = [...sections].sort((a, b) => a.order - b.order);
  const numbers = new Map<string, string>();
  ordered.forEach((section, s) => {
    (section.rules ?? []).forEach((rule, r) => numbers.set(rule._key, `${s + 1}.${r + 1}`));
  });
  return { ordered, numbers };
}

/** "Rules 4.4-4.6" or "Rule 4.4", for a group box label. */
export function groupRange(keys: string[], numbers: Map<string, string>): string {
  const nums = keys
    .map((k) => numbers.get(k))
    .filter((n): n is string => Boolean(n))
    .sort((a, b) => {
      const [as, ar] = a.split('.').map(Number);
      const [bs, br] = b.split('.').map(Number);
      return as - bs || ar - br;
    });
  if (nums.length === 0) return '';
  if (nums.length === 1) return `Rule ${nums[0]}`;
  return `Rules ${nums[0]}-${nums[nums.length - 1]}`;
}

/**
 * Splits a section into blocks in reading order:
 * - runs of rules,
 * - a diagram directly under the rule that has one,
 * - a group box at the position of its first rule, holding all its rules.
 */
export function layoutSection(section: RuleSectionData): SectionBlock[] {
  const rules = section.rules ?? [];
  const groupOf = new Map<string, RuleGroupData>();
  for (const group of section.ruleGroups ?? []) {
    for (const key of group.rules ?? []) if (!groupOf.has(key)) groupOf.set(key, group);
  }

  const blocks: SectionBlock[] = [];
  const emittedGroups = new Set<string>();
  let run: RuleData[] = [];
  const flush = () => {
    if (run.length) blocks.push({ kind: 'rules', rules: run });
    run = [];
  };

  for (const rule of rules) {
    const group = groupOf.get(rule._key);
    if (group) {
      if (emittedGroups.has(group._key)) continue;
      emittedGroups.add(group._key);
      flush();
      blocks.push({ kind: 'group', group, rules: rules.filter((r) => groupOf.get(r._key) === group) });
      continue;
    }
    run.push(rule);
    if (rule.diagram && rule.diagram !== 'none') {
      flush();
      blocks.push({ kind: 'diagram', diagram: rule.diagram, ruleKey: rule._key });
    }
  }
  flush();
  return blocks;
}

export function sectionSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function renderSpans(block: any, numbers: Map<string, string>): string {
  const defs = new Map<string, any>((block.markDefs ?? []).map((d: any) => [d._key, d]));
  return (block.children ?? [])
    .map((child: any) => {
      let text = child.text ?? '';
      const marks: string[] = child.marks ?? [];
      let html = escapeHtml(text);
      let linkOpen = '';
      for (const mark of marks) {
        const def = defs.get(mark);
        if (def?._type === 'ruleRef') {
          const num = numbers.get(def.ruleKey);
          if (num) {
            html = escapeHtml(`rule ${num}`);
            linkOpen = `<a href="#rule-${escapeHtml(def.ruleKey)}">`;
          }
        } else if (def?._type === 'link' && def.href) {
          linkOpen = `<a href="${escapeHtml(def.href)}">`;
        }
      }
      if (marks.includes('em')) html = `<em>${html}</em>`;
      if (marks.includes('strong')) html = `<strong>${html}</strong>`;
      return linkOpen ? `${linkOpen}${html}</a>` : html;
    })
    .join('');
}

/**
 * Renders a rule's Portable Text as inline HTML. The first paragraph runs on
 * after the bold title; later paragraphs and bullet lists follow it.
 */
export function renderRuleBody(body: any[] = [], numbers: Map<string, string>): string {
  let html = '';
  let inList = false;
  body.forEach((block, i) => {
    if (block._type !== 'block') return;
    const inner = renderSpans(block, numbers);
    if (block.listItem) {
      if (!inList) html += '<ul class="rule-list">';
      inList = true;
      html += `<li>${inner}</li>`;
      return;
    }
    if (inList) html += '</ul>';
    inList = false;
    html += i === 0 ? inner : `<span class="rule-p">${inner}</span>`;
  });
  if (inList) html += '</ul>';
  return html;
}

/** Splits "*bold*" markers in group intros into pieces. */
export function boldParts(text?: string): { text: string; bold: boolean }[] {
  if (!text) return [];
  return text
    .split(/(\*[^*]+\*)/)
    .filter(Boolean)
    .map((p) => (p.length > 2 && p.startsWith('*') && p.endsWith('*') ? { text: p.slice(1, -1), bold: true } : { text: p, bold: false }));
}
