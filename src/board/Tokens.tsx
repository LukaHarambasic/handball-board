import { memo, type KeyboardEvent } from 'react'
import { clampToBox, placementBox } from '../state/courtView'
import { announce, useBoard } from '../state/store'
import type { Token } from '../state/types'
import { courtToView, viewToCourt, type Layout } from '../input/coords'
import { strings } from '../strings'
import { TokenShape } from './TokenShape'

export const TOKEN_HELP_ID = 'token-help'

type Props = { tokens: Token[]; hiddenId: string | null; layout: Layout }

export function tokenLabels(tokens: Token[]): Map<string, string> {
  const count = { defense: 0, attack: 0 }
  const labels = new Map<string, string>()
  for (const t of tokens) {
    count[t.team] += 1
    labels.set(t.id, strings.tokenLabel(t.team, count[t.team]))
  }
  return labels
}

function focusToken(id: string | undefined) {
  requestAnimationFrame(() => {
    const el = id ? document.querySelector<SVGGElement>(`[data-token-id="${id}"]`) : null
    ;(el ?? document.getElementById('tray-defense'))?.focus()
  })
}

/** Player tokens in view space; they never rotate with the court. Keyboard-operable. */
export const Tokens = memo(function Tokens({ tokens, hiddenId, layout }: Props) {
  const labels = tokenLabels(tokens)
  const { orientation: o, tokenSize } = layout

  const onKeyDown = (e: KeyboardEvent, t: Token) => {
    const step = e.shiftKey ? 2 : 0.5
    let du = 0
    let dv = 0
    if (e.key === 'ArrowLeft') du = -step
    else if (e.key === 'ArrowRight') du = step
    else if (e.key === 'ArrowUp') dv = -step
    else if (e.key === 'ArrowDown') dv = step
    else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      const i = tokens.findIndex((x) => x.id === t.id)
      const next = tokens[i + 1] ?? tokens[i - 1]
      useBoard.getState().deleteToken(t.id)
      announce(strings.announceDeleted(labels.get(t.id) ?? ''))
      focusToken(next?.id)
      return
    } else return
    e.preventDefault()
    const { view, halfSide, moveToken } = useBoard.getState()
    const [u, v] = courtToView(o, t.x, t.y)
    const [x, y] = viewToCourt(o, u + du, v + dv)
    const [cx, cy] = clampToBox(x, y, placementBox(view, halfSide, tokenSize / 2))
    moveToken(t.id, cx, cy)
  }

  return (
    <g>
      {tokens.map((t) => {
        if (t.id === hiddenId) return null
        const [u, v] = courtToView(o, t.x, t.y)
        return (
          <g
            key={t.id}
            className="token"
            data-token-id={t.id}
            transform={`translate(${u.toFixed(3)} ${v.toFixed(3)})`}
            tabIndex={0}
            role="button"
            aria-roledescription={strings.tokenRole}
            aria-label={labels.get(t.id)}
            aria-describedby={TOKEN_HELP_ID}
            onKeyDown={(e) => onKeyDown(e, t)}
          >
            <circle className="token-focus" r={tokenSize * 0.82} />
            <g filter="url(#token-shadow)">
              <TokenShape team={t.team} size={tokenSize} />
            </g>
          </g>
        )
      })}
    </g>
  )
})
