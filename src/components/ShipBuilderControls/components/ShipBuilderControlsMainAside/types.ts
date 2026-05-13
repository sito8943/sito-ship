import type { ShipSlot } from '@/lib/models/ShipConfig'

export type SymmetricSlot = Extract<ShipSlot, 'wings' | 'engines' | 'weapons'>

export type ShipBuilderControlsMainAsideProps = {
  isHidden: boolean
  panelVisibilityClassName: string
}
