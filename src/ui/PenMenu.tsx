import { useEffect, useId, useRef, type KeyboardEvent } from 'react'
import { PEN_COLORS, penLabel, penValue, type PenColor } from '../board/penColors'
import { announce, useBoard, useUi } from '../state/store'
import { strings } from '../strings'
import { BTN } from './button'
import { PenIcon } from './icons'

/** Pen button: shows the line colour; opens a row of swatches. Picking one switches back to drawing. */
export function PenMenu() {
  const open = useUi((s) => s.openMenu === 'pen')
  const drawing = useUi((s) => s.tool === 'draw')
  const color = useBoard((s) => s.penColor)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])
  const menuId = useId()

  const setOpen = (o: boolean) => useUi.setState({ openMenu: o ? 'pen' : null })

  useEffect(() => {
    if (!open) return
    itemRefs.current[PEN_COLORS.findIndex((c) => c.id === useBoard.getState().penColor)]?.focus()
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (menuRef.current?.contains(t) || buttonRef.current?.contains(t)) return
      if ((t as Element).closest?.('.bottom-bar')) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown, true)
    return () => document.removeEventListener('pointerdown', onDown, true)
  }, [open])

  const choose = (id: PenColor) => {
    useBoard.getState().setPenColor(id)
    useUi.setState({ openMenu: null, tool: 'draw' })
    announce(strings.announcePen(penLabel(id)))
    buttonRef.current?.focus()
  }

  const onMenuKey = (e: KeyboardEvent) => {
    const items = itemRefs.current
    const i = items.findIndex((el) => el === document.activeElement)
    const go = (n: number) => {
      e.preventDefault()
      items[(n + items.length) % items.length]?.focus()
    }
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') go(i + 1)
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') go(i - 1)
    else if (e.key === 'Home') go(0)
    else if (e.key === 'End') go(items.length - 1)
    else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
      buttonRef.current?.focus()
    } else if (e.key === 'Tab') setOpen(false)
  }

  return (
    <div className="relative">
      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={strings.penColor}
          aria-orientation="horizontal"
          onKeyDown={onMenuKey}
          className="pen-menu absolute bottom-[calc(100%+18px)] left-1/2 flex -translate-x-1/2 gap-1 rounded-[20px] bg-white p-2 shadow-[0_12px_32px_rgba(15,23,42,0.18),0_1px_2px_rgba(15,23,42,0.08)]"
        >
          {PEN_COLORS.map((c, i) => (
            <button
              key={c.id}
              ref={(el) => {
                itemRefs.current[i] = el
              }}
              type="button"
              role="menuitemradio"
              aria-checked={color === c.id}
              aria-label={c.label}
              tabIndex={-1}
              onClick={() => choose(c.id)}
              className={`flex size-13 items-center justify-center rounded-2xl hover:bg-chip ${color === c.id ? 'bg-chip' : ''}`}
            >
              <span
                aria-hidden="true"
                className={`block size-8 rounded-full ${color === c.id ? 'ring-3 ring-ink ring-offset-2' : 'ring-1 ring-black/10'}`}
                style={{ background: c.value }}
              />
            </button>
          ))}
        </div>
      )}
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={strings.penColorLabel(penLabel(color))}
        onClick={() => setOpen(!open)}
        className={`${BTN} ${open ? 'bg-defense-active text-defense-ink' : drawing ? 'bg-chip text-ink hover:bg-chip-hover' : 'bg-chip text-ink-muted hover:bg-chip-hover'}`}
      >
        <PenIcon color={penValue(color)} />
      </button>
    </div>
  )
}
