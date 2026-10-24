import { COURT_LENGTH, COURT_WIDTH, MARGIN } from '../board/court'
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
  /** Screen rects of the top-corner controls (delete zone, canvases button); the court line never sits under them. */
  topObstacles: Rect[]
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
  /** Zoom on top of the fit: 1 shows the whole court. */
  zoom: number
  /** The fitted court before zoom: its scale, its screen centre and its view-space box. */
  fit: { scale: number; cx: number; cy: number; box: { u0: number; v0: number; u1: number; v1: number } }
}

/**
 * Zoom on top of the fitted court: `z` times bigger, with view point (u, v) shown where the
 * fitted court's centre was. Kept in view metres, so it survives rotation and resizing.
 */
export type Zoom = { z: number; u: number; v: number }
export const MIN_ZOOM = 1
export const MAX_ZOOM = 4

const PAD = 8
const GAP = 10
const TOKEN_M = 1.6
const MIN_TOKEN_PX = 20
const MIN_HIT_PX = 22

function viewBoxOf(o: Orientation, b: Box) {
  const [ua, va] = courtToView(o, b.x0, b.y0)
  const [ub, vb] = courtToView(o, b.x1, b.y1)
  return { u0: Math.min(ua, ub), v0: Math.min(va, vb), u1: Math.max(ua, ub), v1: Math.max(va, vb) }
}

export function computeLayout(i: LayoutInput, zoom: Zoom | null = null): Layout {
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

  // Centred fit. If the court line would sit under a top-corner control it overlaps
  // horizontally, push the top down and fit again.
  let f = fit(top)
  for (let k = 0; k < 8; k++) {
    const lineTop = f.contentTop + f.scale * MARGIN
    const lineLeft = f.contentLeft + f.scale * MARGIN
    const lineRight = f.contentLeft + f.scale * (cw - MARGIN)
    const need = Math.max(
      -Infinity,
      ...i.topObstacles.filter((o) => o.right > lineLeft - GAP && o.left < lineRight + GAP).map((o) => o.bottom + GAP),
    )
    if (lineTop >= need - 0.5) break
    top += need - lineTop
    f = fit(top)
  }
  const fitCx = f.contentLeft + (f.scale * cw) / 2
  const fitCy = f.contentTop + (f.scale * ch) / 2
  const z = zoom ? Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom.z)) : 1
  const scale = f.scale * z
  const ox = fitCx - scale * (zoom && z > 1 ? zoom.u : vb.u0 + cw / 2)
  const oy = fitCy - scale * (zoom && z > 1 ? zoom.v : vb.v0 + ch / 2)
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
    zoom: z,
    fit: { scale: f.scale, cx: fitCx, cy: fitCy, box: vb },
  }
}

/**
 * Zooms by `k` so the court point under screen point `from` ends up under `to` (pinch: the
 * fingers' midpoint before and after; trackpad and buttons: the same point). Panning stays
 * within the court. Returns null at 100 %, which is the plain fitted court.
 */
export function zoomAround(l: Layout, k: number, from: Point, to: Point = from): Zoom | null {
  const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, l.zoom * k))
  if (z <= MIN_ZOOM + 0.001) return null
  const u = (from[0] - l.ox) / l.scale
  const v = (from[1] - l.oy) / l.scale
  const scale = l.fit.scale * z
  const ox = to[0] - u * scale
  const oy = to[1] - v * scale
  const { box } = l.fit
  return {
    z,
    u: Math.min(box.u1, Math.max(box.u0, (l.fit.cx - ox) / scale)),
    v: Math.min(box.v1, Math.max(box.v0, (l.fit.cy - oy) / scale)),
  }
}

/** Moves a zoomed court by (dx, dy) screen pixels; does nothing at 100 %. */
export function panBy(l: Layout, dx: number, dy: number): Zoom | null {
  return l.zoom > 1 ? zoomAround(l, 1, [0, 0], [dx, dy]) : null
}

/** Screen y of the court's top line (the playing court, not the margin around it). */
export function courtTopPx(l: Layout): number {
  return Math.min(courtToScreen(l, 0, 0)[1], courtToScreen(l, COURT_LENGTH, COURT_WIDTH)[1])
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
