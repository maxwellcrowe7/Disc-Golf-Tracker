// ═══════════════════════════════════════════════
//  Fairway v3 "season atlas" design sample — vanilla JS, hash routing, sample data only.
// ═══════════════════════════════════════════════

const $ = id => document.getElementById(id);
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const ICONS = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  calendar: '<rect x="3" y="4.5" width="18" height="16.5" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
  trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  chevR: '<path d="m9 6 6 6-6 6"/>',
  chevL: '<path d="m15 6-6 6 6 6"/>',
  arrowR: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10.3 20a1.94 1.94 0 0 0 3.4 0"/>',
  car: '<path d="M5 17H3v-5l2-5h14l2 5v5h-2"/><path d="M3 12h18"/><circle cx="7.5" cy="17" r="2"/><circle cx="16.5" cy="17" r="2"/><path d="M9.5 17h5"/>',
  bed: '<path d="M3 19V6M3 15h18v4M21 15v-3a3 3 0 0 0-3-3h-7v6"/><circle cx="7" cy="11" r="2"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',
  basket: '<path d="M12 3v15"/><path d="M5.5 8h13L17 13H7z"/><path d="M8 21h8"/><path d="M9.2 8l.8 5M14.8 8l-.8 5"/>',
  course: '<path d="m2.5 20 6.5-11 4 6.5 2.5-3.5 6 8z"/><circle cx="17" cy="6" r="2"/>',
  list: '<path d="M9 6h12M9 12h12M9 18h12"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
  map: '<path d="m9 4-6 2.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5z"/><path d="M9 4v13.5M15 6.5V20"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  note: '<path d="M5 3h10l4 4v14H5z"/><path d="M14 3v5h5M8 13h8M8 17h5"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  sparkle: '<path d="M12 3c.6 4.2 2.8 6.4 7 7-4.2.6-6.4 2.8-7 7-.6-4.2-2.8-6.4-7-7 4.2-.6 6.4-2.8 7-7z"/>',
  replay: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
};
const I = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24">${ICONS[n] || ''}</svg>`;

// ── Lookup + formatting ──
const course = id => COURSES.find(c => c.id === id);
const event = id => EVENTS.find(e => e.id === id);
const league = id => LEAGUES.find(l => l.id === id);
const D = iso => new Date(iso + 'T12:00:00');
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const fmtDate = iso => { const d = D(iso); return `${MON[d.getMonth()]} ${d.getDate()}`; };
const fmtDateY = iso => `${fmtDate(iso)}, ${D(iso).getFullYear()}`;
const fmtDow = iso => `${DOW[D(iso).getDay()]}, ${fmtDate(iso)}`;
function fmtRange(e) {
  const a = D(e.start), b = D(e.end);
  if (e.start === e.end) return fmtDow(e.start);
  if (a.getMonth() === b.getMonth()) return `${MON[a.getMonth()]} ${a.getDate()}–${b.getDate()}`;
  return `${fmtDate(e.start)} – ${fmtDate(e.end)}`;
}
const daysUntil = iso => Math.round((D(iso) - TODAY) / 864e5);
const money = v => '$' + Math.round(v).toLocaleString();
const ord = n => { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
const ordSup = n => { const o = ord(n); return `${n}<sup>${o.slice(String(n).length)}</sup>`; };
const pad2 = n => String(n).padStart(2, '0');
const coords = (lat, lng) => `${Math.abs(lat).toFixed(3)}°${lat >= 0 ? 'N' : 'S'} ${Math.abs(lng).toFixed(3)}°${lng >= 0 ? 'E' : 'W'}`;
const emLast = s => { const w = s.split(' '); return w.length < 2 ? s : w.slice(0, -1).join(' ') + ' <em>' + w[w.length - 1] + '</em>'; };
const plateNo = cid => 'Pl. ' + pad2(COURSES.findIndex(c => c.id === cid) + 1);
const relTxt = d => d === 0 ? 'E' : d > 0 ? '+' + d : '−' + Math.abs(d);
const scCls = d => d <= -5 ? 'eagle' : d < 0 ? 'under' : d > 0 ? 'over' : 'even';
// scorecard notation: circled under par, double-circled 5+ under, boxed over
const sc = (score, par) => { const d = score - par; return `<span class="sc ${scCls(d)}">${relTxt(d)}</span>`; };
const scD = d => `<span class="sc ${scCls(d)}">${relTxt(d)}</span>`;

const FORMAT = { singles: 'Singles', doubles: 'Doubles', triples: 'Triples', 'team-doubles': 'Team Doubles', 'match-play': 'Match Play' };
const STATUS = { interested: 'Interested', planning: 'Planning', registered: 'Registered', waitlisted: 'Waitlisted', withdrew: 'Withdrew', played: 'Played', recorded: 'Recorded' };
const statusChip = e => `<span class="status ${e.status}">${e.status === 'waitlisted' && e.waitlistPos ? 'Waitlist #' + e.waitlistPos : STATUS[e.status]}</span>`;
const tierChip = e => e.pdga ? `<span class="chip">PDGA ${e.tier || ''}</span>` : `<span class="chip">Non-PDGA</span>`;
const fmtChip = e => `<span class="chip">${FORMAT[e.format]}${e.division ? ' · ' + e.division : ''}</span>`;

const isUpcoming = e => e.start >= '2027-01-01';
const upcoming = () => EVENTS.filter(isUpcoming).sort((a, b) => a.start.localeCompare(b.start));
const past = () => EVENTS.filter(e => !isUpcoming(e)).sort((a, b) => b.start.localeCompare(a.start));

function costFor(e) {
  const entry = e.fee / (e.feeSplit || 1);
  const lodging = e.lodging ? e.lodging.cost / (e.lodging.split || 1) : 0;
  const mi = e.drive?.fromHome?.mi || 0;
  const gas = Math.round(mi * 2 / 27 * 3.4 / (e.feeSplit && e.lodging ? e.feeSplit : 1));
  return { entry, lodging, gas, total: entry + lodging + gas };
}
function courseRounds(cid) {
  const out = [];
  EVENTS.forEach(e => (e.roundLog || []).forEach(r => { if (r.course === cid) out.push({ ...r, label: e.name, sub: `Round ${r.n}` + (e.format !== 'singles' ? ' · ' + FORMAT[e.format] : ''), href: '#/event/' + e.id, singles: e.format === 'singles' }); }));
  LEAGUE_ROUNDS.forEach(r => { if (r.course === cid) out.push({ ...r, label: league(r.league).name, sub: `${ord(r.place)} of ${r.field}`, href: '#/results/leagues', singles: true }); });
  return out.sort((a, b) => b.date.localeCompare(a.date));
}
function holeTally(h) {
  const t = { W: 0, L: 0, P: 0 };
  [...h].forEach(x => { if (t[x] !== undefined) t[x]++; });
  t.res = t.W > t.L ? 'W' : t.L > t.W ? 'L' : 'P';
  return t;
}
function matchRecord(e) { const r = { w: 0, l: 0, p: 0 }; (e.matches || []).forEach(m => r[holeTally(m.holes).res.toLowerCase()]++); return r; }

// ═══════════════════════════════════════════════
//  PLATES — two-ink print: halftone elevation, contour ink,
//  paper knock-out fairway, disc-orange flight
// ═══════════════════════════════════════════════
function hashStr(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const TERRAIN = {
  wooded: { tint: .3, ht: 1, clusters: 10, rings: 8, step: 15 },
  open:   { tint: .1, ht: .55, clusters: 3, rings: 7, step: 16 },
  water:  { tint: .12, ht: .6, clusters: 4, rings: 7, step: 16, water: true },
  hilly:  { tint: .2, ht: 1, clusters: 6, rings: 12, step: 11 },
  mixed:  { tint: .17, ht: .8, clusters: 6, rings: 8, step: 14 },
};
function blob(cx, cy, r, R, amp, n = 64, squash = .78) {
  const ph = [R() * 6.28, R() * 6.28, R() * 6.28];
  let d = '';
  for (let i = 0; i <= n; i++) {
    const t = i / n * Math.PI * 2;
    const rr = r + amp * (Math.sin(t * 2 + ph[0]) * .55 + Math.sin(t * 3 + ph[1]) * .3 + Math.sin(t * 5 + ph[2]) * .15);
    d += (i ? 'L' : 'M') + (cx + Math.cos(t) * rr).toFixed(1) + ' ' + (cy + Math.sin(t) * rr * squash).toFixed(1);
  }
  return d + 'Z';
}
function topo(seed, stroke, rings = 14) {
  const R = rng(hashStr(seed));
  let s = '<svg class="topo" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g style="animation:drift 40s ease-in-out infinite alternate;transform-origin:50% 50%">';
  for (let h = 0; h < 2; h++) {
    const cx = 120 + R() * 160, cy = 120 + R() * 160, sd = R() * 1e9;
    for (let k = 1; k <= rings; k++) s += `<path d="${blob(cx, cy, 6 + k * 15, rng(sd), 6 + k * 2.6, 72, .85)}" fill="none" stroke="${stroke}" stroke-width="${k % 5 === 0 ? 1.6 : .9}"/>`;
  }
  return s + '</g></svg>';
}
function art(c, opts = {}) {
  const R = rng(hashStr(c.id + c.name)), T0 = TERRAIN[c.terrain] || TERRAIN.mixed, W = 320, H = 200, g = 'pl-' + c.id;
  const hills = c.terrain === 'hilly' || c.terrain === 'mixed' ? 2 : 1;
  const hc = Array.from({ length: hills }, () => [50 + R() * 220, 30 + R() * 140, R() * 1e9]);
  const k = opts.dot || 1, gid = g + (opts.dot ? '-d' + String(k).replace('.', '') : '');
  let s = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>
    <pattern id="${gid}-ht" width="${3.6 * k}" height="${3.6 * k}" patternUnits="userSpaceOnUse" patternTransform="rotate(22)"><circle cx="${1.8 * k}" cy="${1.8 * k}" r="${1.05 * k}" fill="var(--pi)"/></pattern>
    <pattern id="${gid}-ht2" width="${3.6 * k}" height="${3.6 * k}" patternUnits="userSpaceOnUse" patternTransform="rotate(22)"><circle cx="${1.8 * k}" cy="${1.8 * k}" r="${.55 * k}" fill="var(--pi)"/></pattern>`;
  hc.forEach(([cx, cy], h) => { s += `<radialGradient id="${g}-g${h}" gradientUnits="userSpaceOnUse" cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${(90 + T0.rings * 6).toFixed(0)}"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient><mask id="${g}-m${h}"><rect width="${W}" height="${H}" fill="url(#${g}-g${h})"/></mask>`; });
  s += `</defs><rect width="${W}" height="${H}" fill="var(--pp)"/><rect width="${W}" height="${H}" fill="var(--pi)" opacity="${T0.tint}"/>`;
  s += `<rect width="${W}" height="${H}" fill="url(#${gid}-ht2)" opacity="${(T0.ht * .18).toFixed(2)}"/>`;
  s += '<g class="contours">';
  hc.forEach(([cx, cy, sd], h) => {
    s += `<rect width="${W}" height="${H}" fill="url(#${gid}-ht)" mask="url(#${g}-m${h})" opacity="${(T0.ht * .8).toFixed(2)}"/>`;
    for (let k = 1; k <= T0.rings; k++) s += `<path d="${blob(cx, cy, 8 + k * T0.step, rng(sd), 4 + k * 2.2)}" fill="none" stroke="var(--pi)" stroke-opacity="${k % 4 === 0 ? .75 : .45}" stroke-width="${k % 4 === 0 ? 1.4 : .8}"/>`;
  });
  s += '</g>';
  if (T0.water) {
    const wx = 210 + R() * 80, wy = 135 + R() * 50, wr = 46 + R() * 14;
    s += `<g class="ink"><path d="${blob(wx, wy, wr, R, 10)}" fill="var(--pb)" opacity=".88"/><path d="${blob(wx, wy, wr + 8, R, 9)}" fill="none" stroke="var(--pb)" stroke-width="1" stroke-dasharray="2 3" opacity=".7"/><path d="${blob(wx, wy, wr + 15, R, 9)}" fill="none" stroke="var(--pb)" stroke-width=".8" stroke-dasharray="1 4" opacity=".5"/></g>`;
  }
  const T = [36 + R() * 40, 148 + R() * 32], B = [222 + R() * 62, 42 + R() * 40], C = [110 + R() * 70, 50 + R() * 110];
  const q = t => [(1 - t) ** 2 * T[0] + 2 * (1 - t) * t * C[0] + t * t * B[0], (1 - t) ** 2 * T[1] + 2 * (1 - t) * t * C[1] + t * t * B[1]];
  const fw = `M${T[0].toFixed(1)} ${T[1].toFixed(1)}Q${C[0].toFixed(1)} ${C[1].toFixed(1)} ${B[0].toFixed(1)} ${B[1].toFixed(1)}`;
  // fairway is knocked out of the green ink — negative space, like a real two-colour print
  s += `<path d="${fw}" fill="none" stroke="var(--pp)" stroke-opacity=".72" stroke-width="34" stroke-linecap="round"/><path d="${fw}" fill="none" stroke="var(--pp)" stroke-opacity=".85" stroke-width="15" stroke-linecap="round"/>`;
  const path = Array.from({ length: 24 }, (_, i) => q(i / 23));
  s += '<g class="ink">';
  for (let k = 0; k < T0.clusters; k++) {
    const kx = R() * W, ky = R() * H, n = 5 + Math.floor(R() * 9);
    for (let j = 0; j < n; j++) {
      const x = kx + (R() - .5) * 60, y = ky + (R() - .5) * 46, r = 4.5 + R() * 6.5;
      if (path.some(([px, py]) => Math.hypot(px - x, py - y) < 24 + r)) continue;
      s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="var(--pi)" opacity=".78"/><circle cx="${(x + r * .3).toFixed(1)}" cy="${(y + r * .32).toFixed(1)}" r="${(r * .62).toFixed(1)}" fill="var(--pi)" opacity=".55"/>`;
    }
  }
  s += '</g>';
  // second ink, slightly mis-registered
  s += `<g transform="translate(.9 -.7)"><path class="flight" d="${fw}" pathLength="1" fill="none" stroke="var(--po)" stroke-width="2" stroke-linecap="round"/>`;
  const ang = Math.atan2(C[1] - T[1], C[0] - T[0]) * 180 / Math.PI;
  s += `<rect x="${(T[0] - 9).toFixed(1)}" y="${(T[1] - 4.5).toFixed(1)}" width="18" height="9" rx="1.5" fill="var(--po)" transform="rotate(${ang.toFixed(1)} ${T[0].toFixed(1)} ${T[1].toFixed(1)})"/>`;
  const bx = B[0].toFixed(1), by = B[1].toFixed(1);
  if (opts.fly) s += `<path class="trail" d="${fw}" pathLength="1"/><circle class="chains" cx="${bx}" cy="${by}" r="7" fill="none" stroke="var(--po)" stroke-width="1.6"/>`;
  s += `<circle cx="${bx}" cy="${by}" r="3.4" fill="var(--po)"/></g>`;
  s += `<circle cx="${bx}" cy="${by}" r="8.5" fill="none" stroke="var(--pi)" stroke-width="1.4"/><circle cx="${bx}" cy="${by}" r="12.5" fill="none" stroke="var(--pi)" stroke-width=".7" stroke-dasharray="1.5 2.5"/>`;
  if (opts.fly) s += `<g class="disc"><ellipse rx="6" ry="4" fill="var(--po)"/><ellipse rx="3.2" ry="2" fill="none" stroke="var(--pp)" stroke-width=".9" opacity=".7"/><animateMotion dur="2s" begin="indefinite" fill="freeze" calcMode="spline" keyTimes="0;1" keyPoints="0;1" keySplines=".3 .1 .15 1" rotate="auto" path="${fw}"/></g>`;
  return s + '</svg>';
}
// map furniture: north arrow, scale bar, plate number
const marks = (c, noScale) => `<div class="marks"><span class="north"><svg viewBox="0 0 14 18"><path d="M7 0 13 16 7 12 1 16Z" fill="currentColor" opacity=".9"/><path d="M7 0V12L1 16Z" fill="var(--pp)" opacity=".5"/></svg>N</span>${noScale ? '' : `<span class="scale"><i></i>0 · 100 ft</span>`}<span class="plate-no">${plateNo(c.id)}</span></div>`;
const thumb = (cid, cls = '') => `<div class="art thumb ${cls}">${art(course(cid))}</div>`;
function fly(el) {
  if (!el || REDUCED) return;
  const anim = el.querySelector('animateMotion');
  el.classList.remove('flying'); void el.offsetWidth; el.classList.add('flying');
  try { anim && anim.beginElement(); } catch (e) {}
}
function medal(place) {
  if (place > 3) return '';
  const c = [['#F3D46B', '#C99A22'], ['#E2E6EB', '#9AA4B0'], ['#EBC09A', '#B97A47']][place - 1];
  return `<svg viewBox="0 0 46 46"><circle cx="23" cy="23" r="21" fill="${c[0]}"/><circle cx="23" cy="23" r="17" fill="none" stroke="${c[1]}" stroke-width="1" stroke-dasharray="1.4 2.4"/></svg>`;
}

// ═══════════════════════════════════════════════
//  PREFS
// ═══════════════════════════════════════════════
const prefs = { theme: 'light', accent: 'orange' };
try { Object.assign(prefs, JSON.parse(localStorage.getItem('dgt-proto-v3') || '{}')); } catch (e) {}
const qp = new URLSearchParams(location.search);
['theme', 'accent'].forEach(k => { if (qp.get(k)) prefs[k] = qp.get(k); });
function applyPrefs() {
  document.documentElement.dataset.theme = prefs.theme;
  document.documentElement.dataset.accent = prefs.accent;
  document.querySelector('#proto [data-theme-toggle]').innerHTML = prefs.theme === 'dark' ? I('sun', 'sm') : I('moon', 'sm');
  document.querySelectorAll('#proto .sw').forEach(b => b.classList.toggle('on', b.dataset.accent === prefs.accent));
  document.querySelector('meta[name=theme-color]').content = prefs.theme === 'dark' ? '#0E1411' : '#F2EDE1';
  try { localStorage.setItem('dgt-proto-v3', JSON.stringify(prefs)); } catch (e) {}
}

// ═══════════════════════════════════════════════
//  SHELL
// ═══════════════════════════════════════════════
const NAV = [
  { key: 'home', label: 'Home', icon: 'home', href: '#/home' },
  { key: 'schedule', label: 'Schedule', icon: 'calendar', href: '#/schedule' },
  { key: 'results', label: 'Results', icon: 'trophy', href: '#/results' },
  { key: 'courses', label: 'Courses', icon: 'course', href: '#/courses' },
];
const logo = s => `<svg width="${s}" height="${s}" viewBox="0 0 34 34"><circle cx="17" cy="17" r="15.5" fill="var(--disc)"/><circle cx="17" cy="17" r="11" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1.2"/><circle cx="17" cy="17" r="4" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="1"/><path d="M6.5 21c5-6.5 13-9 21.5-7.5" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-dasharray=".5 3.4"/></svg>`;
function buildShell() {
  $('sidebar').innerHTML = `${topo('sidebar', 'rgba(242,237,225,.13)', 16)}
    <div class="brand">${logo(36)}<div><b>Fairway</b><small>Season atlas · 2027</small></div></div>
    <div class="nav-wrap"><span class="side-ind"></span>${NAV.map((n, i) => `<a class="nav" data-key="${n.key}" href="${n.href}">${I(n.icon)}${n.label}<span class="k">${pad2(i + 1)}</span></a>`).join('')}</div>
    <button class="add" data-act="quick">${I('plus', 'sm')}Log something</button>
    <div class="me"><div class="av">MC</div><div><b>${PLAYER.name}</b><small>PDGA #${PLAYER.pdga}</small></div><div class="rt">${PLAYER.rating}</div></div>`;
  const t = n => `<a data-key="${n.key}" href="${n.href}">${I(n.icon)}${n.label}</a>`;
  $('tabbar').innerHTML = `<span class="tab-ind"></span>${t(NAV[0])}${t(NAV[1])}<button class="fab" data-act="quick" aria-label="Log something">${I('plus')}</button>${t(NAV[2])}${t(NAV[3])}`;
}
function updateShell(section) {
  document.querySelectorAll('[data-key]').forEach(a => a.classList.toggle('on', a.dataset.key === section));
  const on = $('tabbar').querySelector('a.on'), ind = $('tabbar').querySelector('.tab-ind');
  if (on) { ind.style.opacity = 1; ind.style.width = on.offsetWidth - 8 + 'px'; ind.style.transform = `translateX(${on.offsetLeft + 4}px)`; } else ind.style.opacity = 0;
  const son = $('sidebar').querySelector('a.nav.on'), sind = $('sidebar').querySelector('.side-ind');
  if (son && sind) sind.style.transform = `translateY(${son.offsetTop}px)`;
}
function setTopbar({ title = '', left = '', right = '' }) {
  $('topbar').innerHTML = `<div class="slot">${left}</div><div class="tb-title">${title}</div><div class="slot">${right}</div>`;
  $('topbar').classList.remove('show');
}
const sm = 'style="width:34px;height:34px"';
// split headline into masked lines that rise on first paint
const lines = arr => arr.map((l, i) => `<span class="ln" style="--l:${i}"><span>${l}</span></span>`).join('');
const pagehead = (kick, h1Lines, right = '') => `<div class="pagehead"><div><div class="kick">${kick.map(k => `<span class="mono">${k}</span>`).join('')}</div><h1 data-sentinel>${lines(h1Lines)}</h1></div>${right}</div>`;
const secH = (no, title, link = '') => `<div class="sec-h rv-line"><span class="no">${pad2(no)}</span><h2>${title}</h2><span class="rule"></span>${link}</div>`;

// ═══════════════════════════════════════════════
//  ROUTER + VIEW TRANSITIONS
// ═══════════════════════════════════════════════
const UI = { schedMode: 'list', schedFilter: 'all', resultsTab: 'tournaments', drive: false, q: '', pulse: null, ring: null };
let maps = [], observers = [];
function route() { const [, a = 'home', b] = (location.hash || '#/home').split('/'); return { a, b }; }
function go(href, src) {
  if (href === location.hash) return;
  const from = route(), to = href.split('/');
  const toDetail = to[1] === 'event' || to[1] === 'course', fromDetail = from.a === 'event' || from.a === 'course';
  const vtOK = !REDUCED && document.startViewTransition;
  let backKey = null;
  if (vtOK) {
    const srcArt = src && (src.matches('.art') ? src : src.querySelector('.art'));
    if (toDetail && srcArt) srcArt.style.viewTransitionName = 'hero-art';
    else if (fromDetail) { const b = document.querySelector('.banner > .art'); if (b) { b.style.viewTransitionName = 'hero-art'; backKey = `${from.a}-${from.b}`; } }
  }
  const swap = () => {
    history.pushState(null, '', href);
    render();
    if (backKey) {
      const t = document.querySelector(`[data-vt="${backKey}"]`), a = t && (t.matches('.art') ? t : t.querySelector('.art'));
      if (a && a.getBoundingClientRect().top < innerHeight) a.style.viewTransitionName = 'hero-art';
    }
  };
  if (vtOK) document.startViewTransition(swap).finished.finally(() => document.querySelectorAll('.art').forEach(el => { el.style.viewTransitionName = ''; }));
  else swap();
}
function render(opts = {}) {
  maps.forEach(m => m.remove()); maps = [];
  observers.forEach(o => o.disconnect()); observers = [];
  const r = route();
  let v, section = r.a;
  if (r.a === 'schedule') { if (r.b) UI.schedMode = r.b; v = viewSchedule(); }
  else if (r.a === 'event' && event(r.b)) { v = viewEvent(r.b); section = isUpcoming(event(r.b)) ? 'schedule' : 'results'; }
  else if (r.a === 'course' && course(r.b)) { v = viewCourse(r.b); section = 'courses'; }
  else if (r.a === 'results') { if (r.b) UI.resultsTab = r.b; v = viewResults(); }
  else if (r.a === 'courses') v = viewCourses();
  else { v = viewHome(); section = 'home'; }
  updateShell(section);
  setTopbar(v.top || {});
  const view = $('view');
  view.classList.toggle('intro', !opts.keepScroll);
  view.innerHTML = v.html;
  if (!opts.keepScroll) window.scrollTo(0, 0);
  mountMotion(!!opts.keepScroll);
  v.after && v.after();
  onScroll();
  UI.pulse = null; UI.ring = null;
}

// ═══════════════════════════════════════════════
//  MOTION ENGINE
// ═══════════════════════════════════════════════
function fmtCount(el, v) {
  const dec = +(el.dataset.dec || 0);
  return (el.dataset.pre || '') + (dec ? v.toFixed(dec) : Math.round(v).toLocaleString()) + (el.dataset.suf || '');
}
function countUp(el) {
  const to = parseFloat(el.dataset.count), from = el.dataset.from !== undefined ? parseFloat(el.dataset.from) : 0;
  if (REDUCED) { el.textContent = fmtCount(el, to); return; }
  const dur = 1400, t0 = performance.now();
  const step = now => { const t = clamp((now - t0) / dur, 0, 1), e = t === 1 ? 1 : 1 - Math.pow(2, -10 * t); el.textContent = fmtCount(el, from + (to - from) * e); if (t < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
function mountMotion(instant) {
  const view = $('view');
  view.querySelectorAll('[data-stagger]').forEach(g => [...g.children].forEach((c, i) => { c.classList.add('rv'); c.style.setProperty('--i', i); }));
  const targets = view.querySelectorAll('.rv, .sec-h, .climb, .trail-card, .trip, .receipt, .dots-plot, .match, [data-count]');
  if (instant) targets.forEach(el => { el.classList.add('in'); if (el.dataset.count) el.textContent = fmtCount(el, parseFloat(el.dataset.count)); });
  else {
    const io = new IntersectionObserver(ents => ents.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target; el.classList.add('in');
      if (el.dataset.count && !el.dataset.done) { el.dataset.done = 1; countUp(el); }
      io.unobserve(el);
    }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(el => io.observe(el)); observers.push(io);
  }
  const sentinel = view.querySelector('[data-sentinel]');
  if (sentinel) {
    const io2 = new IntersectionObserver(([en]) => $('topbar').classList.toggle('show', !en.isIntersecting && en.boundingClientRect.top < 60), { rootMargin: '-56px 0px 0px 0px' });
    io2.observe(sentinel); observers.push(io2);
  }
  view.querySelectorAll('.plot[data-pts]').forEach(mountPlot);
  view.querySelectorAll('.seg').forEach(placeSeg);
  view.querySelectorAll('.stations.pre').forEach(s => requestAnimationFrame(() => requestAnimationFrame(() => s.classList.remove('pre'))));
  view.querySelectorAll('[data-slam]').forEach(el => el.closest('.ticket-wrap, .scorecard')?.classList.add('shake'));
  const heroArt = view.querySelector('.hero > .art');
  if (heroArt) setTimeout(() => fly(heroArt), instant ? 0 : 650);
}
function placeSeg(seg) {
  const on = seg.querySelector('button.on'), ind = seg.querySelector('.seg-ind');
  if (!on || !ind) return;
  ind.style.width = on.offsetWidth + 'px'; ind.style.transform = `translateX(${on.offsetLeft - 4}px)`;
}
let ticking = false;
function onScroll() {
  if (ticking) return; ticking = true;
  requestAnimationFrame(() => {
    ticking = false;
    const banner = document.querySelector('.banner');
    if (banner && !REDUCED) banner.style.setProperty('--sy', clamp(scrollY, 0, 420));
    const tl = document.querySelector('.tl');
    if (tl) {
      const r = tl.getBoundingClientRect(), fill = clamp(innerHeight * .58 - r.top, 0, r.height - 20);
      tl.style.setProperty('--fill', fill + 'px');
      tl.querySelectorAll('.tl-month').forEach(m => m.classList.toggle('lit', m.offsetTop - 8 <= fill));
    }
  });
}
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', () => { updateShell(document.querySelector('[data-key].on')?.dataset.key); document.querySelectorAll('.seg').forEach(placeSeg); });

// ═══════════════════════════════════════════════
//  THE CLIMB — rating history drawn as an elevation profile
// ═══════════════════════════════════════════════
function smooth(pts) {
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    d += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}
function climb() {
  const vals = RATING_HISTORY.map(r => r.r), labels = RATING_HISTORY.map(r => MON[+r.d.slice(5) - 1] + ' ’' + r.d.slice(2, 4));
  const lo = Math.floor((Math.min(...vals) - 8) / 10) * 10, hi = Math.ceil((Math.max(...vals) + 6) / 10) * 10;
  const W = 600, H = 200, top = 22, bot = 6;
  const y = v => top + (1 - (v - lo) / (hi - lo)) * (H - top - bot);
  const pts = vals.map((v, i) => [i / (vals.length - 1) * W, y(v)]);
  const line = smooth(pts);
  const mi = vals.indexOf(Math.max(...vals)), [sx, sy] = pts[mi];
  const grid = []; for (let g = lo + 10; g < hi; g += 10) grid.push(g);
  return `<div class="card climb">
    <div class="top">
      <div class="now"><span class="mono">PDGA rating · now</span><span class="num" data-count="${PLAYER.rating}" data-from="${vals[0]}">${PLAYER.rating}</span><span class="delta">▲ ${vals[vals.length - 1] - vals[0]} pts in 12 months</span></div>
      <div class="legend-r"><span class="mono">Elevation profile</span><br><span class="mono" style="color:var(--faint)">Drag to read</span></div>
    </div>
    <div class="plot" data-pts='${JSON.stringify(pts.map(p => [+(p[0] / W).toFixed(4), +(p[1] / H).toFixed(4)]))}' data-vals='${JSON.stringify(vals)}' data-labels='${JSON.stringify(labels)}' style="height:var(--ph,170px)">
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="height:100%">
        <defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="var(--pi)" stroke-width="1.2" stroke-opacity=".38"/></pattern></defs>
        <g class="grid">${grid.map(gv => `<line x1="0" x2="${W}" y1="${y(gv).toFixed(1)}" y2="${y(gv).toFixed(1)}"/>`).join('')}</g>
        <path d="${line}L${W} ${H}L0 ${H}Z" fill="url(#hatch)"/>
        <path class="ridge" d="${line}" transform="translate(0 14)" stroke-width="1.2" stroke-opacity=".45"/>
        <path class="ridge" d="${line}" transform="translate(0 28)" stroke-width="1" stroke-opacity=".25"/>
        <path class="ridge" d="${line}" transform="translate(0 42)" stroke-width="1" stroke-opacity=".12"/>
        <path class="main" d="${line}"/>
      </svg>
      ${grid.map(gv => `<span class="ylab" style="top:${(y(gv) / H * 100).toFixed(1)}%">${gv}</span>`).join('')}
      <span class="lbl ${sx / W > .8 ? 'r' : ''}" style="left:${(sx / W * 100).toFixed(1)}%;top:${(sy / H * 100).toFixed(1)}%"><svg width="18" height="26" viewBox="0 0 18 26" style="display:block;margin:0 0 -2px 8px;overflow:visible"><line x1="1" y1="26" x2="1" y2="1" stroke="var(--ink)" stroke-width="1.4"/><path d="M1 1 15 5.5 1 10Z" fill="var(--disc)"/></svg>Summit · <b>${vals[mi]}</b></span>
      <span class="scrub"><i></i><span></span></span>
    </div>
    <div class="plot-x mono" style="display:flex;justify-content:space-between;margin-top:8px;font-size:9.5px;color:var(--faint)">${labels.filter((_, i) => i % 2 === 0 || i === labels.length - 1).map(l => `<span>${l}</span>`).join('')}</div>
  </div>`;
}
function mountPlot(pl) {
  const pts = JSON.parse(pl.dataset.pts), vals = JSON.parse(pl.dataset.vals), labels = JSON.parse(pl.dataset.labels);
  const sc = pl.querySelector('.scrub'), dot = sc.querySelector('i'), tip = sc.querySelector('span');
  const move = x => {
    const r = pl.getBoundingClientRect();
    if (!r.width) return;
    const f = clamp((x - r.left) / r.width, 0, 1);
    const i = Math.round(f * (pts.length - 1));
    sc.style.left = pts[i][0] * 100 + '%'; dot.style.top = pts[i][1] * 100 + '%';
    tip.textContent = `${labels[i]} · ${vals[i]}`;
    tip.style.transform = pts[i][0] > .85 ? 'translateX(-90%)' : pts[i][0] < .15 ? 'translateX(-10%)' : 'translateX(-50%)';
  };
  pl.addEventListener('pointermove', e => move(e.clientX));
  pl.addEventListener('pointerdown', e => { pl.classList.add('touch'); move(e.clientX); });
  pl.addEventListener('pointerup', () => setTimeout(() => pl.classList.remove('touch'), 1400));
  move(pl.getBoundingClientRect().right);
}

// ═══════════════════════════════════════════════
//  THE SEASON TRAIL — events as stations on a winding trail, Nov → Oct
// ═══════════════════════════════════════════════
function trail(evs) {
  const W = 1000, H = 340, x0 = 46, x1 = 960, start = D('2026-11-01'), days = 365, ROWS = [30, 250, 74, 294];
  const xOf = iso => x0 + clamp((D(iso) - start) / 864e5 / days, 0, 1) * (x1 - x0);
  const yOf = x => 162 + 36 * Math.sin(x / 135 + .8) + 11 * Math.sin(x / 57);
  const samples = []; for (let x = x0; x <= x1; x += 8) samples.push([x, yOf(x)]);
  samples.push([x1, yOf(x1)]);
  const d = smooth(samples);
  const P = (x, y) => `left:${(x / W * 100).toFixed(2)}%;top:${(y / H * 100).toFixed(2)}%`;
  let months = '';
  for (let m = 0; m < 12; m++) { const dt = new Date(2026, 10 + m, 1), x = xOf(dt.toISOString().slice(0, 10)); months += `<span class="mtick" style="left:${(x / W * 100).toFixed(2)}%"></span><span class="mt" style="left:${(x / W * 100).toFixed(2)}%">${MON[dt.getMonth()]}${dt.getMonth() === 0 ? ' ’27' : ''}</span>`; }
  // place each callout on the first row where it doesn't collide (widths estimated in viewBox units)
  const ends = ROWS.map(() => -1e9);
  const pts = evs.map((e, i) => {
    const x = xOf(e.start), w = Math.max(e.name.length * 7, 150) + 20;
    const edge = x > 880 ? 'r' : x < 120 ? 'l' : '', L = edge === 'r' ? x - w + 14 : edge === 'l' ? x - 14 : x - w / 2;
    let r = ROWS.findIndex((_, k) => L > ends[k] + 10); if (r < 0) r = 0;
    ends[r] = L + w;
    return { e, i, x, y: yOf(x), row: ROWS[r], up: ROWS[r] < 162, edge };
  });
  const leaders = pts.map(p => `<line class="leader" style="--i:${p.i}" x1="${p.x.toFixed(1)}" x2="${p.x.toFixed(1)}" y1="${(p.up ? p.y - 12 : p.y + 12).toFixed(1)}" y2="${p.up ? p.row + 16 : p.row - 16}" pathLength="1"/>`).join('');
  const stations = pts.map(({ e, i, x, y }) => `<a class="stn ${e.status}" href="#/event/${e.id}" style="${P(x, y)};--c:var(--st-${e.status});--i:${i}"><span class="dot"></span></a>`).join('');
  const tags = pts.map(({ e, i, x, row, edge }) => { return `<a class="stag ${edge}" href="#/event/${e.id}" style="${P(x, row)};--i:${i}"><b>${e.name}</b><small>${fmtRange(e)} · ${STATUS[e.status]}</small></a>`; }).join('');
  const regs = evs.filter(e => (e.status === 'interested' || e.status === 'planning') && e.regOpens >= '2026-11-01').map((e, i) => { const x = xOf(e.regOpens); return `<span class="reg-d" title="Registration opens ${fmtDate(e.regOpens)} — ${e.name}" style="${P(x, yOf(x))};--i:${i}"></span>`; }).join('');
  return `<div class="card trail-card">
    <div class="th"><span class="mono">Nov ’26 → Oct ’27 · ${evs.length} stops</span><span class="mono mobile-only">Swipe the trail →</span></div>
    <div class="trail-scroll"><div class="trail-map">
      <svg viewBox="0 0 ${W} ${H}"><path class="path-base" d="${d}"/><path class="path-walk" d="${d}" pathLength="1"/>${leaders}</svg>
      ${months}${regs}
      <span class="you" style="${P(x0, yOf(x0))}"><i></i><span>You are here</span></span>
      ${stations}${tags}
    </div></div>
    <div class="legend">${['registered', 'planning', 'interested', 'waitlisted'].map(s => `<span style="--c:var(--st-${s})"><i></i>${STATUS[s]}</span>`).join('')}<span><i style="background:none;border-radius:2px;transform:rotate(45deg) scale(.8);box-shadow:inset 0 0 0 2px var(--st-planning)"></i>Registration opens</span></div>
  </div>`;
}

// ═══════════════════════════════════════════════
//  HOME
// ═══════════════════════════════════════════════
function greeting() { const h = new Date().getHours(); return h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening'; }
function viewHome() {
  const up = upcoming().filter(e => e.status !== 'withdrew');
  const next = up[0], nc = course(next.courses[0]);
  const season = up.reduce((a, e) => { a.cost += costFor(e).total; a.mi += (e.drive?.fromHome?.mi || 0) * 2; return a; }, { cost: 0, mi: 0 });
  const todos = [];
  EVENTS.filter(e => e.status === 'played').forEach(e => { const n = (e.roundLog || []).length; todos.push({ c: 'var(--st-played)', t: `Finish ${e.name}`, s: (e.rounds || 0) > n ? `Round ${n + 1} and notes still missing` : 'Add notes to mark it recorded', w: 'Now', href: '#/event/' + e.id }); });
  up.filter(e => e.regOpens && daysUntil(e.regOpens) > 0 && daysUntil(e.regOpens) < 130).slice(0, 2).forEach(e => todos.push({ c: 'var(--st-planning)', t: `Register · ${e.name}`, s: `Opens ${fmtDate(e.regOpens)}${e.remind ? ' · reminder set' : ''}`, w: `${daysUntil(e.regOpens)} days`, href: '#/event/' + e.id }));
  up.filter(e => e.status === 'waitlisted').forEach(e => todos.push({ c: 'var(--st-waitlisted)', t: `Waitlist · ${e.name}`, s: `You're #${e.waitlistPos}`, w: fmtDate(e.start), href: '#/event/' + e.id }));

  const html = `
  ${pagehead([fmtDow('2026-11-01'), 'Off-season · wk 44'], [`${greeting()},`, '<em>Max.</em>'], `<button class="icon-btn mobile-only" aria-label="Notifications">${I('bell', 'sm')}</button>`)}
  <div class="home-grid">
    <section class="full">
      ${secH(1, 'Next tee')}
      <a class="hero rv" href="#/event/${next.id}" data-vt="event-${next.id}">
        <div class="art">${art(nc, { fly: true, dot: .5 })}${marks(nc)}</div>
        <button class="replay" data-act="replay">${I('replay', 'xs')}Replay flight</button>
        <div class="hero-panel">${topo('hero', 'rgba(242,237,225,.09)', 12)}
          <span class="mono">${fmtRange(next)} · <b>${next.city}</b></span>
          <h3>${emLast(next.name)}</h3>
          <div class="count"><span class="num" data-count="${daysUntil(next.start)}" data-from="${daysUntil(next.start) + 60}">${daysUntil(next.start)}</span><span class="cap">days to<br>the first tee</span></div>
          <div class="foot">${statusChip(next)}${tierChip(next)}<span class="bell">${I('bell', 'xs')}Reg opens ${fmtDate(next.regOpens)}</span></div>
        </div>
      </a>
    </section>

    <section class="sec">${secH(2, 'The <em>climb</em>')}${climb()}</section>

    <section class="sec">
      ${secH(3, 'Ledger', `<a href="#/schedule">Season ${I('arrowR', 'xs')}</a>`)}
      <div class="card ledger rv">
        <div class="row"><span class="k">Events planned</span><span class="dots"></span><span class="num" data-count="${up.length}">${up.length}</span></div>
        <div class="row"><span class="k">Signed up</span><span class="dots"></span><span class="num" data-count="${up.filter(e => e.status === 'registered').length}">0</span></div>
        <div class="row"><span class="k">Est. season cost</span><span class="dots"></span><span class="num" data-count="${Math.round(season.cost)}" data-pre="$">${money(season.cost)}</span></div>
        <div class="row"><span class="k">Road miles</span><span class="dots"></span><span class="num"><span data-count="${season.mi}">${season.mi.toLocaleString()}</span><small>mi</small></span></div>
      </div>
    </section>

    <section class="sec full">${secH(4, 'Season <em>trail</em>', `<a href="#/schedule/map">Map ${I('arrowR', 'xs')}</a>`)}${trail(up)}</section>

    <section class="sec">
      ${secH(5, 'Before the <em>next round</em>')}
      <div class="card list" data-stagger>${todos.map(t => `<a class="todo lrow" href="${t.href}" style="--c:${t.c}"><span class="check">${I('check', 'xs')}</span><div class="body"><b>${t.t}</b><span>${t.s}</span></div><span class="when">${t.w}</span></a>`).join('')}</div>
    </section>

    <section class="sec">
      ${secH(6, 'League <em>nights</em>', `<a href="#/results/leagues">All ${I('arrowR', 'xs')}</a>`)}
      <div class="card list" data-stagger>
        ${LEAGUES.map(l => { const last = LEAGUE_ROUNDS.find(r => r.league === l.id); return `<div class="lrow"><span class="league-chip" style="background:${l.color}"></span><div class="body"><div class="name">${l.name}</div><div class="meta">${l.when}<span class="dot"></span>Next ${fmtDate(l.next)}</div></div><div class="end">${sc(last.score, last.par)}<small>Last · ${ord(last.place)}</small></div></div>`; }).join('')}
        <div style="padding:6px 16px 16px"><button class="btn block" data-act="add-round" data-league="l1">${I('plus', 'xs')}Log Tuesday's round</button></div>
      </div>
    </section>

    <section class="sec full">
      ${secH(7, 'Scorecard', `<a href="#/results">All results ${I('arrowR', 'xs')}</a>`)}
      <div class="card list">${scHead()}<div data-stagger>${past().slice(0, 4).map(resultRow).join('')}</div></div>
    </section>
  </div>`;
  return { html, top: { title: 'Home', right: `<button class="icon-btn" ${sm}>${I('bell', 'xs')}</button>` } };
}

const scHead = () => `<div class="sc-head"><span></span><span>Event</span><span class="cells" style="display:flex;gap:4px">${['R1', 'R2', 'R3'].map(r => `<span style="min-width:34px;text-align:center">${r}</span>`).join('')}</span><span class="tot">Total</span><span style="width:46px;text-align:center">Fin.</span></div>`;
function resultRow(e) {
  const r = e.result || {}, rounds = e.roundLog || [];
  const tot = rounds.reduce((a, x) => ({ s: a.s + x.score, p: a.p + x.par }), { s: 0, p: 0 });
  let cells, total;
  if (e.format === 'match-play') {
    const rec = matchRecord(e);
    cells = (e.matches || []).slice(0, 3).map(m => { const t = holeTally(m.holes); return `<span class="sc ${t.res === 'W' ? 'under' : t.res === 'L' ? 'over' : 'even'}" style="font-family:var(--mono);font-size:11px">${t.res}</span>`; }).join('');
    total = `<span class="num" style="font-size:19px">${rec.w}–${rec.l}–${rec.p}</span><small>W–L–P</small>`;
  } else {
    cells = Array.from({ length: 3 }, (_, i) => rounds[i] ? sc(rounds[i].score, rounds[i].par) : i < (e.rounds || rounds.length) ? `<span class="sc blank">—</span>` : `<span class="sc" style="visibility:hidden">·</span>`).join('');
    total = rounds.length ? `${sc(tot.s, tot.p)}<small>${rounds.length} rds</small>` : '';
  }
  return `<a class="sc-row" href="#/event/${e.id}" data-vt="event-${e.id}">
    ${thumb(e.courses[0])}
    <div style="min-width:0"><div class="name">${e.name}</div><div class="meta">${fmtDateY(e.start)}<span class="dot"></span>${FORMAT[e.format]}${e.status === 'played' ? '<span class="dot"></span><span style="color:var(--st-played);font-weight:650">Needs details</span>' : ''}</div></div>
    <div class="cells">${cells}</div>
    <div class="tot">${total}</div>
    <div class="place">${medal(r.place)}<span class="num">${ordSup(r.place)}</span></div>
  </a>`;
}

// ═══════════════════════════════════════════════
//  SCHEDULE
// ═══════════════════════════════════════════════
const SCHED_FILTERS = ['all', 'registered', 'planning', 'interested', 'waitlisted'];
const seg = (items, cur, act) => `<div class="seg"><span class="seg-ind"></span>${items.map(([k, label, icon]) => `<button class="${cur === k ? 'on' : ''}" data-act="${act}" data-val="${k}">${icon ? I(icon, 'sm') : ''}${label}</button>`).join('')}</div>`;
const stamp = (e, extra = '') => e.status === 'registered' ? `<span class="stamp ${extra}" ${extra ? 'data-slam' : ''}>Registered<small>Confirmed entry</small></span>`
  : e.status === 'waitlisted' ? `<span class="stamp waitlisted ${extra}" ${extra ? 'data-slam' : ''}>Waitlist<small>Position #${e.waitlistPos}</small></span>` : '';

function viewSchedule() {
  const all = upcoming(), list = all.filter(e => UI.schedFilter === 'all' || e.status === UI.schedFilter);
  const live = all.filter(e => e.status !== 'withdrew');
  const tot = live.reduce((a, e) => { a.cost += costFor(e).total; a.mi += (e.drive?.fromHome?.mi || 0) * 2; return a; }, { cost: 0, mi: 0 });
  const mode = UI.schedMode;
  let html = `${pagehead(['Nov ’26 — Oct ’27', `${live.length} events`], ['2027', '<em>season</em>'], `<button class="icon-btn" data-act="new-event" aria-label="Add event">${I('plus', 'sm')}</button>`)}
  <div class="tally rv">
    <div><span class="mono">Events</span><span class="num" data-count="${live.length}">${live.length}</span></div>
    <div><span class="mono">Signed up</span><span class="num" data-count="${live.filter(e => e.status === 'registered').length}">0</span></div>
    <div><span class="mono">Est. cost</span><span class="num" data-count="${Math.round(tot.cost)}" data-pre="$">${money(tot.cost)}</span></div>
    <div><span class="mono">Miles</span><span class="num" data-count="${tot.mi / 1000}" data-dec="1" data-suf="k">${(tot.mi / 1000).toFixed(1)}k</span></div>
  </div>
  <div class="controls">
    ${seg([['list', 'Tickets', 'list'], ['cal', 'Calendar', 'calendar'], ['map', 'Map', 'map']], mode, 'mode')}
    ${mode !== 'cal' ? `<div class="pills">${SCHED_FILTERS.map(f => `<button class="pill ${UI.schedFilter === f ? 'on' : ''}" data-act="filter" data-val="${f}">${f === 'all' ? 'All' : STATUS[f]}<span class="n">${f === 'all' ? all.length : all.filter(e => e.status === f).length}</span></button>`).join('')}</div>` : ''}
  </div>`;
  const top = { title: '2027 season', right: `<button class="icon-btn" ${sm} data-act="new-event">${I('plus', 'xs')}</button>` };
  if (mode === 'cal') return { html: html + calendarView(all), top };
  if (mode === 'map') return {
    html: html + `<div class="map-wrap"><div class="map rv" id="season-map"></div>
      <div class="card list">
        <div class="map-tools"><div><b style="font-size:14.5px">Drive times</b><div class="meta">From home · ${HOME.city}</div></div><button class="switch ${UI.drive ? 'on' : ''}" data-act="drive-toggle" aria-label="Show drive times"></button></div>
        <div data-stagger>${list.map(e => `<button class="lrow" data-act="fly-to" data-id="${e.id}">${thumb(e.courses[0], 'sm')}<div class="body"><div class="name">${e.name}</div><div class="meta">${fmtRange(e)}<span class="dot"></span>${e.drive?.fromHome?.time || ''}</div></div>${statusChip(e)}</button>`).join('')}</div>
      </div></div>`, top, after: () => seasonMap(list),
  };
  const groups = {};
  list.forEach(e => (groups[e.start.slice(0, 7)] = groups[e.start.slice(0, 7)] || []).push(e));
  const body = Object.keys(groups).map(k => {
    const [y, m] = k.split('-').map(Number), cost = groups[k].reduce((a, e) => a + costFor(e).total, 0);
    return `<div class="tl-month"><h4>${MON[m - 1]}<span>${y}</span></h4><span class="mono">${money(cost)} est.</span></div><div data-stagger>${groups[k].map(ticketCard).join('')}</div>`;
  }).join('');
  return { html: html + (body ? `<div class="tl"><span class="fill"></span>${body}</div>` : `<div class="card" style="margin-top:20px;padding:28px;text-align:center"><p class="muted">No events with this status.</p></div>`), top };
}

function ticketCard(e) {
  const d = D(e.start), c = costFor(e), reg = e.regOpens ? daysUntil(e.regOpens) : null;
  let note = '';
  if (e.status === 'interested' || e.status === 'planning') note = reg > 0 ? `<span class="reg-note">${I('bell', 'xs')}Reg opens ${fmtDate(e.regOpens)}${e.remind ? ' · reminder on' : ''}</span>` : `<span class="reg-note open">${I('check', 'xs')}Registration open</span>`;
  return `<a class="ticket-wrap" href="#/event/${e.id}" data-vt="event-${e.id}"><div class="ticket">
    <div class="stub"><div class="art">${art(course(e.courses[0]))}</div><div class="date"><span class="m">${MON[d.getMonth()].toUpperCase()}</span><b>${d.getDate()}</b><span>${e.start === e.end ? DOW[d.getDay()].toUpperCase() : (D(e.end) - d) / 864e5 + 1 + ' DAYS'}</span></div></div>
    <div class="tb">
      <span class="serial">Admit ${e.format === 'singles' ? 'one' : e.format === 'triples' ? 'three' : e.format === 'match-play' ? 'team' : 'two'} · ${FORMAT[e.format]}${e.division ? ' · ' + e.division : ''}</span>
      <div class="top"><div class="name">${e.name}</div><div class="cost"><b>${money(c.total)}</b><small>EST.</small></div></div>
      <div class="meta">${I('pin', 'xs')}${e.city}<span class="dot"></span>${I('car', 'xs')}${e.drive?.fromHome?.time}</div>
      <div class="chips">${statusChip(e)}${tierChip(e)}</div>
      ${note}
    </div></div>${stamp(e)}</a>`;
}

function calendarView(all) {
  const evDay = {}, regDay = {};
  all.forEach(e => {
    for (let d = D(e.start); d <= D(e.end); d = new Date(d.getTime() + 864e5)) evDay[d.toISOString().slice(0, 10)] = e;
    if (e.regOpens && e.regOpens >= '2027') regDay[e.regOpens] = e;
  });
  const cells = Array.from({ length: 10 }, (_, m) => {
    const y = 2027, first = new Date(y, m, 1), n = new Date(y, m + 1, 0).getDate();
    let html = ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => `<span class="dow">${d}</span>`).join('');
    for (let i = 0; i < first.getDay(); i++) html += '<span></span>';
    const here = new Set();
    for (let d = 1; d <= n; d++) {
      const iso = `${y}-${pad2(m + 1)}-${pad2(d)}`, dow = new Date(y, m, d).getDay(), e = evDay[iso], r = regDay[iso];
      if (e) here.add(e);
      html += e ? `<a class="day ev-day" style="--c:var(--st-${e.status})" href="#/event/${e.id}" title="${e.name}">${d}</a>`
        : r ? `<a class="day reg" href="#/event/${r.id}" title="Registration opens: ${r.name}"><span>${d}</span></a>`
        : `<span class="day ${dow === 0 || dow === 6 ? 'we' : ''}">${d}</span>`;
    }
    const regs = Object.values(regDay).filter(e => +e.regOpens.slice(5, 7) === m + 1);
    const items = [...here].map(e => `<a href="#/event/${e.id}" style="--c:var(--st-${e.status})"><i></i>${e.name}</a>`).concat(regs.map(e => `<a href="#/event/${e.id}" style="color:var(--muted)"><i style="background:none;border-radius:1px;transform:rotate(45deg);box-shadow:inset 0 0 0 1.5px var(--st-planning)"></i>Reg · ${e.name}</a>`)).join('');
    return `<div class="card mini"><h5>${MON[m]}<span>${here.size ? here.size + (here.size > 1 ? ' EVENTS' : ' EVENT') : ''}</span></h5><div class="days">${html}</div>${items ? `<div class="evs">${items}</div>` : ''}</div>`;
  }).join('');
  return `<div class="cal-grid" data-stagger>${cells}</div><div class="legend" style="margin-top:16px">${['registered', 'planning', 'interested', 'waitlisted'].map(s => `<span style="--c:var(--st-${s})"><i></i>${STATUS[s]}</span>`).join('')}<span><i style="background:none;border-radius:1px;transform:rotate(45deg) scale(.85);box-shadow:inset 0 0 0 1.5px var(--st-planning)"></i>Registration opens</span></div>`;
}

// ── Maps ──
function tiles() {
  const base = prefs.theme === 'dark' ? 'World_Dark_Gray_Base' : 'World_Light_Gray_Base';
  return L.tileLayer(`https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/${base}/MapServer/tile/{z}/{y}/{x}`, { attribution: 'Tiles © Esri', maxZoom: 16 });
}
const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const homeIcon = () => L.divIcon({ className: '', html: `<div class="pin-home">${I('home')}</div>`, iconSize: [30, 30], iconAnchor: [15, 15] });
const baseIcon = () => L.divIcon({ className: '', html: `<div class="pin-home base">${I('bed')}</div>`, iconSize: [30, 30], iconAnchor: [15, 15] });
const courseIcon = () => L.divIcon({ className: '', html: `<div class="pin-course">${I('basket')}</div>`, iconSize: [28, 28], iconAnchor: [14, 14] });
const evIcon = (e, i) => L.divIcon({ className: '', html: `<div class="pin" style="--c:var(--st-${e.status});--d:${(i * .09 + .25).toFixed(2)}s"><span>${MON[D(e.start).getMonth()].toUpperCase()}</span></div>`, iconSize: [34, 34], iconAnchor: [17, 40] });
let seasonMapRef = null, seasonMarkers = {};
function seasonMap(list) {
  const el = $('season-map'); if (!el) return;
  const m = L.map(el, { zoomControl: false, scrollWheelZoom: false }); maps.push(m); seasonMapRef = m; seasonMarkers = {};
  tiles().addTo(m); L.control.zoom({ position: 'topright' }).addTo(m);
  L.marker([HOME.lat, HOME.lng], { icon: homeIcon(), zIndexOffset: 1000 }).addTo(m).bindTooltip('Home', { className: 'tip', direction: 'top', offset: [0, -16] });
  const pts = [[HOME.lat, HOME.lng]];
  list.forEach((e, i) => {
    pts.push([e.lat, e.lng]);
    const line = L.polyline([[HOME.lat, HOME.lng], [e.lat, e.lng]], { color: cssVar('--st-' + e.status), weight: 2.5, opacity: .85, dashArray: '2 7', lineCap: 'round', className: UI.drive ? 'ants' : '' }).addTo(m);
    if (UI.drive && e.drive?.fromHome) line.bindTooltip(`${e.drive.fromHome.time} · ${e.drive.fromHome.mi} mi`, { permanent: true, className: 'drive', direction: 'center' });
    seasonMarkers[e.id] = L.marker([e.lat, e.lng], { icon: evIcon(e, i), riseOnHover: true }).addTo(m).bindTooltip(`<b>${e.name}</b><br>${fmtRange(e)}`, { className: 'tip', direction: 'top', offset: [0, -44] }).on('click', () => go('#/event/' + e.id));
  });
  m.fitBounds(pts, { padding: [40, 40] });
}
function eventMiniMap(e) {
  const el = $('mini-map'); if (!el) return;
  const m = L.map(el, { zoomControl: false, attributionControl: false, scrollWheelZoom: false, dragging: !L.Browser.mobile }); maps.push(m);
  tiles().addTo(m);
  const origin = e.lodging ? [e.lodging.lat, e.lodging.lng] : [HOME.lat, HOME.lng];
  L.marker(origin, { icon: e.lodging ? baseIcon() : homeIcon(), zIndexOffset: 1000 }).addTo(m);
  const pts = [origin];
  e.courses.forEach(cid => {
    const c = course(cid), leg = e.drive?.toCourses?.[cid]; pts.push([c.lat, c.lng]);
    const line = L.polyline([origin, [c.lat, c.lng]], { color: cssVar('--disc'), weight: 2.5, dashArray: '2 7', lineCap: 'round', className: 'ants' }).addTo(m);
    if (leg) line.bindTooltip(leg.time, { permanent: true, className: 'drive', direction: 'center' });
    L.marker([c.lat, c.lng], { icon: courseIcon() }).addTo(m).bindTooltip(c.name, { className: 'tip', direction: 'top', offset: [0, -14] });
  });
  if (pts.length > 1) m.fitBounds(pts, { padding: [50, 50], maxZoom: 10 }); else m.setView(origin, 10);
}

// ═══════════════════════════════════════════════
//  EVENT DETAIL
// ═══════════════════════════════════════════════
const STEPS = ['interested', 'planning', 'registered', 'played', 'recorded'];
const STEP_NOTE = {
  interested: e => e.regOpens && daysUntil(e.regOpens) > 0 ? `On the radar. Registration opens ${fmtDate(e.regOpens)}.` : 'On the radar.',
  planning: e => e.regOpens && daysUntil(e.regOpens) > 0 ? `Registration opens ${fmtDate(e.regOpens)} — ${daysUntil(e.regOpens)} days.` : 'Registration is open — go sign up.',
  registered: e => `You're in. ${daysUntil(e.start)} days to go.`,
  waitlisted: e => `#${e.waitlistPos} on the waitlist.`,
  withdrew: () => 'You withdrew from this event.',
  played: e => `Played — add ${(e.rounds || 0) > (e.roundLog || []).length ? 'the remaining rounds' : 'notes'} to finish it.`,
  recorded: () => 'Rounds and notes are in. Complete.',
};
function banner(c, { plateLabel, right, title, foot, back, vtKey }) {
  return `<div class="banner" data-vt="${vtKey}">
    <div class="art">${art(c, { dot: .4 })}${marks(c, true)}</div>
    <div class="floating"><a class="icon-btn" href="${back}" aria-label="Back">${I('chevL')}</a><button class="icon-btn" data-act="toast" data-msg="Editing isn't in the sample" aria-label="Edit">${I('edit', 'sm')}</button></div>
    <div class="legend-box"><div class="lh"><span class="mono">${plateLabel}</span><span class="mono">${right}</span></div><h2 data-sentinel>${emLast(title)}</h2><div class="lf">${foot}</div></div>
  </div>`;
}
function viewEvent(id) {
  const e = event(id), up = isUpcoming(e), c0 = course(e.courses[0]), back = up ? '#/schedule' : '#/results';
  const head = banner(c0, {
    plateLabel: `${plateNo(c0.id)} · ${c0.name}`, right: coords(e.lat, e.lng), title: e.name, back, vtKey: 'event-' + e.id,
    foot: `<span class="meta" style="color:var(--ink-2);font-weight:600">${fmtRange(e)}${up ? '' : ', ' + e.start.slice(0, 4)} · ${e.city}</span><span class="chips">${tierChip(e)}${fmtChip(e)}</span>`,
  });
  let left, right;
  if (up) { left = [regTicket(e), statusCard(e), coursesCard(e), teamCard(e)]; right = [travelCard(e), receipt(e)]; }
  else {
    const nudge = e.status === 'played' ? `<div class="nudge-card"><span class="ic-tile">${I('note', 'sm')}</span><div><b>Almost recorded</b><span>${STEP_NOTE.played(e)}</span></div></div>` : '';
    left = [nudge, resultStrip(e), e.format === 'match-play' ? matchesCard(e) : scorecard(e), notesCard(e)];
    right = [statusCard(e), teamCard(e), coursesCard(e), receipt(e)];
  }
  const wrap = arr => arr.filter(Boolean).map((h, i) => `<div class="rv" style="--i:${i}">${h}</div>`).join('');
  return { html: `${head}<div class="detail-grid"><div class="col">${wrap(left)}</div><div class="col">${wrap(right)}</div></div>`, top: { title: e.name, left: `<a class="icon-btn" ${sm} href="${back}">${I('chevL', 'sm')}</a>` }, after: up ? () => eventMiniMap(e) : null };
}
function regTicket(e) {
  const d = D(e.start), reg = daysUntil(e.regOpens);
  return `<div class="ticket-wrap reg-ticket"><div class="ticket">
    <div class="stub">${topo('stub' + e.id, 'rgba(242,237,225,.12)', 10)}<span class="m">${MON[d.getMonth()].toUpperCase()}</span><b>${d.getDate()}</b><span class="d">${e.start === e.end ? DOW[d.getDay()].toUpperCase() : 'THRU ' + D(e.end).getDate()}</span><span class="admit">ADMIT ${e.format === 'singles' ? 'ONE' : e.format === 'triples' ? 'THREE' : 'TWO'}</span></div>
    <div class="tb">
      <div class="kv"><div><div class="k">Registration ${reg > 0 ? 'opens' : 'opened'}</div><div class="v">${fmtDateY(e.regOpens)} <span class="reg-note ${reg > 0 ? '' : 'open'}" style="margin-left:4px">${reg > 0 ? 'in ' + reg + ' days' : 'open'}</span></div></div></div>
      <div class="kv"><div><div class="k">Entry fee</div><div class="v">${money(e.fee)}${e.feeSplit ? ` <span class="muted" style="font-weight:500;font-size:13px">/ team · ${money(e.fee / e.feeSplit)} yours</span>` : ''}</div></div></div>
      ${reg > 0 ? `<div class="remind">${I('bell', 'sm bell' + (UI.ring === e.id ? ' ring' : ''))}<div><b>Notify me when it opens</b><small>Push at 8:00 AM on ${fmtDate(e.regOpens)}</small></div><button class="switch ${e.remind ? 'on' : ''}" data-act="remind" data-id="${e.id}" aria-label="Reminder"></button></div>`
        : `<div class="kv"><button class="btn sm" data-act="toast" data-msg="Would open the PDGA / Disc Golf Scene page">${I('external', 'xs')}Event page</button></div>`}
    </div></div>${stamp(e, UI.pulse === e.id ? 'slam' : '')}</div>`;
}
function statusCard(e) {
  const cur = e.status === 'waitlisted' ? 2 : STEPS.indexOf(e.status);
  return `<div class="card">
    <div class="ph"><h3>Status</h3>${statusChip(e)}</div>
    <div class="stations pre" style="--sc:var(--st-${e.status});--p:${Math.max(cur, 0) / 4}"><span class="prog"></span>${STEPS.map((s, i) => `<button class="st ${i <= cur ? 'done' : ''} ${i === cur ? 'cur' : ''}" style="--i:${i}" data-act="status" data-id="${e.id}" data-val="${s}"><span class="o"></span><span class="lb">${i === 2 && e.status === 'waitlisted' ? 'Waitlist' : STATUS[s]}</span></button>`).join('')}</div>
    <div class="step-foot"><span>${STEP_NOTE[e.status](e)}</span>${isUpcoming(e) && e.status !== 'waitlisted' ? `<button class="btn sm" data-act="status" data-id="${e.id}" data-val="waitlisted">Waitlisted?</button>` : ''}</div>
  </div>`;
}
function coursesCard(e) {
  return `<div class="card"><div class="ph"><h3>${e.courses.length > 1 ? e.courses.length + ' courses' : 'Course'}</h3><span class="mono">Tap for the plate</span></div>
    <div class="pb" style="padding-top:8px">${e.courses.map(cid => { const c = course(cid), leg = e.drive?.toCourses?.[cid]; return `<a class="course-card" href="#/course/${cid}" data-vt="course-${cid}">${thumb(cid)}<div style="flex:1;min-width:0"><span class="mono" style="font-size:9.5px">${plateNo(cid)}</span><b style="display:block;font-size:15.5px;font-weight:650">${c.name}</b><div class="meta">${c.holes} holes<span class="dot"></span>Par ${c.par}</div></div>${leg ? `<span class="meta" style="color:var(--ink-2);font-weight:650">${I('car', 'xs')}${leg.time}</span>` : I('chevR', 'sm')}</a>`; }).join('')}</div></div>`;
}
function teamCard(e) {
  if (e.format === 'singles') return '';
  const label = e.format === 'match-play' ? 'Team' : e.format === 'triples' ? 'Teammates' : 'Partner';
  const names = e.format === 'match-play' ? [e.team] : e.partner.split(', ');
  return `<div class="card"><div class="ph"><h3>${label}</h3></div><div class="pb">${names.map(n => `<div class="kv"><span class="ic-tile" style="font-weight:700;font-size:12px;--c:var(--plum)">${n.split(' ').map(x => x[0]).join('').slice(0, 2)}</span><div><div class="v">${n}</div><div class="k">${e.format === 'match-play' ? `${e.holesPerMatch}-hole matches · holes won decide it` : 'Best shot · one team score'}</div></div></div>`).join('')}${e.feeSplit ? `<p class="meta" style="margin-top:8px">Entry split ${e.feeSplit} ways${e.lodging?.split > 1 ? ' · lodging split ' + e.lodging.split + ' ways' : ''}</p>` : ''}</div></div>`;
}
function travelCard(e) {
  const h = e.drive?.fromHome, stops = [`<div class="stop" style="--c:var(--disc)"><div><b>Home</b><small>${HOME.city}</small></div></div>`];
  if (e.lodging) {
    stops.push(`<div class="leg">${I('car', 'xs')}${h.time} · ${h.mi} mi</div>`);
    stops.push(`<div class="stop" style="--c:var(--plum)"><div><b>${e.lodging.name}</b><small>${e.lodging.type} · ${e.lodging.nights} night${e.lodging.nights > 1 ? 's' : ''} · home base</small></div></div>`);
    e.courses.forEach(cid => { const leg = e.drive.toCourses?.[cid]; stops.push(`<div class="stop" style="--c:var(--moss)"><div><b>${course(cid).name}</b><small>${leg ? leg.mi + ' mi from home base' : ''}</small></div><span class="t">${leg ? leg.time : ''}</span></div>`); });
  } else {
    stops.push(`<div class="leg">${I('car', 'xs')}Day trip</div>`);
    e.courses.forEach(cid => stops.push(`<div class="stop" style="--c:var(--moss)"><div><b>${course(cid).name}</b><small>${h.mi} mi from home</small></div><span class="t">${h.time}</span></div>`));
  }
  return `<div class="card"><div class="ph"><h3>Travel</h3>${!e.lodging && h.mi > 120 ? `<button class="btn sm" data-act="toast" data-msg="Adding a stay isn't in the sample">${I('bed', 'xs')}Add stay</button>` : ''}</div><div class="pb"><div class="trip"><span class="route"><i></i></span>${stops.join('')}</div><div class="minimap" id="mini-map"></div></div></div>`;
}
function receipt(e) {
  const c = costFor(e), up = isUpcoming(e);
  const parts = [
    { k: 'Entry', v: c.entry, note: e.feeSplit ? 'your share' : '', col: 'var(--moss)' },
    { k: 'Lodging', v: c.lodging, note: e.lodging ? `${e.lodging.nights} nt${e.lodging.split > 1 ? ' / split ' + e.lodging.split : ''}` : '', col: 'var(--plum)' },
    { k: 'Gas', v: c.gas, note: `${(e.drive?.fromHome?.mi || 0) * 2} mi`, col: 'var(--st-planning)' },
  ].filter(p => p.v > 0);
  const payout = e.result?.payout || 0, net = payout - c.total;
  return `<div class="receipt-wrap"><div class="receipt">
    <div class="rh"><b>${up ? 'Trip estimate' : 'Trip receipt'}</b><span>${e.name.split(' ').slice(0, 3).join(' ')} · ${fmtDate(e.start)}</span></div>
    ${parts.map((p, i) => `<div class="ln2" style="--i:${i}"><span>${p.k}</span>${p.note ? `<small>${p.note}</small>` : ''}<span class="lead"></span><span class="v">${money(p.v)}</span></div>`).join('')}
    ${payout ? `<div class="ln2 pay" style="--i:${parts.length}"><span>Payout</span><span class="lead"></span><span class="v">+${money(payout)}</span></div>` : ''}
    <div class="bars">${parts.map((p, i) => `<i style="flex:${p.v};background:${p.col};--i:${i}"></i>`).join('')}</div>
    <div class="totl"><span>${payout ? 'Net' : up ? 'Est. total' : 'Total'}</span><span class="num" ${payout ? '' : `data-count="${Math.round(c.total)}" data-pre="$"`}>${payout ? (net >= 0 ? '+' : '−') + money(Math.abs(net)) : money(c.total)}</span></div>
    <div class="thanks">${up ? '— See you on the tee —' : '— Thanks for playing —'}</div>
  </div></div>`;
}
function resultStrip(e) {
  const r = e.result;
  if (e.format === 'match-play') {
    const rec = matchRecord(e);
    return `<div class="card result-strip"><div><span class="mono">Team finish</span><span class="num">${ordSup(r.place)}</span><span class="meta">of ${r.field} teams</span></div><div><span class="mono">Your record</span><span class="num">${rec.w}–${rec.l}–${rec.p}</span><span class="meta">W–L–P</span></div><div><span class="mono">Holes won</span><span class="num" data-count="${(e.matches || []).reduce((a, m) => a + holeTally(m.holes).W, 0)}">0</span><span class="meta">of ${(e.matches || []).length * e.holesPerMatch}</span></div></div>`;
  }
  const rated = (e.roundLog || []).filter(x => x.rating), avg = rated.length ? Math.round(rated.reduce((a, x) => a + x.rating, 0) / rated.length) : null;
  return `<div class="card result-strip"><div><span class="mono">Finish</span><span class="num">${ordSup(r.place)}</span><span class="meta">of ${r.field}${r.unit ? ' ' + r.unit : ''}</span></div><div><span class="mono">Avg rating</span><span class="num" ${avg ? `data-count="${avg}" data-from="${avg - 80}"` : ''}>${avg || '—'}</span><span class="meta">${avg ? rated.length + ' rated rounds' : 'Not PDGA-rated'}</span></div><div><span class="mono">Payout</span><span class="num" style="${r.payout ? 'color:var(--good)' : ''}" ${r.payout ? `data-count="${r.payout}" data-pre="$"` : ''}>${r.payout ? money(r.payout) : '$0'}</span><span class="meta">${r.payout ? 'cashed' : 'no cash'}</span></div></div>`;
}
function scorecard(e) {
  const log = e.roundLog || [], n = Math.max(e.rounds || 0, log.length), cols = Array.from({ length: n }, (_, i) => log[i]);
  const tot = log.reduce((a, x) => ({ s: a.s + x.score, p: a.p + x.par }), { s: 0, p: 0 }), rated = log.some(r => r.rating);
  const cell = (r, f) => r ? f(r) : `<span class="muted">—</span>`;
  return `<div class="card scorecard">
    <div class="ph" style="padding-bottom:12px"><h3>Scorecard${e.format !== 'singles' ? ' <span class="mono">team score</span>' : ''}</h3><button class="btn sm" data-act="add-round" data-event="${e.id}">${I('plus', 'xs')}Round</button></div>
    <table>
      <tr><th>Round</th>${cols.map((_, i) => `<th>R${i + 1}</th>`).join('')}<th class="tot">Tot</th></tr>
      <tr><td>Course</td>${cols.map(r => `<td class="cname">${cell(r, r => course(r.course).name.split(' ')[0])}</td>`).join('')}<td class="tot"></td></tr>
      <tr><td>Par</td>${cols.map(r => `<td>${cell(r, r => r.par)}</td>`).join('')}<td class="tot">${tot.p || ''}</td></tr>
      <tr><td>Score</td>${cols.map(r => `<td>${r ? r.score : `<button class="addbtn" data-act="add-round" data-event="${e.id}" aria-label="Add round">${I('plus', 'xs')}</button>`}</td>`).join('')}<td class="tot"><b>${tot.s || ''}</b></td></tr>
      <tr><td>To par</td>${cols.map(r => `<td>${cell(r, r => sc(r.score, r.par))}</td>`).join('')}<td class="tot">${log.length ? sc(tot.s, tot.p) : ''}</td></tr>
      ${rated ? `<tr><td>Rating</td>${cols.map(r => `<td style="font-family:var(--mono);font-size:12px">${r && r.rating ? r.rating : '—'}</td>`).join('')}<td class="tot"></td></tr>` : ''}
    </table>
    ${e.format !== 'singles' ? `<p class="meta" style="padding:10px 18px 14px">${FORMAT[e.format]} rounds aren't PDGA-rated, so they stay out of your rating.</p>` : '<div style="height:12px"></div>'}
    ${e.status === 'recorded' ? `<span class="stamp recorded ${UI.pulse === e.id ? 'slam' : ''}" ${UI.pulse === e.id ? 'data-slam' : ''}>Recorded<small>${fmtDate(e.end)}</small></span>` : ''}
  </div>`;
}
function matchesCard(e) {
  return `<div class="card"><div class="ph"><h3>Matches</h3><button class="btn sm" data-act="add-match" data-event="${e.id}">${I('plus', 'xs')}Match</button></div>
    <div class="pb" style="padding-top:4px">${(e.matches || []).map((m, mi) => { const t = holeTally(m.holes); return `<div class="match" style="--m:${mi}"><div class="mh"><span class="res ${t.res}">${t.res}</span><div class="who"><b>vs ${m.opponent}</b><small>Match ${m.n} · ${m.oppTeam}</small></div><div class="tal"><span class="num">${t.W}–${t.L}</span><small>${t.P} PUSHED</small></div></div><div class="holes">${[...m.holes].map((x, h) => `<i class="${x}" style="--h:${h}" title="Hole ${h + 1}: ${{ W: 'won', L: 'lost', P: 'push' }[x]}"></i>`).join('')}</div></div>`; }).join('')}
    <div class="legend" style="margin-top:12px"><span><i style="background:var(--good)"></i>Won hole</span><span><i style="background:var(--line-2);height:3px;border-radius:2px"></i>Push</span><span><i style="background:none;border-radius:2px;box-shadow:inset 0 0 0 1.5px var(--bad)"></i>Lost hole</span></div></div></div>`;
}
function notesCard(e) {
  return `<div class="card"><div class="ph"><h3>Field notes</h3></div><div class="pb">${e.notes ? `<p class="notes-q">“${e.notes}”</p>` : `<button class="btn block" data-act="toast" data-msg="The notes editor isn't in the sample">${I('note', 'sm')}Add notes</button>`}</div></div>`;
}

// ═══════════════════════════════════════════════
//  COURSE DETAIL
// ═══════════════════════════════════════════════
function viewCourse(id) {
  const c = course(id), rounds = courseRounds(id), singles = rounds.filter(r => r.singles), rel = singles.map(r => r.score - r.par);
  const avgRel = rel.length ? rel.reduce((a, b) => a + b, 0) / rel.length : null;
  const best = rel.length ? Math.min(...rel) : null, rated = rounds.filter(r => r.rating);
  const evs = EVENTS.filter(e => e.courses.includes(id));
  let plot = '<p class="muted">No singles rounds yet.</p>';
  if (rel.length) {
    const lo = Math.min(...rel), hi = Math.max(lo + 4, Math.max(...rel)), keys = []; for (let k = lo; k <= hi; k++) keys.push(k);
    let n = 0;
    plot = `<div class="dots-plot"><div class="cols" style="grid-template-columns:repeat(${keys.length},1fr)">${keys.map(k => `<div>${rel.filter(v => v === k).map(() => `<i class="${k > 0 ? 'ov' : k === 0 ? 'ev' : ''}" style="--i:${n++}"></i>`).join('')}</div>`).join('')}</div><div class="axis" style="grid-template-columns:repeat(${keys.length},1fr)">${keys.map(k => `<span>${relTxt(k)}</span>`).join('')}</div></div>`;
  }
  const html = `
  ${banner(c, { plateLabel: `${plateNo(c.id)} · ${c.terrain}`, right: coords(c.lat, c.lng), title: c.name, back: '#/courses', vtKey: 'course-' + c.id, foot: `<span class="meta" style="color:var(--ink-2);font-weight:600">${c.city} · ${c.length}</span><span class="chips"><span class="chip">${c.holes} holes</span><span class="chip">Par ${c.par}</span></span>` })}
  <div class="notes-grid rv">
    <div><span class="mono">Rounds</span><span class="num" data-count="${rounds.length}">0</span></div>
    <div><span class="mono">Avg to par</span><span class="num">${avgRel === null ? '—' : `<span class="sc ${scCls(Math.round(avgRel))}">${avgRel < 0 ? '−' : avgRel > 0 ? '+' : ''}${Math.abs(avgRel).toFixed(1)}</span>`}</span></div>
    <div><span class="mono">Personal best</span><span class="num">${best === null ? '—' : scD(best)}</span></div>
    <div><span class="mono">Avg rating</span><span class="num" ${rated.length ? `data-count="${Math.round(rated.reduce((a, r) => a + r.rating, 0) / rated.length)}" data-from="880"` : ''}>${rated.length ? '' : '—'}</span></div>
  </div>
  <div class="detail-grid">
    <div class="col"><div class="card list rv"><div class="ph" style="padding-bottom:10px"><h3>Round history</h3><button class="btn sm" data-act="add-round" data-course="${id}">${I('plus', 'xs')}Round</button></div>
      <div data-stagger>${rounds.map(r => `<a class="lrow" href="${r.href}"><div class="body"><div class="name" style="font-size:14.5px">${r.label}</div><div class="meta">${fmtDateY(r.date)} · ${r.sub}</div></div><span class="mono">${r.rating || ''}</span><div class="end">${sc(r.score, r.par)}<small>${r.score} thr</small></div></a>`).join('') || '<p class="muted" style="padding:16px">No rounds yet.</p>'}</div>
    </div></div>
    <div class="col">
      <div class="card rv"><div class="ph"><h3>Score spread</h3><span class="mono">${singles.length} rounds</span></div><div class="pb">${plot}</div></div>
      <div class="card rv"><div class="ph"><h3>Events here</h3></div><div class="pb" style="padding-top:6px">${evs.map(e => `<a class="lrow" style="padding:11px 0" href="#/event/${e.id}"><div class="body"><div class="name" style="font-size:14.5px">${e.name}</div><div class="meta">${fmtDateY(e.start)}</div></div>${statusChip(e)}</a>`).join('') || '<p class="muted">None yet.</p>'}</div></div>
    </div>
  </div>`;
  return { html, top: { title: c.name, left: `<a class="icon-btn" ${sm} href="#/courses">${I('chevL', 'sm')}</a>` } };
}

// ═══════════════════════════════════════════════
//  RESULTS + ATLAS
// ═══════════════════════════════════════════════
function viewResults() {
  const tab = UI.resultsTab, p = past();
  const podiums = p.filter(e => e.result?.place <= 3).length;
  const rounds = p.reduce((a, e) => a + (e.roundLog || []).length + (e.matches || []).length, 0) + LEAGUE_ROUNDS.length;
  const gain = RATING_HISTORY[RATING_HISTORY.length - 1].r - RATING_HISTORY[0].r;
  let body;
  if (tab === 'leagues') {
    body = LEAGUES.map(l => {
      const rs = LEAGUE_ROUNDS.filter(r => r.league === l.id), avg = rs.reduce((a, r) => a + r.score - r.par, 0) / rs.length, net = rs.reduce((a, r) => a + r.cash - r.fee, 0);
      return `<section class="sec rv"><div class="card list">
        <div class="lrow" style="padding:16px">${thumb(l.course)}<div class="body"><div class="name" style="font-family:var(--display);font-size:22px;font-weight:520;letter-spacing:-.02em">${l.name}</div><div class="meta"><span style="width:8px;height:8px;border-radius:2px;background:${l.color}"></span>${course(l.course).name}<span class="dot"></span>${l.when}</div></div><button class="btn sm primary" data-act="add-round" data-league="${l.id}">${I('plus', 'xs')}Round</button></div>
        <div class="tally" style="border-top:var(--rule);grid-template-columns:repeat(3,1fr);padding:0 16px"><div><span class="mono">Rounds</span><span class="num">${rs.length}</span></div><div><span class="mono">Avg</span><span class="num">${avg < 0 ? '−' : '+'}${Math.abs(avg).toFixed(1)}</span></div><div><span class="mono">Net</span><span class="num" style="color:${net >= 0 ? 'var(--good)' : 'var(--ink-2)'}">${net >= 0 ? '+' : '−'}${money(Math.abs(net))}</span></div></div>
        <div data-stagger>${rs.map(r => `<div class="lrow"><div class="body"><div class="name" style="font-size:14.5px">${fmtDow(r.date)}</div><div class="meta">${ord(r.place)} of ${r.field}${r.cash ? `<span class="dot"></span><span style="color:var(--good);font-weight:650">+${money(r.cash)}</span>` : ''}</div></div><div class="end">${sc(r.score, r.par)}<small>${r.score} thr</small></div></div>`).join('')}</div>
      </div></section>`;
    }).join('');
  } else {
    const byYear = {};
    p.forEach(e => (byYear[e.start.slice(0, 4)] = byYear[e.start.slice(0, 4)] || []).push(e));
    body = Object.keys(byYear).sort().reverse().map(y => `<div class="year-h"><h4>${y}</h4><span class="rule"></span><span class="mono">${byYear[y].length} events</span></div><div class="card list">${scHead()}<div data-stagger>${byYear[y].map(resultRow).join('')}</div></div>`).join('');
  }
  const html = `${pagehead(['Tournaments · leagues', '2026 season'], ['Results'], `<button class="icon-btn" data-act="quick" aria-label="Add">${I('plus', 'sm')}</button>`)}
  <div class="review rv">${topo('review', 'rgba(242,237,225,.13)', 14)}
    <span class="mono">Season scorecard</span><h2>2026, <em>in review</em></h2>
    <div class="g"><div><span class="mono">Events</span><span class="num" data-count="${p.length}">0</span></div><div><span class="mono">Podiums</span><span class="num d" data-count="${podiums}">0</span></div><div><span class="mono">Rounds logged</span><span class="num" data-count="${rounds}">0</span></div><div><span class="mono">Rating climb</span><span class="num d" data-count="${gain}" data-pre="+">0</span></div></div>
  </div>
  <div style="margin-top:24px">${seg([['tournaments', 'Tournaments'], ['leagues', 'Leagues']], tab, 'rtab')}</div>${body}`;
  return { html, top: { title: 'Results' } };
}
function viewCourses() {
  const q = UI.q.toLowerCase(), list = COURSES.filter(c => !q || (c.name + c.city).toLowerCase().includes(q));
  const html = `${pagehead([`${COURSES.length} plates`, 'MI · IA · OH'], ['Course', '<em>atlas</em>'], `<button class="icon-btn" data-act="toast" data-msg="Adding courses isn't in the sample" aria-label="Add">${I('plus', 'sm')}</button>`)}
  <label class="search">${I('search', 'sm')}<input id="course-q" placeholder="Search by name or city" value="${UI.q}" autocomplete="off"></label>
  <div class="atlas" data-stagger>${list.map(c => {
    const all = courseRounds(c.id), rs = all.filter(r => r.singles), avg = rs.length ? rs.reduce((a, r) => a + r.score - r.par, 0) / rs.length : null;
    const nextEv = upcoming().find(e => e.courses.includes(c.id));
    return `<a class="plate-card" href="#/course/${c.id}" data-vt="course-${c.id}"><div class="frame"><div class="art">${art(c, { dot: .75 })}${marks(c)}</div>${nextEv ? `<span class="tag"><span class="chip">${I('calendar', 'xs')}${fmtDate(nextEv.start)}</span></span>` : ''}</div>
      <div class="cap"><span class="pl">${plateNo(c.id)}</span><b>${c.name}</b><span class="st3">${avg === null ? '<span class="mono">—</span>' : `<span class="sc ${scCls(Math.round(avg))}">${avg < 0 ? '−' : avg > 0 ? '+' : ''}${Math.abs(avg).toFixed(1)}</span>`}</span><span class="sub">${c.city} · ${c.holes} holes · par ${c.par} · ${all.length} rds</span></div></a>`;
  }).join('')}</div>`;
  return { html, top: { title: 'Course atlas' } };
}

// ═══════════════════════════════════════════════
//  SHEETS
// ═══════════════════════════════════════════════
let FORM = null;
function openSheet(kind, ctx = {}) {
  FORM = { kind, ...ctx };
  if (kind === 'round') initRoundForm();
  if (kind === 'match') FORM.holes = Array(event(FORM.event).holesPerMatch || 12).fill('');
  if (kind === 'event') Object.assign(FORM, { format: 'singles', pdga: true, status: 'interested', name: '', city: '', link: '' });
  const was = $('sheet').classList.contains('open');
  renderSheet(true);
  if (!was) { $('scrim').classList.add('open'); $('sheet').classList.add('open'); document.body.classList.add('sheet-open'); }
}
function closeSheet() { $('scrim').classList.remove('open'); $('sheet').classList.remove('open'); document.body.classList.remove('sheet-open'); $('sheet').style.removeProperty('--drag'); }
function lastWeekday(dow) { const d = new Date(TODAY); while (d.getDay() !== dow) d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); }
function initRoundForm() {
  const f = FORM; f.toPar = 0; f.rating = ''; f.notes = '';
  if (f.event) {
    const e = event(f.event), log = e.roundLog || [];
    f.n = log.length + 1;
    if (e.courses.length === 1) { f.course = e.courses[0]; f.why = 'auto'; }
    else { const use = id => log.filter(r => r.course === id).length, min = Math.min(...e.courses.map(use)), least = e.courses.filter(id => use(id) === min); f.course = least.length === 1 ? least[0] : null; f.why = least.length === 1 ? 'suggested' : 'pick'; }
    const days = []; for (let d = D(e.start); d <= D(e.end); d = new Date(d.getTime() + 864e5)) days.push(d.toISOString().slice(0, 10));
    f.days = days; const perDay = Math.ceil((e.rounds || days.length) / days.length);
    f.date = days[Math.min(days.length - 1, Math.floor((f.n - 1) / perDay))];
  } else if (f.league) { const l = league(f.league); f.course = l.course; f.why = 'league'; f.days = [lastWeekday(DOW.indexOf(l.when.slice(0, 3))), '2026-11-01']; f.date = f.days[0]; f.fee = 5; }
  else if (f.course) { f.why = ''; f.days = ['2026-11-01', '2026-10-31']; f.date = f.days[0]; }
}
function renderSheet(enter = false) {
  const sb = document.querySelector('#sheet .sb'), keep = sb && !enter ? sb.scrollTop : 0, f = FORM;
  const s = f.kind === 'quick' ? quickSheet() : f.kind === 'pick-event' ? pickEventSheet() : f.kind === 'round' ? roundSheet() : f.kind === 'match' ? matchSheet() : eventSheet();
  const sh = $('sheet'); sh.classList.toggle('enter', enter);
  sh.innerHTML = `<div class="grab"></div><div class="shd"><h3>${s.title}</h3><button class="icon-btn" data-act="sheet-close" aria-label="Close">${I('x', 'sm')}</button></div><div class="sb">${s.body}</div>${s.foot ? `<div class="sf">${s.foot}</div>` : ''}`;
  sh.querySelector('.sb').scrollTop = keep; f.tap = null;
}
function quickSheet() {
  const pending = EVENTS.find(e => e.status === 'played'), l = LEAGUES[0];
  return { title: 'Log something', body: `<div class="quick">
    ${pending ? `<button class="feature" data-act="add-round" data-event="${pending.id}"><span class="ic-tile">${I('note')}</span><div><b>Finish ${pending.name}</b><small>Round ${(pending.roundLog || []).length + 1} — course and date ready</small></div>${I('arrowR', 'sm chev')}</button>` : ''}
    <button data-act="pick-event"><span class="ic-tile">${I('trophy')}</span><div><b>Tournament round</b><small>Pick an event</small></div></button>
    <button data-act="add-round" data-league="${l.id}"><span class="ic-tile">${I('users')}</span><div><b>League round</b><small>${l.name}</small></div></button>
    <button data-act="new-event"><span class="ic-tile">${I('calendar')}</span><div><b>Event</b><small>Upcoming or past</small></div></button>
    <button data-act="toast" data-msg="Adding courses isn't in the sample"><span class="ic-tile">${I('course')}</span><div><b>Course</b><small>New plate</small></div></button></div>` };
}
function pickEventSheet() {
  return { title: 'Which event?', body: `<div class="card list" style="box-shadow:inset 0 0 0 1px var(--line)">${EVENTS.slice().sort((a, b) => b.start.localeCompare(a.start)).map(e => `<button class="lrow" data-act="${e.format === 'match-play' ? 'add-match' : 'add-round'}" data-event="${e.id}">${thumb(e.courses[0], 'sm')}<div class="body"><div class="name">${e.name}</div><div class="meta">${fmtDateY(e.start)}<span class="dot"></span>${FORMAT[e.format]}</div></div>${statusChip(e)}</button>`).join('')}</div>` };
}
function padInner() {
  const f = FORM, c = course(f.course), par = c ? c.par : 54, d = f.toPar;
  return { par, d, throws: par + d };
}
function roundSheet() {
  const f = FORM, e = f.event && event(f.event), l = f.league && league(f.league), c = f.course && course(f.course);
  const { par, d, throws } = padInner();
  const ctx = e ? `<div class="ctx">${thumb(e.courses[0], 'sm')}<div><span class="mono">Event</span><b>${e.name}</b></div><span class="lock">${I('lock', 'sm')}</span></div>`
    : l ? `<div class="ctx"><span class="league-chip" style="background:${l.color};margin:0 6px 0 4px"></span><div><span class="mono">League</span><b>${l.name}</b></div><span class="lock">${I('lock', 'sm')}</span></div>`
    : `<div class="ctx">${thumb(c.id, 'sm')}<div><span class="mono">Casual round</span><b>${c.name}</b></div></div>`;
  const options = e ? e.courses : [f.course];
  const why = { auto: `${I('check', 'xs')}Only course at this event`, suggested: `${I('sparkle', 'xs')}Least-played here so far`, pick: `<span class="hint sug">Pick one of ${e?.courses.length}</span>`, league: `${I('check', 'xs')}League home course` }[f.why] || '';
  const logged = e ? (e.roundLog || []).map(r => r.n) : [], rated = !e || e.format === 'singles';
  const body = `${ctx}
    ${e ? `<div class="field"><div class="lbl">Round<span class="hint">${I('check', 'xs')}Next unlogged</span></div><div class="choice compact">${Array.from({ length: Math.max(e.rounds || 1, f.n) }, (_, i) => i + 1).map(n => `<button class="${f.n === n ? 'on' : ''} ${logged.includes(n) ? 'done' : ''}" data-act="f-set" data-k="n" data-val="${n}">Round ${n}${logged.includes(n) ? ' ✓' : ''}</button>`).join('')}</div></div>` : ''}
    <div class="field"><div class="lbl">Course<span class="hint">${why}</span></div><div class="choice">${options.map(id => { const cc = course(id), used = e ? (e.roundLog || []).filter(r => r.course === id).map(r => 'R' + r.n).join(', ') : ''; return `<button class="${f.course === id ? 'on' : ''}" data-act="f-set" data-k="course" data-val="${id}">${thumb(id, 'sm')}<span>${cc.name}<small>Par ${cc.par}${used ? ' · played ' + used : ''}</small></span>${f.course === id ? `<span class="ck">${I('check')}</span>` : ''}</button>`; }).join('')}</div></div>
    <div class="field"><div class="lbl">Date${e ? `<span class="hint">${I('check', 'xs')}From event days</span>` : ''}</div><div class="choice compact">${(f.days || []).map(dd => `<button class="${f.date === dd ? 'on' : ''}" data-act="f-set" data-k="date" data-val="${dd}">${fmtDow(dd)}</button>`).join('')}</div></div>
    <div class="field"><div class="lbl">Score${e && e.format !== 'singles' ? ' · team' : ''}<span class="hint sug">Circle = under · box = over</span></div>
      <div class="pad"><button data-act="f-score" data-val="-1" aria-label="One fewer">−</button><div class="mid"><span class="shape ${scCls(d)}"></span><span class="val">${relTxt(d)}</span><span class="thr">${throws} throws · par ${par}</span></div><button data-act="f-score" data-val="1" aria-label="One more">+</button></div></div>
    ${rated ? `<div class="field"><div class="lbl">PDGA round rating<span class="hint sug">Optional · add later</span></div><input class="input" data-k="rating" inputmode="numeric" placeholder="e.g. 955" value="${f.rating}"></div>` : `<p class="meta" style="margin-top:16px">${FORMAT[e.format]} rounds aren't rated, so there's no rating field.</p>`}
    ${l ? `<div class="field two"><div><div class="lbl">Place</div><input class="input" data-k="place" inputmode="numeric" placeholder="3"></div><div><div class="lbl">Field</div><input class="input" data-k="field" inputmode="numeric" placeholder="24"></div><div><div class="lbl">Fee</div><input class="input" data-k="fee" inputmode="decimal" value="${f.fee}"></div><div><div class="lbl">Payout</div><input class="input" data-k="cash" inputmode="decimal" placeholder="0"></div></div>` : ''}
    <div class="field"><div class="lbl">Field notes</div><textarea class="input" data-k="notes" placeholder="Wind, putting, what clicked…">${f.notes}</textarea></div>`;
  return { title: e ? `Round ${f.n}` : l ? 'League round' : 'Casual round', body, foot: `<button class="btn" data-act="sheet-close">Cancel</button><button class="btn disc" data-act="save-round" ${f.course ? '' : 'disabled'}>Save round</button>` };
}
// update the score pad in place so the frame can morph between circle and square
function updatePad(dir) {
  const { par, d, throws } = padInner(), pad = document.querySelector('#sheet .pad');
  if (!pad) return renderSheet();
  pad.querySelector('.shape').className = 'shape ' + scCls(d);
  const v = pad.querySelector('.val'); v.textContent = relTxt(d); v.classList.remove('up', 'down'); void v.offsetWidth; v.classList.add(dir);
  pad.querySelector('.thr').textContent = `${throws} throws · par ${par}`;
}
function matchSheet() {
  const f = FORM, e = event(f.event), n = (e.matches || []).length + 1, t = holeTally(f.holes.join('')), played = f.holes.filter(Boolean).length;
  const body = `<div class="ctx">${thumb(e.courses[0], 'sm')}<div><span class="mono">${e.team}</span><b>${e.name}</b></div><span class="lock">${I('lock', 'sm')}</span></div>
    <div class="field two"><div><div class="lbl">Opponent</div><input class="input" data-k="opp" placeholder="Name" value="${f.opp || ''}"></div><div><div class="lbl">Their team</div><input class="input" data-k="oppTeam" placeholder="Team" value="${f.oppTeam || ''}"></div></div>
    <div class="field"><div class="lbl">Holes<span class="hint sug">Tap · win → push → loss</span></div>
      <div class="hole-grid">${f.holes.map((h, i) => `<button class="${h} ${f.tap === i ? 'tap' : ''}" data-act="f-hole" data-i="${i}"><small>${i + 1}</small>${h || '·'}</button>`).join('')}</div>
      <div class="live"><span>${t.W} won · ${t.P} pushed · ${t.L} lost</span><span class="num" style="color:${played ? (t.res === 'W' ? 'var(--good)' : 'var(--ink-2)') : 'var(--faint)'}">${played ? { W: `${t.W - t.L} up`, L: `${t.L - t.W} down`, P: 'All square' }[t.res] : '—'}</span></div></div>`;
  return { title: `Match ${n}`, body, foot: `<button class="btn" data-act="sheet-close">Cancel</button><button class="btn disc" data-act="save-match">Save match</button>` };
}
function eventSheet() {
  const F = FORM;
  const body = `<div class="field" style="margin-top:0"><div class="lbl">PDGA or Disc Golf Scene link<span class="hint sug">Optional</span></div><div style="display:flex;gap:8px"><input class="input" data-k="link" placeholder="Paste event URL" value="${F.link}"><button class="btn disc" data-act="autofill" style="height:50px;flex:none">${I('sparkle', 'sm')}Fill</button></div></div>
    <div class="field"><div class="lbl">Event name</div><input class="input" data-k="name" placeholder="e.g. Glass City Open" value="${F.name}"></div>
    <div class="field two"><div><div class="lbl">Starts</div><input class="input" type="date" data-k="start" value="${F.start || ''}"></div><div><div class="lbl">Ends</div><input class="input" type="date" data-k="end" value="${F.end || ''}"></div></div>
    <div class="field"><div class="lbl">Location</div><input class="input" data-k="city" placeholder="City, State" value="${F.city}"></div>
    <div class="field"><div class="lbl">Format</div><div class="choice compact">${Object.keys(FORMAT).map(k => `<button class="${F.format === k ? 'on' : ''}" data-act="f-set" data-k="format" data-val="${k}">${FORMAT[k]}</button>`).join('')}</div></div>
    ${F.format === 'doubles' || F.format === 'team-doubles' ? `<div class="field"><div class="lbl">Partner</div><input class="input" placeholder="Who are you throwing with?"></div>` : ''}
    ${F.format === 'triples' ? `<div class="field two"><div><div class="lbl">Teammate 1</div><input class="input"></div><div><div class="lbl">Teammate 2</div><input class="input"></div></div>` : ''}
    ${F.format === 'match-play' ? `<div class="field two"><div><div class="lbl">Your team</div><input class="input" placeholder="Team name"></div><div><div class="lbl">Holes per match</div><input class="input" inputmode="numeric" value="12"></div></div>` : ''}
    <div class="field"><div class="lbl">Sanctioning</div><div class="choice compact"><button class="${F.pdga ? 'on' : ''}" data-act="f-set" data-k="pdga" data-val="1">PDGA</button><button class="${!F.pdga ? 'on' : ''}" data-act="f-set" data-k="pdga" data-val="">Non-PDGA</button></div></div>
    ${F.pdga ? `<div class="field two"><div><div class="lbl">Tier</div><select class="input"><option>C-Tier</option><option selected>B-Tier</option><option>A-Tier</option><option>Major</option></select></div><div><div class="lbl">Division</div><select class="input"><option>MA1</option><option>MPO</option><option>MA2</option><option>MA40</option></select></div></div>` : ''}
    <div class="field"><div class="lbl">Status</div><div class="choice compact">${['interested', 'planning', 'registered', 'waitlisted'].map(s => `<button class="${F.status === s ? 'on' : ''}" data-act="f-set" data-k="status" data-val="${s}"><span class="status ${s}" style="background:none;padding:0">${STATUS[s]}</span></button>`).join('')}</div></div>
    <div class="field two"><div><div class="lbl">Entry fee</div><input class="input" inputmode="decimal" placeholder="$" value="${F.fee || ''}"></div><div><div class="lbl">Registration opens</div><input class="input" type="date" value="${F.regOpens || ''}"></div></div>`;
  return { title: 'New event', body, foot: `<button class="btn" data-act="sheet-close">Cancel</button><button class="btn disc" data-act="toast" data-msg="Sample only — event not saved" data-close="1">Save event</button>` };
}
(() => {
  let y0 = null, dy = 0, t0 = 0; const sh = $('sheet');
  sh.addEventListener('pointerdown', e => { if (innerWidth >= 720 || !e.target.closest('.grab, .shd') || e.target.closest('button')) return; y0 = e.clientY; dy = 0; t0 = performance.now(); sh.classList.add('dragging'); sh.setPointerCapture(e.pointerId); });
  sh.addEventListener('pointermove', e => { if (y0 === null) return; dy = Math.max(0, e.clientY - y0) + Math.min(0, e.clientY - y0) * .15; sh.style.setProperty('--drag', dy + 'px'); });
  const end = () => { if (y0 === null) return; y0 = null; sh.classList.remove('dragging'); if (dy > 140 || dy / (performance.now() - t0) > .6) closeSheet(); else sh.style.setProperty('--drag', '0px'); };
  sh.addEventListener('pointerup', end); sh.addEventListener('pointercancel', end);
})();

// ═══════════════════════════════════════════════
//  EVENTS
// ═══════════════════════════════════════════════
function toast(msg) { const t = $('toast'); t.innerHTML = I('check', 'sm') + msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2600); }
function slideSeg(btn, then) { const s = btn.closest('.seg'); s.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === btn)); placeSeg(s); setTimeout(then, REDUCED ? 0 : 230); }
document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-act]');
  if (el) {
    ev.preventDefault(); ev.stopPropagation();
    const act = el.dataset.act, d = el.dataset;
    switch (act) {
      case 'mode': slideSeg(el, () => { UI.schedMode = d.val; history.replaceState(null, '', '#/schedule/' + d.val); render({ keepScroll: true }); }); break;
      case 'rtab': slideSeg(el, () => { UI.resultsTab = d.val; history.replaceState(null, '', '#/results/' + d.val); render({ keepScroll: true }); }); break;
      case 'filter': UI.schedFilter = d.val; render({ keepScroll: true }); break;
      case 'drive-toggle': UI.drive = !UI.drive; el.classList.toggle('on', UI.drive); setTimeout(() => render({ keepScroll: true }), 200); break;
      case 'fly-to': { const e = event(d.id); seasonMapRef?.flyTo([e.lat, e.lng], 9, { duration: .8 }); setTimeout(() => seasonMarkers[d.id]?.openTooltip(), 850); break; }
      case 'replay': fly(document.querySelector('.hero > .art')); break;
      case 'status': { const e = event(d.id); if (e.status === d.val) break; e.status = d.val; if (d.val === 'waitlisted' && !e.waitlistPos) e.waitlistPos = 3; UI.pulse = e.id; render({ keepScroll: true }); toast(`Status set to ${STATUS[d.val]}`); break; }
      case 'remind': { const e = event(d.id); e.remind = !e.remind; UI.ring = e.remind ? e.id : null; render({ keepScroll: true }); toast(e.remind ? `We'll ping you ${fmtDate(e.regOpens)} at 8:00 AM` : 'Reminder off'); break; }
      case 'quick': if (document.body.classList.contains('sheet-open')) closeSheet(); else openSheet('quick'); break;
      case 'pick-event': FORM = { kind: 'pick-event' }; renderSheet(true); break;
      case 'new-event': openSheet('event'); break;
      case 'add-round': openSheet('round', { event: d.event, league: d.league, course: d.course }); break;
      case 'add-match': openSheet('match', { event: d.event }); break;
      case 'sheet-close': closeSheet(); break;
      case 'f-set': FORM[d.k] = d.k === 'n' ? +d.val : d.k === 'pdga' ? !!d.val : d.val; renderSheet(); break;
      case 'f-score': FORM.toPar += +d.val; updatePad(+d.val > 0 ? 'up' : 'down'); break;
      case 'f-hole': { const cyc = ['', 'W', 'P', 'L']; FORM.holes[d.i] = cyc[(cyc.indexOf(FORM.holes[d.i]) + 1) % 4]; FORM.tap = +d.i; renderSheet(); break; }
      case 'autofill': Object.assign(FORM, { name: 'Glass City Open', start: '2027-07-24', end: '2027-07-25', city: 'Sylvania, OH', pdga: true, format: 'singles', fee: 110, regOpens: '2027-03-01' }); renderSheet(); toast('Filled from the event page'); break;
      case 'save-round': saveRound(); break;
      case 'save-match': saveMatch(); break;
      case 'toast': toast(d.msg); if (d.close) closeSheet(); break;
    }
    return;
  }
  const a = ev.target.closest('a[href^="#/"]');
  if (a) { ev.preventDefault(); if (document.body.classList.contains('sheet-open')) closeSheet(); go(a.getAttribute('href'), a.closest('[data-vt]') || a); }
});
document.addEventListener('input', ev => {
  if (ev.target.id === 'course-q') { UI.q = ev.target.value; const pos = ev.target.selectionStart; render({ keepScroll: true }); const i = $('course-q'); i.focus(); i.setSelectionRange(pos, pos); return; }
  const k = ev.target.dataset.k; if (k && FORM) FORM[k] = ev.target.value;
});
$('scrim').addEventListener('click', closeSheet);
document.addEventListener('keydown', ev => { if (ev.key === 'Escape') closeSheet(); });
addEventListener('popstate', () => { if (!REDUCED && document.startViewTransition) document.startViewTransition(() => render()); else render(); });

function saveRound() {
  const f = FORM; if (!f.course) return;
  const par = course(f.course).par;
  if (f.event) {
    const e = event(f.event);
    e.roundLog = e.roundLog || [];
    e.roundLog.push({ n: f.n, date: f.date, course: f.course, par, score: par + f.toPar, rating: +f.rating || null });
    e.roundLog.sort((a, b) => a.n - b.n);
    closeSheet();
    let msg = `Round ${f.n} saved`;
    if (e.status === 'played' && e.roundLog.length >= (e.rounds || 0)) { e.status = 'recorded'; e.notes = e.notes || f.notes || 'Logged from the sample — this is where your round notes live.'; UI.pulse = e.id; msg = `${e.name} is now Recorded`; }
    if (route().a === 'event' && route().b === e.id) render({ keepScroll: true }); else go('#/event/' + e.id);
    toast(msg);
  } else {
    if (f.league) LEAGUE_ROUNDS.unshift({ id: 'lr' + Date.now(), league: f.league, course: f.course, date: f.date, par, score: par + f.toPar, place: +f.place || 1, field: +f.field || 20, fee: +f.fee || 0, cash: +f.cash || 0 });
    closeSheet(); render({ keepScroll: true }); toast('Round saved');
  }
}
function saveMatch() {
  const f = FORM, e = event(f.event);
  e.matches.push({ n: e.matches.length + 1, opponent: f.opp || 'Opponent', oppTeam: f.oppTeam || 'Team', holes: f.holes.map(h => h || 'P').join('') });
  closeSheet(); render({ keepScroll: true }); toast('Match saved');
}

document.querySelector('#proto [data-theme-toggle]').addEventListener('click', () => {
  const flip = () => { prefs.theme = prefs.theme === 'dark' ? 'light' : 'dark'; applyPrefs(); render({ keepScroll: true }); };
  if (!REDUCED && document.startViewTransition) document.startViewTransition(flip); else flip();
});
document.querySelectorAll('#proto .sw').forEach(b => b.addEventListener('click', () => { prefs.accent = b.dataset.accent; applyPrefs(); render({ keepScroll: true }); }));

applyPrefs();
buildShell();
render();
