import { applyUpdate } from '../platform/serviceWorker'
import { useUi } from '../state/store'
import { strings } from '../strings'
import { RefreshIcon } from './icons'

/** Shown top right once a new version is waiting; one tap reloads into it. */
export function UpdateButton() {
  const ready = useUi((s) => s.updateReady)
  if (!ready) return null
  return (
    <button type="button" className="update-button" onClick={applyUpdate} aria-label={strings.updateReadyLabel}>
      <RefreshIcon />
      <span>{strings.updateReady}</span>
    </button>
  )
}
