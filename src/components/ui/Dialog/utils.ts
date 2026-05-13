import { DIALOG_CLOSE_ON_ESCAPE_KEY } from '@/components/ui/Dialog/constants'
import type { BackdropClickEvent } from '@/components/ui/Dialog/types'

export const joinClassNames = (...classes: Array<string | undefined | null | false>) => {
  return classes.filter(Boolean).join(' ')
}

export const isEscapeKeyboardEvent = (event: KeyboardEvent): boolean => {
  return event.key === DIALOG_CLOSE_ON_ESCAPE_KEY
}

export const isBackdropClick = (event: BackdropClickEvent): boolean => {
  return event.target === event.currentTarget
}

