import type {
  BodyVariant,
  CockpitVariant,
  EnginesVariant,
  ShipConfig,
  ShipSlot,
  WeaponsVariant,
  WingsVariant,
} from '@/lib/models/ShipConfig/types'

export const SHIP_CONFIG_VERSION = 2

type TransformRange = {
  min: number
  max: number
  step: number
}

type OffsetRangeMap = {
  x: TransformRange
  y: TransformRange
  z: TransformRange
}

export const SHIP_SLOT_KEYS: readonly ShipSlot[] = [
  'body',
  'cockpit',
  'wings',
  'engines',
  'weapons',
]

export const SHIP_VARIANT_OPTIONS: {
  body: readonly BodyVariant[]
  cockpit: readonly CockpitVariant[]
  wings: readonly WingsVariant[]
  engines: readonly EnginesVariant[]
  weapons: readonly WeaponsVariant[]
} = {
  body: ['box', 'longBox', 'tapered'],
  cockpit: ['sphere', 'oval', 'bubble'],
  wings: ['rect', 'triangular', 'double'],
  engines: ['cylinder', 'cone', 'cylinderDual'],
  weapons: ['none', 'singleCannon', 'dualCannon'],
}

export const SHIP_SLOT_SCALE_RANGES: Record<ShipSlot, TransformRange> = {
  body: { min: 0.85, max: 2.0, step: 0.05 },
  cockpit: { min: 0.75, max: 2.45, step: 0.05 },
  wings: { min: 0.75, max: 2.0, step: 0.05 },
  engines: { min: 0.8, max: 1.35, step: 0.05 },
  weapons: { min: 0.75, max: 1.4, step: 0.05 },
}

export const SHIP_SLOT_OFFSET_RANGES: Record<ShipSlot, OffsetRangeMap> = {
  body: {
    x: { min: -0.4, max: 0.4, step: 0.05 },
    y: { min: -0.35, max: 0.35, step: 0.05 },
    z: { min: -0.6, max: 0.6, step: 0.05 },
  },
  cockpit: {
    x: { min: -0.45, max: 0.45, step: 0.05 },
    y: { min: -1.15, max: 0.95, step: 0.05 },
    z: { min: -0.45, max: 0.95, step: 0.05 },
  },
  wings: {
    x: { min: -0.35, max: 0.35, step: 0.05 },
    y: { min: -0.65, max: 0.65, step: 0.05 },
    z: { min: -1.15, max: 1.15, step: 0.05 },
  },
  engines: {
    x: { min: -0.55, max: 0.55, step: 0.05 },
    y: { min: -0.55, max: 0.55, step: 0.05 },
    z: { min: -1.25, max: 1.75, step: 0.05 },
  },
  weapons: {
    x: { min: -0.45, max: 0.45, step: 0.05 },
    y: { min: -0.45, max: 0.45, step: 0.05 },
    z: { min: -0.45, max: 1.25, step: 0.05 },
  },
}

export const SHIP_SLOT_ROTATION_RANGES: Record<ShipSlot, OffsetRangeMap> = {
  body: {
    x: { min: -2.45, max: 2.45, step: 0.02 },
    y: { min: -2.75, max: 2.75, step: 0.02 },
    z: { min: -2.4, max: 2.4, step: 0.02 },
  },
  cockpit: {
    x: { min: -2.45, max: 2.45, step: 0.02 },
    y: { min: -2.65, max: 2.65, step: 0.02 },
    z: { min: -2.4, max: 2.4, step: 0.02 },
  },
  wings: {
    x: { min: -2.35, max: 2.35, step: 0.02 },
    y: { min: -2.55, max: 2.55, step: 0.02 },
    z: { min: -2.35, max: 2.35, step: 0.02 },
  },
  engines: {
    x: { min: -2.45, max: 2.45, step: 0.02 },
    y: { min: -2.45, max: 2.45, step: 0.02 },
    z: { min: -2.35, max: 2.35, step: 0.02 },
  },
  weapons: {
    x: { min: -2.35, max: 2.35, step: 0.02 },
    y: { min: -2.35, max: 2.35, step: 0.02 },
    z: { min: -2.35, max: 2.35, step: 0.02 },
  },
}

export const SHIP_ENGINE_AIM_ROTATION_RANGES: OffsetRangeMap = {
  x: { min: -2.85, max: 2.85, step: 0.02 },
  y: { min: -2.85, max: 2.85, step: 0.02 },
  z: { min: -2.65, max: 2.65, step: 0.02 },
}

export const SHIP_ENGINE_PAIR_SPREAD_RANGE: TransformRange = {
  min: -2.2,
  max: 1.4,
  step: 0.02,
}

export const SHIP_SLOT_PIVOT_LOCAL_RANGES: Record<ShipSlot, OffsetRangeMap> = {
  body: {
    x: { min: 0, max: 0, step: 0.02 },
    y: { min: 0, max: 0, step: 0.02 },
    z: { min: 0, max: 0, step: 0.02 },
  },
  cockpit: {
    x: { min: 0, max: 0, step: 0.02 },
    y: { min: 0, max: 0, step: 0.02 },
    z: { min: 0, max: 0, step: 0.02 },
  },
  wings: {
    x: { min: -2, max: 2, step: 0.02 },
    y: { min: -2, max: 2, step: 0.02 },
    z: { min: -2, max: 2, step: 0.02 },
  },
  engines: {
    x: { min: -2, max: 2, step: 0.02 },
    y: { min: -2, max: 2, step: 0.02 },
    z: { min: -2, max: 2, step: 0.02 },
  },
  weapons: {
    x: { min: -2, max: 2, step: 0.02 },
    y: { min: -2, max: 2, step: 0.02 },
    z: { min: -2, max: 2, step: 0.02 },
  },
}

export const DEFAULT_SHIP_CONFIG: ShipConfig = {
  version: SHIP_CONFIG_VERSION,
  body: {
    variant: 'longBox',
    color: '#334155',
    scale: [1, 1, 1],
    offset: [0, 0, 0],
    rotation: [0, 0, 0],
    pivotLocal: [0, 0, 0],
  },
  cockpit: {
    variant: 'oval',
    color: '#93c5fd',
    scale: [1, 1, 1],
    offset: [0, 0.28, 0.42],
    rotation: [0, 0, 0],
    pivotLocal: [0, 0, 0],
  },
  wings: {
    variant: 'double',
    color: '#64748b',
    scale: [1, 1, 1],
    offset: [0, 0, 0],
    rotation: [0, 0, 0],
    pivotLocal: [0, 0, 0],
  },
  engines: {
    variant: 'cylinderDual',
    color: '#1f2937',
    scale: [1, 1, 1],
    offset: [0, -0.04, 1],
    rotation: [0, 0, 0],
    pivotLocal: [0, 0, 0],
    aimRotation: [0, 0, 0],
    pairSpread: 0,
  },
  weapons: {
    variant: 'singleCannon',
    color: '#94a3b8',
    scale: [1, 1, 1],
    offset: [0, 0, 0.12],
    rotation: [0, 0, 0],
    pivotLocal: [0, 0, 0],
  },
}
