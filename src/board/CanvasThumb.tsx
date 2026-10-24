import { memo } from 'react'
import type { BoardState } from '../state/types'
import { Court } from './CourtMarkings'
import { STROKE_COLOR } from './Strokes'
import { strokePath } from './strokePath'
import { TokenShape } from './TokenShape'

/** Small preview of a whole board: full court, every line and player. */
export const CanvasThumb = memo(function CanvasThumb({ board }: { board: BoardState }) {
  return (
    <svg viewBox="-1 -1 42 22" className="canvas-thumb" aria-hidden="true" focusable="false">
      <Court />
      <g fill={STROKE_COLOR}>
        {board.strokes.map((s) => (
          <path key={s.id} d={strokePath(s.points)} />
        ))}
      </g>
      {board.tokens.map((t) => (
        <g key={t.id} transform={`translate(${t.x} ${t.y})`}>
          <TokenShape team={t.team} size={2} />
        </g>
      ))}
    </svg>
  )
})
