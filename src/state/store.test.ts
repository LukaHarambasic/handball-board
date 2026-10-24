import { beforeEach, describe, expect, it } from 'vitest'
import { findFreeSpot, initialBoard, useBoard } from './store'
import { placementBox } from './courtView'

beforeEach(() => useBoard.setState(initialBoard))

describe('board store', () => {
  it('6 v 6 replaces all players: six defenders on the 6 m line, six attackers around 9 m', () => {
    useBoard.getState().placeToken('attack', 5, 5)
    useBoard.getState().setupSixVsSix()
    const { tokens } = useBoard.getState()
    expect(tokens).toHaveLength(12)
    const def = tokens.filter((t) => t.team === 'defense')
    expect(def).toHaveLength(6)
    // Every defender outside the goal area, in front of the right goal
    for (const t of def) {
      const dPost = Math.min(Math.hypot(40 - t.x, t.y - 8.5), Math.hypot(40 - t.x, t.y - 11.5))
      const outside = t.y >= 8.5 && t.y <= 11.5 ? 40 - t.x > 6 : dPost > 6
      expect(outside).toBe(true)
      expect(t.x).toBeGreaterThan(20)
    }
  })

  it('6 v 6 in half view uses the visible half', () => {
    useBoard.setState({ view: 'half', halfSide: 'left' })
    useBoard.getState().setupSixVsSix()
    expect(useBoard.getState().tokens.every((t) => t.x < 20)).toBe(true)
  })

  it('erase clears lines and keeps players', () => {
    useBoard.getState().placeToken('defense', 30, 10)
    useBoard.getState().addStroke([[1, 1], [3, 3]])
    useBoard.getState().erase()
    expect(useBoard.getState().strokes).toHaveLength(0)
    expect(useBoard.getState().tokens).toHaveLength(1)
  })

  it('every commit records the last-changed side', () => {
    const s = useBoard.getState()
    const t = s.placeToken('defense', 5, 10)
    expect(useBoard.getState().lastChangedSide).toBe('left')
    s.moveToken(t.id, 35, 10)
    expect(useBoard.getState().lastChangedSide).toBe('right')
    s.addStroke([[2, 2], [4, 4]])
    expect(useBoard.getState().lastChangedSide).toBe('left')
    s.deleteToken(t.id)
    expect(useBoard.getState().lastChangedSide).toBe('right')
  })

  it('tap-to-place never stacks tokens', () => {
    for (let i = 0; i < 8; i++) useBoard.getState().placeTokenAuto('attack')
    const { tokens } = useBoard.getState()
    for (const a of tokens) for (const b of tokens) if (a !== b) expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(1.6)
    expect(findFreeSpot([], [30, 10], placementBox('full', 'right', 0.8))).toEqual([30, 10])
  })
})
