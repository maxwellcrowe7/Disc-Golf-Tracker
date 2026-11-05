import { describe, it, expect } from 'vitest'
import { parseRatingLines } from '../src/lib/ratings.js'

describe('pasted rating history', () => {
  it('reads a copied PDGA ratings table', () => {
    const text = `Date\tRating\tChange\tRounds Used
14-Oct-2026\t1001\t+6\t14
09-Sep-2026\t995\t-2\t12
12-Aug-2026\t997\t+18\t11`
    expect(parseRatingLines(text)).toEqual([
      { effective_date: '2026-08-12', rating: 997 },
      { effective_date: '2026-09-09', rating: 995 },
      { effective_date: '2026-10-14', rating: 1001 },
    ])
  })

  it('accepts ISO, US and spelled-out dates', () => {
    expect(parseRatingLines('2026-10-14 1001\n10/14/2025 980\nMarch 3, 2024 941')).toEqual([
      { effective_date: '2024-03-03', rating: 941 },
      { effective_date: '2025-10-14', rating: 980 },
      { effective_date: '2026-10-14', rating: 1001 },
    ])
  })

  it('ignores the change column and lines without a usable rating', () => {
    expect(parseRatingLines('14-Oct-2026 +950 14\nheader only\n2026-01-01 nothing')).toEqual([])
  })

  it('keeps one rating per date', () => {
    expect(parseRatingLines('2026-10-14 990\n2026-10-14 1001')).toEqual([{ effective_date: '2026-10-14', rating: 1001 }])
  })
})
