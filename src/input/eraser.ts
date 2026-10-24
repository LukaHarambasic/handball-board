import type { Point, Stroke, Token } from '../state/types'

/** Distance from p to the segment a–b. */
export function distToSegment(p: Point, a: Point, b: Point): number {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const len2 = dx * dx + dy * dy
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2))
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy))
}

export function strokeWithin(points: Point[], p: Point, r: number): boolean {
  if (points.length === 1) return Math.hypot(p[0] - points[0]![0], p[1] - points[0]![1]) <= r
  for (let i = 1; i < points.length; i++) if (distToSegment(p, points[i - 1]!, points[i]!) <= r) return true
  return false
}

/**
 * Everything the eraser touched while moving from a to b. The path is sampled finely, so a
 * fast swipe still catches what it crossed between two pointer events.
 */
export function eraserHits(
  tokens: Token[],
  strokes: Stroke[],
  a: Point,
  b: Point,
  tokenRadius: number,
  strokeRadius: number,
): { tokenIds: string[]; strokeIds: string[] } {
  const step = Math.min(tokenRadius, strokeRadius) / 2
  const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step))
  const samples: Point[] = []
  for (let i = 0; i <= n; i++) samples.push([a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n])
  const tokenIds = tokens.filter((t) => samples.some((p) => Math.hypot(t.x - p[0], t.y - p[1]) <= tokenRadius)).map((t) => t.id)
  const strokeIds = strokes.filter((s) => samples.some((p) => strokeWithin(s.points, p, strokeRadius))).map((s) => s.id)
  return { tokenIds, strokeIds }
}
