import type { DialogContextValue } from '@/providers/DialogProvider/types'

export const assertDialogContext = (
  context: DialogContextValue | null,
  errorMessage: string
): DialogContextValue => {
  if (!context) {
    throw new Error(errorMessage)
  }

  return context
}
