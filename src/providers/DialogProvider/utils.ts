import type { DialogId, DialogState } from '@/providers/DialogProvider/types'

export const setDialogVisibility = (
  dialogState: DialogState,
  dialogId: DialogId,
  isOpen: boolean
): DialogState => {
  return {
    ...dialogState,
    [dialogId]: isOpen,
  }
}

export const getDialogVisibility = (dialogState: DialogState, dialogId: DialogId): boolean => {
  return dialogState[dialogId] === true
}
