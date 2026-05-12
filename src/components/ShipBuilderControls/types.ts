import type { TransformMode } from '@/lib/managers/ShipBuilderSceneManager/types'

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
