export { SHIP_SLOT_KEYS } from '@/lib/models/ShipConfig'
import type { Vector3Tuple } from '@/lib/models/ShipConfig'

export const BODY_BASE_DEPTH = 6

// Symmetry conventions are defined in shipGroup local space.
export const SHIP_LOCAL_SYMMETRY_PLANE_NORMAL: Vector3Tuple = [-1, 0, 0]
export const SHIP_LOCAL_SYMMETRY_PLANE_OFFSET = 0
export const SHIP_LOCAL_SYMMETRY_PLANE_AXIS = 'x' as const
export const SHIP_RUNTIME_ROTATION_CANONICAL_MODE = 'quaternion' as const

export const SLOT_ANCHORS = {
  cockpit: { x: 0, y: 0.58, z: 1.08 },
  wing: { x: -2.05, y: 0, z: 0.45 },
  engine: { x: -1.35, y: -0.28, z: -2.35 },
  weapon: { x: -1.15, y: -0.05, z: 1.95 },
} as const
