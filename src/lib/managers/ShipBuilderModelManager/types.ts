import type { ShipSlot, ShipSlotConfigMap } from '@/lib/models'
import type { Group } from 'three'

export type ShipSlotKey = ShipSlot

export type ShipSlotGroupMap = Record<ShipSlotKey, Group>

export type ShipSlotSignatureMap = Record<ShipSlotKey, string>

export type SlotBuilderMap = {
  [TSlot in ShipSlotKey]: (slotConfig: ShipSlotConfigMap[TSlot]) => Group
}
