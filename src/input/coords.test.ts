import { describe, expect, it } from 'vitest'
import { computeLayout, courtToScreen, courtToView, hitToken, screenToCourt, viewToCourt, type LayoutInput } from './coords'

const ipad: LayoutInput = {
  width: 1194,
  height: 834,
  insets: { top: 0, right: 0, bottom: 0, left: 0 },
  barTop: 726,
  deleteZone: { left: 950, top: 12, right: 1170, bottom: 76 },
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

  it('keeps the court line clear of the delete zone', () => {
    for (const input of [ipad, { ...ipad, width: 1366, height: 700, barTop: 600 }, { ...ipad, width: 834, height: 1194, barTop: 1086 }]) {
      const l = computeLayout(input)
      const top = Math.min(courtToScreen(l, 0, 0)[1], courtToScreen(l, 40, 20)[1])
      const right = Math.max(courtToScreen(l, 0, 0)[0], courtToScreen(l, 40, 20)[0])
      const clear = top >= input.deleteZone.bottom + 9 || right <= input.deleteZone.left - 9
      expect(clear).toBe(true)
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
    const phone = computeLayout({ ...ipad, width: 667, height: 375, barTop: 303, deleteZone: { left: 479, top: 8, right: 659, bottom: 60 } })
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
