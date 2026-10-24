import { CENTRE_X, COURT_LENGTH, COURT_WIDTH, MARGIN } from '../board/court'
import type { BoardState, Point, Side, Stroke, View } from './types'

export type Box = { x0: number; y0: number; x1: number; y1: number }

export function sideOfX(x: number): Side {
  return x < CENTRE_X ? 'left' : 'right'
}

/** A stroke belongs to the half holding the centre of its bounding box. */
export function strokeSide(points: Point[]): Side {
  let min = Infinity
  let max = -Infinity
  for (const [x] of points) {
    if (x < min) min = x
    if (x > max) max = x
  }
  return sideOfX((min + max) / 2)
}

/** Visible area in court metres (court plus safety margin). */
export function visibleBox(view: View, halfSide: Side): Box {
  const y0 = -MARGIN
  const y1 = COURT_WIDTH + MARGIN
  if (view === 'full') return { x0: -MARGIN, y0, x1: COURT_LENGTH + MARGIN, y1 }
  return halfSide === 'left'
    ? { x0: -MARGIN, y0, x1: CENTRE_X + MARGIN, y1 }
    : { x0: CENTRE_X - MARGIN, y0, x1: COURT_LENGTH + MARGIN, y1 }
}

/** Box a token centre may sit in: the visible area, but never across the centre line in half view. */
export function placementBox(view: View, halfSide: Side, inset: number): Box {
  const b = visibleBox(view, halfSide)
  const box = { x0: b.x0 + inset, y0: b.y0 + inset, x1: b.x1 - inset, y1: b.y1 - inset }
  if (view === 'half') {
    if (halfSide === 'left') box.x1 = Math.min(box.x1, CENTRE_X - 0.01)
    else box.x0 = Math.max(box.x0, CENTRE_X)
  }
  return box
}

export function clampToBox(x: number, y: number, box: Box): Point {
  return [Math.min(box.x1, Math.max(box.x0, x)), Math.min(box.y1, Math.max(box.y0, y))]
}

/** Half a stroke belongs to: the one it was drawn on in half view, else the one holding its centre. */
export function sideOfStroke(stroke: Stroke): Side {
  return stroke.side ?? strokeSide(stroke.points)
}

type ViewState = Pick<BoardState, 'view' | 'halfSide'>

/** Players shown in the current view; in half view the other half is kept but hidden. */
export function visibleTokens<T extends { x: number }>(state: ViewState, tokens: T[]): T[] {
  return state.view === 'full' ? tokens : tokens.filter((t) => sideOfX(t.x) === state.halfSide)
}

export function visibleStrokes(state: ViewState, strokes: Stroke[]): Stroke[] {
  return state.view === 'full' ? strokes : strokes.filter((s) => sideOfStroke(s) === state.halfSide)
}

/**
 * Full → Half shows the last-changed half as it is; the other half is kept, only hidden.
 * Half → Full shows both halves again, the other one exactly as it was left.
 */
export function switchView(state: BoardState, view: View): BoardState {
  if (view === state.view) return state
  if (view === 'half') return { ...state, view, halfSide: state.lastChangedSide }
  return { ...state, view, lastChangedSide: state.halfSide }
}

/** Side that 6 v 6 and tap-to-place use: the visible half, or the left half on the full court. */
export function activeSide(state: Pick<BoardState, 'view' | 'halfSide'>): Side {
  return state.view === 'half' ? state.halfSide : 'left'
}
