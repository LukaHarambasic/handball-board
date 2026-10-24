import { create } from 'zustand'
import { persist, type StateStorage, createJSONStorage } from 'zustand/middleware'
import { sixVsSix } from '../setups/sixVsSix'
import { activeSide, placementBox, sideOfStroke, sideOfX, strokeSide, switchView } from './courtView'
import { cleanName, cloneBoard, copyName, nextCanvasName } from './canvases'
import type { BoardState, Canvas, Point, Team, Token, View } from './types'

let counter = 0
export function makeId(): string {
  counter += 1
  return `${Date.now().toString(36)}-${counter.toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

type Actions = {
  placeToken: (team: Team, x: number, y: number) => Token
  /** Places a token on a free spot near the middle of the active half (tap or keyboard). */
  placeTokenAuto: (team: Team) => Token
  moveToken: (id: string, x: number, y: number) => void
  deleteToken: (id: string) => void
  addStroke: (points: Point[]) => void
  erase: () => void
  setupSixVsSix: () => void
  setView: (view: View) => void
}

type CanvasActions = {
  /** Adds an empty canvas and opens it. */
  createCanvas: () => Canvas
  /** Adds a copy right after the original; the open canvas stays open. */
  duplicateCanvas: (id: string) => Canvas | undefined
  /** Deletes a canvas; the last one cannot be deleted. Deleting the open one opens a neighbour. */
  deleteCanvas: (id: string) => void
  renameCanvas: (id: string, name: string) => void
  openCanvas: (id: string) => void
}

/**
 * The board fields at the top level are always the open canvas, so the board code never
 * deals with canvases. Its entry in `canvases` is only brought up to date when needed.
 */
export type BoardStore = BoardState & { canvases: Canvas[]; activeId: string } & Actions & CanvasActions
type Persisted = { canvases: Canvas[]; activeId: string }

export const initialBoard: BoardState = {
  view: 'full',
  halfSide: 'right',
  lastChangedSide: 'right',
  tokens: [],
  strokes: [],
}

export function pickBoard(s: BoardState): BoardState {
  return { view: s.view, halfSide: s.halfSide, lastChangedSide: s.lastChangedSide, tokens: s.tokens, strokes: s.strokes }
}

/** Canvases with the open one's board taken from the live fields. */
export function syncedCanvases(s: BoardStore): Canvas[] {
  return s.canvases.map((c) => (c.id === s.activeId ? { ...c, board: pickBoard(s) } : c))
}

export function initialStore(): Pick<BoardStore, keyof BoardState | 'canvases' | 'activeId'> {
  const first: Canvas = { id: makeId(), name: nextCanvasName([]), board: initialBoard }
  return { ...initialBoard, canvases: [first], activeId: first.id }
}

/** Version 1 stored a single board; it becomes the first canvas. */
export function migrateStored(persisted: unknown, version: number): Persisted | undefined {
  if (version >= 2) return persisted as Persisted
  const old = persisted as Partial<BoardState> | undefined
  const board: BoardState = {
    ...initialBoard,
    ...(old ?? {}),
    tokens: Array.isArray(old?.tokens) ? old.tokens : [],
    strokes: Array.isArray(old?.strokes) ? old.strokes : [],
  }
  const first: Canvas = { id: makeId(), name: nextCanvasName([]), board }
  return { canvases: [first], activeId: first.id }
}

// Persistence is a convenience: storage may be missing or throw (private mode, blocked site data).
const safeStorage: StateStorage = {
  getItem: (k) => {
    try {
      return localStorage.getItem(k)
    } catch {
      return null
    }
  },
  setItem: (k, v) => {
    try {
      localStorage.setItem(k, v)
    } catch {
      /* non-critical */
    }
  },
  removeItem: (k) => {
    try {
      localStorage.removeItem(k)
    } catch {
      /* non-critical */
    }
  },
}

/** Spiral out from a preferred spot until no token sits within one token width. */
export function findFreeSpot(tokens: Token[], preferred: Point, box: ReturnType<typeof placementBox>, gap = 1.9): Point {
  const free = (x: number, y: number) => tokens.every((t) => (t.x - x) ** 2 + (t.y - y) ** 2 >= gap * gap)
  const inside = (x: number, y: number) => x >= box.x0 && x <= box.x1 && y >= box.y0 && y <= box.y1
  for (let ring = 0; ring < 12; ring++) {
    const steps = ring === 0 ? 1 : ring * 8
    for (let k = 0; k < steps; k++) {
      const a = (k / steps) * Math.PI * 2
      const x = preferred[0] + Math.cos(a) * ring * gap
      const y = preferred[1] + Math.sin(a) * ring * gap
      if (inside(x, y) && free(x, y)) return [x, y]
    }
  }
  return preferred
}

export const useBoard = create<BoardStore>()(
  persist(
    (set, get) => ({
      ...initialStore(),

      placeToken: (team, x, y) => {
        const token = { id: makeId(), team, x, y }
        set((s) => ({ tokens: [...s.tokens, token], lastChangedSide: sideOfX(x) }))
        return token
      },

      placeTokenAuto: (team) => {
        const s = get()
        const side = activeSide(s)
        // Defenders start nearer the goal, attackers further out.
        const depth = team === 'defense' ? 9 : 13
        const x = side === 'right' ? 40 - depth : depth
        const spot = findFreeSpot(s.tokens, [x, 10], placementBox(s.view, s.halfSide, 0.8))
        return get().placeToken(team, spot[0], spot[1])
      },

      moveToken: (id, x, y) =>
        set((s) => ({
          tokens: s.tokens.map((t) => (t.id === id ? { ...t, x, y } : t)),
          lastChangedSide: sideOfX(x),
        })),

      deleteToken: (id) =>
        set((s) => {
          const t = s.tokens.find((t) => t.id === id)
          if (!t) return s
          return { tokens: s.tokens.filter((t) => t.id !== id), lastChangedSide: sideOfX(t.x) }
        }),

      addStroke: (points) =>
        set((s) => {
          const side = s.view === 'half' ? s.halfSide : strokeSide(points)
          const stroke = s.view === 'half' ? { id: makeId(), points, side } : { id: makeId(), points }
          return { strokes: [...s.strokes, stroke], lastChangedSide: side }
        }),

      // Clears everything on the visible court, players and lines. In half view the hidden half is kept.
      erase: () =>
        set((s) =>
          s.view === 'half'
            ? {
                strokes: s.strokes.filter((st) => sideOfStroke(st) !== s.halfSide),
                tokens: s.tokens.filter((t) => sideOfX(t.x) !== s.halfSide),
              }
            : { strokes: [], tokens: [] },
        ),

      // In half view only the visible half's players are replaced.
      setupSixVsSix: () =>
        set((s) => {
          const side = activeSide(s)
          const kept = s.view === 'half' ? s.tokens.filter((t) => sideOfX(t.x) !== side) : []
          return { tokens: [...kept, ...sixVsSix(side, makeId)], lastChangedSide: side }
        }),

      setView: (view) => set((s) => switchView(s, view)),

      createCanvas: () => {
        const s = get()
        const canvas: Canvas = { id: makeId(), name: nextCanvasName(s.canvases), board: initialBoard }
        set({ canvases: [...syncedCanvases(s), canvas], activeId: canvas.id, ...initialBoard })
        return canvas
      },

      duplicateCanvas: (id) => {
        const list = syncedCanvases(get())
        const i = list.findIndex((c) => c.id === id)
        const source = list[i]
        if (!source) return undefined
        const copy: Canvas = { id: makeId(), name: copyName(source.name, list), board: cloneBoard(source.board) }
        list.splice(i + 1, 0, copy)
        set({ canvases: list })
        return copy
      },

      deleteCanvas: (id) =>
        set((s) => {
          if (s.canvases.length <= 1) return s
          const list = syncedCanvases(s)
          const i = list.findIndex((c) => c.id === id)
          if (i < 0) return s
          const rest = list.filter((c) => c.id !== id)
          if (id !== s.activeId) return { canvases: rest }
          const next = rest[Math.min(i, rest.length - 1)] as Canvas
          return { canvases: rest, activeId: next.id, ...next.board }
        }),

      renameCanvas: (id, name) =>
        set((s) => {
          const clean = cleanName(name)
          if (!clean) return s
          return { canvases: s.canvases.map((c) => (c.id === id ? { ...c, name: clean } : c)) }
        }),

      openCanvas: (id) =>
        set((s) => {
          const target = s.canvases.find((c) => c.id === id)
          if (!target || id === s.activeId) return s
          return { canvases: syncedCanvases(s), activeId: id, ...target.board }
        }),
    }),
    {
      // Key kept from version 1 so existing boards migrate instead of disappearing.
      name: 'handball-board-v1',
      version: 2,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s): Persisted => ({ canvases: syncedCanvases(s), activeId: s.activeId }),
      migrate: (persisted, version) => migrateStored(persisted, version) as unknown as BoardStore,
      merge: (persisted, current) => {
        const p = persisted as Persisted | undefined
        const active = p?.canvases?.find((c) => c.id === p.activeId) ?? p?.canvases?.[0]
        if (!p || !active) return current
        return { ...current, canvases: p.canvases, activeId: active.id, ...active.board }
      },
    },
  ),
)

/** Transient UI state: never persisted. */
type UiState = {
  /** Token being dragged; `spawned` means it came from a tray and is not in the store yet. */
  drag: { id: string | null; team: Team } | null
  overDelete: boolean
  menuOpen: boolean
  announcement: { text: string; n: number }
}

export const useUi = create<UiState>()(() => ({
  drag: null,
  overDelete: false,
  menuOpen: false,
  announcement: { text: '', n: 0 },
}))

export function announce(text: string) {
  useUi.setState((s) => ({ announcement: { text, n: s.announcement.n + 1 } }))
}
