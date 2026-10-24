/**
 * Toolbar icon button: square, 60 px on tablets, 44 px on phones, smaller only on the
 * narrowest screens where nothing else would fit. Every one carries an aria-label.
 */
export const BTN =
  'flex size-15 shrink-0 select-none items-center justify-center rounded-2xl ' +
  'transition-[background-color,transform] duration-100 active:scale-[0.96] ' +
  'disabled:cursor-default disabled:opacity-40 disabled:active:scale-100 ' +
  'max-sm:size-12 short:size-12 @max-[400px]:size-11 @max-[350px]:size-10 @max-[310px]:size-9'

export const CHIP = 'bg-chip text-ink hover:bg-chip-hover'
