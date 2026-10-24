// Inline stroke icons; all decorative (buttons carry the text).
const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
}

export const FullCourtIcon = () => (
  <svg viewBox="0 0 28 18" width="28" height="18" {...base} strokeWidth="1.6">
    <rect x="1" y="1" width="26" height="16" rx="1.5" />
    <path d="M14 1v16" />
    <path d="M1 5.5a3.5 3.5 0 0 1 0 7M27 5.5a3.5 3.5 0 0 0 0 7" />
  </svg>
)

export const HalfCourtIcon = () => (
  <svg viewBox="0 0 28 18" width="28" height="18" {...base} strokeWidth="1.6">
    <rect x="6" y="1" width="16" height="16" rx="1.5" />
    <path d="M22 5.5a3.5 3.5 0 0 0 0 7" />
  </svg>
)

export const ChevronIcon = ({ up }: { up: boolean }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" {...base} strokeWidth="2">
    <path d={up ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'} />
  </svg>
)

export const CheckIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" {...base} stroke="#1E5BD8" strokeWidth="2.4">
    <path d="M5 12l5 5 9-10" />
  </svg>
)

export const DefenderIcon = () => (
  <span aria-hidden="true" className="block size-7 shrink-0 rounded-md border-2 border-white bg-defense shadow-[0_1px_3px_rgba(15,23,42,0.3)]" />
)

export const AttackerIcon = () => (
  <svg viewBox="0 0 46 46" width="30" height="30" aria-hidden="true" focusable="false" className="shrink-0 overflow-visible">
    <polygon points="23,3 44,42 2,42" fill="#D62839" stroke="#FFFFFF" strokeWidth="4" strokeLinejoin="round" />
  </svg>
)

export const SixVsSixIcon = () => (
  <svg viewBox="0 0 30 30" width="30" height="30" aria-hidden="true" focusable="false" className="shrink-0">
    <rect x="2" y="3" width="7" height="7" rx="1.5" fill="#1E5BD8" />
    <rect x="11.5" y="3" width="7" height="7" rx="1.5" fill="#1E5BD8" />
    <rect x="21" y="3" width="7" height="7" rx="1.5" fill="#1E5BD8" />
    <polygon points="5.5,18 9.5,26 1.5,26" fill="#D62839" />
    <polygon points="15,18 19,26 11,26" fill="#D62839" />
    <polygon points="24.5,18 28.5,26 20.5,26" fill="#D62839" />
  </svg>
)

export const EraseIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" {...base} strokeWidth="2">
    <path d="M7 21h10" />
    <path d="M5.5 13.5l7-7a2 2 0 0 1 2.8 0l3.2 3.2a2 2 0 0 1 0 2.8L12 19H8l-2.5-2.5a2 2 0 0 1 0-2.8z" />
    <path d="M9 10l5 5" />
  </svg>
)

export const EnterFullscreenIcon = () => (
  <svg viewBox="0 0 24 24" width="26" height="26" {...base} strokeWidth="2">
    <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />
  </svg>
)

export const ExitFullscreenIcon = () => (
  <svg viewBox="0 0 24 24" width="26" height="26" {...base} strokeWidth="2">
    <path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3" />
  </svg>
)

export const CanvasesIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" {...base} strokeWidth="2">
    <path d="M12 3l9 5-9 5-9-5 9-5z" />
    <path d="M3 13l9 5 9-5" />
  </svg>
)

export const PlusIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" {...base} strokeWidth="2.2">
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const RenameIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" {...base} strokeWidth="2">
    <path d="M4 20h4L19 9l-4-4L4 16v4z" />
    <path d="M13.5 6.5l4 4" />
  </svg>
)

export const DuplicateIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" {...base} strokeWidth="2">
    <rect x="8" y="8" width="12" height="12" rx="2" />
    <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
  </svg>
)

export const TrashIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" {...base} strokeWidth="2">
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" />
  </svg>
)

export const CloseIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" {...base} strokeWidth="2.2">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)

export const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" {...base} strokeWidth="2.2">
    <path d="M20 11a8 8 0 1 0-2.3 5.7" />
    <path d="M20 4v7h-7" />
  </svg>
)

export const PenIcon = ({ color }: { color: string }) => (
  <svg viewBox="0 0 24 24" width="26" height="26" {...base} strokeWidth="2">
    <path d="M4 20l1-4L16 5l3 3L8 19l-4 1z" />
    <path d="M14 7l3 3" />
    <circle cx="19" cy="19" r="3.2" fill={color} stroke="#fff" strokeWidth="1.4" />
  </svg>
)

export const ClearIcon = () => (
  <svg viewBox="0 0 24 24" width="26" height="26" {...base} strokeWidth="2">
    <rect x="3.5" y="5" width="17" height="14" rx="2" />
    <path d="M9 9.5l6 5M15 9.5l-6 5" />
  </svg>
)

export const UndoIcon = () => (
  <svg viewBox="0 0 24 24" width="26" height="26" {...base} strokeWidth="2.2">
    <path d="M9 14L4 9l5-5" />
    <path d="M4 9h10a6 6 0 0 1 0 12h-3" />
  </svg>
)

export const RedoIcon = () => (
  <svg viewBox="0 0 24 24" width="26" height="26" {...base} strokeWidth="2.2">
    <path d="M15 14l5-5-5-5" />
    <path d="M20 9H10a6 6 0 0 0 0 12h3" />
  </svg>
)

export const MinusIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" {...base} strokeWidth="2.4">
    <path d="M5 12h14" />
  </svg>
)
