import type { Team } from '../state/types'

export const DEFENSE = '#1E5BD8'
export const ATTACK = '#D62839'

/** A player token centred on (0, 0), `size` metres across. */
export function TokenShape({ team, size }: { team: Team; size: number }) {
  const h = size / 2
  const border = size * 0.065
  if (team === 'defense') {
    return (
      <rect
        x={-h}
        y={-h}
        width={size}
        height={size}
        rx={size * 0.17}
        fill={DEFENSE}
        stroke="#FFFFFF"
        strokeWidth={border}
      />
    )
  }
  // Equilateral-ish triangle from the design (46 px box), centred on its bounding box.
  const k = size / 46
  const pts = [
    [0, -20],
    [21, 19],
    [-21, 19],
  ]
    .map(([x, y]) => `${(x as number) * k},${(y as number) * k}`)
    .join(' ')
  return <polygon points={pts} fill={ATTACK} stroke="#FFFFFF" strokeWidth={border} strokeLinejoin="round" />
}
