import { useCallback, useMemo, useState } from 'react'
import { DialogContext } from '@/providers/DialogProvider/context'
import type {
  DialogContextValue,
  DialogId,
  DialogProviderProps,
  DialogState,
} from '@/providers/DialogProvider/types'
import { getDialogVisibility, setDialogVisibility } from '@/providers/DialogProvider/utils'

const DialogProvider = ({ children }: DialogProviderProps) => {
  const [dialogState, setDialogState] = useState<DialogState>({})

  const openDialog = useCallback((dialogId: DialogId) => {
    setDialogState((previousState) => setDialogVisibility(previousState, dialogId, true))
  }, [])

  const closeDialog = useCallback((dialogId: DialogId) => {
    setDialogState((previousState) => setDialogVisibility(previousState, dialogId, false))
  }, [])

  const toggleDialog = useCallback((dialogId: DialogId) => {
    setDialogState((previousState) => {
      const nextValue = !getDialogVisibility(previousState, dialogId)

      return setDialogVisibility(previousState, dialogId, nextValue)
    })
  }, [])

  const isDialogOpen = useCallback(
    (dialogId: DialogId) => getDialogVisibility(dialogState, dialogId),
    [dialogState]
  )

  const value = useMemo<DialogContextValue>(() => {
    return {
      openDialog,
      closeDialog,
      toggleDialog,
      isDialogOpen,
    }
  }, [closeDialog, isDialogOpen, openDialog, toggleDialog])

  return <DialogContext.Provider value={value}>{children}</DialogContext.Provider>
}

export default DialogProvider

