import { describe, expect, it } from 'vitest'
import { arcLinePath, fourMetrePath, goalAreaFillPath, sevenMetrePath, substitutionMarkPath } from './court'

describe('court geometry (IHF Rule 1)', () => {
  it('6 m goal area: quarter circles from the goal line around each post, 3 m straight line at 6 m', () => {
    expect(arcLinePath('right', 6)).toBe('M40 2.5 A6 6 0 0 0 34 8.5 L34 11.5 A6 6 0 0 0 40 17.5')
    expect(arcLinePath('left', 6)).toBe('M0 2.5 A6 6 0 0 1 6 8.5 L6 11.5 A6 6 0 0 1 0 17.5')
    expect(goalAreaFillPath('left').endsWith('Z')).toBe(true)
  })

  it('9 m line is clipped where its arc meets the sidelines', () => {
    // sqrt(9² - 8.5²) = 2.958 m from the goal line
    expect(arcLinePath('left', 9)).toBe('M2.958 0 A9 9 0 0 1 9 8.5 L9 11.5 A9 9 0 0 1 2.958 20')
    expect(arcLinePath('right', 9)).toBe('M37.042 0 A9 9 0 0 0 31 8.5 L31 11.5 A9 9 0 0 0 37.042 20')
  })

  it('7 m line is 1 m long, centred, 7 m out', () => {
    expect(sevenMetrePath('left')).toBe('M7 9.5 V10.5')
    expect(sevenMetrePath('right')).toBe('M33 9.5 V10.5')
  })

  it('4 m goalkeeper mark is 15 cm long', () => {
    expect(fourMetrePath('left')).toBe('M4 9.925 V10.075')
    expect(fourMetrePath('right')).toBe('M36 9.925 V10.075')
  })

  it('substitution marks sit 4.5 m either side of the centre line', () => {
    expect(substitutionMarkPath('left')).toContain('M15.5 ')
    expect(substitutionMarkPath('right')).toContain('M24.5 ')
  })
})
