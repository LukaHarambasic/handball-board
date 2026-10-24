import { beforeEach, describe, expect, it } from 'vitest'
import { cleanName, copyName, nextCanvasName } from './canvases'
import { initialStore, migrateStored, syncedCanvases, useBoard } from './store'
import type { Canvas } from './types'

const named = (...names: string[]) => names.map((name, i) => ({ id: String(i), name }) as Canvas)

beforeEach(() => useBoard.setState(initialStore()))

describe('canvas names', () => {
  it('numbers new canvases with the first free number', () => {
    expect(nextCanvasName([])).toBe('Canvas 1')
    expect(nextCanvasName(named('Canvas 1', 'Canvas 3'))).toBe('Canvas 2')
  })

  it('names copies "copy", then "copy 2"', () => {
    expect(copyName('Press', named('Press'))).toBe('Press copy')
    expect(copyName('Press', named('Press', 'Press copy'))).toBe('Press copy 2')
  })

  it('trims names and rejects empty ones', () => {
    expect(cleanName('  Wing   attack  ')).toBe('Wing attack')
    expect(cleanName('   ')).toBeNull()
    expect(cleanName('x'.repeat(60))).toHaveLength(40)
  })
})

describe('canvases in the store', () => {
  it('a new canvas starts empty and is opened; the old one keeps its board', () => {
    const s = useBoard.getState()
    s.setupSixVsSix()
    const first = s.activeId
    const c = s.createCanvas()
    expect(useBoard.getState().activeId).toBe(c.id)
    expect(useBoard.getState().tokens).toHaveLength(0)
    useBoard.getState().openCanvas(first)
    expect(useBoard.getState().tokens).toHaveLength(12)
  })

  it('duplicate copies the live board right after the original without switching', () => {
    const s = useBoard.getState()
    s.addStroke([[1, 1], [4, 4]])
    s.placeToken('defense', 30, 10)
    const copy = s.duplicateCanvas(s.activeId)!
    const st = useBoard.getState()
    expect(st.canvases.map((c) => c.name)).toEqual(['Canvas 1', 'Canvas 1 copy'])
    expect(st.activeId).not.toBe(copy.id)
    // The copy is independent of the original.
    st.moveToken(st.tokens[0]!.id, 5, 5)
    const saved = syncedCanvases(useBoard.getState()).find((c) => c.id === copy.id)!
    expect(saved.board.tokens[0]).toMatchObject({ x: 30, y: 10 })
    expect(saved.board.strokes).toHaveLength(1)
  })

  it('deleting the open canvas opens a neighbour; the last canvas cannot be deleted', () => {
    const s = useBoard.getState()
    const first = s.activeId
    s.setupSixVsSix()
    const second = s.createCanvas()
    useBoard.getState().deleteCanvas(second.id)
    expect(useBoard.getState().activeId).toBe(first)
    expect(useBoard.getState().tokens).toHaveLength(12)
    useBoard.getState().deleteCanvas(first)
    expect(useBoard.getState().canvases).toHaveLength(1)
  })

  it('rename keeps the old name when the new one is blank', () => {
    const s = useBoard.getState()
    s.renameCanvas(s.activeId, '  Fast break ')
    expect(useBoard.getState().canvases[0]!.name).toBe('Fast break')
    useBoard.getState().renameCanvas(s.activeId, '   ')
    expect(useBoard.getState().canvases[0]!.name).toBe('Fast break')
  })

  it('migrates a saved version 1 board into the first canvas', () => {
    const v1 = { view: 'half', halfSide: 'left', lastChangedSide: 'left', tokens: [{ id: 'a', team: 'attack', x: 5, y: 5 }], strokes: [] }
    const p = migrateStored(v1, 1)!
    expect(p.canvases).toHaveLength(1)
    expect(p.canvases[0]!.name).toBe('Canvas 1')
    expect(p.canvases[0]!.board).toMatchObject({ view: 'half', halfSide: 'left', tokens: v1.tokens })
    expect(p.activeId).toBe(p.canvases[0]!.id)
  })
})
