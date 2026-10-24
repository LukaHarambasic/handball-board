import { create } from 'zustand'
import { persist, type StateStorage, createJSONStorage } from 'zustand/middleware'
import { sixVsSix } from '../setups/sixVsSix'
import { activeSide, placementBox, sideOfStroke, sideOfX, strokeSide, switchView } from './courtView'
import type { BoardState, Point, Team, Token, View } from './types'

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

export type BoardStore = BoardState & Actions

export const initialBoard: BoardState = {
  view: 'full',
  halfSide: 'right',
  lastChangedSide: 'right',
  tokens: [],
  strokes: [],
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
      ...initialBoard,

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

      // In half view only the visible half is wiped; the hidden half keeps its lines.
      erase: () =>
        set((s) => ({
          strokes: s.view === 'half' ? s.strokes.filter((st) => sideOfStroke(st) !== s.halfSide) : [],
        })),

      // In half view only the visible half's players are replaced.
      setupSixVsSix: () =>
        set((s) => {
          const side = activeSide(s)
          const kept = s.view === 'half' ? s.tokens.filter((t) => sideOfX(t.x) !== side) : []
          return { tokens: [...kept, ...sixVsSix(side, makeId)], lastChangedSide: side }
        }),

      setView: (view) => set((s) => switchView(s, view)),
    }),
    {
      name: 'handball-board-v1',
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: ({ view, halfSide, lastChangedSide, tokens, strokes }): BoardState => ({
        view,
        halfSide,
        lastChangedSide,
        tokens,
        strokes,
      }),
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
