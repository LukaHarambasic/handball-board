import { COURT_LENGTH } from '../board/court'
import type { Side, Team, Token } from '../state/types'

type Spot = { team: Team; x: number; y: number }

/** Standard setup in front of the right goal: 6:0 defense on the 6 m line, attack around 9 m. */
const RIGHT_GOAL: Spot[] = [
  // 6:0 defense, about 6.5 m from the posts
  { team: 'defense', x: 36.4, y: 3.0 },
  { team: 'defense', x: 33.9, y: 6.2 },
  { team: 'defense', x: 33.2, y: 8.3 },
  { team: 'defense', x: 33.2, y: 11.7 },
  { team: 'defense', x: 33.9, y: 13.8 },
  { team: 'defense', x: 36.4, y: 17.0 },
  // Left wing, left back, centre back, right back, right wing, pivot
  { team: 'attack', x: 38.6, y: 1.2 },
  { team: 'attack', x: 29.0, y: 4.6 },
  { team: 'attack', x: 27.2, y: 10.0 },
  { team: 'attack', x: 29.0, y: 15.4 },
  { team: 'attack', x: 38.6, y: 18.8 },
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
