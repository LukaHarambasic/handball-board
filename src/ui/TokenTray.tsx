import type { MouseEvent } from 'react'
import type { PointerRouter } from '../input/usePointerRouter'
import { announce, useBoard } from '../state/store'
import type { Team } from '../state/types'
import { strings } from '../strings'
import { tokenLabels } from '../board/Tokens'
import { BTN } from './button'
import { AttackerIcon, DefenderIcon } from './icons'

const TRAY_HINT_ID = 'tray-hint'

const TRAYS: { team: Team; label: string; name: string; Icon: () => React.JSX.Element; cls: string }[] = [
  {
    team: 'defense',
    label: strings.defense,
    name: strings.addDefender,
    Icon: DefenderIcon,
    cls: 'bg-defense-soft text-defense-ink hover:bg-defense-active',
  },
  {
    team: 'attack',
    label: strings.attack,
    name: strings.addAttacker,
    Icon: AttackerIcon,
    cls: 'bg-attack-soft text-attack-ink hover:bg-attack-active',
  },
]

/** Defense and Attack trays: drag a new token out, or tap / press Enter to place one. */
export function TokenTray({ router }: { router: PointerRouter }) {
  // Pointer taps are handled by the router; keyboard activation arrives as a click with detail 0.
  const onClick = (team: Team) => (e: MouseEvent) => {
    if (e.detail !== 0) return
    const t = useBoard.getState().placeTokenAuto(team)
    announce(strings.announcePlaced(tokenLabels(useBoard.getState().tokens).get(t.id) ?? ''))
  }
  return (
    <>
      {TRAYS.map(({ team, label, name, Icon, cls }) => (
        <button
          key={team}
          id={`tray-${team}`}
          type="button"
          aria-label={name}
          aria-describedby={TRAY_HINT_ID}
          className={`${BTN} tray touch-none pl-3.5 pr-5 max-sm:pr-2.5 ${cls}`}
          onPointerDown={(e) => router.startSpawn(team, e)}
          onClick={onClick(team)}
          onContextMenu={(e) => e.preventDefault()}
        >
          <Icon />
          <span className="max-sm:sr-only" aria-hidden="true">
            {label}
          </span>
        </button>
      ))}
      <span id={TRAY_HINT_ID} className="sr-only">
        {strings.trayHint}
      </span>
    </>
  )
}
