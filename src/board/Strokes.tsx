import { memo, type Ref } from 'react'
import type { Stroke } from '../state/types'
import { strokePath } from './strokePath'

export const STROKE_COLOR = '#1B2230'

const StrokeView = memo(function StrokeView({ stroke }: { stroke: Stroke }) {
  return <path d={strokePath(stroke.points)} />
})

/** Committed strokes plus the live one, which the pointer router updates directly. */
export function Strokes({ strokes, liveRef }: { strokes: Stroke[]; liveRef: Ref<SVGPathElement> }) {
  return (
    <g fill={STROKE_COLOR} opacity={0.88} aria-hidden="true">
      {strokes.map((s) => (
        <StrokeView key={s.id} stroke={s} />
      ))}
      <path ref={liveRef} d="" />
    </g>
  )
}
