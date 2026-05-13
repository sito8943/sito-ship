import type { ShipSlot, Vector3Tuple } from '@/lib/models/ShipConfig'

export type SceneSize = {
  width: number
  height: number
}

export type TransformMode = 'translate' | 'rotate' | 'scale' | 'pairSpread' | 'aimRotate'
export type ExperienceMode = 'builder' | 'flight'

export type SceneSlotTransformPatch = {
  offset?: Vector3Tuple
  rotation?: Vector3Tuple
  scale?: Vector3Tuple
  aimRotation?: Vector3Tuple
  pairSpread?: number
}

export type SceneSlotSelectionHandler = (slot: ShipSlot | null) => void

export type SceneSlotTransformHandler = (
  slot: ShipSlot,
  patch: SceneSlotTransformPatch,
  options: {
    commitHistory: boolean
  }
) => void

export type SceneValidationHandler = (slots: ShipSlot[]) => void

export type SceneBodyContactHandler = (slots: ShipSlot[]) => void
