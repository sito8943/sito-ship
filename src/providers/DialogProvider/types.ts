import type { PropsWithChildren } from 'react'
import { DIALOG_IDS } from '@/providers/DialogProvider/constants'

export type DialogProviderProps = PropsWithChildren

export type DialogId = (typeof DIALOG_IDS)[keyof typeof DIALOG_IDS]
export type DialogState = Partial<Record<DialogId, boolean>>

export type DialogContextValue = {
  openDialog: (dialogId: DialogId) => void
  closeDialog: (dialogId: DialogId) => void
  toggleDialog: (dialogId: DialogId) => void
  isDialogOpen: (dialogId: DialogId) => boolean
}
