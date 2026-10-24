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
    // On the full court it goes on the left half: every defender outside the left goal area
    for (const t of def) {
      const dPost = Math.min(Math.hypot(t.x, t.y - 8.5), Math.hypot(t.x, t.y - 11.5))
      const outside = t.y >= 8.5 && t.y <= 11.5 ? t.x > 6 : dPost > 6
      expect(outside).toBe(true)
      expect(t.x).toBeLessThan(20)
    }
  })

  it('6 v 6 in half view replaces only the visible half', () => {
    useBoard.getState().placeToken('attack', 5, 10)
    useBoard.setState({ view: 'half', halfSide: 'right' })
    useBoard.getState().setupSixVsSix()
    const { tokens } = useBoard.getState()
    expect(tokens.filter((t) => t.x >= 20)).toHaveLength(12)
    expect(tokens.filter((t) => t.x < 20)).toEqual([expect.objectContaining({ x: 5, y: 10 })])
  })

  it('clear in half view clears only the visible half, players and lines', () => {
    const s = useBoard.getState()
    s.placeToken('defense', 5, 10)
    s.addStroke([[2, 2], [4, 4]])
    s.placeToken('attack', 30, 10)
    s.addStroke([[30, 2], [34, 4]])
    s.setView('half') // last change was on the right
    expect(useBoard.getState().halfSide).toBe('right')
    useBoard.getState().clear()
    expect(useBoard.getState().strokes.map((st) => st.points[0]?.[0])).toEqual([2])
    expect(useBoard.getState().tokens.map((t) => t.x)).toEqual([5])
    useBoard.getState().setView('full')
    expect(useBoard.getState().strokes).toHaveLength(1)
    expect(useBoard.getState().tokens).toHaveLength(1)
  })

  it('clear in full view clears players and lines', () => {
    useBoard.getState().placeToken('defense', 30, 10)
    useBoard.getState().addStroke([[1, 1], [3, 3]])
    useBoard.getState().clear()
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

  it('lines remember the colour they were drawn in', () => {
    const s = useBoard.getState()
    s.addStroke([[1, 1], [3, 3]])
    s.setPenColor('orange')
    useBoard.getState().addStroke([[5, 5], [7, 7]])
    expect(useBoard.getState().strokes.map((st) => st.color)).toEqual(['black', 'orange'])
  })

  it('undo and redo step through edits; a new edit drops the redo steps', () => {
    const s = useBoard.getState()
    const t = s.placeToken('defense', 5, 5)
    s.moveToken(t.id, 8, 8)
    s.addStroke([[1, 1], [3, 3]])
    useBoard.getState().undo()
    expect(useBoard.getState().strokes).toHaveLength(0)
    useBoard.getState().undo()
    expect(useBoard.getState().tokens[0]).toMatchObject({ x: 5, y: 5 })
    useBoard.getState().redo()
    expect(useBoard.getState().tokens[0]).toMatchObject({ x: 8, y: 8 })
    useBoard.getState().deleteToken(t.id)
    expect(useBoard.getState().future).toHaveLength(0)
    useBoard.getState().undo()
    expect(useBoard.getState().tokens).toHaveLength(1)
  })

  it('a batch (one eraser swipe) is a single undo step', () => {
    const s = useBoard.getState()
    s.addStroke([[1, 1], [3, 3]])
    s.addStroke([[5, 5], [7, 7]])
    s.placeToken('attack', 10, 10)
    const before = useBoard.getState().past.length
    s.startBatch()
    for (const st of useBoard.getState().strokes) useBoard.getState().deleteStroke(st.id)
    useBoard.getState().deleteToken(useBoard.getState().tokens[0]!.id)
    useBoard.getState().endBatch()
    expect(useBoard.getState().past.length).toBe(before + 1)
    useBoard.getState().undo()
    expect(useBoard.getState().strokes).toHaveLength(2)
    expect(useBoard.getState().tokens).toHaveLength(1)
  })

  it('clear on an empty court is not an undo step; opening another canvas starts a fresh history', () => {
    useBoard.getState().clear()
    expect(useBoard.getState().past).toHaveLength(0)
    useBoard.getState().placeToken('attack', 10, 10)
    useBoard.getState().createCanvas()
    expect(useBoard.getState().past).toHaveLength(0)
  })
})
