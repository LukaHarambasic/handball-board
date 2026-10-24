import { describe, expect, it } from 'vitest'
import { clampToBox, placementBox, sideOfX, strokeSide, switchView, visibleBox } from './courtView'
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

  it('full → half shows the last-changed half and drops the other half', () => {
    const s = switchView(base, 'half')
    expect(s.view).toBe('half')
    expect(s.halfSide).toBe('left')
    expect(s.tokens.map((t) => t.id)).toEqual(['a'])
    expect(s.strokes.map((t) => t.id)).toEqual(['s1'])
  })

  it('half → full keeps that half on its own side; the other half is empty', () => {
    const half = { ...base, view: 'half' as const, halfSide: 'right' as const }
    const s = switchView(half, 'full')
    expect(s.view).toBe('full')
    expect(s.tokens.map((t) => t.id)).toEqual(['b'])
    expect(s.tokens[0]?.x).toBe(30)
    expect(s.strokes.map((t) => t.id)).toEqual(['s2'])
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
