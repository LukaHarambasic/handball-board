export type Team = 'defense' | 'attack'
export type Side = 'left' | 'right'
export type View = 'full' | 'half'
export type Point = [number, number]

/** All positions are in court metres: x along the 40 m length, y across the 20 m width. */
export type Token = { id: string; team: Team; x: number; y: number }
export type Stroke = { id: string; points: Point[] }

export type BoardState = {
  view: View
  /** Half shown in half view. */
  halfSide: Side
  /** Set on every token or stroke commit. */
  lastChangedSide: Side
  tokens: Token[]
  strokes: Stroke[]
}
