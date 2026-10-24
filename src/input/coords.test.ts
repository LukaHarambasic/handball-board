import { describe, expect, it } from 'vitest'
import { computeLayout, courtTopPx, courtToScreen, courtToView, hitToken, panBy, screenToCourt, viewToCourt, zoomAround, type LayoutInput } from './coords'

const ipad: LayoutInput = {
  width: 1194,
  height: 834,
  insets: { top: 0, right: 0, bottom: 0, left: 0 },
  barTop: 726,
  topObstacles: [
    { left: 950, top: 12, right: 1170, bottom: 76 },
    { left: 24, top: 12, right: 200, bottom: 64 },
  ],
  view: 'full',
  halfSide: 'right',
}

describe('screen ↔ court mapping', () => {
  it('view space round-trips in both orientations', () => {
    for (const o of ['landscape', 'portrait'] as const) {
      const [u, v] = courtToView(o, 33, 4)
      expect(viewToCourt(o, u, v)).toEqual([33, 4])
    }
    // Portrait turns the court clockwise: right goal at the bottom.
    expect(courtToView('portrait', 40, 10)).toEqual([10, 40])
  })

  it('landscape iPad: full court fills the width at true scale', () => {
    const l = computeLayout(ipad)
    expect(l.orientation).toBe('landscape')
    expect(l.scale).toBeCloseTo((1194 - 16) / 42, 5)
    const [px, py] = courtToScreen(l, 20, 10)
    expect(px).toBeCloseTo(597, 0)
    expect(screenToCourt(l, px, py)[0]).toBeCloseTo(20, 6)
    expect(screenToCourt(l, px, py)[1]).toBeCloseTo(10, 6)
  })

  it('keeps the court line clear of the top-corner controls and centred', () => {
    for (const input of [ipad, { ...ipad, width: 1366, height: 700, barTop: 600 }, { ...ipad, width: 834, height: 1194, barTop: 1086 }]) {
      const l = computeLayout(input)
      const [ax, ay] = courtToScreen(l, 0, 0)
      const [bx, by] = courtToScreen(l, 40, 20)
      const court = { left: Math.min(ax, bx), right: Math.max(ax, bx), top: Math.min(ay, by) }
      for (const o of input.topObstacles) {
        const clear = court.top >= o.bottom + 9 || court.right <= o.left - 9 || court.left >= o.right + 9
        expect(clear).toBe(true)
      }
      expect((court.left + court.right) / 2).toBeCloseTo(input.width / 2, 0)
    }
  })

  it('portrait iPad rotates the court to vertical', () => {
    const l = computeLayout({ ...ipad, width: 834, height: 1194, barTop: 1086 })
    expect(l.orientation).toBe('portrait')
    const [, topGoal] = courtToScreen(l, 0, 10)
    const [, bottomGoal] = courtToScreen(l, 40, 10)
    expect(bottomGoal).toBeGreaterThan(topGoal)
  })

  it('touch targets stay at least 44 px across', () => {
    const phone = computeLayout({ ...ipad, width: 667, height: 375, barTop: 303, topObstacles: [{ left: 479, top: 8, right: 659, bottom: 60 }] })
    expect(phone.hitRadius * phone.scale).toBeGreaterThanOrEqual(22 - 1e-9)
  })

  it('picks the nearest token within the touch radius', () => {
    const tokens = [
      { id: 'a', team: 'defense' as const, x: 10, y: 10 },
      { id: 'b', team: 'attack' as const, x: 11, y: 10 },
    ]
    expect(hitToken(tokens, 10.6, 10, 1)?.id).toBe('b')
    expect(hitToken(tokens, 14, 10, 1)).toBeUndefined()
  })
})

describe('zoom', () => {
  const base = computeLayout(ipad)

  it('zooming keeps the court point under the fingers in place', () => {
    const at: [number, number] = [800, 300]
    const before = screenToCourt(base, ...at)
    const zoomed = computeLayout(ipad, zoomAround(base, 2, at))
    expect(zoomed.zoom).toBe(2)
    const after = screenToCourt(zoomed, ...at)
    expect(after[0]).toBeCloseTo(before[0], 6)
    expect(after[1]).toBeCloseTo(before[1], 6)
  })

  it('a pinch that moves pans with the fingers', () => {
    const z = zoomAround(base, 1.5, [600, 400])!
    const l = computeLayout(ipad, z)
    const point = screenToCourt(l, 600, 400)
    const moved = computeLayout(ipad, zoomAround(l, 1, [600, 400], [650, 420]))
    const after = screenToCourt(moved, 650, 420)
    expect(after[0]).toBeCloseTo(point[0], 6)
    expect(after[1]).toBeCloseTo(point[1], 6)
  })

  it('stays between 100 % and 400 %, and cannot be panned off the court', () => {
    expect(zoomAround(base, 0.5, [600, 400])).toBeNull()
    expect(zoomAround(base, 10, [600, 400])!.z).toBe(4)
    const far = panBy(computeLayout(ipad, { z: 2, u: 20, v: 10 }), 100000, 100000)!
    expect(far.u).toBe(base.fit.box.u0)
    expect(far.v).toBe(base.fit.box.v0)
    expect(panBy(base, 50, 50)).toBeNull()
  })
})

describe('court top line', () => {
  it('is where the playing court starts on screen, in both orientations', () => {
    const land = computeLayout(ipad)
    expect(courtTopPx(land)).toBeCloseTo(courtToScreen(land, 0, 0)[1], 6)
    const port = computeLayout({ ...ipad, width: 834, height: 1194, barTop: 1086 })
    // Portrait: the left goal line is at the top.
    expect(courtTopPx(port)).toBeCloseTo(courtToScreen(port, 0, 10)[1], 6)
  })
})

