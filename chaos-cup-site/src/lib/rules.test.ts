import { describe, expect, it } from 'vitest';
import { groupRange, layoutSection, numberRules, renderRuleBody, sectionSlug, type RuleSectionData } from './rules';

const block = (key: string, children: any[], markDefs: any[] = [], extra: Record<string, unknown> = {}) => ({
  _key: key,
  _type: 'block',
  style: 'normal',
  markDefs,
  children,
  ...extra,
});
const span = (text: string, marks: string[] = []) => ({ _type: 'span', _key: text.slice(0, 8), text, marks });

const rule = (key: string, diagram = 'none') => ({ _key: key, title: key, body: [block(`${key}b`, [span(`${key} text`)])], diagram });

const sections: RuleSectionData[] = [
  { _id: 's2', title: 'The Field', order: 20, rules: [rule('walls'), rule('where-to-stand', 'whereToStand')] },
  { _id: 's1', title: 'Teams and Eligibility', order: 10, rules: [rule('rosters'), rule('divisions'), rule('placement')] },
  {
    _id: 's3',
    title: 'Play, Restarts and the Goal Zone',
    order: 30,
    rules: [rule('ball-out', 'kickIn'), rule('free-kicks'), rule('zone'), rule('nobody'), rule('violations'), rule('hands')],
    ruleGroups: [{ _key: 'gz', headline: 'Goal Zone', rules: ['zone', 'nobody', 'violations'], diagramSet: 'goalZone' }],
  },
];

describe('numberRules', () => {
  const { ordered, numbers } = numberRules(sections);
  it('orders sections by their order field', () => {
    expect(ordered.map((s) => s._id)).toEqual(['s1', 's2', 's3']);
  });
  it('numbers rules by position', () => {
    expect(numbers.get('rosters')).toBe('1.1');
    expect(numbers.get('placement')).toBe('1.3');
    expect(numbers.get('where-to-stand')).toBe('2.2');
    expect(numbers.get('hands')).toBe('3.6');
  });
  it('renumbers when rules move', () => {
    const moved = structuredClone(sections);
    moved[1].rules.reverse();
    expect(numberRules(moved).numbers.get('placement')).toBe('1.1');
  });
});

describe('groupRange', () => {
  const { numbers } = numberRules(sections);
  it('labels a range or a single rule', () => {
    expect(groupRange(['zone', 'nobody', 'violations'], numbers)).toBe('Rules 3.3-3.5');
    expect(groupRange(['hands'], numbers)).toBe('Rule 3.6');
    expect(groupRange(['violations', 'zone'], numbers)).toBe('Rules 3.3-3.5');
    expect(groupRange(['missing'], numbers)).toBe('');
  });
});

describe('layoutSection', () => {
  it('splits the list after a rule with a diagram', () => {
    const blocks = layoutSection(sections[0]);
    expect(blocks.map((b) => b.kind)).toEqual(['rules', 'diagram']);
    expect(blocks[1]).toMatchObject({ kind: 'diagram', diagram: 'whereToStand' });
  });
  it('puts a group box where its first rule is, with its rules inside', () => {
    const blocks = layoutSection(sections[2]);
    expect(blocks.map((b) => b.kind)).toEqual(['rules', 'diagram', 'rules', 'group', 'rules']);
    const group = blocks[3];
    expect(group.kind === 'group' && group.rules.map((r) => r._key)).toEqual(['zone', 'nobody', 'violations']);
    const last = blocks[4];
    expect(last.kind === 'rules' && last.rules.map((r) => r._key)).toEqual(['hands']);
  });
});

describe('renderRuleBody', () => {
  const numbers = new Map([['placement', '1.4']]);
  it('renders text, bold and italics, escaping HTML', () => {
    const html = renderRuleBody([block('b', [span('Fast '), span('<3', ['strong']), span(' fun', ['em'])])], numbers);
    expect(html).toBe('Fast <strong>&lt;3</strong><em> fun</em>');
  });
  it('turns rule references into live numbered links', () => {
    const body = [
      block('b', [span('Placement follows '), span('rule 9.9', ['r1']), span('.')], [{ _key: 'r1', _type: 'ruleRef', ruleKey: 'placement' }]),
    ];
    expect(renderRuleBody(body, numbers)).toBe('Placement follows <a href="#rule-placement">rule 1.4</a>.');
  });
  it('leaves a broken reference as plain text', () => {
    const body = [block('b', [span('see rule 2.2', ['r1'])], [{ _key: 'r1', _type: 'ruleRef', ruleKey: 'gone' }])];
    expect(renderRuleBody(body, numbers)).toBe('see rule 2.2');
  });
  it('renders web links and later paragraphs and lists', () => {
    const body = [
      block('a', [span('First.')]),
      block('b', [span('Site', ['l1'])], [{ _key: 'l1', _type: 'link', href: 'https://example.com/?a=1&b=2' }]),
      block('c', [span('One')], [], { listItem: 'bullet', level: 1 }),
      block('d', [span('Two')], [], { listItem: 'bullet', level: 1 }),
    ];
    expect(renderRuleBody(body, numbers)).toBe(
      'First.<span class="rule-p"><a href="https://example.com/?a=1&amp;b=2">Site</a></span><ul class="rule-list"><li>One</li><li>Two</li></ul>',
    );
  });
});

describe('sectionSlug', () => {
  it('makes a readable anchor', () => {
    expect(sectionSlug('Play, Restarts and the Goal Zone')).toBe('play-restarts-and-the-goal-zone');
  });
});
