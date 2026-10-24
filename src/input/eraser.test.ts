import { describe, expect, it } from 'vitest'
import { distToSegment, eraserHits } from './eraser'

describe('eraser hit testing', () => {
  it('measures distance to a segment', () => {
    expect(distToSegment([5, 1], [0, 0], [10, 0])).toBe(1)
    expect(distToSegment([-3, 4], [0, 0], [10, 0])).toBe(5)
  })

  it('catches players and lines along a fast swipe, not ones it missed', () => {
    const tokens = [
      { id: 'near', team: 'defense' as const, x: 5, y: 0.5 },
      { id: 'far', team: 'attack' as const, x: 5, y: 5 },
    ]
    const strokes = [
      { id: 'crossed', points: [[4, -2], [4, 2]] as [number, number][] },
      { id: 'away', points: [[0, 8], [9, 8]] as [number, number][] },
    ]
    // One pointer event jumped from x=0 to x=10: everything in between still counts.
    const hits = eraserHits(tokens, strokes, [0, 0], [10, 0], 0.9, 0.4)
    expect(hits.tokenIds).toEqual(['near'])
    expect(hits.strokeIds).toEqual(['crossed'])
  })
})
