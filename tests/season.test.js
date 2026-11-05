import { describe, it, expect } from 'vitest'
import { demoData } from '../src/data/store.js'
import { isUpcoming, upcomingEvents, pastEvents, costFor, todos } from '../src/lib/season.js'
import { statsFor, seasonsIn } from '../src/lib/stats.js'

const d = demoData()
const today = d.today // 2026-11-01

describe('upcoming vs past', () => {
  it('splits on the last day and on played/recorded status', () => {
    expect(upcomingEvents(d.events, today).map((e) => e.id)).toEqual(['e1', 'e2', 'e3', 'e4', 'e5', 'e6'])
    expect(pastEvents(d.events, today).map((e) => e.id)).toEqual(['p4', 'p3', 'p2', 'p1'])
    expect(isUpcoming({ start_date: '2026-11-01', end_date: '2026-11-02', status: 'registered' }, today)).toBe(true)
    expect(isUpcoming({ start_date: '2026-11-01', end_date: '2026-11-02', status: 'played' }, today)).toBe(false)
  })
})

describe('trip cost', () => {
  it('adds entry share, stay share and gas', () => {
    const c = costFor(d.events.find((e) => e.id === 'e2'))
    expect(c.entry).toBe(70)
    expect(c.lodging).toBe(210)
    expect(c.gas).toBe(65)
    expect(c.total).toBe(345)
  })
  it('includes the caddy fee only when there was a caddy', () => {
    const base = { entry_fee: 100, fee_split: 1, caddy_fee: 40 }
    expect(costFor({ ...base, had_caddy: true }).total).toBe(140)
    expect(costFor({ ...base, had_caddy: false }).total).toBe(100)
  })
})

describe('to-dos', () => {
  it('lists unfinished events, upcoming registrations and waitlists', () => {
    const t = todos(d, today)
    expect(t.map((x) => x.kind)).toEqual(['finish', 'register', 'register', 'waitlist'])
    expect(t[0]).toMatchObject({ title: 'Finish Ewing Park Open', sub: '1 round still to log' })
  })
})

describe('stats', () => {
  it('summarises a season', () => {
    const s = statsFor(d, '2026')
    expect(s.tournament).toMatchObject({ events: 4, wins: 0, podiums: 2, bestRating: 958, avgRating: 950 })
    expect(s.tournament.matchRecord).toEqual({ w: 2, l: 2, p: 0 })
    expect(s.leagues).toMatchObject({ rounds: 5, wins: 1, podiums: 3, fees: 25, cash: 64, net: 39 })
    expect(s.tiers.map((t) => t.tier)).toEqual(['B-Tier', 'C-Tier', 'Non-PDGA'])
    expect(s.best[0].rating).toBe(958)
  })
  it('keeps team rounds out of rating stats', () => {
    const s = statsFor(d)
    expect(s.courses.every((c) => c.course.id !== 'c1')).toBe(true) // Hawk Island rounds were doubles
  })
  it('knows which seasons have data', () => {
    expect(seasonsIn(d)).toEqual(['2027', '2026'])
    expect(seasonsIn({ events: pastEvents(d.events, today), rounds: d.rounds })).toEqual(['2026'])
  })
})
