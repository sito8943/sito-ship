import type { ShipSlot } from '@/lib/models/ShipConfig'

export const MAX_DEVICE_PIXEL_RATIO = 2

export const CAMERA_SETTINGS = {
  fov: 55,
  near: 0.1,
  far: 200,
  position: {
    x: 7.2,
    y: 4.6,
    z: 9.2,
  },
} as const

export const SCENE_COLORS = {
  background: '#040913',
  grid: '#16263f',
  gridCenter: '#44638f',
} as const

export const OVERLAP_VOLUME_RATIO_THRESHOLD = 0.45

export const OVERLAP_SLOT_PAIRS: readonly [ShipSlot, ShipSlot][] = [
  ['cockpit', 'engines'],
  ['cockpit', 'weapons'],
  ['wings', 'engines'],
  ['wings', 'weapons'],
  ['engines', 'weapons'],
]

export const BODY_CONTACT_SLOTS: readonly ShipSlot[] = ['cockpit', 'wings', 'engines', 'weapons']

export const BODY_CONTACT_TOLERANCE = 0.04
export const BODY_CONTACT_SNAP_STEP = 0.05
export const BODY_CONTACT_MAX_STEPS = 140
