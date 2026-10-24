import { useUi } from '../state/store'

/** Polite announcements of board changes for screen-reader users. */
export function LiveRegion() {
  const { text, n } = useUi((s) => s.announcement)
  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      <span key={n}>{text}</span>
    </div>
  )
}
