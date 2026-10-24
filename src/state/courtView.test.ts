import { describe, expect, it } from 'vitest'
import { clampToBox, placementBox, sideOfStroke, sideOfX, strokeSide, switchView, visibleBox, visibleStrokes, visibleTokens } from './courtView'
import type { BoardState } from './types'

const base: BoardState = {
  view: 'full',
  halfSide: 'right',
  lastChangedSide: 'left',
  tokens: [
    { id: 'a', team: 'defense', x: 5, y: 10 },
    { id: 'b', team: 'attack', x: 30, y: 10 },
  ],
  strokes: [
    { id: 's1', points: [[2, 2], [10, 4]] },
    // crosses the centre line, centre point on the right
    { id: 's2', points: [[18, 5], [26, 5]] },
  ],
}

describe('court view switching', () => {
  it('assigns items to the half holding their centre point', () => {
    expect(sideOfX(19.99)).toBe('left')
    expect(sideOfX(20)).toBe('right')
    expect(strokeSide([[18, 0], [26, 0]])).toBe('right')
    expect(strokeSide([[14, 0], [21, 0]])).toBe('left')
  })

  it('full → half shows the last-changed half as it is and keeps the other half hidden', () => {
    const s = switchView(base, 'half')
    expect(s.view).toBe('half')
    expect(s.halfSide).toBe('left')
    expect(visibleTokens(s, s.tokens).map((t) => t.id)).toEqual(['a'])
    expect(visibleStrokes(s, s.strokes).map((t) => t.id)).toEqual(['s1'])
    expect(s.tokens).toHaveLength(2)
    expect(s.strokes).toHaveLength(2)
  })

  it('half → full brings back the other half exactly as it was', () => {
    const half = switchView(base, 'half')
    const s = switchView(half, 'full')
    expect(s.view).toBe('full')
    expect(s.tokens).toEqual(base.tokens)
    expect(s.strokes).toEqual(base.strokes)
    expect(s.lastChangedSide).toBe('left')
  })

  it('a line drawn in half view stays on that half even if it reaches past the centre line', () => {
    expect(sideOfStroke({ id: 'x', points: [[19, 1], [26, 1]], side: 'left' })).toBe('left')
    expect(sideOfStroke({ id: 'x', points: [[19, 1], [26, 1]] })).toBe('right')
  })

  it('switching to the current view is a no-op', () => {
    expect(switchView(base, 'full')).toBe(base)
  })

  it('half view shows 22 × 22 m including the margin', () => {
    expect(visibleBox('half', 'left')).toEqual({ x0: -1, y0: -1, x1: 21, y1: 21 })
    expect(visibleBox('half', 'right')).toEqual({ x0: 19, y0: -1, x1: 41, y1: 21 })
  })

  it('tokens cannot be dropped across the centre line in half view', () => {
    const box = placementBox('half', 'right', 0.8)
    expect(clampToBox(15, 10, box)[0]).toBe(20)
    expect(clampToBox(50, 30, box)).toEqual([40.2, 20.2])
  })
})
