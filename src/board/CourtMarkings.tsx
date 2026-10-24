import { memo } from 'react'
import type { Side } from '../state/types'
import {
  CENTRE_X,
  COURT_WIDTH,
  DASH,
  FREE_THROW_RADIUS,
  GOAL_AREA_RADIUS,
  GOAL_LINE_WIDTH,
  LINE_WIDTH,
  arcLinePath,
  courtRect,
  fourMetrePath,
  goalAreaFillPath,
  goalPostsPath,
  goalRect,
  sevenMetrePath,
  substitutionMarkPath,
} from './court'

const LINE = '#2B3440'
const SURFACE = '#FBFCFD'
const AREA_TINT = '#E7ECF2'
const GOAL_FILL = '#D3DAE3'

/** Static court markings in court metres. `side` draws only that half. */
export const Court = memo(function Court({ side }: { side?: Side }) {
  const ends: Side[] = side ? [side] : ['left', 'right']
  const rect = courtRect(side)
  return (
    <g aria-hidden="true">
      <rect {...rect} fill={SURFACE} />
      {ends.map((end) => (
        <path key={`fill-${end}`} d={goalAreaFillPath(end)} fill={AREA_TINT} />
      ))}
      {ends.map((end) => (
        <rect key={`goal-${end}`} {...goalRect(end)} fill={GOAL_FILL} stroke={LINE} strokeWidth={LINE_WIDTH} />
      ))}
      <g fill="none" stroke={LINE} strokeWidth={LINE_WIDTH} strokeLinecap="butt">
        <rect {...rect} />
        {!side && <path d={`M${CENTRE_X} 0 V${COURT_WIDTH}`} />}
        {ends.map((end) => (
          <g key={end}>
            <path d={arcLinePath(end, GOAL_AREA_RADIUS)} />
            <path d={arcLinePath(end, FREE_THROW_RADIUS)} strokeDasharray={`${DASH} ${DASH}`} />
            <path d={sevenMetrePath(end)} />
            <path d={fourMetrePath(end)} />
            <path d={substitutionMarkPath(end)} />
            <path d={goalPostsPath(end)} strokeWidth={GOAL_LINE_WIDTH} />
          </g>
        ))}
      </g>
    </g>
  )
})
