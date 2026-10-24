import { courtTransform, type Layout } from '../input/coords'
import type { PointerRouter } from '../input/usePointerRouter'
import { useMemo } from 'react'
import { visibleStrokes, visibleTokens } from '../state/courtView'
import { useBoard, useUi } from '../state/store'
import { strings } from '../strings'
import { Court } from './CourtMarkings'
import { Strokes } from './Strokes'
import { TOKEN_HELP_ID, Tokens } from './Tokens'

/** The board: one SVG covering the screen, its viewBox in metres. Layers: court → strokes → tokens. */
export function Board({ layout, router }: { layout: Layout; router: PointerRouter }) {
  const allTokens = useBoard((s) => s.tokens)
  const allStrokes = useBoard((s) => s.strokes)
  const view = useBoard((s) => s.view)
  const halfSide = useBoard((s) => s.halfSide)
  // In half view the other half keeps its players and lines; they are just not drawn.
  const tokens = useMemo(() => visibleTokens({ view, halfSide }, allTokens), [view, halfSide, allTokens])
  const strokes = useMemo(() => visibleStrokes({ view, halfSide }, allStrokes), [view, halfSide, allStrokes])
  const hiddenId = useUi((s) => s.drag?.id ?? null)

  const defenders = tokens.filter((t) => t.team === 'defense').length
  const label = strings.board(
    view === 'full' ? strings.fullCourt : strings.halfCourt,
    defenders,
    tokens.length - defenders,
    strokes.length,
  )

  return (
    <>
      <svg
        className="board"
        viewBox={layout.viewBox}
        preserveAspectRatio="none"
        role="group"
        aria-label={label}
        onPointerDown={router.onBoardPointerDown}
        onContextMenu={(e) => e.preventDefault()}
      >
        <defs>
          <filter id="token-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0.07" stdDeviation="0.09" floodColor="#0F172A" floodOpacity="0.3" />
          </filter>
        </defs>
        <g transform={courtTransform(layout.orientation)}>
          <Court side={view === 'half' ? halfSide : undefined} />
          <Strokes strokes={strokes} liveRef={router.liveStrokeRef} />
        </g>
        <Tokens tokens={tokens} hiddenId={hiddenId} layout={layout} />
      </svg>
      <p id={TOKEN_HELP_ID} className="sr-only">
        {strings.tokenHelp}
      </p>
    </>
  )
}
