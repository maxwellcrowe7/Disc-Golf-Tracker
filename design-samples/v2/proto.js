// ═══════════════════════════════════════════════
//  Fairway v2 design sample — vanilla JS, hash routing, sample data only.
// ═══════════════════════════════════════════════

const $ = id => document.getElementById(id);
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ── Icons (24px grid, stroke) ──
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
  wallet: '<rect x="3" y="6" width="18" height="14" rx="2.5"/><path d="M3 10h18M16 15h2"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  trend: '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
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
const coords = (lat, lng) => `${Math.abs(lat).toFixed(3)}°${lat >= 0 ? 'N' : 'S'} · ${Math.abs(lng).toFixed(3)}°${lng >= 0 ? 'E' : 'W'}`;
const emLast = s => { const w = s.split(' '); return w.length < 2 ? s : w.slice(0, -1).join(' ') + ' <em>' + w[w.length - 1] + '</em>'; };
function toPar(score, par) {
  const d = score - par;
  return { txt: d === 0 ? 'E' : d > 0 ? '+' + d : '−' + Math.abs(d), cls: d < 0 ? 'under' : d > 0 ? 'over' : '' };
}
const toParHTML = (s, p, cls = '') => { const t = toPar(s, p); return `<span class="toPar ${t.cls} ${cls}">${t.txt}</span>`; };

const FORMAT = { singles: 'Singles', doubles: 'Doubles', triples: 'Triples', 'team-doubles': 'Team Doubles', 'match-play': 'Match Play' };
const STATUS = { interested: 'Interested', planning: 'Planning', registered: 'Registered', waitlisted: 'Waitlisted', withdrew: 'Withdrew', played: 'Played', recorded: 'Recorded' };
const statusChip = (e, extra = '') => `<span class="status ${e.status} ${extra}">${e.status === 'waitlisted' && e.waitlistPos ? 'Waitlist #' + e.waitlistPos : STATUS[e.status]}</span>`;
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
function matchRecord(e) {
  const r = { w: 0, l: 0, p: 0 };
  (e.matches || []).forEach(m => r[holeTally(m.holes).res.toLowerCase()]++);
  return r;
}
function holeTally(h) {
  const t = { W: 0, L: 0, P: 0 };
  [...h].forEach(x => { if (t[x] !== undefined) t[x]++; });
  t.res = t.W > t.L ? 'W' : t.L > t.W ? 'L' : 'P';
  return t;
}

// ═══════════════════════════════════════════════
//  ILLUSTRATION — seeded topo + fairway, optional disc flight
// ═══════════════════════════════════════════════
function hashStr(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const PAL = {
  wooded: { bg1: '#1F4A2E', bg2: '#3A6E45', contour: 'rgba(255,255,255,.1)', tree: '#14321E', treeHi: '#285533', fairway: '#B4D886', tee: '#D8CFB4', clusters: 9 },
  open:   { bg1: '#7DAA5E', bg2: '#B9D58F', contour: 'rgba(30,64,22,.16)', tree: '#376834', treeHi: '#548946', fairway: '#EAF3C4', tee: '#EDE4C8', clusters: 3 },
  water:  { bg1: '#6FA35C', bg2: '#A8CC86', contour: 'rgba(30,64,22,.14)', tree: '#305B30', treeHi: '#4B7D42', fairway: '#E6F1BD', tee: '#EDE4C8', water: '#4A97C0', clusters: 4 },
  hilly:  { bg1: '#47733F', bg2: '#8BAB6C', contour: 'rgba(25,45,18,.22)', tree: '#254726', treeHi: '#3C6537', fairway: '#D8EAA9', tee: '#E5DCC0', clusters: 6 },
  mixed:  { bg1: '#58894A', bg2: '#9CC17B', contour: 'rgba(28,58,20,.16)', tree: '#29562B', treeHi: '#43763E', fairway: '#E0EDB5', tee: '#EAE1C4', clusters: 5 },
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
// bare contour lines for decorative backgrounds
function topo(seed, stroke, rings = 14) {
  const R = rng(hashStr(seed));
  let s = '<svg class="topo" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g class="art-contours" style="animation:drift 40s ease-in-out infinite alternate;transform-origin:50% 50%">';
  for (let h = 0; h < 2; h++) {
    const cx = 120 + R() * 160, cy = 120 + R() * 160, sd = R() * 1e9;
    for (let k = 1; k <= rings; k++) s += `<path d="${blob(cx, cy, 6 + k * 15, rng(sd), 6 + k * 2.6, 72, .85)}" fill="none" stroke="${stroke}" stroke-width="1"/>`;
  }
  return s + '</g></svg>';
}
function art(c, opts = {}) {
  const R = rng(hashStr(c.id + c.name)), p = PAL[c.terrain] || PAL.mixed, W = 320, H = 200, g = 'ag-' + c.id;
  let s = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.bg1}"/><stop offset="1" stop-color="${p.bg2}"/></linearGradient>`;
  const hills = c.terrain === 'hilly' || c.terrain === 'mixed' ? 2 : 1;
  const hc = [];
  for (let h = 0; h < hills; h++) { hc.push([50 + R() * 220, 30 + R() * 140, R() * 1e9]); s += `<radialGradient id="${g}-h${h}" cx="${(hc[h][0] / W).toFixed(2)}" cy="${(hc[h][1] / H).toFixed(2)}" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`; }
  s += `<radialGradient id="${g}-v" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".28"/></radialGradient></defs>`;
  s += `<rect width="${W}" height="${H}" fill="url(#${g})"/><g class="contours">`;
  hc.forEach(([cx, cy, sd], h) => {
    s += `<rect width="${W}" height="${H}" fill="url(#${g}-h${h})"/>`;
    const rings = c.terrain === 'hilly' ? 11 : 8, step = c.terrain === 'hilly' ? 12 : 15;
    for (let k = 1; k <= rings; k++) s += `<path d="${blob(cx, cy, 8 + k * step, rng(sd), 4 + k * 2.2)}" fill="none" stroke="${p.contour}" stroke-width="${k % 4 === 0 ? 1.6 : 1}"/>`;
  });
  s += '</g>';
  if (p.water) {
    const wx = 210 + R() * 80, wy = 135 + R() * 50, wr = 46 + R() * 14;
    s += `<path d="${blob(wx, wy, wr + 7, R, 9)}" fill="none" stroke="rgba(255,255,255,.3)" stroke-width="1.4"/><path d="${blob(wx, wy, wr, R, 10)}" fill="${p.water}"/><path d="${blob(wx - 6, wy - 5, wr * .55, R, 6)}" fill="rgba(255,255,255,.12)"/>`;
  }
  const T = [36 + R() * 40, 148 + R() * 32], B = [222 + R() * 62, 42 + R() * 40], C = [110 + R() * 70, 50 + R() * 110];
  const q = t => [(1 - t) ** 2 * T[0] + 2 * (1 - t) * t * C[0] + t * t * B[0], (1 - t) ** 2 * T[1] + 2 * (1 - t) * t * C[1] + t * t * B[1]];
  const fw = `M${T[0].toFixed(1)} ${T[1].toFixed(1)}Q${C[0].toFixed(1)} ${C[1].toFixed(1)} ${B[0].toFixed(1)} ${B[1].toFixed(1)}`;
  s += `<path d="${fw}" fill="none" stroke="${p.fairway}" stroke-opacity=".34" stroke-width="36" stroke-linecap="round"/><path d="${fw}" fill="none" stroke="${p.fairway}" stroke-opacity=".3" stroke-width="16" stroke-linecap="round"/>`;
  const path = Array.from({ length: 24 }, (_, i) => q(i / 23));
  for (let k = 0; k < p.clusters; k++) {
    const kx = R() * W, ky = R() * H, n = 5 + Math.floor(R() * 9);
    for (let j = 0; j < n; j++) {
      const x = kx + (R() - .5) * 60, y = ky + (R() - .5) * 46, r = 5 + R() * 7;
      if (path.some(([px, py]) => Math.hypot(px - x, py - y) < 24 + r)) continue;
      s += `<circle cx="${(x + 2.5).toFixed(1)}" cy="${(y + 3).toFixed(1)}" r="${r.toFixed(1)}" fill="rgba(0,0,0,.2)"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${p.tree}"/><circle cx="${(x - r * .28).toFixed(1)}" cy="${(y - r * .3).toFixed(1)}" r="${(r * .55).toFixed(1)}" fill="${p.treeHi}"/>`;
    }
  }
  s += `<path class="flight" d="${fw}" pathLength="1" fill="none" stroke="#fff" stroke-opacity=".9" stroke-width="1.8" stroke-linecap="round"/>`;
  const ang = Math.atan2(C[1] - T[1], C[0] - T[0]) * 180 / Math.PI;
  s += `<rect x="${(T[0] - 9).toFixed(1)}" y="${(T[1] - 4.5).toFixed(1)}" width="18" height="9" rx="2" fill="${p.tee}" transform="rotate(${ang.toFixed(1)} ${T[0].toFixed(1)} ${T[1].toFixed(1)})"/>`;
  const bx = B[0].toFixed(1), by = B[1].toFixed(1);
  if (opts.fly) {
    s += `<path class="trail" d="${fw}" pathLength="1"/><circle class="chains" cx="${bx}" cy="${by}" r="7" fill="none" stroke="#CDEB6E" stroke-width="1.5"/>`;
  }
  s += `<circle cx="${bx}" cy="${by}" r="11" fill="rgba(255,255,255,.2)"/><circle cx="${bx}" cy="${by}" r="6.5" fill="none" stroke="#fff" stroke-width="1.3"/><circle cx="${bx}" cy="${by}" r="3.6" fill="#fff"/>`;
  if (opts.fly) {
    s += `<g class="disc"><ellipse rx="5.5" ry="3.8" fill="#fff"/><ellipse rx="5.5" ry="3.8" fill="none" stroke="#CDEB6E" stroke-width="1.4"/><animateMotion dur="2s" begin="indefinite" fill="freeze" calcMode="spline" keyTimes="0;1" keyPoints="0;1" keySplines=".3 .1 .15 1" rotate="auto" path="${fw}"/></g>`;
  }
  s += `<rect width="${W}" height="${H}" fill="url(#${g}-v)"/>`;
  return s + '</svg>';
}
const thumb = (cid, cls = '') => `<div class="art thumb ${cls}">${art(course(cid))}</div>`;
function fly(artEl) {
  if (!artEl || REDUCED) return;
  const anim = artEl.querySelector('animateMotion');
  artEl.classList.remove('flying'); void artEl.offsetWidth; artEl.classList.add('flying');
  try { anim && anim.beginElement(); } catch (e) {}
}
function medal(place) {
  if (place > 3) return '';
  const c = [['#F6DA74', '#E2B93B'], ['#E3E8EE', '#B9C2CD'], ['#EDC29C', '#C98C5A']][place - 1];
  return `<svg class="medal" viewBox="0 0 50 50"><circle cx="25" cy="25" r="22" fill="${c[0]}"/><circle cx="25" cy="25" r="18.5" fill="none" stroke="${c[1]}" stroke-width="1.2" stroke-dasharray="1.5 2.5"/></svg>`;
}

// ═══════════════════════════════════════════════
//  PREFS
// ═══════════════════════════════════════════════
const prefs = { theme: 'light' };
try { Object.assign(prefs, JSON.parse(localStorage.getItem('dgt-proto-v2') || '{}')); } catch (e) {}
const qp = new URLSearchParams(location.search);
if (qp.get('theme')) prefs.theme = qp.get('theme');
function applyPrefs() {
  document.documentElement.dataset.theme = prefs.theme;
  document.querySelector('#proto [data-theme-toggle]').innerHTML = prefs.theme === 'dark' ? I('sun', 'sm') : I('moon', 'sm');
  document.querySelector('meta[name=theme-color]').content = prefs.theme === 'dark' ? '#0C120F' : '#F1EEE4';
  try { localStorage.setItem('dgt-proto-v2', JSON.stringify(prefs)); } catch (e) {}
}

// ═══════════════════════════════════════════════
//  SHELL — built once, indicators slide between items
// ═══════════════════════════════════════════════
const NAV = [
  { key: 'home', label: 'Home', icon: 'home', href: '#/home' },
  { key: 'schedule', label: 'Schedule', icon: 'calendar', href: '#/schedule' },
  { key: 'results', label: 'Results', icon: 'trophy', href: '#/results' },
  { key: 'courses', label: 'Courses', icon: 'course', href: '#/courses' },
];
function buildShell() {
  $('sidebar').innerHTML = `${topo('sidebar', 'rgba(205,235,110,.16)', 16)}
    <div class="brand"><svg width="34" height="34" viewBox="0 0 34 34"><circle cx="17" cy="17" r="15" fill="#CDEB6E"/><circle cx="17" cy="17" r="10.5" fill="none" stroke="#123826" stroke-width="1.4" opacity=".55"/><path d="M8 20c4-6 12-9 18-8" stroke="#123826" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-dasharray="1 3.2"/></svg><div><b>Fairway</b><small>Disc golf log</small></div></div>
    <div class="nav-wrap"><span class="side-ind"></span>${NAV.map(n => `<a class="nav" data-key="${n.key}" href="${n.href}">${I(n.icon)}${n.label}</a>`).join('')}</div>
    <button class="add" data-act="quick">${I('plus', 'sm')}Log something</button>
    <div class="me"><div class="av">MC</div><div><b>${PLAYER.name}</b><small>PDGA #${PLAYER.pdga}</small></div><div class="rt"><b>${PLAYER.rating}</b></div></div>`;
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

// ═══════════════════════════════════════════════
//  ROUTER + VIEW TRANSITIONS
// ═══════════════════════════════════════════════
const UI = { schedMode: 'list', schedFilter: 'all', resultsTab: 'tournaments', drive: false, q: '', pulse: null, ring: null };
let maps = [], observers = [];

function route() {
  const [, a = 'home', b] = (location.hash || '#/home').split('/');
  return { a, b };
}
function go(href, src) {
  if (href === location.hash) return;
  const from = route();
  const to = href.split('/');
  const toDetail = to[1] === 'event' || to[1] === 'course';
  const fromDetail = from.a === 'event' || from.a === 'course';
  let named = false, backKey = null;
  if (!REDUCED && document.startViewTransition) {
    const srcArt = src && (src.matches('.art') ? src : src.querySelector('.art'));
    if (toDetail && srcArt) { srcArt.style.viewTransitionName = 'hero-art'; named = true; }
    else if (fromDetail) {
      const b = document.querySelector('.banner > .art');
      if (b) { b.style.viewTransitionName = 'hero-art'; named = true; backKey = `${from.a}-${from.b}`; }
    }
  }
  const swap = () => {
    history.pushState(null, '', href);
    render();
    if (backKey) {
      const t = document.querySelector(`[data-vt="${backKey}"]`);
      const a = t && (t.matches('.art') ? t : t.querySelector('.art'));
      if (a && a.getBoundingClientRect().top < innerHeight) a.style.viewTransitionName = 'hero-art';
    }
  };
  if (!REDUCED && document.startViewTransition) {
    const vt = document.startViewTransition(swap);
    vt.finished.finally(() => document.querySelectorAll('[style*="view-transition-name"]').forEach(el => { if (el.style.viewTransitionName === 'hero-art') el.style.viewTransitionName = ''; }));
  } else swap();
  void named;
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
  $('view').innerHTML = v.html;
  if (!opts.keepScroll) window.scrollTo(0, 0);
  mountMotion(!!opts.keepScroll);
  v.after && v.after();
  onScroll();
  UI.pulse = null; UI.ring = null;
}

// ═══════════════════════════════════════════════
//  MOTION ENGINE
// ═══════════════════════════════════════════════
function countUp(el) {
  const to = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0);
  const from = el.dataset.from !== undefined ? parseFloat(el.dataset.from) : 0;
  const pre = el.dataset.pre || '', suf = el.dataset.suf || '';
  const fmt = v => pre + (dec ? v.toFixed(dec) : Math.round(v).toLocaleString()) + suf;
  if (REDUCED) { el.textContent = fmt(to); return; }
  const dur = 1300, t0 = performance.now();
  const step = now => {
    const t = clamp((now - t0) / dur, 0, 1), e = 1 - Math.pow(2, -10 * t);
    el.textContent = fmt(from + (to - from) * (t === 1 ? 1 : e));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
function mountMotion(instant) {
  const view = $('view');
  view.querySelectorAll('[data-stagger]').forEach(g => [...g.children].forEach((c, i) => { c.classList.add('rv'); c.style.setProperty('--i', i); }));
  const targets = view.querySelectorAll('.rv, .spark, .ribbon, .trip, .budget, .dist, .match, [data-count]');
  if (instant) {
    targets.forEach(el => { el.classList.add('in'); if (el.dataset.count && !el.dataset.done) { el.dataset.done = 1; el.textContent = (el.dataset.pre || '') + (+el.dataset.count).toLocaleString(undefined, { minimumFractionDigits: +(el.dataset.dec || 0), maximumFractionDigits: +(el.dataset.dec || 0) }) + (el.dataset.suf || ''); } });
  } else {
    const io = new IntersectionObserver(ents => ents.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target;
      el.classList.add('in');
      if (el.dataset.count && !el.dataset.done) { el.dataset.done = 1; countUp(el); }
      io.unobserve(el);
    }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(el => io.observe(el));
    observers.push(io);
  }
  // compact topbar appears once the big title scrolls off
  const sentinel = view.querySelector('[data-sentinel]');
  if (sentinel) {
    const io2 = new IntersectionObserver(([en]) => $('topbar').classList.toggle('show', !en.isIntersecting && en.boundingClientRect.top < 60), { rootMargin: '-56px 0px 0px 0px' });
    io2.observe(sentinel); observers.push(io2);
  }
  // rating sparkline scrubber
  view.querySelectorAll('.spark[data-pts]').forEach(sp => {
    const pts = JSON.parse(sp.dataset.pts), labels = JSON.parse(sp.dataset.labels);
    const min = Math.min(...pts) - 3, max = Math.max(...pts) + 3;
    const dot = sp.querySelector('.scrub-dot'), tip = sp.querySelector('.scrub');
    const move = x => {
      const r = sp.getBoundingClientRect();
      const i = clamp(Math.round((x - r.left) / r.width * (pts.length - 1)), 0, pts.length - 1);
      const px = i / (pts.length - 1) * 100, py = (1 - (pts[i] - min) / (max - min)) * 100;
      dot.style.left = tip.style.left = px + '%'; dot.style.top = py + '%';
      tip.textContent = `${labels[i]} · ${pts[i]}`;
    };
    sp.addEventListener('pointermove', e => move(e.clientX));
    sp.addEventListener('pointerdown', e => { sp.classList.add('touch'); move(e.clientX); });
    sp.addEventListener('pointerup', () => setTimeout(() => sp.classList.remove('touch'), 1200));
    move(sp.getBoundingClientRect().right);
  });
  // spotlight follows the pointer across the hero
  view.querySelectorAll('.hero').forEach(h => h.addEventListener('pointermove', e => {
    const r = h.getBoundingClientRect();
    h.style.setProperty('--mx', e.clientX - r.left + 'px'); h.style.setProperty('--my', e.clientY - r.top + 'px');
  }));
  // segmented control indicators
  view.querySelectorAll('.seg').forEach(placeSeg);
  // status bars sweep in
  view.querySelectorAll('.stepper.pre').forEach(s => requestAnimationFrame(() => requestAnimationFrame(() => s.classList.remove('pre'))));
  // disc flight on the hero
  const heroArt = view.querySelector('.hero > .art');
  if (heroArt) setTimeout(() => fly(heroArt), instant ? 0 : 450);
}
function placeSeg(seg) {
  const on = seg.querySelector('button.on'), ind = seg.querySelector('.seg-ind');
  if (!on || !ind) return;
  ind.style.width = on.offsetWidth + 'px';
  ind.style.transform = `translateX(${on.offsetLeft - 4}px)`;
}

let ticking = false;
function onScroll() {
  if (ticking) return; ticking = true;
  requestAnimationFrame(() => {
    ticking = false;
    const y = scrollY;
    const banner = document.querySelector('.banner');
    if (banner && !REDUCED) banner.style.setProperty('--sy', clamp(y, 0, 420));
    const tl = document.querySelector('.tl');
    if (tl) {
      const r = tl.getBoundingClientRect();
      const fill = clamp(innerHeight * .58 - r.top, 0, r.height - 16);
      tl.style.setProperty('--fill', fill + 'px');
      tl.querySelectorAll('.tl-month').forEach(m => m.classList.toggle('lit', m.offsetTop - 8 <= fill));
    }
  });
}
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', () => { updateShell(document.querySelector('[data-key].on')?.dataset.key); document.querySelectorAll('.seg').forEach(placeSeg); });

// ═══════════════════════════════════════════════
//  HOME
// ═══════════════════════════════════════════════
function sparkline(pts) {
  const w = 200, h = 46, min = Math.min(...pts) - 3, max = Math.max(...pts) + 3;
  const xy = pts.map((v, i) => [i / (pts.length - 1) * w, h - (v - min) / (max - min) * h]);
  const d = xy.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('');
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><defs><linearGradient id="sparkfill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--fern)" stop-opacity=".28"/><stop offset="1" stop-color="var(--fern)" stop-opacity="0"/></linearGradient></defs><path class="area" d="${d}L${w} ${h}L0 ${h}Z" fill="url(#sparkfill)"/><path class="line" d="${d}" pathLength="1" vector-effect="non-scaling-stroke"/></svg><span class="scrub-dot"></span><span class="scrub"></span>`;
}
function greeting() { const h = new Date().getHours(); return h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening'; }

function viewHome() {
  const up = upcoming().filter(e => e.status !== 'withdrew');
  const next = up[0], nc = course(next.courses[0]);
  const regIn = daysUntil(next.regOpens);
  const season = up.reduce((a, e) => { a.cost += costFor(e).total; a.mi += (e.drive?.fromHome?.mi || 0) * 2; return a; }, { cost: 0, mi: 0 });

  const todos = [];
  EVENTS.filter(e => e.status === 'played').forEach(e => {
    const missing = (e.rounds || 0) - (e.roundLog || []).length;
    todos.push({ c: 'var(--st-played)', icon: 'note', t: `Finish ${e.name}`, s: missing > 0 ? `Round ${(e.roundLog || []).length + 1} and notes still missing` : 'Add notes to mark it recorded', href: '#/event/' + e.id });
  });
  up.filter(e => e.regOpens && daysUntil(e.regOpens) > 0 && daysUntil(e.regOpens) < 130).slice(0, 2).forEach(e => todos.push({ c: 'var(--st-planning)', icon: 'bell', t: `${e.name} registration`, s: `Opens ${fmtDate(e.regOpens)} · ${daysUntil(e.regOpens)} days${e.remind ? ' · reminder set' : ''}`, href: '#/event/' + e.id }));
  up.filter(e => e.status === 'waitlisted').forEach(e => todos.push({ c: 'var(--st-waitlisted)', icon: 'clock', t: `Waitlisted · ${e.name}`, s: `You're #${e.waitlistPos} · ${fmtRange(e)}`, href: '#/event/' + e.id }));

  const html = `
  <div class="pagehead">
    <div><span class="mono">${fmtDow('2026-11-01')} · Off-season</span><h1 class="display" data-sentinel>${greeting()}, <em>Max</em></h1></div>
    <button class="icon-btn mobile-only" aria-label="Notifications">${I('bell', 'sm')}</button>
  </div>

  <div class="home-grid">
    <a class="hero rv" href="#/event/${next.id}" data-vt="event-${next.id}">
      <div class="art">${art(nc, { fly: true })}</div>
      <div class="hero-in">
        <div class="coords"><span>Next up · <b>${nc.name}</b></span><span>${coords(next.lat, next.lng)}</span></div>
        <button class="replay" data-act="replay">${I('replay', 'xs')}Replay</button>
        <div class="bottom">
          <h3>${emLast(next.name)}</h3>
          <div class="row">
            <div class="count"><span class="num" data-count="${daysUntil(next.start)}" data-from="${daysUntil(next.start) + 40}">${daysUntil(next.start)}</span><span>days<br>to go</span></div>
            <div class="chips">${statusChip(next)}${tierChip(next)}</div>
          </div>
          ${regIn > 0 ? `<div class="alert">${I('bell', 'sm')}Registration opens ${fmtDate(next.regOpens)}<span class="tag">${next.remind ? 'Reminder set' : 'Remind me'}</span></div>` : ''}
        </div>
      </div>
    </a>

    <div class="side-stats" data-stagger>
      <div class="card stat">
        <span class="mono">PDGA rating</span>
        <span class="num"><span data-count="${PLAYER.rating}" data-from="${PLAYER.rating - 60}">${PLAYER.rating}</span><small>▲ ${PLAYER.ratingDelta}</small></span>
        <span class="sub">12-month high · drag to explore</span>
        <div class="spark" data-pts='${JSON.stringify(RATING_HISTORY.map(r => r.r))}' data-labels='${JSON.stringify(RATING_HISTORY.map(r => MON[+r.d.slice(5) - 1] + " ’" + r.d.slice(2, 4)))}'>${sparkline(RATING_HISTORY.map(r => r.r))}</div>
      </div>
      <a class="card stat" href="#/schedule">
        <span class="mono">2027 season</span>
        <span class="num"><span data-count="${up.length}">${up.length}</span><small style="color:var(--muted)">events</small></span>
        <span class="sub">${up.filter(e => e.status === 'registered').length} registered · ${up.filter(e => e.pdga).length} PDGA</span>
        <div class="season-miles"><div><span class="mono">Est. cost</span><b data-count="${Math.round(season.cost)}" data-pre="$">${money(season.cost)}</b></div><div><span class="mono">Driving</span><b data-count="${season.mi}" data-suf=" mi">${season.mi.toLocaleString()} mi</b></div></div>
      </a>
    </div>

    <section class="full">${ribbon(up)}</section>

    <section class="rv">
      <div class="sh"><h2>Needs attention <span class="mono">${String(todos.length).padStart(2, '0')}</span></h2></div>
      <div class="card list" data-stagger>
        ${todos.map(t => `<a class="todo lrow" href="${t.href}"><span class="ic-tile" style="--c:${t.c}">${I(t.icon, 'sm')}</span><div class="body"><b>${t.t}</b><span>${t.s}</span></div>${I('chevR', 'sm chev')}</a>`).join('')}
      </div>
    </section>

    <section class="rv">
      <div class="sh"><h2>League nights</h2><a href="#/results/leagues">All ${I('arrowR', 'xs')}</a></div>
      <div class="card list" data-stagger>
        ${LEAGUES.map(l => {
          const last = LEAGUE_ROUNDS.find(r => r.league === l.id);
          return `<div class="lrow"><span class="league-chip" style="background:${l.color}"></span><div class="body"><div class="name">${l.name}</div><div class="meta">${l.when}<span class="dot"></span>Next ${fmtDate(l.next)}</div></div>
            <div class="end"><div class="v">${toParHTML(last.score, last.par)}</div><small>Last · ${ord(last.place)}</small></div></div>`;
        }).join('')}
        <div style="padding:6px 16px 16px"><button class="btn block" data-act="add-round" data-league="l1">${I('plus', 'xs')}Log Tuesday's round</button></div>
      </div>
    </section>

    <section class="full rv">
      <div class="sh"><h2>Recent results</h2><a href="#/results">Everything ${I('arrowR', 'xs')}</a></div>
      <div class="card list" data-stagger>${past().slice(0, 4).map(resultRow).join('')}</div>
    </section>
  </div>`;
  return { html, top: { title: 'Home', right: `<button class="icon-btn" style="width:34px;height:34px">${I('bell', 'xs')}</button>` } };
}

function ribbon(evs) {
  const start = D('2026-11-01'), days = 365;
  const pct = iso => clamp((D(iso) - start) / 864e5 / days * 100, 0, 100);
  let months = '';
  for (let m = 0; m < 12; m++) { const d = new Date(2026, 10 + m, 1); months += `<div class="mcol" style="left:${pct(d.toISOString().slice(0, 10))}%"><span>${MON[d.getMonth()]}${d.getMonth() === 0 ? ' ’27' : ''}</span></div>`; }
  const items = evs.map((e, i) => {
    const l = pct(e.start), w = Math.max(.6, (D(e.end) - D(e.start)) / 864e5 + 1) / days * 100;
    const right = l > 78;
    return `<a class="rb-ev" href="#/event/${e.id}" style="--c:var(--st-${e.status});--i:${i};top:${i % 2 ? 62 : 16}px;${right ? `right:${100 - l - w}%;align-items:flex-end` : `left:${l}%`}"><span class="bar" style="width:${Math.max(14, w * 7.8)}px"></span><span class="lbl" style="${right ? 'text-align:right' : ''}">${e.name}<small>${fmtRange(e)} · ${STATUS[e.status]}</small></span></a>`;
  }).join('');
  const regs = evs.filter(e => (e.status === 'interested' || e.status === 'planning') && e.regOpens >= '2026-11-01').map((e, i) => `<span class="rb-reg" title="Registration opens ${fmtDate(e.regOpens)} — ${e.name}" style="left:${pct(e.regOpens)}%;--i:${i}"></span>`).join('');
  return `<div class="card ribbon">
    <div class="rh"><b>Season at a glance</b><span class="mono">Nov ’26 — Oct ’27</span></div>
    <div class="ribbon-scroll"><div class="ribbon-track">${months}<div class="base"></div><div class="today"></div>${items}${regs}</div></div>
    <div class="legend">${['registered', 'planning', 'interested', 'waitlisted'].map(s => `<span style="--c:var(--st-${s})"><i></i>${STATUS[s]}</span>`).join('')}<span><i style="background:none;border-radius:50%;box-shadow:inset 0 0 0 2px var(--st-planning)"></i>Registration opens</span></div>
  </div>`;
}

function resultRow(e) {
  const r = e.result || {}, rounds = e.roundLog || [];
  const tot = rounds.reduce((a, x) => ({ s: a.s + x.score, p: a.p + x.par }), { s: 0, p: 0 });
  const mp = e.format === 'match-play' ? matchRecord(e) : null;
  return `<a class="lrow" href="#/event/${e.id}" data-vt="event-${e.id}">
    ${thumb(e.courses[0])}
    <div class="body"><div class="name">${e.name}</div><div class="meta">${fmtDateY(e.start)}<span class="dot"></span>${FORMAT[e.format]}${e.status === 'played' ? '<span class="dot"></span><span style="color:var(--st-played);font-weight:650">Needs details</span>' : ''}</div></div>
    <div class="end desktop-only" style="margin-right:6px">${mp ? `<div class="v num">${mp.w}–${mp.l}–${mp.p}</div><small>W–L–P</small>` : rounds.length ? `<div class="v">${toParHTML(tot.s, tot.p)}</div><small>${rounds.length} rounds</small>` : ''}</div>
    <div class="place p${r.place}">${medal(r.place)}<span class="num">${ordSup(r.place)}</span></div>
  </a>`;
}

// ═══════════════════════════════════════════════
//  SCHEDULE
// ═══════════════════════════════════════════════
const SCHED_FILTERS = ['all', 'registered', 'planning', 'interested', 'waitlisted'];
function seg(items, cur, act) {
  return `<div class="seg"><span class="seg-ind"></span>${items.map(([k, label, icon]) => `<button class="${cur === k ? 'on' : ''}" data-act="${act}" data-val="${k}">${icon ? I(icon, 'sm') : ''}${label}</button>`).join('')}</div>`;
}
function viewSchedule() {
  const all = upcoming();
  const list = all.filter(e => UI.schedFilter === 'all' || e.status === UI.schedFilter);
  const live = all.filter(e => e.status !== 'withdrew');
  const tot = live.reduce((a, e) => { a.cost += costFor(e).total; a.mi += (e.drive?.fromHome?.mi || 0) * 2; return a; }, { cost: 0, mi: 0 });
  const mode = UI.schedMode;
  let html = `
  <div class="pagehead">
    <div><span class="mono">Nov ’26 — Oct ’27</span><h1 class="display" data-sentinel>2027 <em>season</em></h1></div>
    <button class="icon-btn" data-act="new-event" aria-label="Add event">${I('plus', 'sm')}</button>
  </div>
  <div class="card stats-strip rv">
    <div><span class="mono">Events</span><span class="num" data-count="${live.length}">${live.length}</span></div>
    <div><span class="mono">Signed up</span><span class="num" data-count="${live.filter(e => e.status === 'registered').length}">0</span></div>
    <div><span class="mono">Est. cost</span><span class="num" data-count="${Math.round(tot.cost)}" data-pre="$">${money(tot.cost)}</span></div>
    <div><span class="mono">Miles</span><span class="num" data-count="${tot.mi / 1000}" data-dec="1" data-suf="k">${(tot.mi / 1000).toFixed(1)}k</span></div>
  </div>
  <div class="controls">
    ${seg([['list', 'List', 'list'], ['cal', 'Calendar', 'calendar'], ['map', 'Map', 'map']], mode, 'mode')}
    ${mode !== 'cal' ? `<div class="pills">${SCHED_FILTERS.map(f => `<button class="pill ${UI.schedFilter === f ? 'on' : ''}" data-act="filter" data-val="${f}">${f === 'all' ? 'All' : STATUS[f]}<span class="n">${f === 'all' ? all.length : all.filter(e => e.status === f).length}</span></button>`).join('')}</div>` : ''}
  </div>`;
  const top = { title: '2027 season', right: `<button class="icon-btn" style="width:34px;height:34px" data-act="new-event">${I('plus', 'xs')}</button>` };

  if (mode === 'cal') return { html: html + calendarView(all), top };
  if (mode === 'map') return {
    html: html + `<div class="map-wrap">
      <div class="map rv" id="season-map"></div>
      <div class="card list">
        <div class="map-tools"><div><b style="font-size:14.5px">Drive times</b><div class="meta">From home · ${HOME.city}</div></div><button class="switch ${UI.drive ? 'on' : ''}" data-act="drive-toggle" aria-label="Show drive times"></button></div>
        <div data-stagger>${list.map(e => `<button class="lrow" data-act="fly-to" data-id="${e.id}">${thumb(e.courses[0], 'sm')}<div class="body"><div class="name">${e.name}</div><div class="meta">${fmtRange(e)}<span class="dot"></span>${e.drive?.fromHome?.time || ''}</div></div>${statusChip(e)}</button>`).join('')}</div>
      </div>
    </div>`, top, after: () => seasonMap(list),
  };

  const groups = {};
  list.forEach(e => (groups[e.start.slice(0, 7)] = groups[e.start.slice(0, 7)] || []).push(e));
  const body = Object.keys(groups).map(k => {
    const [y, m] = k.split('-').map(Number);
    const cost = groups[k].reduce((a, e) => a + costFor(e).total, 0);
    return `<div class="tl-month"><h4>${MON[m - 1]}<span>${y}</span></h4><span class="mono">${money(cost)} est.</span></div><div data-stagger>${groups[k].map(evCard).join('')}</div>`;
  }).join('');
  return { html: html + (body ? `<div class="tl"><span class="fill"></span>${body}</div>` : `<div class="card" style="margin-top:20px;padding:28px;text-align:center"><p class="muted">No events with this status.</p></div>`), top };
}

function evCard(e) {
  const d = D(e.start), c = costFor(e);
  const reg = e.regOpens ? daysUntil(e.regOpens) : null;
  let note = '';
  if (e.status === 'interested' || e.status === 'planning') note = reg > 0 ? `<span class="reg-note">${I('bell', 'xs')}Reg opens ${fmtDate(e.regOpens)}${e.remind ? ' · reminder on' : ''}</span>` : `<span class="reg-note open">${I('check', 'xs')}Registration open</span>`;
  return `<a class="card ev" href="#/event/${e.id}" data-vt="event-${e.id}">
    <div class="art">${art(course(e.courses[0]))}<div class="when"><b>${d.getDate()}</b><span>${MON[d.getMonth()].toUpperCase()}</span></div></div>
    <div class="body">
      <div class="top"><div class="name">${e.name}</div><div class="cost"><b>${money(c.total)}</b><small>EST.</small></div></div>
      <div class="meta">${I('pin', 'xs')}${e.city}<span class="dot"></span>${I('car', 'xs')}${e.drive?.fromHome?.time}</div>
      <div class="chips">${statusChip(e)}${tierChip(e)}${fmtChip(e)}</div>
      ${note}
    </div>
  </a>`;
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
      const iso = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`, dow = new Date(y, m, d).getDay();
      const e = evDay[iso], r = regDay[iso];
      if (e) here.add(e);
      html += e ? `<a class="day ev-day" style="--c:var(--st-${e.status})" href="#/event/${e.id}" title="${e.name}">${d}</a>`
        : r ? `<a class="day reg" href="#/event/${r.id}" title="Registration opens: ${r.name}">${d}</a>`
        : `<span class="day ${dow === 0 || dow === 6 ? 'we' : ''}">${d}</span>`;
    }
    const regs = Object.values(regDay).filter(e => +e.regOpens.slice(5, 7) === m + 1);
    const items = [...here].map(e => `<a href="#/event/${e.id}" style="--c:var(--st-${e.status})"><i></i>${e.name}</a>`)
      .concat(regs.map(e => `<a href="#/event/${e.id}" style="color:var(--muted)"><i style="background:none;box-shadow:inset 0 0 0 1.5px var(--st-planning)"></i>Reg · ${e.name}</a>`)).join('');
    return `<div class="card mini"><h5>${MON[m]}<span>${here.size ? here.size + (here.size > 1 ? ' EVENTS' : ' EVENT') : ''}</span></h5><div class="days">${html}</div>${items ? `<div class="evs">${items}</div>` : ''}</div>`;
  }).join('');
  return `<div class="cal-grid" data-stagger>${cells}</div>
    <div class="legend" style="margin-top:16px">${['registered', 'planning', 'interested', 'waitlisted'].map(s => `<span style="--c:var(--st-${s})"><i></i>${STATUS[s]}</span>`).join('')}<span><i style="background:none;box-shadow:inset 0 0 0 1.5px var(--st-planning)"></i>Registration opens</span></div>`;
}

// ── Maps ──
function tiles() {
  const base = prefs.theme === 'dark' ? 'World_Dark_Gray_Base' : 'World_Light_Gray_Base';
  return L.tileLayer(`https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/${base}/MapServer/tile/{z}/{y}/{x}`, { attribution: 'Tiles © Esri', maxZoom: 16 });
}
const stColor = s => getComputedStyle(document.documentElement).getPropertyValue('--st-' + s).trim();
const homeIcon = () => L.divIcon({ className: '', html: `<div class="pin-home">${I('home')}</div>`, iconSize: [32, 32], iconAnchor: [16, 16] });
const baseIcon = () => L.divIcon({ className: '', html: `<div class="pin-home base">${I('bed')}</div>`, iconSize: [32, 32], iconAnchor: [16, 16] });
const courseIcon = () => L.divIcon({ className: '', html: `<div class="pin-course">${I('basket')}</div>`, iconSize: [28, 28], iconAnchor: [14, 14] });
const evIcon = (e, i) => L.divIcon({ className: '', html: `<div class="pin" style="--c:var(--st-${e.status});--d:${(i * .09 + .25).toFixed(2)}s"><span>${MON[D(e.start).getMonth()].toUpperCase()}</span></div>`, iconSize: [36, 36], iconAnchor: [18, 42] });

let seasonMapRef = null, seasonMarkers = {};
function seasonMap(list) {
  const el = $('season-map'); if (!el) return;
  const m = L.map(el, { zoomControl: false, scrollWheelZoom: false });
  maps.push(m); seasonMapRef = m; seasonMarkers = {};
  tiles().addTo(m);
  L.control.zoom({ position: 'topright' }).addTo(m);
  L.marker([HOME.lat, HOME.lng], { icon: homeIcon(), zIndexOffset: 1000 }).addTo(m).bindTooltip('Home', { className: 'tip', direction: 'top', offset: [0, -16] });
  const pts = [[HOME.lat, HOME.lng]];
  list.forEach((e, i) => {
    pts.push([e.lat, e.lng]);
    const line = L.polyline([[HOME.lat, HOME.lng], [e.lat, e.lng]], { color: stColor(e.status), weight: 2.5, opacity: .8, dashArray: '2 7', lineCap: 'round', className: UI.drive ? 'ants' : '' }).addTo(m);
    if (UI.drive && e.drive?.fromHome) line.bindTooltip(`${e.drive.fromHome.time} · ${e.drive.fromHome.mi} mi`, { permanent: true, className: 'drive', direction: 'center' });
    seasonMarkers[e.id] = L.marker([e.lat, e.lng], { icon: evIcon(e, i), riseOnHover: true }).addTo(m)
      .bindTooltip(`<b>${e.name}</b><br>${fmtRange(e)}`, { className: 'tip', direction: 'top', offset: [0, -44] })
      .on('click', () => go('#/event/' + e.id));
  });
  m.fitBounds(pts, { padding: [40, 40] });
}
function eventMiniMap(e) {
  const el = $('mini-map'); if (!el) return;
  const m = L.map(el, { zoomControl: false, attributionControl: false, scrollWheelZoom: false, dragging: !L.Browser.mobile });
  maps.push(m);
  tiles().addTo(m);
  const origin = e.lodging ? [e.lodging.lat, e.lodging.lng] : [HOME.lat, HOME.lng];
  L.marker(origin, { icon: e.lodging ? baseIcon() : homeIcon(), zIndexOffset: 1000 }).addTo(m);
  const pts = [origin];
  e.courses.forEach(cid => {
    const c = course(cid), leg = e.drive?.toCourses?.[cid];
    pts.push([c.lat, c.lng]);
    const line = L.polyline([origin, [c.lat, c.lng]], { color: '#6B4B98', weight: 2.5, dashArray: '2 7', lineCap: 'round', className: 'ants' }).addTo(m);
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

function banner(c, { kicker, title, chips, back, vtKey }) {
  return `<div class="banner" data-vt="${vtKey}">
    <div class="art">${art(c)}</div>
    <div class="floating"><a class="icon-btn" href="${back}" aria-label="Back">${I('chevL')}</a><button class="icon-btn" data-act="toast" data-msg="Editing isn't in the sample" aria-label="Edit">${I('edit', 'sm')}</button></div>
    <div class="over"><span class="mono">${kicker}</span><h2 data-sentinel>${emLast(title)}</h2><div class="chips">${chips}</div></div>
  </div>`;
}

function viewEvent(id) {
  const e = event(id), up = isUpcoming(e), c0 = course(e.courses[0]);
  const back = up ? '#/schedule' : '#/results';
  const top = { title: e.name, left: `<a class="icon-btn" style="width:34px;height:34px" href="${back}">${I('chevL', 'sm')}</a>` };
  const head = banner(c0, {
    kicker: `${fmtRange(e)}${up ? '' : ', ' + e.start.slice(0, 4)} · <b>${e.city}</b>`,
    title: e.name, chips: tierChip(e) + fmtChip(e), back, vtKey: 'event-' + e.id,
  });
  let left, right;
  if (up) {
    left = [statusCard(e), coursesCard(e), teamCard(e), budgetCard(e)];
    right = [regCard(e), travelCard(e)];
  } else {
    const nudge = e.status === 'played' ? `<div class="nudge-card"><span class="ic-tile">${I('note', 'sm')}</span><div><b>Almost recorded</b><span>${STEP_NOTE.played(e)}</span></div></div>` : '';
    left = [nudge, resultCard(e), e.format === 'match-play' ? matchesCard(e) : roundsCard(e), notesCard(e)];
    right = [statusCard(e), teamCard(e), coursesCard(e), budgetCard(e)];
  }
  const wrap = arr => arr.filter(Boolean).map((h, i) => h.replace(/^(\s*<div class=")/, `$1rv `).replace('<div class="rv', `<div style="--i:${i}" class="rv`)).join('');
  return { html: `${head}<div class="detail-grid"><div class="col">${wrap(left)}</div><div class="col">${wrap(right)}</div></div>`, top, after: up ? () => eventMiniMap(e) : null };
}

function statusCard(e) {
  const cur = e.status === 'waitlisted' ? 2 : STEPS.indexOf(e.status);
  return `<div class="card">
    <div class="ph"><h3>Status</h3>${statusChip(e, UI.pulse === e.id ? 'pulse' : '')}</div>
    <div class="stepper pre" style="--sc:var(--st-${e.status})">${STEPS.map((s, i) => `<button class="step ${i <= cur ? 'done' : ''} ${i === cur ? 'cur' : ''}" style="--i:${i}" data-act="status" data-id="${e.id}" data-val="${s}"><span class="bar"><i></i></span><span class="lb">${i === 2 && e.status === 'waitlisted' ? 'Waitlist' : STATUS[s]}</span></button>`).join('')}</div>
    <div class="step-foot"><span>${STEP_NOTE[e.status](e)}</span>${isUpcoming(e) && e.status !== 'waitlisted' ? `<button class="btn sm" data-act="status" data-id="${e.id}" data-val="waitlisted">Waitlisted?</button>` : ''}</div>
  </div>`;
}
function coursesCard(e) {
  return `<div class="card">
    <div class="ph"><h3>${e.courses.length > 1 ? e.courses.length + ' courses' : 'Course'}</h3></div>
    <div class="pb" style="padding-top:8px">${e.courses.map(cid => {
      const c = course(cid), leg = e.drive?.toCourses?.[cid];
      return `<a class="course-card" href="#/course/${cid}" data-vt="course-${cid}">${thumb(cid)}<div style="flex:1;min-width:0"><b style="font-size:15.5px;font-weight:650">${c.name}</b><div class="meta">${c.holes} holes<span class="dot"></span>Par ${c.par}</div></div>${leg ? `<span class="meta" style="color:var(--ink-2);font-weight:650">${I('car', 'xs')}${leg.time}</span>` : I('chevR', 'sm chev')}</a>`;
    }).join('')}</div>
  </div>`;
}
function teamCard(e) {
  if (e.format === 'singles') return '';
  const label = e.format === 'match-play' ? 'Team' : e.format === 'triples' ? 'Teammates' : 'Partner';
  const names = e.format === 'match-play' ? [e.team] : e.partner.split(', ');
  return `<div class="card">
    <div class="ph"><h3>${label}</h3></div>
    <div class="pb">${names.map(n => `<div class="kv"><span class="ic-tile" style="font-weight:700;font-size:12px;--c:var(--plum)">${n.split(' ').map(x => x[0]).join('').slice(0, 2)}</span><div><div class="v">${n}</div><div class="k">${e.format === 'match-play' ? `${e.holesPerMatch}-hole matches · holes won decide it` : 'Best shot · one team score'}</div></div></div>`).join('')}
      ${e.feeSplit ? `<p class="meta" style="margin-top:8px">Entry split ${e.feeSplit} ways${e.lodging?.split > 1 ? ' · lodging split ' + e.lodging.split + ' ways' : ''}</p>` : ''}
    </div>
  </div>`;
}
function regCard(e) {
  const reg = daysUntil(e.regOpens);
  return `<div class="card">
    <div class="ph"><h3>Registration</h3><button class="btn sm" data-act="toast" data-msg="Would open the PDGA / Disc Golf Scene page">${I('external', 'xs')}Event page</button></div>
    <div class="pb">
      <div class="kv"><span class="ic-tile">${I('calendar', 'sm')}</span><div><div class="k">${reg > 0 ? 'Opens' : 'Opened'}</div><div class="v">${fmtDateY(e.regOpens)}</div></div><div class="end"><span class="reg-note ${reg > 0 ? '' : 'open'}">${reg > 0 ? 'in ' + reg + ' days' : 'Open now'}</span></div></div>
      <div class="kv"><span class="ic-tile">${I('wallet', 'sm')}</span><div><div class="k">Entry fee</div><div class="v">${money(e.fee)}${e.feeSplit ? ` <span class="muted" style="font-weight:500;font-size:13px">per team · ${money(e.fee / e.feeSplit)} yours</span>` : ''}</div></div></div>
      ${reg > 0 ? `<div class="remind">${I('bell', 'sm bell' + (UI.ring === e.id ? ' ring' : ''))}<div><b>Notify me when it opens</b><small>Push at 8:00 AM on ${fmtDate(e.regOpens)}</small></div><button class="switch ${e.remind ? 'on' : ''}" data-act="remind" data-id="${e.id}" aria-label="Reminder"></button></div>` : ''}
    </div>
  </div>`;
}
function travelCard(e) {
  const h = e.drive?.fromHome;
  const stops = [`<div class="stop" style="--c:var(--ink-2)"><div><b>Home</b><small>${HOME.city}</small></div></div>`];
  if (e.lodging) {
    stops.push(`<div class="leg">${I('car', 'xs')}${h.time} · ${h.mi} mi</div>`);
    stops.push(`<div class="stop" style="--c:var(--plum)"><div><b>${e.lodging.name}</b><small>${e.lodging.type} · ${e.lodging.nights} night${e.lodging.nights > 1 ? 's' : ''} · home base</small></div></div>`);
    e.courses.forEach(cid => { const leg = e.drive.toCourses?.[cid]; stops.push(`<div class="stop" style="--c:var(--good)"><div><b>${course(cid).name}</b><small>${leg ? leg.mi + ' mi from home base' : ''}</small></div><span class="t">${leg ? leg.time : ''}</span></div>`); });
  } else {
    stops.push(`<div class="leg">${I('car', 'xs')}Day trip</div>`);
    e.courses.forEach(cid => stops.push(`<div class="stop" style="--c:var(--good)"><div><b>${course(cid).name}</b><small>${h.mi} mi from home</small></div><span class="t">${h.time}</span></div>`));
  }
  return `<div class="card">
    <div class="ph"><h3>Travel</h3>${!e.lodging && h.mi > 120 ? `<button class="btn sm" data-act="toast" data-msg="Adding a stay isn't in the sample">${I('bed', 'xs')}Add stay</button>` : ''}</div>
    <div class="pb"><div class="trip"><span class="route"><i></i></span>${stops.join('')}</div><div class="minimap" id="mini-map"></div></div>
  </div>`;
}
function budgetCard(e) {
  const c = costFor(e);
  const parts = [
    { k: 'Entry', v: c.entry, note: e.feeSplit ? 'your share' : '', col: 'var(--moss)' },
    { k: 'Lodging', v: c.lodging, note: e.lodging ? `${e.lodging.nights} nt${e.lodging.split > 1 ? ' · split ' + e.lodging.split : ''}` : '', col: 'var(--plum)' },
    { k: 'Gas', v: c.gas, note: `${(e.drive?.fromHome?.mi || 0) * 2} mi`, col: 'var(--sun)' },
  ].filter(p => p.v > 0);
  const payout = e.result?.payout || 0, net = payout - c.total;
  return `<div class="card budget">
    <div class="ph"><h3>${isUpcoming(e) ? 'Budget' : 'Spent'}</h3><span class="mono">Estimate</span></div>
    <div class="pb">
      <div class="stack">${parts.map((p, i) => `<i style="flex:${p.v};background:${p.col};--i:${i}"></i>`).join('')}</div>
      ${parts.map(p => `<div class="line"><span><i style="background:${p.col}"></i>${p.k}<small>${p.note}</small></span><b>${money(p.v)}</b></div>`).join('')}
      ${payout ? `<div class="line"><span><i style="background:var(--lime)"></i>Payout</span><b style="color:var(--good)">+${money(payout)}</b></div>` : ''}
      <div class="line total"><span class="mono">${payout ? 'Net' : 'Total'}</span><span class="num" ${payout ? '' : `data-count="${Math.round(c.total)}" data-pre="$"`}>${payout ? (net >= 0 ? '+' : '−') + money(Math.abs(net)) : money(c.total)}</span></div>
    </div>
  </div>`;
}
function resultCard(e) {
  const r = e.result;
  if (e.format === 'match-play') {
    const rec = matchRecord(e);
    return `<div class="card result-hero">
      <div><span class="num">${ordSup(r.place)}</span><span class="mono">Team · of ${r.field}</span></div>
      <div><span class="num">${rec.w}–${rec.l}–${rec.p}</span><span class="mono">Your W–L–P</span></div>
      <div><span class="num" data-count="${(e.matches || []).reduce((a, m) => a + holeTally(m.holes).W, 0)}">0</span><span class="mono">Holes won</span></div>
    </div>`;
  }
  const rated = (e.roundLog || []).filter(x => x.rating);
  const avg = rated.length ? Math.round(rated.reduce((a, x) => a + x.rating, 0) / rated.length) : null;
  return `<div class="card result-hero">
    <div><span class="num">${ordSup(r.place)}</span><span class="mono">of ${r.field}${r.unit ? ' ' + r.unit : ''}</span></div>
    <div><span class="num" ${avg ? `data-count="${avg}" data-from="${avg - 80}"` : ''}>${avg || '—'}</span><span class="mono">${avg ? 'Avg rating' : 'Unrated'}</span></div>
    <div><span class="num" style="${r.payout ? 'color:var(--good)' : ''}" ${r.payout ? `data-count="${r.payout}" data-pre="$"` : ''}>${r.payout ? money(r.payout) : '$0'}</span><span class="mono">Payout</span></div>
  </div>`;
}
function roundsCard(e) {
  const log = e.roundLog || [], total = Math.max(e.rounds || 0, log.length), rows = [];
  for (let i = 0; i < total; i++) {
    const r = log[i];
    rows.push(r
      ? `<div class="rd"><span class="n">R${r.n}</span><div class="c"><b>${course(r.course).name}</b><small>${fmtDow(r.date)} · ${r.score} throws</small></div><span class="rt">${r.rating || ''}</span>${toParHTML(r.score, r.par)}</div>`
      : `<button class="rd missing" data-act="add-round" data-event="${e.id}"><span class="n">R${i + 1}</span><div class="c"><b>Not logged yet</b><small>Tap to add — course and date are pre-filled</small></div><span></span><span class="plus">${I('plus', 'sm')}</span></button>`);
  }
  const tot = log.reduce((a, x) => ({ s: a.s + x.score, p: a.p + x.par }), { s: 0, p: 0 });
  return `<div class="card">
    <div class="ph"><h3>Rounds${e.format !== 'singles' ? ' <span class="mono">team score</span>' : ''}</h3><button class="btn sm" data-act="add-round" data-event="${e.id}">${I('plus', 'xs')}Add</button></div>
    <div class="pb">${rows.join('')}
      ${log.length ? `<div class="rd total"><span></span><div class="c"><b>Total</b></div><span class="rt">${tot.s}</span>${toParHTML(tot.s, tot.p)}</div>` : ''}
      ${e.format !== 'singles' ? `<p class="meta" style="margin-top:8px">${FORMAT[e.format]} rounds aren't PDGA-rated, so they stay out of your rating stats.</p>` : ''}
    </div>
  </div>`;
}
function matchesCard(e) {
  return `<div class="card">
    <div class="ph"><h3>Matches</h3><button class="btn sm" data-act="add-match" data-event="${e.id}">${I('plus', 'xs')}Add match</button></div>
    <div class="pb" style="padding-top:4px">
      ${(e.matches || []).map((m, mi) => {
        const t = holeTally(m.holes);
        return `<div class="match" style="--m:${mi}"><div class="mh"><span class="res ${t.res}">${t.res}</span><div class="who"><b>vs ${m.opponent}</b><small>Match ${m.n} · ${m.oppTeam}</small></div><div class="tally"><span class="num">${t.W}–${t.L}</span><small>${t.P} PUSHED</small></div></div>
          <div class="holes">${[...m.holes].map((x, h) => `<i class="${x}" style="--h:${h}" title="Hole ${h + 1}: ${{ W: 'won', L: 'lost', P: 'push' }[x]}"></i>`).join('')}</div></div>`;
      }).join('')}
      <div class="legend" style="margin-top:12px"><span style="--c:var(--good)"><i></i>Won hole</span><span style="--c:var(--line-2)"><i></i>Push</span><span style="--c:var(--bad)"><i></i>Lost hole</span></div>
    </div>
  </div>`;
}
function notesCard(e) {
  return `<div class="card"><div class="ph"><h3>Notes</h3></div><div class="pb">${e.notes ? `<p style="font-family:var(--display);font-size:18px;line-height:1.45;font-weight:400;font-style:italic;color:var(--ink-2);font-variation-settings:'SOFT' 100,'opsz' 24">“${e.notes}”</p>` : `<button class="btn block" data-act="toast" data-msg="The notes editor isn't in the sample">${I('note', 'sm')}Add notes</button>`}</div></div>`;
}

// ═══════════════════════════════════════════════
//  COURSE DETAIL
// ═══════════════════════════════════════════════
function viewCourse(id) {
  const c = course(id), rounds = courseRounds(id), singles = rounds.filter(r => r.singles);
  const rel = singles.map(r => r.score - r.par);
  const avgRel = rel.length ? rel.reduce((a, b) => a + b, 0) / rel.length : null;
  const best = singles.length ? singles.reduce((a, r) => (r.score - r.par < a.score - a.par ? r : a)) : null;
  const rated = rounds.filter(r => r.rating);
  const evs = EVENTS.filter(e => e.courses.includes(id));
  const buckets = {};
  rel.forEach(v => buckets[v] = (buckets[v] || 0) + 1);
  const keys = Object.keys(buckets).map(Number).sort((a, b) => a - b), maxB = Math.max(1, ...Object.values(buckets));
  const sgn = v => v === 0 ? 'E' : (v > 0 ? '+' : '−') + Math.abs(v);
  const html = `
  ${banner(c, { kicker: `${coords(c.lat, c.lng)} · <b>${c.city}</b>`, title: c.name, chips: `<span class="chip">${c.holes} holes</span><span class="chip">Par ${c.par}</span><span class="chip">${c.length}</span><span class="chip">${c.terrain[0].toUpperCase() + c.terrain.slice(1)}</span>`, back: '#/courses', vtKey: 'course-' + c.id })}
  <div class="tiles" data-stagger>
    <div class="card tile"><span class="mono">Rounds</span><span class="num" data-count="${rounds.length}">0</span></div>
    <div class="card tile"><span class="mono">Avg to par</span><span class="num toPar ${avgRel < 0 ? 'under' : avgRel > 0 ? 'over' : ''}">${avgRel === null ? '—' : (avgRel < 0 ? '−' : avgRel > 0 ? '+' : '') + Math.abs(avgRel).toFixed(1)}</span></div>
    <div class="card tile"><span class="mono">Best</span><span class="num">${best ? toParHTML(best.score, best.par) : '—'}</span></div>
    <div class="card tile"><span class="mono">Avg rating</span><span class="num" ${rated.length ? `data-count="${Math.round(rated.reduce((a, r) => a + r.rating, 0) / rated.length)}" data-from="880"` : ''}>${rated.length ? '' : '—'}</span></div>
  </div>
  <div class="detail-grid">
    <div class="col"><div class="card rv">
      <div class="ph"><h3>Round history</h3><button class="btn sm" data-act="add-round" data-course="${id}">${I('plus', 'xs')}Add</button></div>
      <div class="pb" style="padding-top:4px" data-stagger>${rounds.map(r => `<a class="rd" href="${r.href}" style="grid-template-columns:1fr auto auto"><div class="c"><b>${r.label}</b><small>${fmtDateY(r.date)} · ${r.sub}</small></div><span class="rt">${r.rating || ''}</span>${toParHTML(r.score, r.par)}</a>`).join('') || '<p class="muted">No rounds yet.</p>'}</div>
    </div></div>
    <div class="col">
      <div class="card rv"><div class="ph"><h3>Score spread</h3><span class="mono">${singles.length} rounds</span></div>
        <div class="pb dist">${keys.map((k, i) => `<div class="r"><span>${sgn(k)}</span><span class="b"><i style="width:${buckets[k] / maxB * 100}%;--i:${i}"></i></span><span class="n">${buckets[k]}</span></div>`).join('') || '<p class="muted">—</p>'}</div>
      </div>
      <div class="card rv"><div class="ph"><h3>Events here</h3></div>
        <div class="pb" style="padding-top:6px">${evs.map(e => `<a class="lrow" style="padding:11px 0" href="#/event/${e.id}"><div class="body"><div class="name" style="font-size:14.5px">${e.name}</div><div class="meta">${fmtDateY(e.start)}</div></div>${statusChip(e)}</a>`).join('') || '<p class="muted">None yet.</p>'}</div>
      </div>
    </div>
  </div>`;
  return { html, top: { title: c.name, left: `<a class="icon-btn" style="width:34px;height:34px" href="#/courses">${I('chevL', 'sm')}</a>` } };
}

// ═══════════════════════════════════════════════
//  RESULTS + COURSES
// ═══════════════════════════════════════════════
function viewResults() {
  const tab = UI.resultsTab, p = past();
  const podiums = p.filter(e => e.result?.place <= 3).length;
  const rounds = p.reduce((a, e) => a + (e.roundLog || []).length + (e.matches || []).length, 0) + LEAGUE_ROUNDS.length;
  const gain = RATING_HISTORY[RATING_HISTORY.length - 1].r - RATING_HISTORY[0].r;
  let body;
  if (tab === 'leagues') {
    body = LEAGUES.map(l => {
      const rs = LEAGUE_ROUNDS.filter(r => r.league === l.id);
      const avg = rs.reduce((a, r) => a + r.score - r.par, 0) / rs.length;
      const net = rs.reduce((a, r) => a + r.cash - r.fee, 0);
      return `<section class="section rv"><div class="card list">
        <div class="lrow" style="padding:16px">${thumb(l.course)}<div class="body"><div class="name" style="font-family:var(--display);font-size:21px;font-weight:560;letter-spacing:-.02em">${l.name}</div><div class="meta"><span class="league-chip" style="background:${l.color};width:8px;height:8px;border-radius:2px"></span>${course(l.course).name}<span class="dot"></span>${l.when}</div></div>
          <button class="btn sm primary" data-act="add-round" data-league="${l.id}">${I('plus', 'xs')}Round</button></div>
        <div class="stats-strip" style="grid-template-columns:repeat(3,1fr);box-shadow:inset 0 1px 0 var(--line), inset 0 -1px 0 var(--line)">
          <div><span class="mono">Rounds</span><span class="num">${rs.length}</span></div><div><span class="mono">Avg</span><span class="num toPar ${avg < 0 ? 'under' : ''}">${avg < 0 ? '−' : '+'}${Math.abs(avg).toFixed(1)}</span></div><div><span class="mono">Net</span><span class="num" style="color:${net >= 0 ? 'var(--good)' : 'var(--bad)'}">${net >= 0 ? '+' : '−'}${money(Math.abs(net))}</span></div>
        </div>
        <div data-stagger>${rs.map(r => `<div class="lrow"><div class="body"><div class="name" style="font-size:14.5px">${fmtDow(r.date)}</div><div class="meta">${ord(r.place)} of ${r.field}${r.cash ? `<span class="dot"></span><span style="color:var(--good);font-weight:650">+${money(r.cash)}</span>` : ''}</div></div><div class="end"><div class="v">${toParHTML(r.score, r.par)}</div><small>${r.score} throws</small></div></div>`).join('')}</div>
      </div></section>`;
    }).join('');
  } else {
    const byYear = {};
    p.forEach(e => (byYear[e.start.slice(0, 4)] = byYear[e.start.slice(0, 4)] || []).push(e));
    body = Object.keys(byYear).sort().reverse().map(y => `<div class="year-h"><h4>${y}</h4><span class="mono">${byYear[y].length} events</span></div><div class="card list" data-stagger>${byYear[y].map(resultRow).join('')}</div>`).join('');
  }
  const html = `
  <div class="pagehead"><div><span class="mono">Tournaments · leagues</span><h1 class="display" data-sentinel>Results</h1></div><button class="icon-btn" data-act="quick" aria-label="Add">${I('plus', 'sm')}</button></div>
  <div class="review rv">${topo('review', 'rgba(205,235,110,.18)', 14)}
    <span class="mono">Season recap</span>
    <h2>2026, <em>in review</em></h2>
    <div class="grid">
      <div><span class="mono">Events</span><span class="num" data-count="${p.length}">0</span></div>
      <div><span class="mono">Podiums</span><span class="num lime" data-count="${podiums}">0</span></div>
      <div><span class="mono">Rounds logged</span><span class="num" data-count="${rounds}">0</span></div>
      <div><span class="mono">Rating gain</span><span class="num lime" data-count="${gain}" data-pre="+">0</span></div>
    </div>
  </div>
  <div style="margin-top:22px">${seg([['tournaments', 'Tournaments'], ['leagues', 'Leagues']], tab, 'rtab')}</div>
  ${body}`;
  return { html, top: { title: 'Results' } };
}

function viewCourses() {
  const q = UI.q.toLowerCase();
  const list = COURSES.filter(c => !q || (c.name + c.city).toLowerCase().includes(q));
  const html = `
  <div class="pagehead"><div><span class="mono">${COURSES.length} courses · 3 states</span><h1 class="display" data-sentinel>Courses</h1></div><button class="icon-btn" data-act="toast" data-msg="Adding courses isn't in the sample" aria-label="Add">${I('plus', 'sm')}</button></div>
  <label class="search">${I('search', 'sm')}<input id="course-q" placeholder="Search by name or city" value="${UI.q}" autocomplete="off"></label>
  <div class="course-grid" data-stagger>${list.map(c => {
    const all = courseRounds(c.id), rs = all.filter(r => r.singles);
    const avg = rs.length ? rs.reduce((a, r) => a + r.score - r.par, 0) / rs.length : null;
    const nextEv = upcoming().find(e => e.courses.includes(c.id));
    return `<a class="card ccard" href="#/course/${c.id}" data-vt="course-${c.id}">
      <div class="art">${art(c)}${nextEv ? `<span class="tag"><span class="chip">${I('calendar', 'xs')}${fmtDate(nextEv.start)}</span></span>` : ''}<span class="coord">${coords(c.lat, c.lng)}</span></div>
      <div class="cb"><b>${c.name}</b><div class="meta">${c.city}<span class="dot"></span>${c.holes} holes · par ${c.par}</div>
        <div class="s3"><div><span class="mono">Rounds</span><span class="num">${all.length}</span></div><div><span class="mono">Avg</span><span class="num toPar ${avg < 0 ? 'under' : avg > 0 ? 'over' : ''}">${avg === null ? '—' : (avg < 0 ? '−' : avg > 0 ? '+' : '') + Math.abs(avg).toFixed(1)}</span></div></div>
      </div></a>`;
  }).join('')}</div>`;
  return { html, top: { title: 'Courses' } };
}

// ═══════════════════════════════════════════════
//  SHEETS — log round / match / event / quick add
// ═══════════════════════════════════════════════
let FORM = null;
function openSheet(kind, ctx = {}) {
  FORM = { kind, ...ctx };
  if (kind === 'round') initRoundForm();
  if (kind === 'match') FORM.holes = Array(event(FORM.event).holesPerMatch || 12).fill('');
  if (kind === 'event') Object.assign(FORM, { format: 'singles', pdga: true, status: 'interested', name: '', city: '', link: '' });
  const wasOpen = $('sheet').classList.contains('open');
  renderSheet(true);
  if (!wasOpen) { $('scrim').classList.add('open'); $('sheet').classList.add('open'); document.body.classList.add('sheet-open'); }
}
function closeSheet() {
  $('scrim').classList.remove('open'); $('sheet').classList.remove('open'); document.body.classList.remove('sheet-open');
  $('sheet').style.removeProperty('--drag');
}
function lastWeekday(dow) { const d = new Date(TODAY); while (d.getDay() !== dow) d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); }

function initRoundForm() {
  const f = FORM;
  f.toPar = 0; f.rating = ''; f.notes = '';
  if (f.event) {
    const e = event(f.event), log = e.roundLog || [];
    f.n = log.length + 1;
    if (e.courses.length === 1) { f.course = e.courses[0]; f.why = 'auto'; }
    else {
      const use = id => log.filter(r => r.course === id).length;
      const min = Math.min(...e.courses.map(use)), least = e.courses.filter(id => use(id) === min);
      f.course = least.length === 1 ? least[0] : null;
      f.why = least.length === 1 ? 'suggested' : 'pick';
    }
    const days = []; for (let d = D(e.start); d <= D(e.end); d = new Date(d.getTime() + 864e5)) days.push(d.toISOString().slice(0, 10));
    f.days = days;
    const perDay = Math.ceil((e.rounds || days.length) / days.length);
    f.date = days[Math.min(days.length - 1, Math.floor((f.n - 1) / perDay))];
  } else if (f.league) {
    const l = league(f.league);
    f.course = l.course; f.why = 'league';
    f.days = [lastWeekday(DOW.indexOf(l.when.slice(0, 3))), '2026-11-01'];
    f.date = f.days[0]; f.fee = 5;
  } else if (f.course) { f.why = ''; f.days = ['2026-11-01', '2026-10-31']; f.date = f.days[0]; }
}

function renderSheet(enter = false) {
  const sb = document.querySelector('#sheet .sb'), keep = sb && !enter ? sb.scrollTop : 0;
  const f = FORM;
  let s = {};
  if (f.kind === 'quick') s = quickSheet();
  else if (f.kind === 'pick-event') s = pickEventSheet();
  else if (f.kind === 'round') s = roundSheet();
  else if (f.kind === 'match') s = matchSheet();
  else if (f.kind === 'event') s = eventSheet();
  const sh = $('sheet');
  sh.classList.toggle('enter', enter);
  sh.innerHTML = `<div class="grab"></div><div class="shd"><h3>${s.title}</h3><button class="icon-btn" data-act="sheet-close" aria-label="Close">${I('x', 'sm')}</button></div><div class="sb">${s.body}</div>${s.foot ? `<div class="sf">${s.foot}</div>` : ''}`;
  sh.querySelector('.sb').scrollTop = keep;
  f.dir = ''; f.tap = null;
}

function quickSheet() {
  const pending = EVENTS.find(e => e.status === 'played'), l = LEAGUES[0];
  return { title: 'Log something', body: `
    <div class="quick">
      ${pending ? `<button class="feature" data-act="add-round" data-event="${pending.id}"><span class="ic-tile">${I('note')}</span><div><b>Finish ${pending.name}</b><small>Round ${(pending.roundLog || []).length + 1} — course and date ready</small></div>${I('arrowR', 'sm chev')}</button>` : ''}
      <button data-act="pick-event"><span class="ic-tile">${I('trophy')}</span><div><b>Tournament round</b><small>Pick an event</small></div></button>
      <button data-act="add-round" data-league="${l.id}"><span class="ic-tile">${I('users')}</span><div><b>League round</b><small>${l.name}</small></div></button>
      <button data-act="new-event"><span class="ic-tile">${I('calendar')}</span><div><b>Event</b><small>Upcoming or past</small></div></button>
      <button data-act="toast" data-msg="Adding courses isn't in the sample"><span class="ic-tile">${I('course')}</span><div><b>Course</b><small>New layout</small></div></button>
    </div>` };
}
function pickEventSheet() {
  const evs = EVENTS.slice().sort((a, b) => b.start.localeCompare(a.start));
  return { title: 'Which event?', body: `<div class="card list" style="box-shadow:var(--hair)">${evs.map(e => `<button class="lrow" data-act="${e.format === 'match-play' ? 'add-match' : 'add-round'}" data-event="${e.id}">${thumb(e.courses[0], 'sm')}<div class="body"><div class="name">${e.name}</div><div class="meta">${fmtDateY(e.start)}<span class="dot"></span>${FORMAT[e.format]}</div></div>${statusChip(e)}</button>`).join('')}</div>` };
}
function roundSheet() {
  const f = FORM, e = f.event && event(f.event), l = f.league && league(f.league), c = f.course && course(f.course);
  const par = c ? c.par : 54, throwsN = par + f.toPar, tp = toPar(throwsN, par);
  const ctx = e ? `<div class="ctx">${thumb(e.courses[0], 'sm')}<div><span class="mono">Event</span><b>${e.name}</b></div><span class="lock">${I('lock', 'sm')}</span></div>`
    : l ? `<div class="ctx"><span class="league-chip" style="background:${l.color};margin:0 6px 0 4px"></span><div><span class="mono">League</span><b>${l.name}</b></div><span class="lock">${I('lock', 'sm')}</span></div>`
    : `<div class="ctx">${thumb(c.id, 'sm')}<div><span class="mono">Casual round</span><b>${c.name}</b></div></div>`;
  const options = e ? e.courses : [f.course];
  const why = { auto: `${I('check', 'xs')}Only course at this event`, suggested: `${I('sparkle', 'xs')}Least-played here so far`, pick: `<span class="hint sug">Pick one of ${e?.courses.length}</span>`, league: `${I('check', 'xs')}League home course` }[f.why] || '';
  const logged = e ? (e.roundLog || []).map(r => r.n) : [];
  const rated = !e || e.format === 'singles';
  const body = `
    ${ctx}
    ${e ? `<div class="field"><div class="lbl">Round<span class="hint">${I('check', 'xs')}Next unlogged</span></div><div class="choice compact">${Array.from({ length: Math.max(e.rounds || 1, f.n) }, (_, i) => i + 1).map(n => `<button class="${f.n === n ? 'on' : ''} ${logged.includes(n) ? 'done' : ''}" data-act="f-set" data-k="n" data-val="${n}">Round ${n}${logged.includes(n) ? ' ✓' : ''}</button>`).join('')}</div></div>` : ''}
    <div class="field"><div class="lbl">Course<span class="hint">${why}</span></div>
      <div class="choice">${options.map(id => { const cc = course(id); const used = e ? (e.roundLog || []).filter(r => r.course === id).map(r => 'R' + r.n).join(', ') : ''; return `<button class="${f.course === id ? 'on' : ''}" data-act="f-set" data-k="course" data-val="${id}">${thumb(id, 'sm')}<span>${cc.name}<small>Par ${cc.par}${used ? ' · played ' + used : ''}</small></span>${f.course === id ? `<span class="ck">${I('check')}</span>` : ''}</button>`; }).join('')}</div>
    </div>
    <div class="field"><div class="lbl">Date${e ? `<span class="hint">${I('check', 'xs')}From event days</span>` : ''}</div><div class="choice compact">${(f.days || []).map(d => `<button class="${f.date === d ? 'on' : ''}" data-act="f-set" data-k="date" data-val="${d}">${fmtDow(d)}</button>`).join('')}</div></div>
    <div class="field"><div class="lbl">Score${e && e.format !== 'singles' ? ' · team' : ''}<span class="hint sug">Par ${par}</span></div>
      <div class="pad"><button data-act="f-score" data-val="-1" aria-label="One fewer">−</button><div class="mid"><span class="toPar ${tp.cls} ${f.dir}">${tp.txt}</span><small>${throwsN} throws</small></div><button data-act="f-score" data-val="1" aria-label="One more">+</button></div>
    </div>
    ${rated ? `<div class="field"><div class="lbl">PDGA round rating<span class="hint sug">Optional · add later</span></div><input class="input" data-k="rating" inputmode="numeric" placeholder="e.g. 955" value="${f.rating}"></div>` : `<p class="meta" style="margin-top:16px">${FORMAT[e.format]} rounds aren't rated, so there's no rating field.</p>`}
    ${l ? `<div class="field two"><div><div class="lbl">Place</div><input class="input" data-k="place" inputmode="numeric" placeholder="3"></div><div><div class="lbl">Field</div><input class="input" data-k="field" inputmode="numeric" placeholder="24"></div><div><div class="lbl">Fee</div><input class="input" data-k="fee" inputmode="decimal" value="${f.fee}"></div><div><div class="lbl">Payout</div><input class="input" data-k="cash" inputmode="decimal" placeholder="0"></div></div>` : ''}
    <div class="field"><div class="lbl">Notes</div><textarea class="input" data-k="notes" placeholder="Wind, putting, what clicked…">${f.notes}</textarea></div>`;
  return { title: e ? `Round ${f.n}` : l ? 'League round' : 'Casual round', body, foot: `<button class="btn" data-act="sheet-close">Cancel</button><button class="btn primary" data-act="save-round" ${f.course ? '' : 'disabled'}>Save round</button>` };
}
function matchSheet() {
  const f = FORM, e = event(f.event), n = (e.matches || []).length + 1;
  const t = holeTally(f.holes.join('')), played = f.holes.filter(Boolean).length;
  const body = `
    <div class="ctx">${thumb(e.courses[0], 'sm')}<div><span class="mono">${e.team}</span><b>${e.name}</b></div><span class="lock">${I('lock', 'sm')}</span></div>
    <div class="field two"><div><div class="lbl">Opponent</div><input class="input" data-k="opp" placeholder="Name" value="${f.opp || ''}"></div><div><div class="lbl">Their team</div><input class="input" data-k="oppTeam" placeholder="Team" value="${f.oppTeam || ''}"></div></div>
    <div class="field"><div class="lbl">Holes<span class="hint sug">Tap · win → push → loss</span></div>
      <div class="hole-grid">${f.holes.map((h, i) => `<button class="${h} ${f.tap === i ? 'tap' : ''}" data-act="f-hole" data-i="${i}"><small>${i + 1}</small>${h || '·'}</button>`).join('')}</div>
      <div class="live"><span>${t.W} won · ${t.P} pushed · ${t.L} lost</span><span class="num" style="color:${played ? (t.res === 'W' ? 'var(--good)' : t.res === 'L' ? 'var(--bad)' : 'var(--muted)') : 'var(--faint)'}">${played ? { W: `${t.W - t.L} up`, L: `${t.L - t.W} down`, P: 'All square' }[t.res] : '—'}</span></div>
    </div>`;
  return { title: `Match ${n}`, body, foot: `<button class="btn" data-act="sheet-close">Cancel</button><button class="btn primary" data-act="save-match">Save match</button>` };
}
function eventSheet() {
  const f = FORMAT, F = FORM;
  const body = `
    <div class="field" style="margin-top:4px"><div class="lbl">PDGA or Disc Golf Scene link<span class="hint sug">Optional</span></div>
      <div style="display:flex;gap:8px"><input class="input" data-k="link" placeholder="Paste event URL" value="${F.link}"><button class="btn primary" data-act="autofill" style="height:50px;flex:none">${I('sparkle', 'sm')}Fill</button></div>
    </div>
    <div class="field"><div class="lbl">Event name</div><input class="input" data-k="name" placeholder="e.g. Glass City Open" value="${F.name}"></div>
    <div class="field two"><div><div class="lbl">Starts</div><input class="input" type="date" data-k="start" value="${F.start || ''}"></div><div><div class="lbl">Ends</div><input class="input" type="date" data-k="end" value="${F.end || ''}"></div></div>
    <div class="field"><div class="lbl">Location</div><input class="input" data-k="city" placeholder="City, State" value="${F.city}"></div>
    <div class="field"><div class="lbl">Format</div><div class="choice compact">${Object.keys(f).map(k => `<button class="${F.format === k ? 'on' : ''}" data-act="f-set" data-k="format" data-val="${k}">${f[k]}</button>`).join('')}</div></div>
    ${F.format === 'doubles' || F.format === 'team-doubles' ? `<div class="field"><div class="lbl">Partner</div><input class="input" placeholder="Who are you throwing with?"></div>` : ''}
    ${F.format === 'triples' ? `<div class="field two"><div><div class="lbl">Teammate 1</div><input class="input"></div><div><div class="lbl">Teammate 2</div><input class="input"></div></div>` : ''}
    ${F.format === 'match-play' ? `<div class="field two"><div><div class="lbl">Your team</div><input class="input" placeholder="Team name"></div><div><div class="lbl">Holes per match</div><input class="input" inputmode="numeric" value="12"></div></div>` : ''}
    <div class="field"><div class="lbl">Sanctioning</div><div class="choice compact"><button class="${F.pdga ? 'on' : ''}" data-act="f-set" data-k="pdga" data-val="1">PDGA</button><button class="${!F.pdga ? 'on' : ''}" data-act="f-set" data-k="pdga" data-val="">Non-PDGA</button></div></div>
    ${F.pdga ? `<div class="field two"><div><div class="lbl">Tier</div><select class="input"><option>C-Tier</option><option selected>B-Tier</option><option>A-Tier</option><option>Major</option></select></div><div><div class="lbl">Division</div><select class="input"><option>MA1</option><option>MPO</option><option>MA2</option><option>MA40</option></select></div></div>` : ''}
    <div class="field"><div class="lbl">Status</div><div class="choice compact">${['interested', 'planning', 'registered', 'waitlisted'].map(s => `<button class="${F.status === s ? 'on' : ''}" data-act="f-set" data-k="status" data-val="${s}"><span class="status ${s}" style="background:none;padding:0">${STATUS[s]}</span></button>`).join('')}</div></div>
    <div class="field two"><div><div class="lbl">Entry fee</div><input class="input" inputmode="decimal" placeholder="$" value="${F.fee || ''}"></div><div><div class="lbl">Registration opens</div><input class="input" type="date" value="${F.regOpens || ''}"></div></div>`;
  return { title: 'New event', body, foot: `<button class="btn" data-act="sheet-close">Cancel</button><button class="btn primary" data-act="toast" data-msg="Sample only — event not saved" data-close="1">Save event</button>` };
}

// drag the sheet down to dismiss
(() => {
  let y0 = null, dy = 0, t0 = 0;
  const sh = $('sheet');
  sh.addEventListener('pointerdown', e => {
    if (innerWidth >= 720 || !e.target.closest('.grab, .shd') || e.target.closest('button')) return;
    y0 = e.clientY; dy = 0; t0 = performance.now(); sh.classList.add('dragging'); sh.setPointerCapture(e.pointerId);
  });
  sh.addEventListener('pointermove', e => {
    if (y0 === null) return;
    dy = Math.max(0, e.clientY - y0) + Math.min(0, e.clientY - y0) * .15;
    sh.style.setProperty('--drag', dy + 'px');
  });
  const end = () => {
    if (y0 === null) return;
    y0 = null; sh.classList.remove('dragging');
    const v = dy / (performance.now() - t0);
    if (dy > 140 || v > .6) closeSheet(); else sh.style.setProperty('--drag', '0px');
  };
  sh.addEventListener('pointerup', end); sh.addEventListener('pointercancel', end);
})();

// ═══════════════════════════════════════════════
//  EVENTS
// ═══════════════════════════════════════════════
function toast(msg) {
  const t = $('toast'); t.innerHTML = I('check', 'sm') + msg; t.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2600);
}
function slideSeg(btn, then) {
  const seg = btn.closest('.seg');
  seg.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === btn));
  placeSeg(seg);
  setTimeout(then, REDUCED ? 0 : 230);
}

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
      case 'replay': fly(el.closest('.hero').querySelector('.art')); break;
      case 'status': { const e = event(d.id); if (e.status === d.val) break; e.status = d.val; if (d.val === 'waitlisted' && !e.waitlistPos) e.waitlistPos = 3; UI.pulse = e.id; render({ keepScroll: true }); toast(`Status set to ${STATUS[d.val]}`); break; }
      case 'remind': { const e = event(d.id); e.remind = !e.remind; UI.ring = e.remind ? e.id : null; render({ keepScroll: true }); toast(e.remind ? `We'll ping you ${fmtDate(e.regOpens)} at 8:00 AM` : 'Reminder off'); break; }
      case 'quick': if (document.body.classList.contains('sheet-open')) closeSheet(); else openSheet('quick'); break;
      case 'pick-event': FORM = { kind: 'pick-event' }; renderSheet(true); break;
      case 'new-event': openSheet('event'); break;
      case 'add-round': openSheet('round', { event: d.event, league: d.league, course: d.course }); break;
      case 'add-match': openSheet('match', { event: d.event }); break;
      case 'sheet-close': closeSheet(); break;
      case 'f-set': FORM[d.k] = d.k === 'n' ? +d.val : d.k === 'pdga' ? !!d.val : d.val; renderSheet(); break;
      case 'f-score': FORM.toPar += +d.val; FORM.dir = +d.val > 0 ? 'up' : 'down'; renderSheet(); break;
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
  if (ev.target.id === 'course-q') {
    UI.q = ev.target.value; const pos = ev.target.selectionStart;
    render({ keepScroll: true }); const i = $('course-q'); i.focus(); i.setSelectionRange(pos, pos); return;
  }
  const k = ev.target.dataset.k;
  if (k && FORM) FORM[k] = ev.target.value;
});
$('scrim').addEventListener('click', closeSheet);
document.addEventListener('keydown', ev => { if (ev.key === 'Escape') closeSheet(); });
addEventListener('popstate', () => {
  if (!REDUCED && document.startViewTransition) document.startViewTransition(() => render()); else render();
});

function saveRound() {
  const f = FORM; if (!f.course) return;
  const par = course(f.course).par;
  if (f.event) {
    const e = event(f.event);
    e.roundLog = e.roundLog || [];
    e.roundLog.push({ n: f.n, date: f.date, course: f.course, par, score: par + f.toPar, rating: +f.rating || null });
    e.roundLog.sort((a, b) => a.n - b.n);
    closeSheet();
    if (e.status === 'played' && e.roundLog.length >= (e.rounds || 0)) { e.status = 'recorded'; e.notes = e.notes || f.notes || 'Logged from the sample — this is where your round notes live.'; UI.pulse = e.id; }
    const msg = e.status === 'recorded' && UI.pulse ? `${e.name} is now Recorded` : `Round ${f.n} saved`;
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

applyPrefs();
buildShell();
render();
