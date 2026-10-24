import { strings } from '../strings'
import type { BoardState, Canvas } from './types'

export const MAX_NAME_LENGTH = 40

/** First "Canvas N" not taken yet. */
export function nextCanvasName(canvases: Canvas[]): string {
  const taken = new Set(canvases.map((c) => c.name))
  let n = 1
  while (taken.has(strings.canvasName(n))) n += 1
  return strings.canvasName(n)
}

/** "Name copy", then "Name copy 2", "Name copy 3"… */
export function copyName(name: string, canvases: Canvas[]): string {
  const taken = new Set(canvases.map((c) => c.name))
  const base = cleanName(strings.copyOf(name)) ?? strings.copyOf(name)
  if (!taken.has(base)) return base
  let n = 2
  while (taken.has(`${base} ${n}`)) n += 1
  return `${base} ${n}`
}

/** Trimmed and length-limited, or null when nothing is left. */
export function cleanName(name: string): string | null {
  const trimmed = name.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME_LENGTH).trim()
  return trimmed || null
}

export function cloneBoard(b: BoardState): BoardState {
  return {
    ...b,
    tokens: b.tokens.map((t) => ({ ...t })),
    strokes: b.strokes.map((s) => ({ ...s, points: s.points.map((p) => [p[0], p[1]]) })),
  }
}
