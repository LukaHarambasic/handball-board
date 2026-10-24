import { memo, type Ref } from 'react'
import type { Stroke } from '../state/types'
import { penValue } from './penColors'
import { strokePath } from './strokePath'

const StrokeView = memo(function StrokeView({ stroke }: { stroke: Stroke }) {
  return <path d={strokePath(stroke.points)} fill={penValue(stroke.color)} data-stroke-id={stroke.id} />
})

/** Committed strokes plus the live one, which the pointer router updates directly. */
export function Strokes({ strokes, liveRef }: { strokes: Stroke[]; liveRef: Ref<SVGPathElement> }) {
  return (
    <g className="strokes" opacity={0.9} aria-hidden="true">
      {strokes.map((s) => (
        <StrokeView key={s.id} stroke={s} />
      ))}
      <path ref={liveRef} d="" />
    </g>
  )
}
