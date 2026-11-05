import { describe, it, expect } from 'vitest'
import { nextRoundNumber, suggestCourse, suggestDate, lastLeagueNight, percentile, eventDays } from '../src/lib/prefill.js'
import { holeTally, matchResult, matchRecord } from '../src/lib/matchplay.js'

const ev = { id: 'e', start_date: '2026-06-13', end_date: '2026-06-14', rounds_planned: 3, courses: [{ course_id: 'a' }, { course_id: 'b' }] }
const r = (n, course) => ({ event_id: 'e', round_number: n, course_id: course })

describe('round pre-fills', () => {
  it('lists the event days', () => expect(eventDays(ev)).toEqual(['2026-06-13', '2026-06-14']))
  it('picks the first unlogged round, filling gaps', () => {
    expect(nextRoundNumber(ev, [])).toBe(1)
    expect(nextRoundNumber(ev, [r(1, 'a'), r(2, 'b')])).toBe(3)
    expect(nextRoundNumber(ev, [r(1, 'a'), r(3, 'b')])).toBe(2)
    expect(nextRoundNumber(ev, [r(1, 'a'), r(2, 'b'), r(3, 'a')])).toBe(4)
  })
  it('uses the only course, or the least-played one, or asks on a tie', () => {
    expect(suggestCourse({ ...ev, courses: [{ course_id: 'a' }] }, [])).toEqual({ courseId: 'a', why: 'only' })
    expect(suggestCourse(ev, [r(1, 'a')])).toEqual({ courseId: 'b', why: 'least' })
    expect(suggestCourse(ev, [r(1, 'a'), r(2, 'b')])).toEqual({ courseId: null, why: 'pick' })
  })
  it('spreads rounds across the event days', () => {
    expect(suggestDate(ev, 1)).toBe('2026-06-13')
    expect(suggestDate(ev, 2)).toBe('2026-06-13')
    expect(suggestDate(ev, 3)).toBe('2026-06-14')
  })
  it('finds the most recent league night', () => {
    expect(lastLeagueNight({ day_time: 'Tue · 6:00 PM' }, '2026-11-05')).toBe('2026-11-03')
    expect(lastLeagueNight({ day_time: 'Thu · 5:30 PM' }, '2026-11-05')).toBe('2026-11-05')
    expect(lastLeagueNight({ day_time: '' }, '2026-11-05')).toBe('2026-11-05')
  })
  it('turns place and field into a top-percent finish', () => {
    expect(percentile(3, 24)).toBe(13)
    expect(percentile(1, 200)).toBe(1)
    expect(percentile(5, 3)).toBeNull()
  })
})

describe('match play', () => {
  it('tallies holes and decides the match on holes won', () => {
    expect(holeTally('WWPLW')).toEqual({ W: 3, P: 1, L: 1, res: 'W' })
    expect(holeTally('LPP')).toMatchObject({ res: 'L' })
    expect(holeTally('')).toMatchObject({ res: 'P' })
  })
  it('uses the recorded result when holes were not tracked', () => {
    expect(matchResult({ holes: '', result: 'L' })).toBe('L')
    expect(matchResult({ holes: 'WWL', result: 'L' })).toBe('W')
  })
  it('builds a W-L-P record', () => expect(matchRecord([{ holes: '', result: 'L' }, { holes: '', result: 'P' }, { holes: 'WW', result: null }, { holes: '', result: 'W' }])).toEqual({ w: 2, l: 1, p: 1 }))
})
