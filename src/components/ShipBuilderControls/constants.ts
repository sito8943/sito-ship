import {
  SHIP_ENGINE_AIM_ROTATION_RANGES,
  SHIP_ENGINE_PAIR_SPREAD_RANGE,
  SHIP_SLOT_OFFSET_RANGES,
  SHIP_SLOT_KEYS,
  SHIP_SLOT_ROTATION_RANGES,
  SHIP_SLOT_SCALE_RANGES,
  SHIP_SLOT_PIVOT_LOCAL_RANGES,
  SHIP_VARIANT_OPTIONS,
  type ShipSlot,
} from '@/lib/models/ShipConfig'
import type { OffsetAxisOption, TransformModeOption } from '@/components/ShipBuilderControls/types'

export const SLOT_ORDER: readonly ShipSlot[] = SHIP_SLOT_KEYS

export const SLOT_LABELS: Record<ShipSlot, string> = {
  body: 'Body',
  cockpit: 'Cockpit',
  wings: 'Wings',
  engines: 'Engines',
  weapons: 'Weapons',
}

export const SLOT_VARIANT_OPTIONS = SHIP_VARIANT_OPTIONS

export const SLOT_SCALE_RANGES = SHIP_SLOT_SCALE_RANGES
export const SLOT_OFFSET_RANGES = SHIP_SLOT_OFFSET_RANGES
export const SLOT_ROTATION_RANGES = SHIP_SLOT_ROTATION_RANGES
export const SLOT_PIVOT_LOCAL_RANGES = SHIP_SLOT_PIVOT_LOCAL_RANGES
export const ENGINE_AIM_ROTATION_RANGES = SHIP_ENGINE_AIM_ROTATION_RANGES
export const ENGINE_PAIR_SPREAD_RANGE = SHIP_ENGINE_PAIR_SPREAD_RANGE

export const OFFSET_AXIS_OPTIONS: readonly OffsetAxisOption[] = [
  { axis: 'x', index: 0 },
  { axis: 'y', index: 1 },
  { axis: 'z', index: 2 },
]

export const TRANSFORM_MODE_OPTIONS: readonly TransformModeOption[] = [
  { value: 'translate', label: 'Move' },
  { value: 'rotate', label: 'Rotate' },
  { value: 'scale', label: 'Scale' },
]
