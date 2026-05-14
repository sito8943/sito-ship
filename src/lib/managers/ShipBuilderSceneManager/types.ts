import type { ShipSlot, Vector3Tuple } from '@/lib/models/ShipConfig'

export type DebugHelpersVisibility = {
  axes: boolean
  light: boolean
  shadow: boolean
}

export type SymmetricSlot = Extract<ShipSlot, 'wings' | 'engines' | 'weapons'>

export type TransformControlMode = 'translate' | 'rotate' | 'scale'

export type OrbitConstraintSet = {
  minDistance: number
  maxDistance: number
  minPolarAngle: number
  maxPolarAngle: number
}

export type FlightInputState = {
  throttleForward: boolean
  throttleReverse: boolean
  yawLeft: boolean
  yawRight: boolean
  pitchUp: boolean
  pitchDown: boolean
  rollLeft: boolean
  rollRight: boolean
  boost: boolean
}

export type DisposableResource = {
  dispose: () => void
}

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
