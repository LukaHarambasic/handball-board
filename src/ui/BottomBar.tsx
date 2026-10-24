import { forwardRef } from 'react'
import type { PointerRouter } from '../input/usePointerRouter'
import { fullscreenAvailable, useFullscreen } from '../platform/fullscreen'
import { visibleStrokes } from '../state/courtView'
import { announce, useBoard, useUi } from '../state/store'
import { strings } from '../strings'
import { BTN, CHIP } from './button'
import { CourtMenu } from './CourtMenu'
import { EnterFullscreenIcon, EraseIcon, ExitFullscreenIcon, SixVsSixIcon } from './icons'
import { TokenTray } from './TokenTray'

/** Floating toolbar in three parts. Left: court menu. Centre: trays and 6 v 6. Right: Erase and Full screen. */
export const BottomBar = forwardRef<HTMLDivElement, { router: PointerRouter }>(function BottomBar({ router }, ref) {
  const dragging = useUi((s) => s.drag !== null)
  const hasStrokes = useBoard((s) => visibleStrokes(s, s.strokes).length > 0)
  const fs = useFullscreen()
  const showFullscreen = fullscreenAvailable()

  const erase = () => {
    useBoard.getState().erase()
    announce(strings.announceErased)
  }
  const sixVsSix = () => {
    useBoard.getState().setupSixVsSix()
    announce(strings.announceSixVsSix)
  }

  return (
    <div ref={ref} role="toolbar" aria-label={strings.appName} className="bottom-bar" data-dragging={dragging}>
      <div className="flex min-w-0 items-center justify-start">
        <CourtMenu />
      </div>
      <div className="flex items-center gap-2 max-sm:gap-1.5">
        <TokenTray router={router} />
        <button type="button" onClick={sixVsSix} className={`${BTN} ${CHIP} ml-2 @max-[680px]:ml-0`} aria-label={strings.sixVsSixLabel}>
          <SixVsSixIcon />
          <span className="@max-[680px]:sr-only" aria-hidden="true">
            {strings.sixVsSix}
          </span>
        </button>
      </div>
      <div className="flex min-w-0 items-center justify-end gap-2 max-sm:gap-1.5">
        <button type="button" onClick={erase} disabled={!hasStrokes} className={`${BTN} ${CHIP}`} aria-label={strings.eraseLabel}>
          <EraseIcon />
          <span className="@max-[900px]:sr-only" aria-hidden="true">
            {strings.erase}
          </span>
        </button>
        {showFullscreen && (
          <button
            type="button"
            onClick={fs.toggle}
            aria-label={fs.active ? strings.exitFullscreen : strings.enterFullscreen}
            className={`${BTN} w-15 bg-ink px-0 text-white hover:bg-ink-hover max-sm:w-12 short:w-12 @max-[400px]:w-11 @max-[340px]:hidden`}
          >
            {fs.active ? <ExitFullscreenIcon /> : <EnterFullscreenIcon />}
          </button>
        )}
      </div>
    </div>
  )
})
