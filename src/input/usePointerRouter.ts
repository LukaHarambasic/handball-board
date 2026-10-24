import { useMemo, useRef, type RefObject } from 'react'
import { flushSync } from 'react-dom'
import { strokeLength, strokePath } from '../board/strokePath'
import { visibleTokenLabel } from '../board/Tokens'
import { clampToBox, placementBox, visibleTokens } from '../state/courtView'
import { announce, useBoard, useUi } from '../state/store'
import type { Point, Team } from '../state/types'
import { strings } from '../strings'
import { courtToView, hitToken, inRect, screenToCourt, type Layout, type Rect } from './coords'

/** Movement below this many pixels counts as a tap, not a drag. */
const TAP_SLOP = 10
const MIN_POINT_GAP = 0.03 // metres between recorded stroke points
const MIN_STROKE_LENGTH = 0.25 // shorter touches are taps, not lines
const LIFT = 1.18

type StrokeGesture = { kind: 'stroke'; pointerId: number; pointerType: string; points: Point[]; raf: number }
type DragGesture = {
  kind: 'drag'
  pointerId: number
  pointerType: string
  /** Store id, or null for a token being spawned from a tray. */
  id: string | null
  team: Team
  grab: Point
  pos: Point
  startPx: Point
  moved: boolean
  overDelete: boolean
  deleteRect: Rect
  barTop: number
}
type Gesture = StrokeGesture | DragGesture

export type PointerRouter = {
  onBoardPointerDown: (e: React.PointerEvent) => void
  startSpawn: (team: Team, e: React.PointerEvent) => void
  liveStrokeRef: RefObject<SVGPathElement | null>
  dragOuterRef: RefObject<SVGGElement | null>
  dragInnerRef: RefObject<SVGGElement | null>
  deleteZoneRef: RefObject<HTMLDivElement | null>
  barRef: RefObject<HTMLDivElement | null>
}

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

/**
 * One router for the whole board, with no modes: a finger that lands on a player moves it,
 * a finger that lands on empty court draws. Only the first pointer counts, so a palm or a
 * second hand is ignored. During a gesture the SVG is updated directly; the store is only
 * touched on release, which keeps drawing at display rate.
 */
export function usePointerRouter(layoutRef: RefObject<Layout | null>): PointerRouter {
  const liveStrokeRef = useRef<SVGPathElement | null>(null)
  const dragOuterRef = useRef<SVGGElement | null>(null)
  const dragInnerRef = useRef<SVGGElement | null>(null)
  const deleteZoneRef = useRef<HTMLDivElement | null>(null)
  const barRef = useRef<HTMLDivElement | null>(null)

  return useMemo(() => {
    let active: Gesture | null = null
    let shrinkSeq = 0

    const toCourt = (e: { clientX: number; clientY: number }): Point | null => {
      const l = layoutRef.current
      return l ? screenToCourt(l, e.clientX, e.clientY) : null
    }

    const setDragTransform = (pos: Point, scale: number) => {
      const l = layoutRef.current
      if (!l) return
      const [u, v] = courtToView(l.orientation, pos[0], pos[1])
      dragOuterRef.current?.setAttribute('transform', `translate(${u.toFixed(3)} ${v.toFixed(3)})`)
      dragInnerRef.current?.setAttribute('transform', `scale(${scale})`)
    }

    const attach = () => {
      window.addEventListener('pointermove', onMove, { passive: false })
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', onCancel)
    }
    const detach = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onCancel)
    }

    const clearDrag = () => useUi.setState({ drag: null, overDelete: false })

    const beginDrag = (g: DragGesture) => {
      active = g
      shrinkSeq += 1
      // Render the lifted token synchronously so it is under the finger on the first frame.
      flushSync(() => useUi.setState({ drag: { id: g.id, team: g.team }, overDelete: false, menuOpen: false }))
      setDragTransform(g.pos, LIFT)
      attach()
    }

    const dragFor = (
      e: React.PointerEvent,
      id: string | null,
      team: Team,
      pos: Point,
      grab: Point,
    ): DragGesture => ({
      kind: 'drag',
      pointerId: e.pointerId,
      pointerType: e.pointerType,
      id,
      team,
      grab,
      pos,
      startPx: [e.clientX, e.clientY],
      moved: false,
      overDelete: false,
      deleteRect: deleteZoneRef.current?.getBoundingClientRect() ?? { left: 0, top: 0, right: 0, bottom: 0 },
      barTop: barRef.current?.getBoundingClientRect().top ?? Infinity,
    })

    const renderLiveStroke = () => {
      if (active?.kind !== 'stroke') return
      active.raf = 0
      liveStrokeRef.current?.setAttribute('d', strokePath(active.points, false))
    }

    const endStroke = (g: StrokeGesture, commit: boolean) => {
      if (g.raf) cancelAnimationFrame(g.raf)
      if (commit && g.points.length >= 2 && strokeLength(g.points) >= MIN_STROKE_LENGTH) {
        useBoard.getState().addStroke(g.points)
        announce(strings.announceLine)
      }
      // Clear the live path once React has painted the committed one.
      requestAnimationFrame(() => {
        if (active?.kind !== 'stroke') liveStrokeRef.current?.setAttribute('d', '')
      })
    }

    const startStroke = (e: React.PointerEvent, p: Point) => {
      active = { kind: 'stroke', pointerId: e.pointerId, pointerType: e.pointerType, points: [p], raf: 0 }
      liveStrokeRef.current?.setAttribute('d', '')
      attach()
    }

    function onMove(e: PointerEvent) {
      const g = active
      if (!g || e.pointerId !== g.pointerId) return
      e.preventDefault()
      if (g.kind === 'stroke') {
        const events = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : []
        for (const ce of events.length ? events : [e]) {
          const p = toCourt(ce)
          const last = g.points[g.points.length - 1]
          if (p && last && Math.hypot(p[0] - last[0], p[1] - last[1]) >= MIN_POINT_GAP) g.points.push(p)
        }
        if (!g.raf) g.raf = requestAnimationFrame(renderLiveStroke)
        return
      }
      const p = toCourt(e)
      if (!p) return
      if (!g.moved && Math.hypot(e.clientX - g.startPx[0], e.clientY - g.startPx[1]) > TAP_SLOP) g.moved = true
      g.pos = [p[0] + g.grab[0], p[1] + g.grab[1]]
      setDragTransform(g.pos, LIFT)
      const over = g.moved && inRect(g.deleteRect, e.clientX, e.clientY, 8)
      if (over !== g.overDelete) {
        g.overDelete = over
        useUi.setState({ overDelete: over })
      }
    }

    function finishDrag(g: DragGesture, e: PointerEvent) {
      const board = useBoard.getState()
      const l = layoutRef.current
      const label = visibleTokenLabel

      if (g.overDelete) {
        if (g.id) {
          announce(strings.announceDeleted(label(g.id)))
          board.deleteToken(g.id)
        }
        shrinkAway(g.pos)
        return
      }
      if (g.id === null && !g.moved) {
        // A tap on a tray button places a token on a free spot.
        const t = board.placeTokenAuto(g.team)
        announce(strings.announcePlaced(label(t.id)))
        clearDrag()
        return
      }
      if (g.id === null && e.clientY >= g.barTop) {
        // Dragged out of the tray and dropped back on the bar: cancelled.
        clearDrag()
        return
      }
      const box = placementBox(board.view, board.halfSide, (l?.tokenSize ?? 1.6) / 2)
      const [x, y] = clampToBox(g.pos[0], g.pos[1], box)
      if (g.id === null) {
        const t = board.placeToken(g.team, x, y)
        announce(strings.announcePlaced(label(t.id)))
      } else if (g.moved) {
        board.moveToken(g.id, x, y)
      }
      clearDrag()
    }

    function shrinkAway(pos: Point) {
      const seq = shrinkSeq
      if (reducedMotion()) return clearDrag()
      const t0 = performance.now()
      const step = (now: number) => {
        if (seq !== shrinkSeq) return // a new drag took over the layer
        const k = Math.min(1, (now - t0) / 160)
        setDragTransform(pos, LIFT * (1 - k))
        if (k < 1) requestAnimationFrame(step)
        else clearDrag()
      }
      requestAnimationFrame(step)
    }

    function onUp(e: PointerEvent) {
      const g = active
      if (!g || e.pointerId !== g.pointerId) return
      active = null
      detach()
      if (g.kind === 'stroke') {
        const p = toCourt(e)
        const last = g.points[g.points.length - 1]
        if (p && last && (p[0] !== last[0] || p[1] !== last[1])) g.points.push(p)
        endStroke(g, true)
      } else finishDrag(g, e)
    }

    function onCancel(e: PointerEvent) {
      const g = active
      if (!g || e.pointerId !== g.pointerId) return
      active = null
      detach()
      if (g.kind === 'stroke') endStroke(g, false)
      else clearDrag()
    }

    /** Only the first pointer counts; an Apple Pencil may take over from a resting palm's line. */
    const accepts = (e: React.PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return false
      if (!active) return true
      if (active.kind === 'stroke' && active.pointerType === 'touch' && e.pointerType === 'pen') {
        const g = active
        active = null
        detach()
        endStroke(g, false)
        return true
      }
      return false
    }

    const onBoardPointerDown = (e: React.PointerEvent) => {
      if (!accepts(e)) return
      if (useUi.getState().menuOpen) {
        useUi.setState({ menuOpen: false })
        return
      }
      const l = layoutRef.current
      const p = toCourt(e)
      if (!l || !p) return
      e.preventDefault()
      const s = useBoard.getState()
      const hit = hitToken(visibleTokens(s, s.tokens), p[0], p[1], l.hitRadius)
      if (hit) beginDrag(dragFor(e, hit.id, hit.team, [hit.x, hit.y], [hit.x - p[0], hit.y - p[1]]))
      else startStroke(e, p)
    }

    const startSpawn = (team: Team, e: React.PointerEvent) => {
      if (!accepts(e)) return
      const p = toCourt(e)
      if (!p) return
      useUi.setState({ menuOpen: false })
      beginDrag(dragFor(e, null, team, p, [0, 0]))
    }

    return { onBoardPointerDown, startSpawn, liveStrokeRef, dragOuterRef, dragInnerRef, deleteZoneRef, barRef }
  }, [layoutRef])
}
