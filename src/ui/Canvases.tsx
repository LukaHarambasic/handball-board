import { forwardRef, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { CanvasThumb } from '../board/CanvasThumb'
import { MAX_NAME_LENGTH } from '../state/canvases'
import { announce, pickBoard, useBoard, useUi } from '../state/store'
import type { Canvas } from '../state/types'
import { strings } from '../strings'
import { CanvasesIcon, ChevronIcon, CloseIcon, DuplicateIcon, PlusIcon, RenameIcon, TrashIcon } from './icons'

const TITLE_ID = 'canvases-title'
const ICON_BTN =
  'flex size-11 shrink-0 items-center justify-center rounded-xl text-ink hover:bg-chip disabled:opacity-35 disabled:hover:bg-transparent'

/** Top-left button showing the open canvas; opens the canvases dialog. */
export const Canvases = forwardRef<HTMLButtonElement>(function Canvases(_, ref) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const name = useBoard((s) => s.canvases.find((c) => c.id === s.activeId)?.name ?? '')
  const [open, setOpen] = useState(false)

  const show = () => {
    useUi.setState({ menuOpen: false })
    dialogRef.current?.showModal()
    setOpen(true)
  }
  const close = () => dialogRef.current?.close()

  return (
    <>
      <button
        ref={(el) => {
          buttonRef.current = el
          if (typeof ref === 'function') ref(el)
          else if (ref) ref.current = el
        }}
        type="button"
        className="canvas-button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={strings.canvasesButton(name)}
        onClick={show}
      >
        <CanvasesIcon />
        <span className="min-w-0 truncate">{name}</span>
        <span className="text-ink-muted">
          <ChevronIcon up={false} />
        </span>
      </button>
      <dialog
        ref={dialogRef}
        className="canvas-dialog"
        aria-labelledby={TITLE_ID}
        onClose={() => {
          setOpen(false)
          buttonRef.current?.focus()
        }}
        // A tap on the backdrop lands on the dialog element itself.
        onClick={(e) => e.target === dialogRef.current && close()}
      >
        {open && <CanvasList onDone={close} />}
      </dialog>
    </>
  )
})

function CanvasList({ onDone }: { onDone: () => void }) {
  const canvases = useBoard((s) => s.canvases)
  const activeId = useBoard((s) => s.activeId)
  const view = useBoard((s) => s.view)
  const halfSide = useBoard((s) => s.halfSide)
  const lastChangedSide = useBoard((s) => s.lastChangedSide)
  const tokens = useBoard((s) => s.tokens)
  const strokes = useBoard((s) => s.strokes)
  const newRef = useRef<HTMLButtonElement>(null)
  const [renaming, setRenaming] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)

  // The open canvas shows its live board.
  const list = useMemo(() => {
    const live = pickBoard({ view, halfSide, lastChangedSide, tokens, strokes })
    return canvases.map((c) => (c.id === activeId ? { ...c, board: live } : c))
  }, [canvases, activeId, view, halfSide, lastChangedSide, tokens, strokes])

  const store = () => useBoard.getState()

  const create = () => {
    const c = store().createCanvas()
    announce(strings.announceCanvasCreated(c.name))
    onDone()
  }
  const open = (c: Canvas) => {
    store().openCanvas(c.id)
    announce(strings.announceCanvasOpened(c.name))
    onDone()
  }
  const duplicate = (c: Canvas) => {
    const copy = store().duplicateCanvas(c.id)
    if (copy) announce(strings.announceCanvasDuplicated(copy.name))
  }
  const remove = (c: Canvas) => {
    store().deleteCanvas(c.id)
    setConfirming(null)
    announce(strings.announceCanvasDeleted(c.name))
    newRef.current?.focus()
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-chip px-4 py-3">
        <h2 id={TITLE_ID} className="flex-1 text-xl font-bold">
          {strings.canvases}
        </h2>
        <button
          ref={newRef}
          type="button"
          onClick={create}
          className="flex h-11 items-center gap-1.5 rounded-xl bg-defense px-3.5 text-[17px] font-semibold text-white hover:bg-defense-ink"
        >
          <PlusIcon />
          {strings.newCanvas}
        </button>
        <button type="button" onClick={onDone} aria-label={strings.closeCanvases} className={ICON_BTN}>
          <CloseIcon />
        </button>
      </div>
      <ul className="canvas-list">
        {list.map((c) => (
          <CanvasRow
            key={c.id}
            canvas={c}
            active={c.id === activeId}
            onlyOne={list.length === 1}
            renaming={renaming === c.id}
            confirming={confirming === c.id}
            onOpen={() => open(c)}
            onRename={() => {
              setConfirming(null)
              setRenaming(c.id)
            }}
            onRenameDone={() => setRenaming(null)}
            onDuplicate={() => duplicate(c)}
            onDelete={() => {
              setRenaming(null)
              setConfirming(c.id)
            }}
            onDeleteCancel={() => setConfirming(null)}
            onDeleteConfirm={() => remove(c)}
          />
        ))}
      </ul>
      <p className="border-t border-chip px-4 py-2.5 text-sm font-medium text-ink-muted">{strings.version(__APP_VERSION__)}</p>
    </div>
  )
}

type RowProps = {
  canvas: Canvas
  active: boolean
  onlyOne: boolean
  renaming: boolean
  confirming: boolean
  onOpen: () => void
  onRename: () => void
  onRenameDone: () => void
  onDuplicate: () => void
  onDelete: () => void
  onDeleteCancel: () => void
  onDeleteConfirm: () => void
}

function CanvasRow(p: RowProps) {
  const { canvas: c } = p
  const summary = strings.canvasSummary(c.board.tokens.length, c.board.strokes.length)
  const renameRef = useRef<HTMLButtonElement>(null)
  const deleteRef = useRef<HTMLButtonElement>(null)
  const wasRenaming = useRef(false)
  const wasConfirming = useRef(false)

  // Return focus to the button that started rename or delete once it is done.
  useEffect(() => {
    if (wasRenaming.current && !p.renaming) renameRef.current?.focus()
    wasRenaming.current = p.renaming
  }, [p.renaming])
  useEffect(() => {
    if (wasConfirming.current && !p.confirming) deleteRef.current?.focus()
    wasConfirming.current = p.confirming
  }, [p.confirming])

  return (
    <li className={`canvas-row ${p.active ? 'bg-defense-soft' : ''}`}>
      {p.renaming ? (
        <RenameForm canvas={c} onDone={p.onRenameDone} />
      ) : (
        <button
          type="button"
          onClick={p.onOpen}
          aria-current={p.active ? 'true' : undefined}
          aria-label={`${strings.openCanvas(c.name)}. ${summary}${p.active ? `. ${strings.currentCanvas}` : ''}`}
          className="flex min-h-14 min-w-0 flex-[1_1_220px] items-center gap-3 rounded-xl text-left"
        >
          <CanvasThumb board={c.board} />
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-lg font-semibold">{c.name}</span>
            <span className="truncate text-sm font-medium text-ink-muted">
              {p.active ? `${strings.currentCanvas} · ${summary}` : summary}
            </span>
          </span>
        </button>
      )}
      {p.confirming ? (
        <div role="group" aria-label={strings.confirmDelete(c.name)} className="flex shrink-0 items-center gap-1.5">
          <span className="sr-only">{strings.confirmDelete(c.name)}</span>
          <button type="button" onClick={p.onDeleteCancel} autoFocus className="h-11 rounded-xl bg-chip px-3 text-base font-semibold hover:bg-chip-hover">
            {strings.cancel}
          </button>
          <button type="button" onClick={p.onDeleteConfirm} className="h-11 rounded-xl bg-danger px-3 text-base font-semibold text-white">
            {strings.delete}
          </button>
        </div>
      ) : (
        !p.renaming && (
          <div className="flex shrink-0 items-center">
            <button ref={renameRef} type="button" onClick={p.onRename} aria-label={strings.renameCanvas(c.name)} className={ICON_BTN}>
              <RenameIcon />
            </button>
            <button type="button" onClick={p.onDuplicate} aria-label={strings.duplicateCanvas(c.name)} className={ICON_BTN}>
              <DuplicateIcon />
            </button>
            <button
              ref={deleteRef}
              type="button"
              onClick={p.onDelete}
              disabled={p.onlyOne}
              aria-label={strings.deleteCanvas(c.name)}
              className={`${ICON_BTN} text-danger`}
            >
              <TrashIcon />
            </button>
          </div>
        )
      )}
    </li>
  )
}

function RenameForm({ canvas, onDone }: { canvas: Canvas; onDone: () => void }) {
  const [value, setValue] = useState(canvas.name)
  const inputRef = useRef<HTMLInputElement>(null)
  const done = useRef(false)

  useEffect(() => inputRef.current?.select(), [])

  const save = () => {
    if (done.current) return
    done.current = true
    if (value.trim() && value.trim() !== canvas.name) {
      useBoard.getState().renameCanvas(canvas.id, value)
      const renamed = useBoard.getState().canvases.find((c) => c.id === canvas.id)?.name
      if (renamed) announce(strings.announceCanvasRenamed(renamed))
    }
    onDone()
  }
  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    save()
  }
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Escape') return
    // Cancel the rename, not the whole dialog.
    e.preventDefault()
    e.stopPropagation()
    done.current = true
    onDone()
  }

  return (
    <form onSubmit={onSubmit} className="flex min-w-0 flex-[1_1_100%] items-center gap-2">
      <label htmlFor={`name-${canvas.id}`} className="sr-only">
        {strings.canvasNameLabel}
      </label>
      <input
        ref={inputRef}
        id={`name-${canvas.id}`}
        value={value}
        maxLength={MAX_NAME_LENGTH}
        autoFocus
        enterKeyHint="done"
        autoComplete="off"
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={onKeyDown}
        className="h-12 min-w-0 flex-1 rounded-xl border-2 border-defense bg-white px-3 text-lg font-semibold text-ink outline-none"
      />
      <button type="submit" className="h-11 shrink-0 rounded-xl bg-defense px-3.5 text-base font-semibold text-white">
        {strings.saveName}
      </button>
    </form>
  )
}
