import type { Template } from 'sanity';

// Starting content for new tournaments, copied from the approved designs.
const checklist = (shoeLine: string) => [
  'Check in 30 minutes before your first game',
  'Shin guards required for every player',
  shoeLine,
  'Pick up your team pinnies at check-in. Wear them every game.',
  'Water bottle',
  'Check PlayMetrics for live schedule and standings',
];

const eventDetails = (venueNote: string) => ({
  scheduleNote: 'Your team plays within one ~5-hour block. Times posted on PlayMetrics by [SCHEDULE RELEASE DATE].',
  venueNote,
  divisionsNote:
    'Boys, girls and coed divisions by birth year. Rosters of 3 to 6 players. To keep games even, teams may be moved, but you will never play a team more than 1 year apart from your selected division.',
  formatHeadline: '4 guaranteed games',
  formatText: 'Plus a chance at a 5th game for the championship. 12-minute running-clock games inside inflatable walled fields.',
});

const shared = {
  statusOverride: 'auto',
  divisions: 'U7 to U18',
  rosterSize: 'Rosters of 3 to 6 players',
};

const hardwood = {
  ...shared,
  surface: { type: 'hardwood', headline: 'Hardwood basketball court' },
  shoes: [
    { _key: 'futsal', _type: 'shoe', name: 'Futsal flats', rating: 'best', note: 'Flat indoor soccer shoes with gum rubber soles.' },
    { _key: 'tennis', _type: 'shoe', name: 'Tennis shoes', rating: 'allowed', note: 'Court or running shoes with flat soles.' },
    { _key: 'cleats', _type: 'shoe', name: 'Cleats of any kind', rating: 'notAllowed', note: 'Molded, screw-in or turf studs. Not on hardwood.' },
  ],
  eventDetails: eventDetails('Indoor gyms on hardwood.'),
  checklist: checklist('Futsal flats or tennis shoes only. No cleats on the hardwood.'),
};

const turf = {
  ...shared,
  surface: { type: 'turf', headline: 'Indoor artificial turf' },
  shoes: [
    { _key: 'cleats', _type: 'shoe', name: 'Cleats / turf shoes', rating: 'best', note: 'Molded cleats or turf shoes give the best grip on the turf.' },
    { _key: 'futsal', _type: 'shoe', name: 'Futsal flats', rating: 'allowed', note: 'Flat indoor soccer shoes with gum rubber soles.' },
    { _key: 'tennis', _type: 'shoe', name: 'Tennis shoes', rating: 'allowed', note: 'Court or running shoes with flat soles.' },
  ],
  eventDetails: eventDetails('Indoor field house on artificial turf.'),
  checklist: checklist('Cleats, turf shoes, futsal flats or tennis shoes. All are allowed on the turf.'),
};

export const templates = (previous: Template[]): Template[] => [
  // Drop the blank tournament and sponsor templates in favor of the ones below.
  ...previous.filter((t) => t.id !== 'tournament' && t.id !== 'sponsor'),
  { id: 'tournament-hardwood', title: 'Tournament on hardwood', schemaType: 'tournament', value: hardwood },
  { id: 'tournament-turf', title: 'Tournament on turf', schemaType: 'tournament', value: turf },
  { id: 'sponsor-primary', title: 'Primary sponsor', schemaType: 'sponsor', value: { tier: 'primary', linkEnabled: true, order: 10 } },
  { id: 'sponsor-secondary', title: 'Secondary sponsor', schemaType: 'sponsor', value: { tier: 'secondary', linkEnabled: true, order: 10, tileStyle: 'dark' } },
];
