/**
 * The No goal blocking rule (rules 4.4 to 4.6), which replaced the Goal Zone.
 * Shared by seed.ts (fresh datasets) and migrate-goal-blocking.ts (the live dataset),
 * so both always write the same content. {{key}} becomes a cross reference to that rule.
 */

export const PLAY_SECTION_ID = 'ruleSection-play';
export const PLAY_SECTION_TITLE = 'Play, Restarts and Goal Blocking';

/** Rule keys the Goal Zone used. The migration swaps these out. */
export const OLD_RULE_KEYS = ['goal-zone', 'nobody-in-zone', 'zone-violations'];
export const OLD_GROUP_KEY = 'goal-zone-group';

export const goalBlockingRules = [
  {
    key: 'no-goal-blocking',
    title: 'No goal blocking',
    text: 'There are no goalkeepers, and no player may act as one. A player may not stand directly in front of the goal with the main purpose of blocking it. Defending near the goal is allowed: marking an attacker, tracking a runner, or blocking a shot while playing the ball. Parking in front of the goal and waiting there is not.',
  },
  {
    key: 'referees-call',
    title: "Referee's call",
    text: 'Goal blocking is called at the referee\'s discretion, based on one question: is this player there to play the ball or an opponent, or only to block the goal? As a guide, a player who stays directly in front of the goal for more than 3 seconds without playing the ball or marking an opponent is goal blocking.',
  },
  {
    key: 'goal-blocking-enforcement',
    title: 'Enforcement',
    text: 'The first time, the referee warns the player ("Off the goal!") and play continues. If the player does not move, or the team does it again after a warning, the referee stops play. The other team gets an indirect free kick from the halfway mark ({{free-kicks}}), and it counts as a team foul under the 3-foul rule ({{three-foul-rule}}). Referee decisions on goal blocking are final.',
  },
];

export const goalBlockingGroup = {
  key: 'goalblocking',
  eyebrow: 'No goal blocking',
  headline: 'Defend the player, not the goal.',
  intro:
    'There are no goalkeepers, and no one may act as one. Defending near your goal is good soccer. Parking in front of it just to block shots is not. Refs ask one question: *is this player there to play the ball or an opponent, or only to block the goal?*',
  rules: goalBlockingRules.map((r) => r.key),
  diagramSet: 'goalBlocking',
};

/** Home page "Rules in 60 seconds", card 01. */
export const homeRuleTile = {
  title: '3v3, no goal blocking',
  text: 'Three players per side, rosters of 3 to 6. No goalkeepers, and no parking in front of the goal to block it. Defend the player, not the goal.',
  linkLabel: "See how it's called",
  linkPath: '/rules#goalblocking',
};

/** Contact page, "Rules and game day" quick answer. */
export const contactRulesText = 'Shoes, check-in, goal blocking and everything else about how the games work.';
