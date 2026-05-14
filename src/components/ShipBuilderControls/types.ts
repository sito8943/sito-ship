import type { TransformMode } from '@/lib/managers/ShipBuilderSceneManager/types'
import type { ShipSlot } from '@/lib/models/ShipConfig'

export type OffsetAxis = 'x' | 'y' | 'z'
export type OffsetAxisOption = {
  axis: OffsetAxis
  index: 0 | 1 | 2
}

export type TransformModeOption = {
  value: TransformMode
  label: string
  symmetricOnly?: boolean
}

export type SymmetricSlot = Extract<ShipSlot, 'wings' | 'engines' | 'weapons'>
