import type { ShipSlot } from '@/lib/models/ShipConfig'

export const MAX_DEVICE_PIXEL_RATIO = 1.5

export const POST_PROCESSING_SETTINGS = {
  bloom: {
    enabled: true,
    intensity: 0.04,
    radius: 0.22,
    threshold: 0.72,
  },
  fxaa: {
    enabled: true,
  },
  outline: {
    enabled: true,
    edgeStrength: 3.2,
    pulseSpeed: 2,
    visibleEdgeColor: 0x88c0ff,
    hiddenEdgeColor: 0x223a66,
    blur: false,
    xRay: true,
  },
} as const

export const BUILDER_RENDERER_SETTINGS = {
  toneMappingExposure: 1.0,
} as const

export const BUILDER_SHADOW_SETTINGS = {
  mapSize: 1024,
  bias: -0.0002,
  cameraNear: 1,
  cameraFar: 28,
  cameraBounds: 5.5,
} as const

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

export const DEFAULT_ORBIT_CONSTRAINTS = {
  minDistance: 5.5,
  maxDistance: 20,
  minPolarAngle: Math.PI * 0.2,
  maxPolarAngle: Math.PI * 0.48,
} as const

export const PANORAMIC_ORBIT_CONSTRAINTS = {
  minDistance: 8.5,
  maxDistance: 30,
  minPolarAngle: Math.PI * 0.42,
  maxPolarAngle: Math.PI * 0.58,
} as const

export const CINEMATIC_ROTATION_SPEED = 0.8
export const IDLE_CINEMATIC_DELAY_MS = 6000
export const CAMERA_FOCUS_PADDING = 1.35

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

export const FLIGHT_SETTINGS = {
  acceleration: 9.2,
  brakeAcceleration: 10.8,
  drag: 1.5,
  maxForwardSpeed: 19,
  maxReverseSpeed: 5,
  yawRate: 1.4,
  pitchRate: 1.2,
  rollRate: 1.8,
  cameraFollowDistance: 9,
  cameraFollowHeight: 2.2,
  cameraLookAhead: 6.5,
  cameraSmoothing: 5.8,
} as const
