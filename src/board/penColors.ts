import { strings } from '../strings'

/** Line colours. All pass 4.5:1 on the court surface; blue and red match the teams. */
export const PEN_COLORS = [
  { id: 'black', label: strings.colorBlack, value: '#1B2230' },
  { id: 'blue', label: strings.colorBlue, value: '#1E5BD8' },
  { id: 'red', label: strings.colorRed, value: '#C81E30' },
  { id: 'orange', label: strings.colorOrange, value: '#C2410C' },
  { id: 'green', label: strings.colorGreen, value: '#1F7A3A' },
] as const

export type PenColor = (typeof PEN_COLORS)[number]['id']
export const DEFAULT_PEN: PenColor = 'black'

export function penValue(id: string | undefined): string {
  return (PEN_COLORS.find((c) => c.id === id) ?? PEN_COLORS[0]).value
}
export function penLabel(id: string): string {
  return (PEN_COLORS.find((c) => c.id === id) ?? PEN_COLORS[0]).label
}
