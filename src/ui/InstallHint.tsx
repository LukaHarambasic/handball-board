import { useState } from 'react'
import { isIos, isStandalone } from '../platform/standalone'
import { strings } from '../strings'

const KEY = 'handball-install-hint-dismissed'

function shouldShow() {
  if (!isIos() || isStandalone()) return false
  try {
    return localStorage.getItem(KEY) !== '1'
  } catch {
    return false
  }
}

/** One-time hint in plain Safari: Add to Home Screen gives full screen and offline use every time. */
export function InstallHint() {
  const [show, setShow] = useState(shouldShow)
  if (!show) return null
  const dismiss = () => {
    try {
      localStorage.setItem(KEY, '1')
    } catch {
      /* non-critical */
    }
    setShow(false)
  }
  return (
    <aside className="install-hint" aria-labelledby="install-title">
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-0.5 shrink-0 text-defense">
        <path d="M12 3v12M8 7l4-4 4 4" />
        <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
      </svg>
      <div className="flex min-w-0 flex-col gap-1">
        <h2 id="install-title" className="text-[17px] font-semibold leading-tight">
          {strings.installTitle}
        </h2>
        <p className="text-[15px] font-medium leading-snug text-ink-muted">{strings.installBody}</p>
      </div>
      <button type="button" onClick={dismiss} className="h-11 shrink-0 self-center rounded-xl bg-chip px-4 text-[16px] font-semibold text-ink hover:bg-chip-hover">
        {strings.installDismiss}
      </button>
    </aside>
  )
}
