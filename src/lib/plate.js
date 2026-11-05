// Course "plates": a seeded two-ink map print per course — halftone elevation,
// contour ink, paper knock-out fairway, disc-orange flight. Colours come from
// CSS variables (--pp paper, --pi ink, --pb water, --po disc) so light/dark both work.

function hashStr(s) {
  let h = 2166136261
  for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) }
  return h >>> 0
}

function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const TERRAIN = {
  wooded: { tint: 0.3, ht: 1, clusters: 10, rings: 8, step: 15 },
  open: { tint: 0.1, ht: 0.55, clusters: 3, rings: 7, step: 16 },
  water: { tint: 0.12, ht: 0.6, clusters: 4, rings: 7, step: 16, water: true },
  hilly: { tint: 0.2, ht: 1, clusters: 6, rings: 12, step: 11 },
  mixed: { tint: 0.17, ht: 0.8, clusters: 6, rings: 8, step: 14 },
}
export const TERRAINS = Object.keys(TERRAIN)

function blob(cx, cy, r, R, amp, n = 64, squash = 0.78) {
  const ph = [R() * 6.28, R() * 6.28, R() * 6.28]
  let d = ''
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2
    const rr = r + amp * (Math.sin(t * 2 + ph[0]) * 0.55 + Math.sin(t * 3 + ph[1]) * 0.3 + Math.sin(t * 5 + ph[2]) * 0.15)
    d += (i ? 'L' : 'M') + (cx + Math.cos(t) * rr).toFixed(1) + ' ' + (cy + Math.sin(t) * rr * squash).toFixed(1)
  }
  return d + 'Z'
}

// Bare contour lines for decorative backgrounds (sidebar).
export function topo(seed, stroke, rings = 14) {
  const R = rng(hashStr(seed))
  let s = '<svg class="topo" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g>'
  for (let h = 0; h < 2; h++) {
    const cx = 120 + R() * 160, cy = 120 + R() * 160, sd = R() * 1e9
    for (let k = 1; k <= rings; k++) s += `<path d="${blob(cx, cy, 6 + k * 15, rng(sd), 6 + k * 2.6, 72, 0.85)}" fill="none" stroke="${stroke}" stroke-width="${k % 5 === 0 ? 1.6 : 0.9}"/>`
  }
  return s + '</g></svg>'
}

/**
 * @param {{id: string, name: string, terrain?: string}} course
 * @param {{lite?: boolean, dot?: number, fly?: boolean}} opts
 *   lite — thumbnail variant (no halftone, fewer rings/trees); dot — halftone size multiplier for big plates;
 *   fly — include the animated disc for the home hero.
 */
export function plateSvg(course, opts = {}) {
  const R = rng(hashStr(course.id + course.name)), T0 = TERRAIN[course.terrain] || TERRAIN.mixed
  const W = 320, H = 200, g = 'pl-' + course.id, lite = !!opts.lite, k = opts.dot || 1
  const gid = g + (opts.dot ? '-d' + String(k).replace('.', '') : '')
  const hills = course.terrain === 'hilly' || course.terrain === 'mixed' ? 2 : 1
  const hc = Array.from({ length: hills }, () => [50 + R() * 220, 30 + R() * 140, R() * 1e9])

  let s = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>`
  if (!lite) {
    s += `<pattern id="${gid}-ht" width="${3.6 * k}" height="${3.6 * k}" patternUnits="userSpaceOnUse" patternTransform="rotate(22)"><circle cx="${1.8 * k}" cy="${1.8 * k}" r="${1.05 * k}" fill="var(--pi)"/></pattern>`
    s += `<pattern id="${gid}-ht2" width="${3.6 * k}" height="${3.6 * k}" patternUnits="userSpaceOnUse" patternTransform="rotate(22)"><circle cx="${1.8 * k}" cy="${1.8 * k}" r="${0.55 * k}" fill="var(--pi)"/></pattern>`
    hc.forEach(([cx, cy], h) => {
      s += `<radialGradient id="${g}-g${h}" gradientUnits="userSpaceOnUse" cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${(90 + T0.rings * 6).toFixed(0)}"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient><mask id="${g}-m${h}"><rect width="${W}" height="${H}" fill="url(#${g}-g${h})"/></mask>`
    })
  }
  s += `</defs><rect width="${W}" height="${H}" fill="var(--pp)"/><rect width="${W}" height="${H}" fill="var(--pi)" opacity="${T0.tint}"/>`
  if (!lite) s += `<rect width="${W}" height="${H}" fill="url(#${gid}-ht2)" opacity="${(T0.ht * 0.18).toFixed(2)}"/>`

  hc.forEach(([cx, cy, sd], h) => {
    if (!lite) s += `<rect width="${W}" height="${H}" fill="url(#${gid}-ht)" mask="url(#${g}-m${h})" opacity="${(T0.ht * 0.8).toFixed(2)}"/>`
    for (let r = 1; r <= T0.rings; r += lite ? 2 : 1) {
      s += `<path d="${blob(cx, cy, 8 + r * T0.step, rng(sd), 4 + r * 2.2)}" fill="none" stroke="var(--pi)" stroke-opacity="${r % 4 === 0 ? 0.75 : 0.45}" stroke-width="${r % 4 === 0 ? 1.4 : 0.8}"/>`
    }
  })

  if (T0.water) {
    const wx = 210 + R() * 80, wy = 135 + R() * 50, wr = 46 + R() * 14
    s += `<path d="${blob(wx, wy, wr, R, 10)}" fill="var(--pb)" opacity=".88"/><path d="${blob(wx, wy, wr + 8, R, 9)}" fill="none" stroke="var(--pb)" stroke-width="1" stroke-dasharray="2 3" opacity=".7"/><path d="${blob(wx, wy, wr + 15, R, 9)}" fill="none" stroke="var(--pb)" stroke-width=".8" stroke-dasharray="1 4" opacity=".5"/>`
  }

  const T = [36 + R() * 40, 148 + R() * 32], B = [222 + R() * 62, 42 + R() * 40], C = [110 + R() * 70, 50 + R() * 110]
  const q = (t) => [(1 - t) ** 2 * T[0] + 2 * (1 - t) * t * C[0] + t * t * B[0], (1 - t) ** 2 * T[1] + 2 * (1 - t) * t * C[1] + t * t * B[1]]
  const fw = `M${T[0].toFixed(1)} ${T[1].toFixed(1)}Q${C[0].toFixed(1)} ${C[1].toFixed(1)} ${B[0].toFixed(1)} ${B[1].toFixed(1)}`
  // The fairway is knocked out of the green ink — negative space, like a real two-colour print.
  s += `<path d="${fw}" fill="none" stroke="var(--pp)" stroke-opacity=".72" stroke-width="34" stroke-linecap="round"/><path d="${fw}" fill="none" stroke="var(--pp)" stroke-opacity=".85" stroke-width="15" stroke-linecap="round"/>`

  const path = Array.from({ length: 24 }, (_, i) => q(i / 23))
  for (let c = 0; c < T0.clusters; c++) {
    const kx = R() * W, ky = R() * H, n = 5 + Math.floor(R() * 9)
    for (let j = 0; j < n; j++) {
      const x = kx + (R() - 0.5) * 60, y = ky + (R() - 0.5) * 46, r = 4.5 + R() * 6.5
      if (path.some(([px, py]) => Math.hypot(px - x, py - y) < 24 + r)) continue
      s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="var(--pi)" opacity=".78"/>`
      if (!lite) s += `<circle cx="${(x + r * 0.3).toFixed(1)}" cy="${(y + r * 0.32).toFixed(1)}" r="${(r * 0.62).toFixed(1)}" fill="var(--pi)" opacity=".55"/>`
    }
  }

  // Second ink, slightly mis-registered.
  const ang = (Math.atan2(C[1] - T[1], C[0] - T[0]) * 180) / Math.PI
  const bx = B[0].toFixed(1), by = B[1].toFixed(1)
  s += `<g transform="translate(.9 -.7)"><path class="flight" d="${fw}" pathLength="1" fill="none" stroke="var(--po)" stroke-width="2" stroke-linecap="round"/>`
  s += `<rect x="${(T[0] - 9).toFixed(1)}" y="${(T[1] - 4.5).toFixed(1)}" width="18" height="9" rx="1.5" fill="var(--po)" transform="rotate(${ang.toFixed(1)} ${T[0].toFixed(1)} ${T[1].toFixed(1)})"/>`
  if (opts.fly) s += `<path class="trail" d="${fw}" pathLength="1"/><circle class="chains" cx="${bx}" cy="${by}" r="7" fill="none" stroke="var(--po)" stroke-width="1.6"/>`
  s += `<circle cx="${bx}" cy="${by}" r="3.4" fill="var(--po)"/></g>`
  s += `<circle cx="${bx}" cy="${by}" r="8.5" fill="none" stroke="var(--pi)" stroke-width="1.4"/><circle cx="${bx}" cy="${by}" r="12.5" fill="none" stroke="var(--pi)" stroke-width=".7" stroke-dasharray="1.5 2.5"/>`
  if (opts.fly) s += `<g class="disc"><ellipse rx="6" ry="4" fill="var(--po)"/><ellipse rx="3.2" ry="2" fill="none" stroke="var(--pp)" stroke-width=".9" opacity=".7"/><animateMotion dur="2s" begin="indefinite" fill="freeze" calcMode="spline" keyTimes="0;1" keyPoints="0;1" keySplines=".3 .1 .15 1" rotate="auto" path="${fw}"/></g>`
  return s + '</svg>'
}
