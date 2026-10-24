import { getStroke } from 'perfect-freehand'
import type { Point } from '../state/types'

// perfect-freehand is tuned for pixel-sized input, so strokes are smoothed in centimetres.
const CM = 100

const OPTIONS = {
  size: 22, // ~20 cm line, readable across a huddle
  thinning: 0.3,
  smoothing: 0.55,
  streamline: 0.45,
  simulatePressure: true,
}

/** Smoothed outline of a freehand stroke as an SVG path in court metres. */
export function strokePath(points: Point[], complete = true): string {
  if (points.length === 0) return ''
  const outline = getStroke(
    points.map(([x, y]) => [x * CM, y * CM]),
    { ...OPTIONS, last: complete },
  )
  return outlineToPath(outline)
}

function outlineToPath(pts: number[][]): string {
  const n = pts.length
  if (n < 2) return ''
  const f = (v: number) => (v / CM).toFixed(3)
  const p = (i: number) => pts[i % n] as [number, number]
  let d = `M${f(p(0)[0])} ${f(p(0)[1])} Q`
  for (let i = 0; i < n; i++) {
    const [x0, y0] = p(i)
    const [x1, y1] = p(i + 1)
    d += `${f(x0)} ${f(y0)} ${f((x0 + x1) / 2)} ${f((y0 + y1) / 2)} `
  }
  return `${d}Z`
}

export function strokeLength(points: Point[]): number {
  let len = 0
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1] as Point
    const b = points[i] as Point
    len += Math.hypot(b[0] - a[0], b[1] - a[1])
  }
  return len
}
