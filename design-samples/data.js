// Sample data for the design prototype. Nothing here touches Supabase.
const TODAY = new Date('2026-11-01T12:00:00');

const PLAYER = { name: 'Max Crowe', pdga: 97579, rating: 952, ratingDelta: 6 };

const HOME = { name: 'Home', city: 'Lansing, MI', lat: 42.7325, lng: -84.5555 };

const COURSES = [
  { id: 'c1', name: 'Hawk Island Park', city: 'Lansing, MI', lat: 42.7046, lng: -84.5352, terrain: 'water', holes: 18, par: 57, length: '5,410 ft' },
  { id: 'c2', name: 'Burchfield Park', city: 'Holt, MI', lat: 42.6175, lng: -84.5960, terrain: 'wooded', holes: 18, par: 62, length: '7,120 ft' },
  { id: 'c3', name: 'Grand Woods Park', city: 'Lansing, MI', lat: 42.7189, lng: -84.6416, terrain: 'mixed', holes: 18, par: 58, length: '5,980 ft' },
  { id: 'c4', name: 'Kensington Toboggan', city: 'Milford, MI', lat: 42.5317, lng: -83.6328, terrain: 'hilly', holes: 18, par: 61, length: '6,840 ft' },
  { id: 'c5', name: 'Ewing Park', city: 'Des Moines, IA', lat: 41.5468, lng: -93.5885, terrain: 'wooded', holes: 18, par: 60, length: '6,950 ft' },
  { id: 'c6', name: 'Pickard Park', city: 'Indianola, IA', lat: 41.3634, lng: -93.5655, terrain: 'open', holes: 18, par: 58, length: '6,310 ft' },
  { id: 'c7', name: 'Olander Park', city: 'Sylvania, OH', lat: 41.7066, lng: -83.7216, terrain: 'water', holes: 18, par: 56, length: '5,620 ft' },
  { id: 'c8', name: 'Milham Park', city: 'Kalamazoo, MI', lat: 42.2550, lng: -85.5850, terrain: 'mixed', holes: 18, par: 59, length: '6,200 ft' },
  { id: 'c9', name: 'Hickory Hills', city: 'Traverse City, MI', lat: 44.7610, lng: -85.6600, terrain: 'hilly', holes: 18, par: 63, length: '7,480 ft' },
];

const LEAGUES = [
  { id: 'l1', name: 'Hawk Island Tuesdays', course: 'c1', when: 'Tue · 6:00 PM', color: '#2F7D5B', next: '2026-11-03' },
  { id: 'l2', name: 'Burchfield Bag Tag', course: 'c2', when: 'Thu · 5:30 PM', color: '#C0702E', next: '2026-11-05' },
];

const LEAGUE_ROUNDS = [
  { id: 'lr1', league: 'l1', course: 'c1', date: '2026-10-27', par: 57, score: 52, place: 2, field: 26, fee: 5, cash: 18 },
  { id: 'lr2', league: 'l2', course: 'c2', date: '2026-10-22', par: 62, score: 60, place: 5, field: 19, fee: 5, cash: 0 },
  { id: 'lr3', league: 'l1', course: 'c1', date: '2026-10-20', par: 57, score: 55, place: 9, field: 31, fee: 5, cash: 0 },
  { id: 'lr4', league: 'l1', course: 'c1', date: '2026-10-13', par: 57, score: 51, place: 1, field: 28, fee: 5, cash: 34 },
  { id: 'lr5', league: 'l2', course: 'c2', date: '2026-10-08', par: 62, score: 58, place: 3, field: 22, fee: 5, cash: 12 },
];

// status flow: interested → planning → registered (or waitlisted) → played → recorded; withdrew is a side exit
const EVENTS = [
  // ── 2027 season ──
  {
    id: 'e1', name: 'Milham Spring Opener', start: '2027-04-10', end: '2027-04-11',
    city: 'Kalamazoo, MI', lat: 42.2550, lng: -85.5850,
    pdga: true, tier: 'B-Tier', format: 'singles', division: 'MA1',
    status: 'planning', regOpens: '2027-01-15', remind: true,
    fee: 85, courses: ['c8'], rounds: 2,
    drive: { fromHome: { time: '1h 10m', mi: 76 } },
  },
  {
    id: 'e2', name: 'Central Iowa Doubles Bash', start: '2027-05-15', end: '2027-05-16',
    city: 'Des Moines, IA', lat: 41.5868, lng: -93.6250,
    pdga: false, format: 'doubles', partner: 'Jake Ruiz',
    status: 'registered', regOpens: '2026-10-01', remind: false,
    fee: 140, feeSplit: 2, courses: ['c5', 'c6'], rounds: 3,
    lodging: { type: 'Airbnb', name: 'East Village loft', lat: 41.5880, lng: -93.6080, cost: 420, nights: 2, split: 2 },
    drive: {
      fromHome: { time: '8h 05m', mi: 520 },
      toCourses: { c5: { time: '12 min', mi: 6 }, c6: { time: '28 min', mi: 21 } },
    },
  },
  {
    id: 'e3', name: 'Capital City Match Play Cup', start: '2027-06-12', end: '2027-06-12',
    city: 'Lansing, MI', lat: 42.7189, lng: -84.6416,
    pdga: false, format: 'match-play', holesPerMatch: 12, team: 'Hawk Island Chains',
    status: 'interested', regOpens: '2027-04-01', remind: true,
    fee: 40, courses: ['c3', 'c1'], rounds: 4,
    drive: { fromHome: { time: '15 min', mi: 8 } },
  },
  {
    id: 'e4', name: 'Glass City Open', start: '2027-07-24', end: '2027-07-25',
    city: 'Sylvania, OH', lat: 41.7066, lng: -83.7216,
    pdga: true, tier: 'A-Tier', format: 'singles', division: 'MA1',
    status: 'interested', regOpens: '2027-03-01', remind: true,
    fee: 110, courses: ['c7'], rounds: 3,
    lodging: { type: 'Hotel', name: 'Hampton Inn Sylvania', lat: 41.7180, lng: -83.7010, cost: 129, nights: 1, split: 1 },
    drive: { fromHome: { time: '1h 45m', mi: 98 }, toCourses: { c7: { time: '6 min', mi: 2 } } },
  },
  {
    id: 'e5', name: 'Hickory Hills Triples', start: '2027-09-18', end: '2027-09-18',
    city: 'Traverse City, MI', lat: 44.7610, lng: -85.6600,
    pdga: false, format: 'triples', partner: 'Jake Ruiz, Sam Ortiz',
    status: 'interested', regOpens: '2027-07-15', remind: false,
    fee: 105, feeSplit: 3, courses: ['c9'], rounds: 2,
    drive: { fromHome: { time: '3h 05m', mi: 186 } },
  },
  {
    id: 'e6', name: 'Kensington Fall Classic', start: '2027-10-09', end: '2027-10-10',
    city: 'Milford, MI', lat: 42.5317, lng: -83.6328,
    pdga: true, tier: 'B-Tier', format: 'singles', division: 'MA1',
    status: 'waitlisted', waitlistPos: 4, regOpens: '2027-06-01', remind: false,
    fee: 95, courses: ['c4'], rounds: 2,
    drive: { fromHome: { time: '1h 05m', mi: 62 } },
  },

  // ── 2026 history ──
  {
    id: 'p1', name: 'Burchfield Bash', start: '2026-04-18', end: '2026-04-18',
    city: 'Holt, MI', lat: 42.6175, lng: -84.5960,
    pdga: true, tier: 'C-Tier', format: 'singles', division: 'MA1',
    status: 'recorded', fee: 60, courses: ['c2'],
    result: { place: 4, field: 38, payout: 45 },
    roundLog: [
      { n: 1, date: '2026-04-18', course: 'c2', par: 62, score: 61, rating: 941 },
      { n: 2, date: '2026-04-18', course: 'c2', par: 62, score: 59, rating: 958 },
    ],
    notes: 'Windy morning, putted well in round 2.',
  },
  {
    id: 'p2', name: 'Ewing Park Open', start: '2026-06-13', end: '2026-06-14',
    city: 'Des Moines, IA', lat: 41.5468, lng: -93.5885,
    pdga: true, tier: 'B-Tier', format: 'singles', division: 'MA1',
    status: 'played', fee: 90, courses: ['c5', 'c6'], rounds: 3,
    result: { place: 7, field: 52, payout: 0 },
    roundLog: [
      { n: 1, date: '2026-06-13', course: 'c5', par: 60, score: 58, rating: 955 },
      { n: 2, date: '2026-06-13', course: 'c6', par: 58, score: 57, rating: 947 },
    ],
  },
  {
    id: 'p3', name: 'Hawk Island Doubles', start: '2026-08-08', end: '2026-08-08',
    city: 'Lansing, MI', lat: 42.7046, lng: -84.5352,
    pdga: false, format: 'doubles', partner: 'Jake Ruiz',
    status: 'recorded', fee: 50, feeSplit: 2, courses: ['c1'],
    result: { place: 3, field: 22, payout: 60, unit: 'teams' },
    roundLog: [
      { n: 1, date: '2026-08-08', course: 'c1', par: 57, score: 50 },
      { n: 2, date: '2026-08-08', course: 'c1', par: 57, score: 49 },
    ],
  },
  {
    id: 'p4', name: 'Lansing Team Match Play', start: '2026-09-19', end: '2026-09-19',
    city: 'Lansing, MI', lat: 42.7189, lng: -84.6416,
    pdga: false, format: 'match-play', holesPerMatch: 12, team: 'Hawk Island Chains',
    status: 'recorded', fee: 40, courses: ['c3'],
    result: { place: 2, field: 6, payout: 0, unit: 'teams' },
    matches: [
      { n: 1, opponent: 'T. Nguyen', oppTeam: 'Grand Woods Grip', holes: 'WPLWWPLPWLWP' },
      { n: 2, opponent: 'R. Alvarez', oppTeam: 'Burchfield Ballers', holes: 'LPLWLPWLPLWP' },
      { n: 3, opponent: 'D. Kimura', oppTeam: 'Chain Gang', holes: 'PWLPWLPLWPLP' },
      { n: 4, opponent: 'B. Holt', oppTeam: 'Mason Mashers', holes: 'WWPLWPWPLWPW' },
    ],
    notes: 'First match play event. Aggressive lines paid off on 1 and 4; got too cute on the short holes in 2.',
  },
];

const RATING_HISTORY = [
  { d: '2025-11', r: 921 }, { d: '2026-01', r: 926 }, { d: '2026-03', r: 931 }, { d: '2026-05', r: 938 },
  { d: '2026-06', r: 941 }, { d: '2026-08', r: 944 }, { d: '2026-09', r: 946 }, { d: '2026-10', r: 952 },
];
