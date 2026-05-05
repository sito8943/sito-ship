import type { ShipSlot, ShipSlotConfigMap, Vector3Tuple } from '@/lib/models/ShipConfig'

export type QuaternionTuple = [number, number, number, number]

export type ShipPartId = string
export type ShipPartSymmetryGroupId = string

export type ShipPartMirrorRole = 'original' | 'mirrored' | 'none'

export type ShipPartVariantBySlot<TSlot extends ShipSlot> = ShipSlotConfigMap[TSlot]['variant']
export type ShipPartVariant = ShipPartVariantBySlot<ShipSlot>

export type ShipPartTransform = {
  localPosition: Vector3Tuple
  localRotation: QuaternionTuple
  localScale: Vector3Tuple
  pivotLocal: Vector3Tuple
}

export type ShipPart<TSlot extends ShipSlot = ShipSlot> = ShipPartTransform & {
  id: ShipPartId
  slot: TSlot
  variant: ShipPartVariantBySlot<TSlot>
  mirrorRole: ShipPartMirrorRole
  symmetryGroupId: ShipPartSymmetryGroupId | null
  mirrorOfPartId: ShipPartId | null
}
