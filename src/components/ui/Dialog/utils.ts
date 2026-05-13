import {
    DIALOG_BACKDROP_INVISIBLE_CLASS,
  DIALOG_BACKDROP_VISIBLE_CLASS,
  DIALOG_CLOSE_ON_ESCAPE_KEY,
  DIALOG_PANEL_INVISIBLE_CLASS,
  DIALOG_PANEL_VISIBLE_CLASS,
} from '@/components/ui/Dialog/constants'
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

export const getBackdropVisibilityClassName = (isVisible: boolean): string | null => {
  return isVisible ? DIALOG_BACKDROP_VISIBLE_CLASS : DIALOG_BACKDROP_INVISIBLE_CLASS
}

export const getDialogVisibilityClassName = (isVisible: boolean): string | null => {
  return isVisible ? DIALOG_PANEL_VISIBLE_CLASS : DIALOG_PANEL_INVISIBLE_CLASS
}
