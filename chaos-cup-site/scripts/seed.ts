/**
 * Seeds Sanity with all content from the approved designs.
 *
 *   npx sanity exec scripts/seed.ts --with-user-token
 *
 * Safe to run again: every document has a fixed _id and is written with
 * createOrReplace, and Sanity reuses an image it already has instead of
 * uploading a duplicate. Running it again resets edited content to the
 * design copy, so only re-run it before editors start working.
 *
 * Videos: if BLOB_READ_WRITE_TOKEN is set (in .env or the shell), the MP4s in
 * design-reference/assets are uploaded to Vercel Blob and their URLs stored.
 * Without it, video fields are left empty and the script says so.
 *
 * Text containing [CONFIRM] or other [SQUARE BRACKET] placeholders is copied
 * as-is from the designs so it is easy to find and fill in.
 */
import { createReadStream, readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { getCliClient } from 'sanity/cli';

try {
  process.loadEnvFile('.env');
} catch {
  // No .env file. Fine, the CLI already knows the project.
}

const client = getCliClient({ apiVersion: '2026-11-01' });
const ASSETS = resolve(process.cwd(), 'design-reference/assets');

const REGISTER_URL =
  'https://playmetrics.com/signup?clubToken=U2lnbnVwLkdCLlYyLTEzMjctVGhlIENoYW9zIEN1cC1odHRwczovL2FwaS5nYi5wbGF5bWV0cmljcy5jb20vcHVibGljL2dicy8xMzI3L2xvZ28tMTc4NTYxMDkyN3xpT3RYS2IxVDV1di9GMUlCWVlmQkZoNlNTU0VtWVMwWDlWNk0yTjZJUE9FPQ==&program_id=2525';
const SOLO_URL = 'https://atomicathletics.fillout.com/t/i56zmzhtvUus';
const INSTAGRAM_URL = 'https://www.instagram.com/atomic_chaoscup/';
const SMUGMUG_OFFER_URL = 'https://www.smugmug.com/signup?coupon=Chaos2026';
const RELYTE_URL = 'https://glnk.io/oq72y/atomic-athletics-soccer';
// Still on the old WordPress site. Phase 10 sets up redirects for these.
const SPONSORSHIP_PDF_URL = 'https://thechaoscup.com/wp-content/uploads/2026/07/SPONSORSHIP-OPPORTUNITIES.pdf';
const CONTACT_EMAIL = 'contact@atomicathleticsutah.com';

// ---------- helpers ----------

const imageCache = new Map<string, string>();

async function uploadImage(file: string): Promise<string> {
  const cached = imageCache.get(file);
  if (cached) return cached;
  const asset = await client.assets.upload('image', createReadStream(resolve(ASSETS, file)), { filename: file });
  imageCache.set(file, asset._id);
  return asset._id;
}

/** An image field value with alt text. */
async function img(file: string, alt: string, extra: Record<string, unknown> = {}) {
  return { _type: 'image', asset: { _type: 'reference', _ref: await uploadImage(file) }, alt, ...extra };
}

/** An image inside an array, which needs a _key. */
async function imgItem(key: string, file: string, alt: string, extra: Record<string, unknown> = {}) {
  return { _key: key, ...(await img(file, alt, extra)) };
}

const ref = (id: string) => ({ _type: 'reference', _ref: id });

const internal = (key: string, label: string, path: string) => ({ _key: key, _type: 'link', label, kind: 'internal', path });
const external = (key: string, label: string, url: string) => ({ _key: key, _type: 'link', label, kind: 'external', url });

/** Gives each string or object in a list a stable _key. */
const keyed = <T extends object>(prefix: string, items: T[]) => items.map((item, i) => ({ _key: `${prefix}${i + 1}`, ...item }));

async function uploadVideos(files: string[]): Promise<Record<string, string>> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.warn(
      '\n! BLOB_READ_WRITE_TOKEN is not set, so videos were not uploaded and video fields are empty.\n' +
        '  Create a public Blob store in the Vercel dashboard (Storage > Create > Blob), copy its\n' +
        '  BLOB_READ_WRITE_TOKEN into .env, then run the seed again.\n',
    );
    return {};
  }
  const { head, put } = await import('@vercel/blob');
  const urls: Record<string, string> = {};
  for (const file of files) {
    const pathname = `videos/${file}`;
    try {
      urls[file] = (await head(pathname, { token })).url;
      console.log(`  video ${file}: already on Blob`);
    } catch {
      const blob = await put(pathname, readFileSync(resolve(ASSETS, file)), {
        access: 'public',
        token,
        addRandomSuffix: false,
        contentType: 'video/mp4',
      });
      urls[file] = blob.url;
      console.log(`  video ${file}: uploaded`);
    }
  }
  return urls;
}

async function uploadSponsorshipPdf() {
  try {
    const res = await fetch(SPONSORSHIP_PDF_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const asset = await client.assets.upload('file', Buffer.from(await res.arrayBuffer()), {
      filename: 'chaos-cup-sponsorship-opportunities.pdf',
      contentType: 'application/pdf',
    });
    return { _type: 'file', asset: ref(asset._id) };
  } catch (error) {
    console.warn(`! Could not download the sponsorship PDF (${(error as Error).message}). Upload it in Site settings.`);
    return undefined;
  }
}

// ---------- rules ----------

type RuleSeed = { key: string; title: string; text: string; diagram?: string };
type SectionSeed = {
  id: string;
  title: string;
  rules: RuleSeed[];
  groups?: { key: string; eyebrow: string; headline: string; intro: string; rules: string[]; diagramSet: string }[];
  image?: { file: string; alt: string; caption: string };
  callout?: { label: string; text: string };
  button?: { label: string; url: string };
};

// {{key}} inside rule text becomes a cross reference to that rule, shown as "rule 4.2".
const ruleSections: SectionSeed[] = [
  {
    id: 'ruleSection-teams',
    title: 'Teams and Eligibility',
    rules: [
      { key: 'rosters', title: 'Rosters', text: 'Teams carry 3 to 6 players. Three play at a time.' },
      { key: 'divisions', title: 'Divisions', text: 'Divisions run U7 through U18 and are set by birth year. Players may play up an age group but not down. Final team placement follows {{division-placement}}.' },
      { key: 'boys-girls-coed', title: 'Boys, girls and coed', text: 'Boys, girls and coed divisions are offered when enough teams register for each. A team is never placed in a coed division without its consent.' },
      { key: 'division-placement', title: 'Division placement', text: 'Our goal is to place every team where the competition is even, so games stay fun and competitive. Teams may not always land in the division they selected. When too few teams register in a division to split it into gold, silver and bronze, a team may be moved to a higher or lower division based on what the tournament needs. Without a team\'s consent, it will never play against a team more than 1 year apart from the division it selected, and it will never be placed in a coed division.' },
      { key: 'roster-changes', title: 'Roster changes', text: 'Rosters lock at check-in. Changes after that need tournament director approval.' },
      { key: 'solo-players', title: 'Solo players', text: 'Individuals who register solo are placed on a team by the tournament staff.' },
    ],
  },
  {
    id: 'ruleSection-field',
    title: 'The Field',
    image: {
      file: 'kick3v3-field.webp',
      alt: 'An inflatable 3v3 field: a rectangle of long inflatable tube walls with a gap at each end for the goals',
      caption: 'One of our inflatable fields. Low tube walls surround the field, with an opening at each end where the goal sits.',
    },
    callout: {
      label: 'Why the walls matter:',
      text: 'the ball almost never stops, so players get far more touches, quicker decisions and more goals than in a normal game.',
    },
    rules: [
      { key: 'inflatable-walls', title: 'Inflatable walls', text: 'Every game is played inside an inflatable walled field. The walls are part of the field, and the ball is live when it bounces off them.' },
      { key: 'stay-off-walls', title: 'Stay off the walls', text: 'No climbing, sitting, leaning or hanging on the walls at any time, for players or spectators.' },
      { key: 'spectators-outside', title: 'Spectators outside', text: 'Only players and the referee are allowed inside the walls. Coaches and parents cheer from outside.' },
      { key: 'where-to-stand', title: 'Where to stand', diagram: 'whereToStand', text: 'Venue sizes and layouts vary, so staff may adjust these spots, but in general: players not in the game and coaches stand behind their own goal, the one their team is defending. Referees stand outside the field near the halfway line and may step onto the field when needed.' },
    ],
  },
  {
    id: 'ruleSection-format',
    title: 'Game Format',
    rules: [
      { key: 'game-length', title: 'Game length', text: 'Each game is 12 minutes on one running clock that every field shares. Because everyone plays on the same clock, it never stops for any reason, including injuries and referee decisions.' },
      { key: 'guaranteed-games', title: 'Guaranteed games', text: 'Every team plays a minimum of 4 games within about a 5-hour block, with a chance to play a 5th game for the championship.' },
      { key: 'kickoff', title: 'Kickoff', text: 'A coin toss decides first possession, and the game starts with a kickoff from the center. After a goal, play restarts as described in {{after-a-goal}}.' },
      { key: 'after-a-goal', title: 'After a goal: touch your end line', diagram: 'afterGoal', text: 'After scoring, every player on the scoring team must run back and touch their own end line. Touching anywhere along the inflatable wall at their own goal end, or their own goal, counts. Meanwhile, the team that was scored on gets the ball out of the net and waits. Once the scoring team has touched back, the team that was scored on restarts with an indirect kick. If either team breaks this rule, any goal it scores is immediately disallowed and the ball is turned over to the other team.' },
      { key: 'championship-game', title: 'Championship game', text: 'After the 4 guaranteed games, the top teams in each division play a 5th game for the championship. [CONFIRM: how teams qualify, e.g. top 2 in the standings.]' },
      { key: 'championship-ties', title: 'Ties in the championship: 1v1 golden goal', text: 'A tied championship game is decided by a 1v1 golden goal. Each team sends 1 player onto the field. The two players stand back to back at the center with the ball between them. On the whistle, the referee drops the ball and the two play it out. The first goal wins the championship. If the ball goes out or there is a foul, the referee restarts with a new ball drop at the center. If no one scores within 2 minutes, each team sends in a fresh player and the ball drops again, repeating until someone scores. Once every player on the roster has had a turn, the rotation starts over in the same order. The players on each team choose who plays the 1v1, not the coaches. We ask coaches to let the kids make the call.' },
    ],
  },
  {
    id: 'ruleSection-play',
    title: 'Play, Restarts and the Goal Zone',
    rules: [
      { key: 'ball-out', title: 'Ball out of the field', diagram: 'kickIn', text: 'If the ball leaves the walls, the opposing team restarts with a kick-in from where it went out. Kick-ins are indirect: the ball must touch a second player before a goal counts. Opponents must stay at least 3 feet from the ball until it is kicked.' },
      { key: 'free-kicks', title: 'Free kicks', diagram: 'freeKicks', text: 'Free kicks are not taken from the spot of the foul. The ball is placed on the halfway mark (the white tick mark on the inflatable side wall) on either the left or right side, and play restarts from there. All free kicks are indirect: the ball must touch a second player before a goal counts. Defenders must give 3 yards. A free kick shot straight into the goal is a goal kick for the defense.' },
      { key: 'no-offside', title: 'No offside', diagram: 'noOffside', text: 'There is no offside in the Chaos Cup.' },
      { key: 'goal-zone', title: 'The Goal Zone', text: 'Each goal has a half-circle zone marked in front of it, reaching about one goal-width (6 feet) out from the goal line. [CONFIRM zone size and how it is marked]' },
      { key: 'nobody-in-zone', title: 'Nobody in the zone', text: 'Players from both teams must stay out of the zone. No one may stand, stop or touch the ball inside it. Running through it while chasing play is fine. Outside the zone, all normal defending is legal: pressure, cover, dropping back in front of the goal and blocking shots with your body.' },
      { key: 'zone-violations', title: 'Zone violations', text: 'If a player stands or stops in the zone, or an attacking player touches the ball inside it, the other team gets an indirect free kick, taken like any other free kick ({{free-kicks}}), and it counts as a team foul. A goal scored from inside the zone does not count. If a defending player touches the ball inside the zone, the attacking team is awarded a goal.' },
      { key: 'hands', title: 'Hands', text: 'Handling the ball anywhere on the field is a foul.' },
    ],
    groups: [
      {
        key: 'goal-zone-group',
        eyebrow: 'Goal Zone',
        headline: 'Nobody plays in the zone. Outside it, defend however you want.',
        intro: 'Every goal has a marked zone in front of it. Refs don\'t judge intent or where a player "should" be. They only ask one question: *is anyone playing inside the zone?* Pressure, cover, balance and dropping back to protect the goal are all good soccer, as long as it happens outside the line.',
        rules: ['goal-zone', 'nobody-in-zone', 'zone-violations'],
        diagramSet: 'goalZone',
      },
    ],
  },
  {
    id: 'ruleSection-fouls',
    title: 'Fouls and Safety',
    rules: [
      { key: 'no-slide-tackles', title: 'No slide tackles', text: 'Players stay on their feet. Slide tackles result in a free kick for the other team.' },
      { key: 'heading', title: 'Heading', text: 'No heading for U11 and younger. Intentional headers result in an indirect free kick for the other team.' },
      { key: 'wall-play', title: 'Wall play', text: 'The walls keep the ball in play, but they are not a place to battle or hide the ball. Any physical play on or around the walls, such as pushing, pinning, leaning on or checking an opponent into a wall, is an immediate foul. So is stalling play along the walls, such as trapping or shielding the ball against a wall to hold it or waste time. A player who keeps the ball pinned against the wall for more than 3 seconds without trying to play it is stalling. Every wall foul counts toward the team\'s foul total under the 3-foul rule ({{three-foul-rule}}).' },
      { key: 'dangerous-play', title: 'Dangerous play', text: 'High kicks, reckless challenges and rough play will be called. Repeat offenders may sit out the rest of the game.' },
      { key: 'three-foul-rule', title: '3-foul rule', text: 'The referee tracks team fouls each game. When a team commits its 3rd foul, the other team gets an uncontested free kick from the halfway line, and that team\'s foul count resets to 0.' },
      { key: 'three-foul-kick', title: 'Taking the 3-foul free kick', text: 'Every player except the shooter must stay behind the halfway line and at least 5 feet from the shooter. The moment the shooter touches the ball, everyone can go for it and regular play continues.' },
      { key: 'injuries', title: 'Injuries', text: 'The clock never stops for an injury. An injured player must sub out.' },
    ],
    groups: [
      {
        key: 'three-foul-group',
        eyebrow: '3-Foul Rule',
        headline: 'Only after a team\'s 3rd foul',
        // Plain text field, so the "rule 4.2" here does not renumber itself.
        intro: 'This special free kick from half happens *only* when a team reaches 3 fouls. Every other free kick is taken from the spot of the foul and is indirect, as in rule 4.2.',
        rules: ['three-foul-rule', 'three-foul-kick'],
        diagramSet: 'threeFoul',
      },
    ],
  },
  {
    id: 'ruleSection-subs',
    title: 'Substitutions',
    rules: [
      { key: 'subs-on-the-fly', title: 'On the fly', text: 'Teams may sub at any time without stopping play.' },
      { key: 'clean-swap', title: 'Clean swap', text: 'The player coming off must be out of the field before the new player enters. Too many players means a free kick for the other team.' },
    ],
  },
  {
    id: 'ruleSection-scoring',
    title: 'Scoring and Standings',
    button: { label: 'Standings on PlayMetrics', url: 'https://playmetricssports.com/g/leagues/1327-2438-663366d5/league_view.html' },
    rules: [
      { key: 'points', title: 'Points', text: 'Win 3, tie 1, loss 0.' },
      { key: 'tiebreakers', title: 'Tiebreakers, in order', text: 'Head-to-head result, goal differential, fewest goals allowed, then a coin flip.' },
      { key: 'live-results', title: 'Live results', text: 'Scores, schedules and standings are posted live on PlayMetrics.' },
    ],
  },
  {
    id: 'ruleSection-checkin',
    title: 'Check-in and Forfeits',
    rules: [
      { key: 'check-in-early', title: 'Check in early', text: 'Check in at the tournament desk at least 30 minutes before your first game.' },
      { key: 'be-ready', title: 'Be ready', text: 'Teams must be at their field when the previous game ends. Games start on time.' },
      { key: 'forfeits', title: 'Forfeits', text: 'A team not ready 5 minutes after its scheduled start forfeits. A forfeit counts as a 3-0 win for the opponent.' },
      { key: 'short-handed', title: 'Short-handed', text: 'A team may play with 2 players rather than forfeit.' },
    ],
  },
  {
    id: 'ruleSection-equipment',
    title: 'Equipment',
    rules: [
      { key: 'shin-guards', title: 'Shin guards', text: 'Required for every player in every game.' },
      { key: 'shoes', title: 'Shoes', text: 'Allowed shoes depend on the playing surface. Each event page lists the surface and the shoes allowed. Cleats are never allowed on gym floors.' },
      { key: 'pinnies', title: 'Pinnies', text: 'Every team is assigned pinnies at check-in and wears them for the entire tournament. This avoids color conflicts and keeps transitions between games quick and simple.' },
      { key: 'jewelry', title: 'Jewelry', text: 'No jewelry, watches or hard hair accessories.' },
      { key: 'balls', title: 'Balls', text: 'Game balls are provided by the tournament.' },
    ],
  },
  {
    id: 'ruleSection-conduct',
    title: 'Conduct',
    callout: {
      label: 'The Chaos Cup way:',
      text: 'creativity rewarded, bravery celebrated. Mistakes are part of the game. Encourage every player, on both teams.',
    },
    rules: [
      { key: 'referees-final', title: 'Referees are final', text: 'All referee decisions are final. Only the team captain may ask a referee a question, calmly and between plays.' },
      { key: 'zero-tolerance', title: 'Zero tolerance', text: 'Abuse of referees, players, staff or spectators is not tolerated. Players, coaches or spectators may be removed from the event.' },
      { key: 'sideline-behavior', title: 'Sideline behavior', text: 'Cheer loud, cheer positive. No coaching from inside the walls.' },
      { key: 'respect-venue', title: 'Respect the venue', text: 'We are guests of the host school. Leave every field and gym better than you found it.' },
    ],
  },
  {
    id: 'ruleSection-refunds',
    title: 'Refunds and Weather',
    rules: [
      { key: 'refunds', title: 'Refunds', text: '[YOUR REFUND POLICY]' },
      { key: 'indoor-events', title: 'Indoor events', text: 'Events are held indoors and run in any weather unless the venue closes.' },
      { key: 'schedule-changes', title: 'Schedule changes', text: 'The tournament director may adjust schedules or formats as needed. Updates are posted on PlayMetrics and Instagram @atomic_chaoscup.' },
    ],
  },
];

// Rule numbers as they are today, used only for the readable text inside a cross reference.
const ruleNumbers = new Map<string, string>();
ruleSections.forEach((s, si) => s.rules.forEach((r, ri) => ruleNumbers.set(r.key, `${si + 1}.${ri + 1}`)));

function ruleBody(ruleKey: string, text: string) {
  const children: any[] = [];
  const markDefs: any[] = [];
  text.split(/(\{\{[\w-]+\}\})/).forEach((part, i) => {
    if (!part) return;
    const target = part.match(/^\{\{([\w-]+)\}\}$/)?.[1];
    if (target) {
      const number = ruleNumbers.get(target);
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

async function ruleSectionDocs() {
  const seen = new Set<string>();
  const docs = [];
  for (const [index, section] of ruleSections.entries()) {
    docs.push({
    _id: section.id,
    _type: 'ruleSection',
    title: section.title,
    order: (index + 1) * 10,
    ...(section.image ? { image: await img(section.image.file, section.image.alt, { caption: section.image.caption }) } : {}),
    ...(section.callout ? { callout: section.callout } : {}),
    ...(section.button ? { button: section.button } : {}),
    rules: section.rules.map((rule) => {
      if (seen.has(rule.key)) throw new Error(`Duplicate rule key "${rule.key}".`);
      seen.add(rule.key);
      return { _key: rule.key, _type: 'rule', title: rule.title, body: ruleBody(rule.key, rule.text), diagram: rule.diagram ?? 'none' };
    }),
    ruleGroups: (section.groups ?? []).map((g) => ({
      _key: g.key,
      _type: 'ruleGroup',
      eyebrow: g.eyebrow,
      headline: g.headline,
      intro: g.intro,
      rules: g.rules.map((key) => {
        if (!section.rules.some((r) => r.key === key)) throw new Error(`Group "${g.key}" lists rule "${key}" from another section.`);
        return key;
      }),
      diagramSet: g.diagramSet,
    })),
    });
  }
  return docs;
}

// ---------- tournaments ----------

const checklist = (shoeLine: string) => [
  'Check in 30 minutes before your first game',
  'Shin guards required for every player',
  shoeLine,
  'Pick up your team pinnies at check-in. Wear them every game.',
  'Water bottle. Redmond Re-Lyte on site.',
  'Check PlayMetrics for live schedule and standings',
];

async function shoes(surface: 'hardwood' | 'turf') {
  const futsal = { name: 'Futsal flats', note: 'Flat indoor soccer shoes with gum rubber soles.', image: await img('futsal.webp', 'Futsal flat indoor soccer shoe') };
  const tennis = { name: 'Tennis shoes', note: 'Court or running shoes with flat soles.', image: await img('tennis.webp', 'Tennis shoe') };
  const cleat = await img('cleat2.webp', 'Soccer cleat');
  const list =
    surface === 'hardwood'
      ? [
          { _key: 'futsal', rating: 'best', ...futsal },
          { _key: 'tennis', rating: 'allowed', ...tennis },
          { _key: 'cleats', rating: 'notAllowed', name: 'Cleats of any kind', note: 'Molded, screw-in or turf studs. Not on hardwood.', image: cleat },
        ]
      : [
          { _key: 'cleats', rating: 'best', name: 'Cleats / turf shoes', note: 'Molded cleats or turf shoes give the best grip on the field house turf.', image: cleat },
          { _key: 'futsal', rating: 'allowed', ...futsal },
          { _key: 'tennis', rating: 'allowed', ...tennis },
        ];
  return list.map((s) => ({ _type: 'shoe', ...s }));
}

const eventDetails = (venueNote: string) => ({
  scheduleNote: 'Your team plays within one ~5-hour block. Times posted on PlayMetrics by [SCHEDULE RELEASE DATE].',
  venueNote,
  divisionsNote:
    'Boys, girls and coed divisions by birth year. Rosters of 3 to 6 players. To keep games even, teams may be moved, but you will never play a team more than 1 year apart from your selected division.',
  formatHeadline: '4 guaranteed games',
  formatText: 'Plus a chance at a 5th game for the championship. 12-minute running-clock games inside inflatable walled fields.',
});

const divisionsAndRoster = { divisions: 'U7 to U18', rosterSize: 'Rosters of 3 to 6 players' };
const holidayPricing = { regularPrice: 265, earlyBirdPrice: 238.5, bundleSavings: 50.35 };

async function tournamentDocs(videos: Record<string, string>) {
  const heroVideo = async () => ({
    ...(videos['hero.mp4'] ? { url: videos['hero.mp4'] } : {}),
    poster: await img('hero-poster.jpg', 'Players racing for the ball inside the inflatable walls'),
  });

  return [
    {
      _id: 'tournament-monster-mash',
      _type: 'tournament',
      title: 'Monster Mash',
      slug: { _type: 'slug', current: 'monster-mash' },
      seriesLabel: 'Holiday Series · Event 1 of 3',
      presentingSponsor: ref('sponsor-redmond-relyte'),
      logo: await img('logo-monstermash.webp', 'Redmond Re-Lyte Chaos Cup 3v3 Monster Mash logo'),
      primaryColor: '#F90EE7',
      heroImage: await img('mm-champs-1.jpg', 'Monster Mash champions holding the Chaos Cup belt'),
      cardImage: await img('mm-champs-1.jpg', 'Monster Mash champions holding the Chaos Cup belt'),
      startDate: '2026-10-17',
      endDate: '2026-10-17',
      statusOverride: 'auto',
      venue: { name: 'Salt Lake Academy West Campus', address: 'Herriman, UT' },
      ...divisionsAndRoster,
      links: {
        resultsUrl: 'https://playmetricssports.com/g/leagues/1327-2438-663366d5/league_view.html',
        smugmugGalleryUrl: 'https://chaoscupphotos.smugmug.com/Events/Monster-Mash',
      },
      recap: {
        coverImage: await img('mm-champs-1.jpg', 'Monster Mash champions holding the Chaos Cup belt'),
        championPhotos: [
          await imgItem('champs1', 'mm-champs-1.jpg', 'Monster Mash champions holding the Chaos Cup belt'),
          await imgItem('champs3', 'mm-champs-3.jpg', 'Players showing off their Chaos Cup rings'),
        ],
      },
    },
    {
      _id: 'tournament-turkey-takedown',
      _type: 'tournament',
      title: 'Turkey Takedown',
      slug: { _type: 'slug', current: 'turkey-takedown' },
      seriesLabel: 'Holiday Series · Event 2 of 3',
      presentingSponsor: ref('sponsor-redmond-relyte'),
      logo: await img('logo-turkey.webp', 'Turkey Takedown logo'),
      primaryColor: '#DF6902',
      accentColor: '#DB8943',
      heroVideo: await heroVideo(),
      cardImage: await img('action-7.jpg', 'Players battling for the ball in Redmond Re-Lyte pinnies'),
      startDate: '2026-11-20',
      endDate: '2026-11-21',
      statusOverride: 'auto',
      venue: {
        name: 'West Lake High School',
        address: '99 N 200 W, Saratoga Springs, UT',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=West+Lake+High+School+99+N+200+W+Saratoga+Springs+UT',
        parking: 'Park in [PARKING LOT] and follow the Chaos Cup signs to the check-in desk at [CHECK-IN LOCATION].',
      },
      surface: {
        type: 'hardwood',
        headline: 'Hardwood basketball court',
        areaName: 'West Lake HS Main + AUX Gyms',
        intro: "This event is on hardwood. Bring the right shoes or you can't play.",
        photo: await img('westlake-gym.jpg', 'West Lake High School main gym with hardwood basketball court'),
      },
      shoes: await shoes('hardwood'),
      ...divisionsAndRoster,
      pricing: {
        ...holidayPricing,
        earlyBirdDeadline: '2026-11-15',
        bundleNote: 'Add Frostbite Frenzy (Jan 8-9). Select Turkey Takedown, then choose the bundle at checkout.',
      },
      beneficiary: {
        schoolName: 'West Lake High School',
        programName: 'Girls Soccer Program',
        logo: await img('westlake-logo.webp', 'West Lake High School'),
        donateUrl: 'https://donate.stripe.com/28EaEXaVqbBjb1bgUj8Ra00',
      },
      eventDetails: eventDetails('Indoor Main + AUX Gyms on hardwood.'),
      checklist: checklist('Futsal flats or tennis shoes only. No cleats on the hardwood.'),
      photoStrip: [
        await imgItem('strip1', 'action-2.jpg', 'Player dribbling along the line'),
        await imgItem('strip2', 'action-8.jpg', 'Young player chasing down the ball'),
        {
          _key: 'strip3',
          _type: 'stripVideo',
          title: 'Champions showing off their rings',
          ...(videos['reel-rings.mp4'] ? { videoUrl: videos['reel-rings.mp4'] } : {}),
          poster: await img('reel-rings.jpg', 'Champions showing off their rings'),
        },
        await imgItem('strip4', 'action-9.jpg', 'Teammates working the ball together'),
      ],
    },
    {
      _id: 'tournament-frostbite-frenzy',
      _type: 'tournament',
      title: 'Frostbite Frenzy',
      slug: { _type: 'slug', current: 'frostbite-frenzy' },
      seriesLabel: 'Holiday Series · Event 3 of 3',
      presentingSponsor: ref('sponsor-redmond-relyte'),
      logo: await img('logo-frostbite.webp', 'Frostbite Frenzy logo'),
      primaryColor: '#3CA8E4',
      accentColor: '#7CC4EC',
      heroVideo: await heroVideo(),
      cardImage: await img('action-5.jpg', 'Defender squaring up an attacker'),
      startDate: '2027-01-08',
      endDate: '2027-01-09',
      statusOverride: 'auto',
      venue: {
        name: 'Brighton High School',
        address: '2220 Bengal Blvd, Cottonwood Heights, UT',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Brighton+High+School+2220+Bengal+Blvd+Cottonwood+Heights+UT',
        parking: 'Park in [PARKING LOT] and follow the Chaos Cup signs to the check-in desk at [CHECK-IN LOCATION].',
      },
      surface: {
        type: 'turf',
        headline: 'Indoor artificial turf',
        areaName: 'Brighton HS Indoor Field House',
        intro: 'This event is on indoor turf, so every shoe type below is allowed.',
        photo: await img('brighton-fieldhouse.jpg', 'Brighton High School indoor field house with artificial turf'),
      },
      shoes: await shoes('turf'),
      ...divisionsAndRoster,
      pricing: {
        ...holidayPricing,
        earlyBirdDeadline: '2026-12-27',
        bundleNote: 'Playing Turkey Takedown too (Nov 20-21)? Select Turkey Takedown first, then choose the bundle at checkout.',
      },
      beneficiary: {
        schoolName: 'Brighton High School',
        programName: 'Girls Soccer Program',
        logo: await img('brighton-logo.webp', 'Brighton High School'),
        donateUrl: 'https://donate.stripe.com/6oU3cvaVqbBjedn0Vl8Ra01',
      },
      eventDetails: eventDetails('Indoor Field House on artificial turf.'),
      checklist: checklist('Cleats, turf shoes, futsal flats or tennis shoes. All are allowed on the turf.'),
      photoStrip: [
        await imgItem('strip1', 'action-2.jpg', 'Player dribbling along the line'),
        await imgItem('strip2', 'action-8.jpg', 'Young player chasing down the ball'),
        {
          _key: 'strip3',
          _type: 'stripVideo',
          title: 'Champions showing off their rings',
          ...(videos['reel-rings.mp4'] ? { videoUrl: videos['reel-rings.mp4'] } : {}),
          poster: await img('reel-rings.jpg', 'Champions showing off their rings'),
        },
        await imgItem('strip4', 'action-9.jpg', 'Teammates working the ball together'),
      ],
    },
  ];
}

// ---------- sponsors ----------

// Contract dates are not in the designs. These cover the Holiday Series plus
// time for recap content. Confirm them in the Studio.
const SERIES_CONTRACT = { contractStart: '2026-09-01', contractEnd: '2027-03-31' };

async function sponsorDocs() {
  const secondary = [
    { id: 'keybank', name: 'KeyBank', url: 'https://www.key.com/personal/index.html', file: 'keybank.webp', tile: 'light' },
    { id: 'one-stop-insurance', name: 'One Stop Insurance', url: 'https://onestopinsurance.com/', file: 'onestop.webp', tile: 'light' },
    { id: 'klingler', name: 'Klingler & Associates', alt: 'Klingler and Associates', url: 'https://klinglercpa.com/', file: 'klingler.webp', tile: 'light' },
    { id: 'jc-laker', name: 'JC Laker Jewelry', alt: 'JC Laker Jewelry, Inc.', url: 'https://jclaker.jewelershowcase.com/', file: 'jclaker.webp', tile: 'light' },
    { id: 'd1-training', name: 'D1 Training', url: 'https://d1training.com/', file: 'd1.webp', tile: 'dark' },
    { id: 'mac-d33p', name: 'MAC d33p', file: 'macd33p.webp', tile: 'dark' },
    { id: 'pro-gjdj', name: 'Pro GJDJ', url: 'https://www.progjdj.com/', file: 'gjdj.webp', tile: 'dark' },
  ];

  const smugmugLogo = await img('smugmug-black.webp', 'SmugMug');

  return [
    {
      _id: 'sponsor-redmond-relyte',
      _type: 'sponsor',
      name: 'Redmond Re-Lyte',
      tier: 'primary',
      order: 1,
      designation: 'Title sponsor',
      url: RELYTE_URL,
      linkEnabled: true,
      tournaments: [{ _key: 'turkey', ...ref('tournament-turkey-takedown') }],
      logoOnDark: await img('relyte-white.webp', 'Redmond Re-Lyte'),
      tileStyle: 'dark',
      ...SERIES_CONTRACT,
      banner: {
        eyebrow: 'Title sponsor of the Chaos Cup',
        headline: 'Hydrate like a champion.',
        body: 'Redmond Re-Lyte keeps players going from the first whistle to the championship game.',
        image: await img('relyte-kids.jpg', 'Redmond Re-Lyte Kids: pediatrician-approved, no added sugar, no artificial dyes, made with Real Salt'),
        buttonLabel: 'Shop Redmond Re-Lyte',
        backgroundColor: '#009CC7', // Redmond's official blue
        textColor: 'light',
      },
    },
    {
      _id: 'sponsor-smugmug',
      _type: 'sponsor',
      name: 'SmugMug',
      tier: 'primary',
      order: 2,
      // The contract requires exactly this wording.
      designation: 'Official Photo Sharing Partner',
      url: SMUGMUG_OFFER_URL,
      linkEnabled: true,
      // Only the black logo was provided, so it sits on a light tile. Never recolor it.
      logoOnDark: smugmugLogo,
      logoOnLight: smugmugLogo,
      tileStyle: 'light',
      ...SERIES_CONTRACT,
      banner: {
        eyebrow: 'Official Photo Sharing Partner of the Chaos Cup Series',
        headline: 'Save *25%* on your family photo site.',
        body: 'Parents, save 25% on SmugMug and build a private album and website for all your family memories, from tournament day to the holidays.',
        qrCode: await img('smugmug-qr.png', 'QR code for 25% off SmugMug with code Chaos2026'),
        qrLabel: 'Scan with your phone',
        accentColor: '#4E8F00',
        buttonLabel: 'Claim 25% Off on SmugMug',
        backgroundColor: '#F2FAE8',
        textColor: 'dark',
        promoCode: 'Chaos2026',
        finePrint: "Offer for adults 18+. Subject to the terms on SmugMug's offer page.",
        stripText:
          'Event photos land on SmugMug, our Official Photo Sharing Partner. Parents save 25% with code Chaos2026 (adults 18+, offer terms apply).',
        stripButtonLabel: 'Claim 25% Off',
        galleryOfferText: 'Parents: save 25% on your own family site with code Chaos2026',
      },
    },
    ...(await Promise.all(
      secondary.map(async (s, i) => ({
        _id: `sponsor-${s.id}`,
        _type: 'sponsor',
        name: s.name,
        tier: 'secondary',
        order: i + 1,
        ...(s.url ? { url: s.url, linkEnabled: true } : { linkEnabled: false }),
        logoOnDark: await img(s.file, s.alt ?? s.name),
        tileStyle: s.tile,
        ...SERIES_CONTRACT,
      })),
    )),
  ];
}

// ---------- singletons ----------

async function siteSettingsDoc() {
  const sponsorshipPdf = await uploadSponsorshipPdf();
  return {
    _id: 'siteSettings',
    _type: 'siteSettings',
    logo: await img('logo-main.webp', 'Chaos Cup 3v3 Experience'),
    tagline: 'Where freedom to play changes everything. A 3v3 series by Atomic Athletics.',
    ...(sponsorshipPdf ? { sponsorshipPdf } : {}),
    navLinks: [
      internal('tournaments', 'Tournaments', '/#tournaments'),
      internal('why', 'Why 3v3', '/why-3v3'),
      internal('rules', 'Rules', '/rules'),
      internal('past', 'Past Events', '/past-events'),
      internal('photos', 'Photos', '/#photos'),
      internal('sponsors', 'Sponsors', '/#sponsors'),
      internal('involved', 'Get Involved', '/get-involved'),
    ],
    registerLabel: 'Register a Team',
    registerUrl: REGISTER_URL,
    individualSignupUrl: SOLO_URL,
    announcement: { enabled: true, mode: 'auto' },
    comingSoon: {
      headline: 'Stay tuned',
      text: 'The next Chaos Cup is coming soon.',
      image: await img('aerial.jpg', 'Aerial view of eight inflatable pitches on a stadium field'),
    },
    footerColumns: [
      {
        _key: 'play',
        _type: 'footerColumn',
        heading: 'Play',
        links: [
          internal('upcoming', 'Upcoming Tournaments', '/#tournaments'),
          internal('rulebook', 'Rulebook', '/rules'),
          internal('past', 'Past Tournaments', '/past-events'),
        ],
      },
      {
        _key: 'partner',
        _type: 'footerColumn',
        heading: 'Partner',
        links: [
          internal('host', 'Host a Chaos Cup', '/get-involved#schools'),
          external('packages', 'Sponsorship Packages', SPONSORSHIP_PDF_URL),
          internal('contact', 'Contact Us', '/contact'),
        ],
      },
      {
        _key: 'follow',
        _type: 'footerColumn',
        heading: 'Follow',
        links: [
          external('instagram', 'Instagram @atomic_chaoscup', INSTAGRAM_URL),
          external('smugmug', 'Photos on SmugMug, our Official Photo Sharing Partner', SMUGMUG_OFFER_URL),
        ],
      },
    ],
    instagramUrl: INSTAGRAM_URL,
    contactEmail: CONTACT_EMAIL,
    seoTitle: 'Chaos Cup 3v3 | Youth soccer inside inflatable walled fields',
    seoDescription:
      'Fast 3v3 soccer inside inflatable walled fields. More touches, more goals, nonstop energy. Ages U7 to U18, and every event funds a local high school program.',
    seoImage: await img('aerial.jpg', 'Aerial view of eight inflatable pitches on a stadium field'),
  };
}

async function homePageDoc(videos: Record<string, string>) {
  const reel = async (key: string, title: string, file: string, alt: string) => ({
    _key: key,
    _type: 'reel',
    title,
    ...(videos[`${file}.mp4`] ? { videoUrl: videos[`${file}.mp4`] } : {}),
    poster: await img(`${file}.jpg`, alt),
  });

  return {
    _id: 'homePage',
    _type: 'homePage',
    heroText: 'Fast 3v3 soccer inside inflatable walled fields. More touches, more goals, nonstop energy. Ages U7 to U18.',
    quickFacts: keyed('fact', [
      { _type: 'quickFact', value: 'U7-U18', label: 'Boys and girls divisions' },
      { _type: 'quickFact', value: '3-6', label: 'Players per roster' },
      { _type: 'quickFact', value: '4 Games', label: 'Guaranteed, plus a title game' },
      { _type: 'quickFact', value: '12 Min', label: 'Running-clock games' },
      { _type: 'quickFact', value: '~5 Hrs', label: "Your team's play window" },
    ]),
    whatIs: {
      eyebrow: 'What is the Chaos Cup?',
      headline: 'A soccer playground, not a pressure cooker.',
      body: 'Every game is played inside inflatable walled fields. The ball never goes out, so players get more touches, make faster decisions and have way more fun. Our mission: put the game back in the hands of the players.',
      points: [
        'Creativity rewarded. Bravery celebrated.',
        'More touches. More freedom. More confidence.',
        'Music, energy and nonstop 3v3 action.',
        'Every event funds a local high school program.',
      ],
      photos: [
        await imgItem('wall', 'action-6.jpg', 'Players racing for the ball along the inflatable wall'),
        await imgItem('rings', 'mm-champs-3.jpg', 'Players showing off their Chaos Cup rings'),
        await imgItem('aerial', 'aerial.jpg', 'Aerial view of eight inflatable pitches on a stadium field'),
      ],
    },
    reels: {
      eyebrow: 'Watch the chaos',
      headline: 'This is what game day feels like',
      instagramLabel: 'More on Instagram',
      videos: [
        await reel('girls-play', 'Girls division game inside the inflatable walls', 'reel-girls-play', 'Girls division game inside the inflatable walls'),
        await reel('girls-play-3', 'Girls division highlights', 'reel-girls-play-3', 'Girls division highlights'),
        await reel('360', '360 view of a Chaos Cup game', 'reel-360', '360 view of a Chaos Cup game'),
        await reel('rings', 'Champions showing off their Chaos Cup rings', 'reel-rings', 'Champions showing off their Chaos Cup rings'),
      ],
    },
    upcoming: {
      eyebrow: 'Holiday Series 2026-27',
      headline: 'Upcoming Tournaments',
      intro: "Every Chaos Cup raises money for the host school's girls soccer program. Register to play, or donate even if you can't make it.",
    },
    bundle: {
      headline: 'Play both. Save $50.35.',
      text: 'Stack the early bird price with the 2-event bundle. Select Turkey Takedown, then choose the bundle at checkout.',
      buttonLabel: 'Get the Bundle',
    },
    rulesSection: {
      eyebrow: 'Rules in 60 seconds',
      headline: 'How the game works',
      buttonLabel: 'Read the Full Rulebook',
      tiles: keyed('tile', [
        {
          _type: 'ruleTile',
          title: '3v3, stay out of the Goal Zone',
          text: 'Three players per side, rosters of 3 to 6. Nobody plays inside the Goal Zone in front of each goal.',
          linkLabel: 'See how it works',
          linkPath: '/rules#rule-goal-zone',
        },
        { _type: 'ruleTile', title: 'The walls are in play', text: 'Bank it, pass it, use it. If the ball leaves the field, the other team restarts with a kick-in.' },
        { _type: 'ruleTile', title: '12-minute running clock', text: 'One 12-minute game on a single clock shared by every field. It never stops.' },
        {
          _type: 'ruleTile',
          title: 'No slide tackles. Watch your fouls.',
          text: "Stay on your feet and keep it clean on the walls: no pushing or stalling against them. A team's 3rd foul gives the other team an uncontested free kick from half. No heading for U11 and younger.",
        },
        { _type: 'ruleTile', title: '4 games guaranteed', text: 'Plus a shot at a 5th game for the championship. Win 3 points, tie 1, loss 0. Standings and schedules update live on PlayMetrics.' },
        { _type: 'ruleTile', title: 'Check in 30 min early', text: 'Bring shin guards. Shoe rules depend on the playing surface, so check your event page before you pack.' },
      ]),
    },
    past: { eyebrow: 'The archive', headline: 'Past Tournaments' },
    finalCta: {
      // The eyebrow in the design ("Nov 20-21 · West Lake High School") comes from the next tournament.
      headline: 'Bring the *chaos.*',
      text: 'Grab two to five teammates, pick your division and lock in the early bird price through Nov 15.',
      primaryLabel: 'Register Your Team',
      secondaryLabel: 'Register as an Individual',
    },
  };
}

async function rulebookPageDoc() {
  return {
    _id: 'rulebookPage',
    _type: 'rulebookPage',
    eyebrow: 'Official rules · Holiday Series 2026-27',
    title: 'Chaos Cup Rulebook',
    intro: 'Short version: play hard, play fair, have fun. The details below cover everything from rosters to tiebreakers so every team plays by the same rules.',
    // The design links the PDF to [RULEBOOK PDF LINK]. Upload it in the Studio when it exists.
    video: { url: 'https://youtu.be/Qf3iqOOS_yA', title: 'Chaos Cup rules in 2 minutes', duration: '2 min' },
  };
}

function pastEventsPageDoc() {
  return {
    _id: 'pastEventsPage',
    _type: 'pastEventsPage',
    title: 'Past Events',
    intro: 'Photos and results from every Chaos Cup.',
    seo: {
      _type: 'seo',
      description: 'Photos, SmugMug galleries and final results from every Chaos Cup 3v3 youth soccer tournament in Utah.',
    },
  };
}

function contactPageDoc() {
  const topic = (key: string, title: string, text: string, linkLabel: string, linkPath: string) => ({
    _key: key,
    _type: 'contactTopic',
    title,
    text,
    linkLabel,
    linkPath,
  });
  return {
    _id: 'contactPage',
    _type: 'contactPage',
    eyebrow: 'Contact',
    headline: "Let's *talk.*",
    intro: 'Questions about a tournament, hosting a Chaos Cup at your school or sponsoring a program? Send us an email and we will get back to you.',
    topics: [
      topic('register', 'Registration and teams', 'Register a team or sign up solo on PlayMetrics. Schedules and standings live there too.', 'See tournaments', '/#tournaments'),
      topic('host', 'Host a Chaos Cup', 'High school programs can bring a Chaos Cup to their school to fund their season.', 'How hosting works', '/get-involved#schools'),
      topic('sponsor', 'Sponsor a school', 'Put your business in front of local families while supporting a high school program.', 'Sponsorship options', '/get-involved#sponsors-path'),
      topic('rules', 'Rules and game day', 'Shoes, check-in, the Goal Zone and everything else about how the games work.', 'Read the rulebook', '/rules'),
    ],
  };
}

async function getInvolvedPageDoc() {
  const step = (key: string, title: string, text: string) => ({ _key: key, _type: 'step', title, text });
  return {
    _id: 'getInvolvedPage',
    _type: 'getInvolvedPage',
    seo: {
      _type: 'seo',
      description: 'Host a Chaos Cup at your high school or sponsor a program. Every 3v3 event funds student-athletes and brings local families together.',
    },
    hero: {
      eyebrow: 'Get involved',
      headline: 'Build the future of *local athletics.*',
      text: 'The Chaos Cup brings local businesses, high school programs and the community together. Every event directly funds student-athletes and builds something that lasts.',
      image: await img('aerial.jpg', 'Aerial view of eight inflatable pitches on a stadium field'),
    },
    video: {
      eyebrow: 'How it works',
      headline: 'See how a Chaos Cup comes together',
      text: 'A quick look at how a school, its sponsors and the Chaos Cup team turn one event into money for the season.',
    },
    schools: {
      eyebrow: 'For school programs',
      headline: 'Join the Chaos Cup circuit',
      text: 'Looking for a turnkey fundraiser? You bring the venue and the players. We handle the rest, so your program can fund its season and rally its community.',
      schoolProvides: ['A venue for the event', 'Your players, families and community'],
      weProvide: ['Event logistics and coordination', 'Registration and team placement', 'Administration, from schedules to standings', 'Everything else on game day'],
      buttonLabel: 'Host a Chaos Cup',
      buttonUrl: '/contact',
      image: await img('mm-champs-3.jpg', 'Players showing off their Chaos Cup rings'),
    },
    partners: {
      eyebrow: 'For community partners',
      headline: 'Sponsor a school, build your brand',
      text: 'Connect your business with the families who already support it, and put your brand in front of thousands of active community members.',
      steps: [
        step('school', 'Pick a school', 'Choose the high school program you want to support.'),
        step('tier', 'Choose your impact', 'Select the sponsorship tier that fits your goals.'),
        step('reach', 'Reach local families', 'Get your brand in front of thousands of active community members.'),
      ],
      buttonLabel: 'See Sponsorship Packages',
      image: await img('dev6.jpg', 'Two players racing along the wall for the ball'),
    },
    cta: {
      headline: 'Ready to *get involved?*',
      text: 'Tell us about your school or business and we will help you find the right fit.',
      buttonLabel: 'Contact Us',
      buttonUrl: '/contact',
    },
  };
}

async function developmentPageDoc() {
  const card = (icon: string, title: string, text: string) => ({ _type: 'benefitCard', icon, title, text });
  const row = (label: string, value: number, highlight = false) => ({ _type: 'chartRow', label, value, highlight });

  return {
    _id: 'developmentPage',
    _type: 'developmentPage',
    hero: {
      eyebrow: 'Why 3v3 works',
      headline: 'Small field. *Big development.*',
      text: '3v3 inside inflatable walls gives every player more touches, more decisions and more goals than a full-field game, and it keeps soccer fun.',
      image: await img('dev3.jpg', 'Players in blue and red Re-Lyte pinnies battling for the ball inside the inflatable walls'),
    },
    benefits: {
      eyebrow: 'Player development',
      headline: 'What players get from 3v3',
      intro: 'Fewer players on a smaller field means every player is in the game all the time. Here is what that builds.',
      cards: keyed('card', [
        card('touches', 'More touches', 'With only three players a side and no keeper, the ball finds every player again and again. More touches means more practice of first touch, dribbling, passing and shooting in every minute played.'),
        card('decisions', 'Quick decision making', 'Defenders are always close and space closes fast. Players have to scan, decide and act in a second, game after game. That speed of thought carries straight into the big field.'),
        card('freedom', 'Freedom to try new moves', 'Mistakes are cheap and the next chance is seconds away. Players can try the step-over, the nutmeg or the fake shot without worrying about losing the game on one play.'),
        card('scoring', 'More chances to score', 'Short fields and small numbers mean shots and goals happen constantly. Every player gets to feel what it is like to finish, not just the strikers.'),
        card('oneVOne', 'More 1v1 battles', 'There is nowhere to hide in 3v3. Players attack and defend one against one over and over, which builds the courage and technique to beat a defender.'),
        card('teammates', 'Connecting with teammates', 'With two teammates, every pass matters. Players learn give-and-go, support angles and talking to each other because the team does not work without it.'),
        card('attackDefend', 'Attack and defend every play', 'No one stands at the back waiting. Every player switches between attacking and defending in an instant, learning the whole game instead of one position.'),
        card('moving', 'Always moving', 'The inflatable walls keep the ball in play. Less time chasing balls out of bounds means more running, more effort and more fitness without it feeling like a workout.'),
      ]),
      photos: [
        await imgItem('dev1', 'dev1.jpg', 'Three smiling players in Redmond Re-Lyte pinnies leaning on the inflatable wall'),
        await imgItem('dev2', 'dev2.jpg', 'Player dribbling toward the inflatable wall'),
        await imgItem('dev6', 'dev6.jpg', 'Two players racing along the wall for the ball'),
      ],
    },
    research: {
      eyebrow: 'The research',
      headline: 'Smaller games, way more action',
      intro: 'Research on youth players shows the same pattern every time: the smaller the game, the more every player gets involved. 3v3 is the smallest of them all.',
      charts: keyed('chart', [
        {
          _type: 'chart',
          title: 'Goals per game',
          subtitle: 'Average total goals, both teams combined',
          rows: keyed('row', [row('Chaos Cup 3v3', 12.3, true), row('11v11', 5)]),
          note: 'Chaos Cup games are just 12 minutes. The 11v11 youth figure is for a full-length game.',
        },
        {
          _type: 'chart',
          title: 'How many goals in a Chaos Cup game?',
          subtitle: 'Share of 71 games by total goals scored',
          unit: '%',
          rows: keyed('row', [row('15 to 21', 23), row('10 to 14', 61, true), row('5 to 9', 17)]),
          note: '83% of games had 10 or more goals. Every game had at least 5.',
        },
        {
          _type: 'chart',
          title: 'Touches per player',
          subtitle: 'Average touches for each player in one game',
          rows: keyed('row', [row('Small-sided*', 115, true), row('7v7', 55), row('11v11', 22)]),
          note: 'About 5x the touches of a full-field game',
        },
        {
          _type: 'chart',
          title: '1v1 attempts per game',
          subtitle: 'Times a player took on a defender',
          unit: 'x',
          rows: keyed('row', [row('Small-sided*', 113, true), row('7v7', 79), row('11v11', 50)]),
          note: 'More than 2x the 1v1 battles',
        },
      ]),
      statBoxes: keyed('stat', [
        { _type: 'statBox', value: '4x', label: 'less time with the ball out of play', text: '3.2 minutes in small-sided games vs 13.1 in 11v11. With inflatable walls, 3v3 loses even less.' },
        { _type: 'statBox', value: '0', label: 'players waiting in goal', text: 'No keepers in 3v3, so all six players are in the action every second.' },
        {
          _type: 'statBox',
          value: '~170',
          label: 'touches in a Chaos Cup day',
          text: 'Our estimate for 5 games of 12 minutes at the measured small-sided rate of about 2.9 touches a minute, compared with about 45 at the 11v11 rate. With only 3 per side, real 3v3 numbers are likely higher.',
        },
      ]),
      sources:
        'Chaos Cup goals: our own tally of 71 Chaos Cup 3v3 games (873 goals) from PlayMetrics results. 11v11 goals, touches, 1v1s and time out of play*: Scottish Football Association research (Small, 2006), which measured 4v4 as its smallest game. 3v3 puts even fewer players around the ball. The Chaos Cup day estimate is our own calculation from these rates.',
    },
    comparison: {
      eyebrow: 'Side by side',
      headline: 'Chaos Cup 3v3 vs a full-field game',
      columnA: 'Chaos Cup 3v3',
      columnB: '11v11',
      rows: keyed('cmp', [
        { _type: 'comparisonRow', label: 'Players on the field', a: '6 (3 per side)', b: '22 (11 per side)' },
        { _type: 'comparisonRow', label: 'Goalkeeper', a: 'None. Everyone plays the field.', b: 'One per team, often out of the action' },
        { _type: 'comparisonRow', label: 'Ball out of play', a: 'Rarely. The walls keep it live.', b: 'Often. Throw-ins, goal kicks and corners' },
        { _type: 'comparisonRow', label: 'Positions', a: 'Everyone attacks and defends', b: 'Many players stay in one zone' },
        { _type: 'comparisonRow', label: 'Touches per player', a: 'Constant', b: 'Few, and some players go minutes without one' },
        { _type: 'comparisonRow', label: 'Decisions per minute', a: 'Many, under real pressure', b: 'Fewer, with more time standing' },
        { _type: 'comparisonRow', label: 'Chances to score', a: 'Every player, many times a game', b: 'Mostly forwards' },
        { _type: 'comparisonRow', label: 'Mistakes', a: 'Quickly forgotten, next chance is seconds away', b: 'Can feel costly and stick with a player' },
      ]),
    },
    lifelong: {
      eyebrow: 'The experience',
      headline: 'Building happy, lifelong players',
      intro: 'Skills matter, but so does how the game makes a player feel. The Chaos Cup is built so kids leave wanting to play again.',
      points: keyed('point', [
        { _type: 'point', title: 'Confidence that comes from doing', text: 'Players do not build confidence from being told they are good. They build it by touching the ball, beating a defender and scoring, over and over. 3v3 gives them that repetition in every game.' },
        { _type: 'point', title: 'A safe place to make mistakes', text: 'When the next chance is seconds away, a bad touch is just part of the game. Kids learn that mistakes are how you get better, not something to fear.' },
        { _type: 'point', title: 'Everyone matters', text: 'With three on a team, every player is needed every play. No one is stuck on the bench or parked on the wing. Feeling needed is one of the strongest reasons kids keep playing.' },
        { _type: 'point', title: 'Ownership and leadership', text: 'Fewer adults directing every move means players solve problems themselves. They talk, decide and lead, like picking who takes the 1v1 golden goal in a tied championship.' },
        { _type: 'point', title: 'Joy first', text: 'Music, nonstop action and lots of goals make the Chaos Cup fun. Kids who love the game keep playing it, and kids who keep playing keep improving.' },
      ]),
      photos: [
        await imgItem('dev5', 'dev5.jpg', 'Player in a green pinnie ready to defend'),
        await imgItem('dev7', 'dev7.jpg', 'Young player jumping with excitement on the court'),
        await imgItem('dev4', 'dev4.jpg', 'Players closing in on the ball along the wall'),
      ],
    },
    cta: {
      headline: 'More touches. More fun. *More soccer.*',
      text: 'Give your player a day full of touches, goals and decisions they will remember.',
    },
  };
}

// ---------- run ----------

async function main() {
  const { projectId, dataset } = client.config();
  console.log(`Seeding ${projectId}/${dataset}`);

  console.log('Videos');
  const videos = await uploadVideos(['hero.mp4', 'reel-girls-play.mp4', 'reel-girls-play-3.mp4', 'reel-360.mp4', 'reel-rings.mp4']);

  console.log('Images and documents');
  const docs = [
    await siteSettingsDoc(),
    await homePageDoc(videos),
    await rulebookPageDoc(),
    await developmentPageDoc(),
    await getInvolvedPageDoc(),
    contactPageDoc(),
    pastEventsPageDoc(),
    ...(await sponsorDocs()),
    ...(await tournamentDocs(videos)),
    ...(await ruleSectionDocs()),
  ];

  // Drafts of these documents would hide the seeded version in the Studio, so clear them.
  const tx = client.transaction();
  for (const doc of docs) {
    tx.createOrReplace(doc as any);
    tx.delete(`drafts.${doc._id}`);
  }
  await tx.commit({ visibility: 'sync' });

  const byType = docs.reduce<Record<string, number>>((acc, d) => ({ ...acc, [d._type]: (acc[d._type] ?? 0) + 1 }), {});
  console.log(`Done. ${docs.length} documents, ${imageCache.size} images:`, byType);
  console.log(`Images used: ${[...imageCache.keys()].map((f) => basename(f)).join(', ')}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
