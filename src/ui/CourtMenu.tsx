import { useEffect, useId, useRef, type KeyboardEvent } from 'react'
import { announce, useBoard, useUi } from '../state/store'
import type { View } from '../state/types'
import { strings } from '../strings'
import { BTN } from './button'
import { CheckIcon, ChevronIcon, FullCourtIcon, HalfCourtIcon } from './icons'

const OPTIONS: { view: View; label: string; hint: string; Icon: () => React.JSX.Element }[] = [
  { view: 'full', label: strings.fullCourt, hint: strings.fullCourtHint, Icon: FullCourtIcon },
  { view: 'half', label: strings.halfCourt, hint: strings.halfCourtHint, Icon: HalfCourtIcon },
]

/** Court switch: a menu that opens upward from the bottom bar. */
export function CourtMenu() {
  const open = useUi((s) => s.menuOpen)
  const view = useBoard((s) => s.view)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])
  const menuId = useId()

  const setOpen = (menuOpen: boolean) => useUi.setState({ menuOpen })

  useEffect(() => {
    if (!open) return
    itemRefs.current[OPTIONS.findIndex((o) => o.view === useBoard.getState().view)]?.focus()
    // Taps elsewhere in the toolbar close the menu; the board closes it itself.
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (menuRef.current?.contains(t) || buttonRef.current?.contains(t)) return
      if ((t as Element).closest?.('.bottom-bar')) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown, true)
    return () => document.removeEventListener('pointerdown', onDown, true)
  }, [open])

  const choose = (v: View) => {
    if (v !== useBoard.getState().view) {
      useBoard.getState().setView(v)
      announce(strings.announceView(v === 'full' ? strings.fullCourt : strings.halfCourt))
    }
    setOpen(false)
    buttonRef.current?.focus()
  }

  const onMenuKey = (e: KeyboardEvent) => {
    const items = itemRefs.current
    const i = items.findIndex((el) => el === document.activeElement)
    const go = (n: number) => {
      e.preventDefault()
      items[(n + items.length) % items.length]?.focus()
    }
    if (e.key === 'ArrowDown') go(i + 1)
    else if (e.key === 'ArrowUp') go(i - 1)
    else if (e.key === 'Home') go(0)
    else if (e.key === 'End') go(items.length - 1)
    else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
      buttonRef.current?.focus()
    } else if (e.key === 'Tab') setOpen(false)
  }

  const full = view === 'full'
  return (
    <div className="relative">
      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={strings.courtMenu}
          onKeyDown={onMenuKey}
          className="absolute bottom-[calc(100%+18px)] left-0 flex w-75 max-w-[calc(100vw-32px)] flex-col gap-1 rounded-[20px] bg-white p-2 shadow-[0_12px_32px_rgba(15,23,42,0.18),0_1px_2px_rgba(15,23,42,0.08)]"
        >
          {OPTIONS.map((o, i) => (
            <button
              key={o.view}
              ref={(el) => {
                itemRefs.current[i] = el
              }}
              type="button"
              role="menuitemradio"
              aria-checked={view === o.view}
              tabIndex={-1}
              onClick={() => choose(o.view)}
              className={`flex min-h-16 w-full items-center gap-3.5 rounded-[14px] px-3.5 py-2 text-left text-ink ${
                view === o.view ? 'bg-defense-soft' : 'hover:bg-chip'
              }`}
            >
              <o.Icon />
              <span className="flex flex-1 flex-col gap-0.5">
                <span className="text-lg font-semibold">{o.label}</span>
                <span className="text-sm font-medium text-ink-muted">{o.hint}</span>
              </span>
              {view === o.view && <CheckIcon />}
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
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault()
            setOpen(true)
          }
        }}
        className={`${BTN} pr-3 ${open ? 'bg-defense-active text-defense-ink' : 'bg-chip text-ink hover:bg-chip-hover'}`}
      >
        {full ? <FullCourtIcon /> : <HalfCourtIcon />}
        <span className="max-sm:sr-only">
          {full ? strings.fullCourtShort : strings.halfCourtShort}
          <span className="max-lg:sr-only">{strings.courtSuffix}</span>
        </span>
        <span className="text-ink-muted">
          <ChevronIcon up={!open} />
        </span>
      </button>
    </div>
  )
}
