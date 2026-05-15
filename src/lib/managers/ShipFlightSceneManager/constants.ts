import { Color, Matrix4, Quaternion, Vector3 } from 'three'

export const MAX_ENGINE_EXHAUSTS = 4

export const FLIGHT_SCENE_CAMERA = {
  fov: 52,
  near: 0.1,
  far: 520,
  position: {
    x: 0,
    y: 5.1,
    z: 10.2,
  },
  lookAt: {
    x: 0,
    y: 0.2,
    z: -6,
  },
} as const

export const MOBILE_FLIGHT_SCENE_CAMERA = {
  fov: 52,
  near: 0.1,
  far: 520,
  position: {
    x: 0,
    y: 5.1,
    z: 10.2,
  },
  lookAt: {
    x: 0,
    y: 0.2,
    z: -6,
  },
} as const

export const FLIGHT_SCENE_RENDERER = {
  maxPixelRatio: 1.5,
  clearColor: '#03070f',
  fogDensity: 0.004,
  enableShadows: false,
  toneMappingExposure: 1.0,
} as const

export const FLIGHT_SCENE_STRAFE = {
  speed: 0.4,
  range: Math.PI * 0.1,
  edgeMargin: 0.88,
  smoothing: 8.2,
} as const

export const FLIGHT_SCENE_BANK = {
  rollFactor: 0.85,
  yawFactor: 0.22,
  pitchFactor: 0.2,
} as const

export const FLIGHT_SCENE_SPACE = {
  travelSpeed: 22.0,
  yawDrift: 0.45,
  zDespawnBehind: 18,
  zSpawnAheadMin: 120,
  zSpawnAheadMax: 360,
  xySpread: 220,
} as const

export const FLIGHT_SCENE_STAR_LAYERS = [
  {
    count: 2200,
    size: 0.22,
    opacity: 0.95,
    speedMultiplier: 0.35,
    color: '#dbeafe',
    spread: 260,
    minRadius: 32,
    verticalSquash: 0.72,
  },
  {
    count: 1500,
    size: 0.18,
    opacity: 0.68,
    speedMultiplier: 0.18,
    color: '#93c5fd',
    spread: 340,
    minRadius: 48,
    verticalSquash: 0.72,
  },
] as const

export const FLIGHT_SCENE_THRUSTERS = {
  particlesPerEngine: 80,
  lifetimeMin: 0.35,
  lifetimeMax: 0.7,
  exhaustSpeed: 18.0,
  jitter: 1.2,
  spawnSpread: 0.08,
  size: 0.55,
  coreColor: '#dbeafe',
  midColor: '#60a5fa',
  tailColor: '#1e3a8a',
} as const

export const FLIGHT_SCENE_PROJECTILES = {
  cooldown: 0.1,
  speed: 80,
  lifetime: 1.2,
  size: 0.35,
  color: '#7dd3fc',
  poolSize: 128,
} as const

export const FLIGHT_SCENE_MUZZLE_FLASH = {
  poolSize: 24,
  size: 0.75,
  lifetimeMin: 0.1,
  lifetimeMax: 0.18,
  coreColor: '#ffffff',
  edgeColor: '#7dd3fc',
} as const

export const FLIGHT_SCENE_POST_PROCESSING = {
  bloom: {
    enabled: true,
    intensity: 0.14,
    radius: 0.5,
    threshold: 0.78,
  },
  fxaa: {
    enabled: true,
  },
  noise: {
    enabled: true,
    opacity: 0.08,
    premultiply: false,
  },
} as const

export const FLIGHT_SCENE_PLANET_POOL_SIZE = 5

export const FLIGHT_SCENE_PLANET_TEMPLATES = [
  {
    color: '#0ea5e9',
    emissive: '#0369a1',
    radiusRange: [2.0, 3.2] as [number, number],
    speedMultiplier: 0.34,
  },
  {
    color: '#f97316',
    emissive: '#9a3412',
    radiusRange: [2.6, 3.8] as [number, number],
    speedMultiplier: 0.26,
  },
  {
    color: '#a78bfa',
    emissive: '#5b21b6',
    radiusRange: [1.6, 2.6] as [number, number],
    speedMultiplier: 0.2,
  },
  {
    color: '#34d399',
    emissive: '#065f46',
    radiusRange: [1.8, 2.8] as [number, number],
    speedMultiplier: 0.3,
  },
  {
    color: '#f472b6',
    emissive: '#9d174d',
    radiusRange: [2.2, 3.4] as [number, number],
    speedMultiplier: 0.22,
  },
] as const

export const THRUSTER_CORE_COLOR = new Color(FLIGHT_SCENE_THRUSTERS.coreColor)
export const THRUSTER_MID_COLOR = new Color(FLIGHT_SCENE_THRUSTERS.midColor)
export const THRUSTER_TAIL_COLOR = new Color(FLIGHT_SCENE_THRUSTERS.tailColor)

export const PROJECTILE_LOCAL_FORWARD = new Vector3(0, 0, -1)
export const PROJECTILE_TMP_MATRIX = new Matrix4()
export const PROJECTILE_TMP_POS = new Vector3()
export const PROJECTILE_TMP_SCALE = new Vector3(1, 1, 1)
export const PROJECTILE_TMP_QUAT = new Quaternion()
