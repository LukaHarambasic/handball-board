import { COURT_LENGTH } from '../board/court'
import type { Side, Team, Token } from '../state/types'

type Spot = { team: Team; x: number; y: number }

/** Default setup in front of the right goal: 6:0 defense on the 6 m line, wings in the corners, backs and pivot. */
const RIGHT_GOAL: Spot[] = [
  // 6:0 defense, just outside the goal area
  { team: 'defense', x: 37.1, y: 2.7 },
  { team: 'defense', x: 34.5, y: 4.7 },
  { team: 'defense', x: 33.3, y: 7.3 },
  { team: 'defense', x: 33.5, y: 12.3 },
  { team: 'defense', x: 34.9, y: 15.1 },
  { team: 'defense', x: 37.3, y: 17.2 },
  // Left wing, left back, centre back, right back, right wing, pivot
  { team: 'attack', x: 39.8, y: 0.1 },
  { team: 'attack', x: 29.4, y: 0.9 },
  { team: 'attack', x: 26.1, y: 9.5 },
  { team: 'attack', x: 29.0, y: 18.2 },
  { team: 'attack', x: 39.8, y: 19.4 },
  { team: 'attack', x: 33.4, y: 10.0 },
]

export function sixVsSix(side: Side, makeId: () => string): Token[] {
  return RIGHT_GOAL.map((s) => ({
    id: makeId(),
    team: s.team,
    x: side === 'right' ? s.x : COURT_LENGTH - s.x,
    y: s.y,
  }))
}
