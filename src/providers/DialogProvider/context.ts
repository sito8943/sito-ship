import { createContext } from 'react'
import type { DialogContextValue } from '@/providers/DialogProvider/types'

export const DialogContext = createContext<DialogContextValue | null>(null)

