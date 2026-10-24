import { useMemo, useRef } from 'react'
import { Board } from './board/Board'
import { DeleteZone } from './board/DeleteZone'
import { DragLayer } from './board/DragLayer'
import { useLayout } from './board/useLayout'
import type { Layout } from './input/coords'
import { usePointerRouter } from './input/usePointerRouter'
import { useZoomInput } from './input/useZoomInput'
import { useWakeLock } from './platform/wakeLock'
import { strings } from './strings'
import { BottomBar } from './ui/BottomBar'
import { Canvases } from './ui/Canvases'
import { InstallHint } from './ui/InstallHint'
import { UndoRedo } from './ui/UndoRedo'
import { ZoomControls } from './ui/ZoomControls'
import { UpdateButton } from './ui/UpdateButton'
import { LiveRegion } from './ui/LiveRegion'

export function App() {
  const rootRef = useRef<HTMLElement>(null)
  const insetProbeRef = useRef<HTMLDivElement>(null)
  const canvasButtonRef = useRef<HTMLButtonElement>(null)
  const undoRedoRef = useRef<HTMLDivElement>(null)
  const zoomRef = useRef<HTMLDivElement>(null)
  const layoutRef = useRef<Layout | null>(null)
  const topControls = useMemo(() => [canvasButtonRef, zoomRef, undoRedoRef], [])
  const router = usePointerRouter(layoutRef)
  const layout = useLayout({
    root: rootRef,
    bar: router.barRef,
    topControls,
    insetProbe: insetProbeRef,
  })
  layoutRef.current = layout
  useWakeLock()
  useZoomInput(layoutRef)

  return (
    <main ref={rootRef} className="app" data-orientation={layout?.orientation}>
      <h1 className="sr-only">{strings.appName}</h1>
      {layout && <Board layout={layout} router={router} />}
      <DeleteZone zoneRef={router.deleteZoneRef} layout={layout} />
      <Canvases ref={canvasButtonRef} />
      <ZoomControls ref={zoomRef} layoutRef={layoutRef} />
      <UndoRedo ref={undoRedoRef} />
      <InstallHint />
      <UpdateButton />
      <BottomBar ref={router.barRef} router={router} />
      {layout && <DragLayer layout={layout} router={router} />}
      <LiveRegion />
      <div ref={insetProbeRef} className="inset-probe" aria-hidden="true" />
    </main>
  )
}
