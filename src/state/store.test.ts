import { beforeEach, describe, expect, it } from 'vitest'
import { findFreeSpot, initialStore, useBoard } from './store'
import { placementBox } from './courtView'

beforeEach(() => useBoard.setState(initialStore()))

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

  it('6 v 6 in half view replaces only the visible half', () => {
    useBoard.getState().placeToken('attack', 30, 10)
    useBoard.setState({ view: 'half', halfSide: 'left' })
    useBoard.getState().setupSixVsSix()
    const { tokens } = useBoard.getState()
    expect(tokens.filter((t) => t.x < 20)).toHaveLength(12)
    expect(tokens.filter((t) => t.x >= 20)).toEqual([expect.objectContaining({ x: 30, y: 10 })])
  })

  it('erase in half view clears only the visible half, players and lines', () => {
    const s = useBoard.getState()
    s.placeToken('defense', 5, 10)
    s.addStroke([[2, 2], [4, 4]])
    s.placeToken('attack', 30, 10)
    s.addStroke([[30, 2], [34, 4]])
    s.setView('half') // last change was on the right
    expect(useBoard.getState().halfSide).toBe('right')
    useBoard.getState().erase()
    expect(useBoard.getState().strokes.map((st) => st.points[0]?.[0])).toEqual([2])
    expect(useBoard.getState().tokens.map((t) => t.x)).toEqual([5])
    useBoard.getState().setView('full')
    expect(useBoard.getState().strokes).toHaveLength(1)
    expect(useBoard.getState().tokens).toHaveLength(1)
  })

  it('erase in full view clears players and lines', () => {
    useBoard.getState().placeToken('defense', 30, 10)
    useBoard.getState().addStroke([[1, 1], [3, 3]])
    useBoard.getState().erase()
    expect(useBoard.getState().strokes).toHaveLength(0)
    expect(useBoard.getState().tokens).toHaveLength(0)
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
