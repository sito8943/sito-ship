import { createContext } from 'react'
import type { ShipBuilderContextValue } from '@/providers/ShipBuilderProvider/types'

export const ShipBuilderContext = createContext<ShipBuilderContextValue | null>(null)
