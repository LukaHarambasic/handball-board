import { forwardRef, useEffect } from 'react'
import { announce, useBoard, useUi } from '../state/store'
import { strings } from '../strings'
import { RedoIcon, UndoIcon } from './icons'

const undo = () => {
  if (!useBoard.getState().past.length) return
  useBoard.getState().undo()
  announce(strings.announceUndo)
}
const redo = () => {
  if (!useBoard.getState().future.length) return
  useBoard.getState().redo()
  announce(strings.announceRedo)
}

/** Undo and Redo, floating top centre in the row of the canvases button. Also ⌘Z / ⇧⌘Z. */
export const UndoRedo = forwardRef<HTMLDivElement>(function UndoRedo(_, ref) {
  const canUndo = useBoard((s) => s.past.length > 0)
  const canRedo = useBoard((s) => s.future.length > 0)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey || e.key.toLowerCase() !== 'z') return
      if ((e.target as Element | null)?.closest?.('input, textarea, [role="dialog"]')) return
      if (useUi.getState().drag) return
      e.preventDefault()
      if (e.shiftKey) redo()
      else undo()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div ref={ref} className="undo-redo" role="group" aria-label={`${strings.undo} / ${strings.redo}`}>
      <button type="button" onClick={undo} disabled={!canUndo} aria-label={strings.undo} aria-keyshortcuts="Meta+Z Control+Z">
        <UndoIcon />
      </button>
      <button type="button" onClick={redo} disabled={!canRedo} aria-label={strings.redo} aria-keyshortcuts="Meta+Shift+Z Control+Shift+Z">
        <RedoIcon />
      </button>
    </div>
  )
})
