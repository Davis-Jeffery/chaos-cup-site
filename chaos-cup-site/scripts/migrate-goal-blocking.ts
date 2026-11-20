/**
 * Replaces the Goal Zone rule with No goal blocking in the live dataset:
 * the Play section's title, rules 4.4 to 4.6 and its rule group, home card 01,
 * and the Contact page's rules answer. Content comes from ./content/goal-blocking.
 *
 * Safe to run more than once: it only writes what differs from the target.
 * Drafts of the same documents are updated too, so they don't bring the old rule back.
 *
 *   npx sanity exec scripts/migrate-goal-blocking.ts -- --dry-run
 *   npx sanity exec scripts/migrate-goal-blocking.ts
 *
 * Writes use SANITY_API_WRITE_TOKEN from .env. Without it, add --with-user-token
 * after the script path to write as your own Sanity login instead.
 */
import { createClient, type SanityClient } from '@sanity/client';
import {
  OLD_GROUP_KEY,
  OLD_RULE_KEYS,
  PLAY_SECTION_ID,
  PLAY_SECTION_TITLE,
  contactRulesText,
  goalBlockingGroup,
  goalBlockingRules,
  homeRuleTile,
} from './content/goal-blocking';

try {
  process.loadEnvFile('.env');
} catch {
  // No .env: rely on the environment.
}

const dryRun = process.argv.includes('--dry-run');
const env = process.env;
const projectId = env.PUBLIC_SANITY_PROJECT_ID ?? env.SANITY_STUDIO_PROJECT_ID;
const dataset = env.PUBLIC_SANITY_DATASET ?? env.SANITY_STUDIO_DATASET ?? 'production';
if (!projectId) throw new Error('PUBLIC_SANITY_PROJECT_ID is not set.');

async function getClient(): Promise<{ client: SanityClient; auth: string }> {
  const base = { projectId: projectId!, dataset, apiVersion: '2026-11-01', useCdn: false };
  if (env.SANITY_API_WRITE_TOKEN) return { client: createClient({ ...base, token: env.SANITY_API_WRITE_TOKEN }), auth: 'SANITY_API_WRITE_TOKEN' };
  if (dryRun && env.SANITY_API_READ_TOKEN) return { client: createClient({ ...base, token: env.SANITY_API_READ_TOKEN }), auth: 'SANITY_API_READ_TOKEN (dry run)' };
  // Under `sanity exec --with-user-token`, the CLI client carries the user's login.
  const { getCliClient } = await import('sanity/cli');
  const client = getCliClient({ apiVersion: '2026-11-01' });
  if (!client.config().token) {
    throw new Error('No write access. Set SANITY_API_WRITE_TOKEN in .env, or run with --with-user-token.');
  }
  return { client, auth: 'Sanity user login' };
}

/** Same block shape as seed.ts, so a seeded dataset and a migrated one are identical. */
function ruleBody(ruleKey: string, text: string, numbers: Map<string, string>) {
  const children: any[] = [];
  const markDefs: any[] = [];
  text.split(/(\{\{[\w-]+\}\})/).forEach((part, i) => {
    if (!part) return;
    const target = part.match(/^\{\{([\w-]+)\}\}$/)?.[1];
    if (target) {
      const number = numbers.get(target);
      if (!number) throw new Error(`Rule "${ruleKey}" links to unknown rule "${target}".`);
      const markKey = `${ruleKey}-ref${i}`;
      markDefs.push({ _key: markKey, _type: 'ruleRef', ruleKey: target });
      children.push({ _key: `${ruleKey}-s${i}`, _type: 'span', text: `rule ${number}`, marks: [markKey] });
    } else {
      children.push({ _key: `${ruleKey}-s${i}`, _type: 'span', text: part, marks: [] });
    }
  });
  return [{ _key: `${ruleKey}-b0`, _type: 'block', style: 'normal', markDefs, children }];
}

/** Deep equality that ignores key order (Sanity returns fields in its own order). */
const canonical = (v: unknown): unknown =>
  Array.isArray(v) ? v.map(canonical) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)).map(([k, x]) => [k, canonical(x)])) : v;
const same = (a: unknown, b: unknown) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
const log = (msg: string) => console.log(msg);

async function main() {
  const { client, auth } = await getClient();
  log(`${dryRun ? 'DRY RUN, nothing will be written.' : 'Writing changes.'} Dataset ${dataset}, auth: ${auth}`);

  // Current rule numbers, for the readable "rule 4.2" text inside cross references.
  const sections = await client.fetch<{ _id: string; order: number; rules?: { _key: string }[] }[]>(
    `*[_type == "ruleSection" && !(_id in path("drafts.**"))] | order(order asc){ _id, order, "rules": rules[]{ _key } }`,
  );
  const numbers = new Map<string, string>();
  sections.forEach((s, si) => {
    const keys = (s.rules ?? []).map((r) => r._key);
    // Number the new rules where the old ones sit, as they will after the migration.
    const firstOld = keys.findIndex((k) => OLD_RULE_KEYS.includes(k));
    const final =
      firstOld === -1
        ? keys
        : [...keys.slice(0, firstOld).filter((k) => !OLD_RULE_KEYS.includes(k)), ...goalBlockingRules.map((r) => r.key), ...keys.slice(firstOld).filter((k) => !OLD_RULE_KEYS.includes(k))];
    final.forEach((k, ri) => numbers.set(k, `${si + 1}.${ri + 1}`));
  });

  const newRules = goalBlockingRules.map((r) => ({ _key: r.key, _type: 'rule', title: r.title, body: ruleBody(r.key, r.text, numbers), diagram: 'none' }));
  const newKeys = newRules.map((r) => r._key);
  const newGroup = {
    _key: goalBlockingGroup.key,
    _type: 'ruleGroup',
    eyebrow: goalBlockingGroup.eyebrow,
    headline: goalBlockingGroup.headline,
    intro: goalBlockingGroup.intro,
    rules: goalBlockingGroup.rules,
    diagramSet: goalBlockingGroup.diagramSet,
  };

  const tx = client.transaction();
  let changes = 0;

  // 1. Rulebook Section 04 (published and draft).
  const playDocs = await client.fetch<any[]>(`*[_id in [$id, "drafts." + $id]]`, { id: PLAY_SECTION_ID });
  if (playDocs.length === 0) log(`! ${PLAY_SECTION_ID} not found. Skipped.`);
  for (const doc of playDocs) {
    const rules: any[] = doc.rules ?? [];
    const firstIdx = rules.findIndex((r) => OLD_RULE_KEYS.includes(r._key) || newKeys.includes(r._key));
    let nextRules = rules;
    if (firstIdx === -1) {
      log(`! ${doc._id}: no Goal Zone or goal blocking rules found, rules left as they are.`);
    } else {
      const rest = rules.filter((r) => !OLD_RULE_KEYS.includes(r._key) && !newKeys.includes(r._key));
      const before = rules.slice(0, firstIdx).filter((r) => rest.includes(r));
      const after = rules.slice(firstIdx).filter((r) => rest.includes(r));
      nextRules = [...before, ...newRules, ...after];
    }
    const groups: any[] = doc.ruleGroups ?? [];
    const gi = groups.findIndex((g) => g._key === OLD_GROUP_KEY || g._key === newGroup._key);
    const isGoalGroup = (g: any) => g._key === OLD_GROUP_KEY || g._key === newGroup._key;
    const nextGroups = gi === -1 ? [...groups, newGroup] : groups.flatMap((g, i) => (!isGoalGroup(g) ? [g] : i === gi ? [newGroup] : []));

    const set: Record<string, unknown> = {};
    if (doc.title !== PLAY_SECTION_TITLE) set.title = PLAY_SECTION_TITLE;
    if (!same(rules, nextRules)) set.rules = nextRules;
    if (!same(groups, nextGroups)) set.ruleGroups = nextGroups;
    if (Object.keys(set).length === 0) {
      log(`= ${doc._id}: already up to date.`);
      continue;
    }
    changes++;
    log(`~ ${doc._id}: ${Object.keys(set).join(', ')}`);
    if (set.title) log(`    title: "${doc.title}" -> "${PLAY_SECTION_TITLE}"`);
    if (set.rules) log(`    rules: [${rules.map((r) => r._key).join(', ')}]\n        -> [${nextRules.map((r) => r._key).join(', ')}]`);
    if (set.ruleGroups) log(`    groups: [${groups.map((g) => g._key).join(', ')}] -> [${nextGroups.map((g) => g._key).join(', ')}]`);
    tx.patch(doc._id, (p) => p.ifRevisionId(doc._rev).set(set));
  }

  // 2. Home page, "Rules in 60 seconds" card 01.
  const homeDocs = await client.fetch<any[]>(`*[_id in ["homePage", "drafts.homePage"]]{ _id, _rev, "tiles": rulesSection.tiles }`);
  for (const doc of homeDocs) {
    const tile = (doc.tiles ?? []).find(
      (t: any) => /goal ?zone/i.test(`${t.title} ${t.text} ${t.linkPath}`) || t.linkPath === homeRuleTile.linkPath,
    );
    if (!tile) {
      log(`! ${doc._id}: no Goal Zone card found. Skipped.`);
      continue;
    }
    const target = { ...tile, ...homeRuleTile };
    if (same(tile, target)) {
      log(`= ${doc._id}: card "${tile._key}" already up to date.`);
      continue;
    }
    changes++;
    log(`~ ${doc._id}: card "${tile._key}" "${tile.title}" -> "${homeRuleTile.title}", link ${tile.linkPath} -> ${homeRuleTile.linkPath}`);
    const path = `rulesSection.tiles[_key=="${tile._key}"]`;
    tx.patch(doc._id, (p) =>
      p.ifRevisionId(doc._rev).set({
        [`${path}.title`]: homeRuleTile.title,
        [`${path}.text`]: homeRuleTile.text,
        [`${path}.linkLabel`]: homeRuleTile.linkLabel,
        [`${path}.linkPath`]: homeRuleTile.linkPath,
      }),
    );
  }

  // 3. Contact page, "Rules and game day" answer.
  const contactDocs = await client.fetch<any[]>(`*[_id in ["contactPage", "drafts.contactPage"]]{ _id, _rev, topics }`);
  for (const doc of contactDocs) {
    const topic = (doc.topics ?? []).find((t: any) => /goal ?zone/i.test(t.text ?? '') || t.text === contactRulesText);
    if (!topic) {
      log(`= ${doc._id}: no Goal Zone mention.`);
      continue;
    }
    if (topic.text === contactRulesText) {
      log(`= ${doc._id}: topic "${topic._key}" already up to date.`);
      continue;
    }
    changes++;
    log(`~ ${doc._id}: topic "${topic._key}" text -> "${contactRulesText}"`);
    tx.patch(doc._id, (p) => p.ifRevisionId(doc._rev).set({ [`topics[_key=="${topic._key}"].text`]: contactRulesText }));
  }

  if (changes === 0) {
    log('Nothing to change.');
  } else if (dryRun) {
    log(`${changes} document(s) would change. Run again without --dry-run to apply.`);
  } else {
    await tx.commit({ visibility: 'sync' });
    log(`Done. ${changes} document(s) updated.`);
  }

  // Anything still mentioning the zone. Why 3v3 ("Many players stay in one zone") is unrelated, so it isn't checked.
  const docs = await client.fetch<any[]>(
    `*[_type in ["ruleSection", "homePage", "contactPage", "tournament", "siteSettings", "rulebookPage", "getInvolvedPage", "pastEventsPage", "eventSafetyPage"]]`,
  );
  const left = docs.filter((d) => /zone/i.test(JSON.stringify(d)));
  log(left.length ? `Still mentions "zone": ${left.map((d) => d._id).join(', ')}${dryRun ? ' (expected before applying)' : ''}` : 'No Goal Zone references left in Sanity.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
