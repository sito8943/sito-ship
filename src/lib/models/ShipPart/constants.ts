import type { Vector3Tuple } from '@/lib/models/ShipConfig'
import type { QuaternionTuple, ShipPartMirrorRole } from '@/lib/models/ShipPart/types'

export const SHIP_PART_MIRROR_ROLES: readonly ShipPartMirrorRole[] = [
  'original',
  'mirrored',
  'none',
]

export const SHIP_PART_DEFAULT_LOCAL_POSITION: Vector3Tuple = [0, 0, 0]
export const SHIP_PART_DEFAULT_LOCAL_ROTATION: QuaternionTuple = [0, 0, 0, 1]
export const SHIP_PART_DEFAULT_LOCAL_SCALE: Vector3Tuple = [1, 1, 1]
export const SHIP_PART_DEFAULT_PIVOT_LOCAL: Vector3Tuple = [0, 0, 0]
