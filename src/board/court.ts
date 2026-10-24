import type { Side } from '../state/types'

// IHF Rules of the Game, Rule 1. All values in metres.
export const COURT_LENGTH = 40
export const COURT_WIDTH = 20
export const CENTRE_X = COURT_LENGTH / 2
export const GOAL_WIDTH = 3
export const POST_TOP = (COURT_WIDTH - GOAL_WIDTH) / 2 // 8.5
export const POST_BOTTOM = POST_TOP + GOAL_WIDTH // 11.5
export const GOAL_AREA_RADIUS = 6
export const FREE_THROW_RADIUS = 9
export const SEVEN_METRE = 7
export const SEVEN_METRE_LENGTH = 1
export const FOUR_METRE = 4
export const FOUR_METRE_LENGTH = 0.15
export const SUBSTITUTION_OFFSET = 4.5
export const SUBSTITUTION_MARK = 0.15 // into and out of the court
export const DASH = 0.15 // 9 m line: 15 cm dash / 15 cm gap
export const GOAL_DEPTH = 0.9
/** Safety-zone margin shown around the court. */
export const MARGIN = 1

// Real lines are 5 cm; scaled up for legibility.
export const LINE_WIDTH = 0.12
export const GOAL_LINE_WIDTH = 0.28

const r3 = (n: number) => Math.round(n * 1000) / 1000

function goalLineX(end: Side) {
  return end === 'left' ? 0 : COURT_LENGTH
}

/**
 * The 6 m or 9 m line: a straight segment parallel to the goal line joined to it
 * by two quarter circles around the posts, clipped at the sidelines.
 */
export function arcLinePath(end: Side, radius: number): string {
  const gx = goalLineX(end)
  const dir = end === 'left' ? 1 : -1
  const sweep = end === 'left' ? 1 : 0
  const startY = Math.max(0, POST_TOP - radius)
  const startDx = Math.sqrt(radius * radius - (POST_TOP - startY) ** 2)
  const sx = r3(gx + dir * startDx)
  const lx = gx + dir * radius
  return (
    `M${sx} ${r3(startY)} A${radius} ${radius} 0 0 ${sweep} ${lx} ${POST_TOP} ` +
    `L${lx} ${POST_BOTTOM} A${radius} ${radius} 0 0 ${sweep} ${sx} ${r3(COURT_WIDTH - startY)}`
  )
}

/** Goal area closed along the goal line, for the tint. */
export function goalAreaFillPath(end: Side): string {
  return `${arcLinePath(end, GOAL_AREA_RADIUS)} Z`
}

export function sevenMetrePath(end: Side): string {
  const x = goalLineX(end) + (end === 'left' ? 1 : -1) * SEVEN_METRE
  const h = SEVEN_METRE_LENGTH / 2
  return `M${x} ${10 - h} V${10 + h}`
}

export function fourMetrePath(end: Side): string {
  const x = goalLineX(end) + (end === 'left' ? 1 : -1) * FOUR_METRE
  const h = FOUR_METRE_LENGTH / 2
  return `M${x} ${r3(10 - h)} V${r3(10 + h)}`
}

export function substitutionMarkPath(end: Side): string {
  const x = CENTRE_X + (end === 'left' ? -1 : 1) * SUBSTITUTION_OFFSET
  return `M${x} ${COURT_WIDTH - SUBSTITUTION_MARK} V${COURT_WIDTH + SUBSTITUTION_MARK}`
}

export function goalPostsPath(end: Side): string {
  const x = goalLineX(end)
  return `M${x} ${POST_TOP} V${POST_BOTTOM}`
}

export function goalRect(end: Side) {
  return {
    x: end === 'left' ? -GOAL_DEPTH : COURT_LENGTH,
    y: POST_TOP,
    width: GOAL_DEPTH,
    height: GOAL_WIDTH,
  }
}

/** Playing-court rectangle for a full court or one half. */
export function courtRect(side?: Side) {
  if (!side) return { x: 0, y: 0, width: COURT_LENGTH, height: COURT_WIDTH }
  return { x: side === 'left' ? 0 : CENTRE_X, y: 0, width: CENTRE_X, height: COURT_WIDTH }
}
