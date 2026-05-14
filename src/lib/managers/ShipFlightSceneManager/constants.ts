export const FLIGHT_SCENE_CAMERA = {
  fov: 52,
  near: 0.1,
  far: 520,
  position: {
    x: 0,
    y: 3.1,
    z: 15.2,
  },
  lookAt: {
    x: 0,
    y: 0.2,
    z: -6,
  },
} as const

export const FLIGHT_SCENE_RENDERER = {
  maxPixelRatio: 2,
  clearColor: '#03070f',
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
  pitchFactor: 1.20,
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
    speedMultiplier: 1.2,
    color: '#dbeafe',
    spread: 260,
  },
  {
    count: 1500,
    size: 0.18,
    opacity: 0.68,
    speedMultiplier: 0.8,
    color: '#93c5fd',
    spread: 340,
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
  cooldown: 0.10,
  speed: 80,
  lifetime: 1.2,
  size: 0.35,
  color: '#7dd3fc',
  poolSize: 128,
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
