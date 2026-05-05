import type { ShipPart, ShipSlot, ShipSlotConfigMap } from '@/lib/models'
import type { Group } from 'three'

export type ShipSlotKey = ShipSlot

export type ShipSlotGroupMap = Record<ShipSlotKey, Group>

export type ShipSlotSignatureMap = Record<ShipSlotKey, string>

export type ShipSymmetricSlotKey = Extract<ShipSlotKey, 'wings' | 'engines' | 'weapons'>

export type ShipPartPair<TSlot extends ShipSymmetricSlotKey = ShipSymmetricSlotKey> = {
  symmetryGroupId: string
  masterPart: ShipPart<TSlot>
  mirroredPart: ShipPart<TSlot>
}

export type ShipPartPairMap = Partial<{
  [TSlot in ShipSymmetricSlotKey]: ShipPartPair<TSlot>
}>

export type SlotBuilderMap = {
  [TSlot in ShipSlotKey]: (slotConfig: ShipSlotConfigMap[TSlot]) => Group
}
