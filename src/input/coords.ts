import { COURT_WIDTH, MARGIN } from '../board/court'
import { visibleBox, type Box } from '../state/courtView'
import type { Point, Side, Token, View } from '../state/types'

export type Orientation = 'landscape' | 'portrait'
export type Insets = { top: number; right: number; bottom: number; left: number }
export type Rect = { left: number; top: number; right: number; bottom: number }

/**
 * View space is court metres as drawn on screen. In landscape it equals court space;
 * in portrait the court is turned a quarter clockwise, so the right goal sits at the bottom.
 */
export function courtToView(o: Orientation, x: number, y: number): Point {
  return o === 'landscape' ? [x, y] : [COURT_WIDTH - y, x]
}

export function viewToCourt(o: Orientation, u: number, v: number): Point {
  return o === 'landscape' ? [u, v] : [v, COURT_WIDTH - u]
}

/** SVG transform that draws court-space content in view space. */
export function courtTransform(o: Orientation): string | undefined {
  return o === 'landscape' ? undefined : `matrix(0 1 -1 0 ${COURT_WIDTH} 0)`
}

export type LayoutInput = {
  width: number
  height: number
  insets: Insets
  /** Screen y of the bottom bar's top edge. */
  barTop: number
  /** Screen rect of the delete zone; the court line must never sit under it. */
  deleteZone: Rect
  view: View
  halfSide: Side
}

export type Layout = {
  width: number
  height: number
  orientation: Orientation
  /** Pixels per metre. */
  scale: number
  /** Screen position of view-space origin. */
  ox: number
  oy: number
  viewBox: string
  /** Visible area in court metres. */
  visible: Box
  /** Drawn token size in metres (grows on small screens to stay visible). */
  tokenSize: number
  /** Touch radius in metres: at least 22 px, so the target is 44 px across. */
  hitRadius: number
}

const PAD = 8
const GAP = 10
const TOKEN_M = 1.6
const MIN_TOKEN_PX = 20
const MIN_HIT_PX = 22
/** Give up centring only when it makes the court at least this much bigger. */
const SLIDE_GAIN = 1.2

function viewBoxOf(o: Orientation, b: Box) {
  const [ua, va] = courtToView(o, b.x0, b.y0)
  const [ub, vb] = courtToView(o, b.x1, b.y1)
  return { u0: Math.min(ua, ub), v0: Math.min(va, vb), u1: Math.max(ua, ub), v1: Math.max(va, vb) }
}

export function computeLayout(i: LayoutInput): Layout {
  const orientation: Orientation = i.width >= i.height ? 'landscape' : 'portrait'
  const visible = visibleBox(i.view, i.halfSide)
  const vb = viewBoxOf(orientation, visible)
  const cw = vb.u1 - vb.u0
  const ch = vb.v1 - vb.v0

  const left = i.insets.left + PAD
  const right = i.width - i.insets.right - PAD
  const bottom = Math.max(i.barTop - GAP, i.insets.top + PAD + 40)
  let top = i.insets.top + PAD

  const fit = (t: number) => {
    const scale = Math.max(1, Math.min((right - left) / cw, (bottom - t) / ch))
    return {
      scale,
      contentLeft: left + (right - left - scale * cw) / 2,
      contentTop: t + (bottom - t - scale * ch) / 2,
    }
  }
  const lineTop = (f: ReturnType<typeof fit>) => f.contentTop + f.scale * MARGIN

  // Centred fit; if the court line would sit under the delete zone, push the top down and fit again.
  const first = fit(top)
  let centred = first
  for (let k = 0; k < 8 && lineTop(centred) < i.deleteZone.bottom + GAP - 0.5; k++) {
    top += i.deleteZone.bottom + GAP - lineTop(centred)
    centred = fit(top)
  }
  // On short screens (phones in landscape) pushing down shrinks the court a lot; sliding it left
  // of the delete zone keeps it much bigger. Only then is it worth giving up centring.
  const slideLeft = i.deleteZone.left - GAP - first.scale * (cw - MARGIN)
  const slid =
    slideLeft >= left && first.scale >= centred.scale * SLIDE_GAIN ? { ...first, contentLeft: slideLeft } : null
  const { scale, contentLeft, contentTop } = slid ?? centred

  const ox = contentLeft - scale * vb.u0
  const oy = contentTop - scale * vb.v0
  const tokenSize = Math.max(TOKEN_M, MIN_TOKEN_PX / scale)
  return {
    width: i.width,
    height: i.height,
    orientation,
    scale,
    ox,
    oy,
    viewBox: `${-ox / scale} ${-oy / scale} ${i.width / scale} ${i.height / scale}`,
    visible,
    tokenSize,
    hitRadius: Math.max((tokenSize / 2) * 1.15, MIN_HIT_PX / scale),
  }
}

export function screenToCourt(l: Layout, px: number, py: number): Point {
  return viewToCourt(l.orientation, (px - l.ox) / l.scale, (py - l.oy) / l.scale)
}

export function courtToScreen(l: Layout, x: number, y: number): Point {
  const [u, v] = courtToView(l.orientation, x, y)
  return [l.ox + u * l.scale, l.oy + v * l.scale]
}

/** Nearest token within the touch radius, so crowded tokens stay pickable. */
export function hitToken(tokens: Token[], x: number, y: number, radius: number): Token | undefined {
  let best: Token | undefined
  let bestD = radius * radius
  for (const t of tokens) {
    const d = (t.x - x) ** 2 + (t.y - y) ** 2
    if (d <= bestD) {
      best = t
      bestD = d
    }
  }
  return best
}

export function inRect(r: Rect, px: number, py: number, slop = 0): boolean {
  return px >= r.left - slop && px <= r.right + slop && py >= r.top - slop && py <= r.bottom + slop
}
