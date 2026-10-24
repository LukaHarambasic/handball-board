import { forwardRef } from 'react'
import type { PointerRouter } from '../input/usePointerRouter'
import { fullscreenAvailable, useFullscreen } from '../platform/fullscreen'
import { visibleStrokes, visibleTokens } from '../state/courtView'
import { announce, useBoard, useUi } from '../state/store'
import { strings } from '../strings'
import { BTN, CHIP } from './button'
import { CourtMenu } from './CourtMenu'
import { ClearIcon, EnterFullscreenIcon, EraseIcon, ExitFullscreenIcon, SixVsSixIcon } from './icons'
import { PenMenu } from './PenMenu'
import { TokenTray } from './TokenTray'

/**
 * Floating toolbar of icon buttons in three parts. Left: court menu. Centre: the two trays and
 * 6 v 6, then the drawing tools (line colour, eraser). Right: Clear and Full screen.
 */
export const BottomBar = forwardRef<HTMLDivElement, { router: PointerRouter }>(function BottomBar({ router }, ref) {
  const dragging = useUi((s) => s.drag !== null)
  const erasing = useUi((s) => s.tool === 'erase')
  const hasContent = useBoard((s) => visibleStrokes(s, s.strokes).length > 0 || visibleTokens(s, s.tokens).length > 0)
  const fs = useFullscreen()
  const showFullscreen = fullscreenAvailable()

  const clear = () => {
    useBoard.getState().clear()
    useUi.setState({ tool: 'draw' })
    announce(strings.announceCleared)
  }
  const sixVsSix = () => {
    useBoard.getState().setupSixVsSix()
    useUi.setState({ tool: 'draw' })
    announce(strings.announceSixVsSix)
  }
  const toggleEraser = () => {
    const on = !erasing
    useUi.setState({ tool: on ? 'erase' : 'draw', openMenu: null })
    announce(on ? strings.announceEraserOn : strings.announceEraserOff)
  }

  return (
    <div ref={ref} role="toolbar" aria-label={strings.appName} className="bottom-bar" data-dragging={dragging}>
      <div className="flex min-w-0 items-center justify-start">
        <CourtMenu />
      </div>
      <div className="flex items-center gap-2 @max-[400px]:gap-1">
        <TokenTray router={router} />
        <button type="button" onClick={sixVsSix} className={`${BTN} ${CHIP}`} aria-label={strings.sixVsSixLabel}>
          <SixVsSixIcon />
        </button>
        <span className="mx-1 h-8 w-px bg-chip-hover @max-[400px]:mx-0" aria-hidden="true" />
        <PenMenu />
        <button
          type="button"
          onClick={toggleEraser}
          aria-pressed={erasing}
          aria-label={strings.eraserLabel}
          className={`${BTN} ${erasing ? 'bg-ink text-white hover:bg-ink-hover' : CHIP}`}
        >
          <EraseIcon />
        </button>
      </div>
      <div className="flex min-w-0 items-center justify-end gap-2 @max-[400px]:gap-1">
        <button type="button" onClick={clear} disabled={!hasContent} className={`${BTN} ${CHIP}`} aria-label={strings.clearLabel}>
          <ClearIcon />
        </button>
        {showFullscreen && (
          <button
            type="button"
            onClick={fs.toggle}
            aria-label={fs.active ? strings.exitFullscreen : strings.enterFullscreen}
            className={`${BTN} bg-ink text-white hover:bg-ink-hover @max-[400px]:hidden`}
          >
            {fs.active ? <ExitFullscreenIcon /> : <EnterFullscreenIcon />}
          </button>
        )}
      </div>
    </div>
  )
})
