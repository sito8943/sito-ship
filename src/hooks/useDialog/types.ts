import type { DialogId } from '@/providers/DialogProvider'

export type UseDialogResult = {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

export type UseDialog = (dialogId: DialogId) => UseDialogResult

