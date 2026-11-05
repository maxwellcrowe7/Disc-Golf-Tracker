// Match play: each hole is won (W), pushed (P) or lost (L); holes won decide the match.

export function holeTally(holes) {
  const t = { W: 0, P: 0, L: 0 }
  for (const h of holes || '') if (h in t) t[h]++
  t.res = t.W > t.L ? 'W' : t.L > t.W ? 'L' : 'P'
  return t
}

// A match's result: from the holes when they were tracked, otherwise as recorded.
export const matchResult = (m) => (m.holes ? holeTally(m.holes).res : m.result)

export function matchRecord(matches) {
  const r = { w: 0, l: 0, p: 0 }
  for (const m of matches) {
    const res = matchResult(m)
    if (res) r[res.toLowerCase()]++
  }
  return r
}
