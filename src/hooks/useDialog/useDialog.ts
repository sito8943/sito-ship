import { useContext } from 'react'
import { USE_DIALOG_PROVIDER_ERROR_MESSAGE } from '@/hooks/useDialog/constants'
import type { UseDialog } from '@/hooks/useDialog/types'
import { assertDialogContext } from '@/hooks/useDialog/utils'
import { DialogContext } from '@/providers/DialogProvider'

export const useDialog: UseDialog = (dialogId) => {
  const context = useContext(DialogContext)
  const dialogContext = assertDialogContext(context, USE_DIALOG_PROVIDER_ERROR_MESSAGE)

  return {
    isOpen: dialogContext.isDialogOpen(dialogId),
    open: () => {
      dialogContext.openDialog(dialogId)
    },
    close: () => {
      dialogContext.closeDialog(dialogId)
    },
    toggle: () => {
      dialogContext.toggleDialog(dialogId)
    },
  }
}
