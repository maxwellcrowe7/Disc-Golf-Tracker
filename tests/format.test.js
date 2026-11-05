import { describe, it, expect } from 'vitest'
import { relTxt, scClass, fmtRange, ord, daysBetween, splitLast } from '../src/lib/format.js'
import { demoData } from '../src/data/store.js'
import { avgToPar, bestToPar, avgRating } from '../src/lib/stats.js'

describe('scorecard notation', () => {
  it('labels to-par numbers', () => {
    expect(relTxt(0)).toBe('E')
    expect(relTxt(3)).toBe('+3')
    expect(relTxt(-4)).toBe('−4')
  })
  it('circles under par, double-circles 5+ under, boxes over par', () => {
    expect(scClass(-1)).toBe('under')
    expect(scClass(-5)).toBe('eagle')
    expect(scClass(2)).toBe('over')
    expect(scClass(0)).toBe('even')
  })
})

describe('dates', () => {
  it('formats single days and ranges', () => {
    expect(fmtRange('2027-04-10', '2027-04-11')).toBe('Apr 10–11')
    expect(fmtRange('2027-05-31', '2027-06-01')).toBe('May 31 – Jun 1')
    expect(fmtRange('2027-06-12', '2027-06-12')).toBe('Sat, Jun 12')
  })
  it('counts days', () => expect(daysBetween('2026-11-01', '2027-04-10')).toBe(160))
  it('ordinals', () => expect([1, 2, 3, 4, 11, 22].map(ord)).toEqual(['1st', '2nd', '3rd', '4th', '11th', '22nd']))
  it('splits the last word for italics', () => expect(splitLast('Ewing Park Open')).toEqual({ head: 'Ewing Park', last: 'Open' }))
})

describe('demo data in table shape', () => {
  const d = demoData()
  it('keeps par on every round', () => expect(d.rounds.every((r) => typeof r.par === 'number')).toBe(true))
  it('parses drive times into minutes', () => expect(d.events.find((e) => e.id === 'e2').home_drive_minutes).toBe(485))
  it('computes course stats', () => {
    const rs = d.rounds.filter((r) => r.course_id === 'c2')
    expect(avgToPar(rs)).toBeCloseTo((-1 - 3 - 2 - 4) / 4)
    expect(bestToPar(rs)).toBe(-4)
    expect(avgRating(rs)).toBe(950)
  })
})
