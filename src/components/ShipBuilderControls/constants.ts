import {
  faArrowsToCircle,
  faArrowsSpin,
  faArrowsUpDownLeftRight,
  faMaximize,
  faUpRightAndDownLeftFromCenter,
} from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import {
  SHIP_SYMMETRIC_AIM_ROTATION_RANGES,
  SHIP_SYMMETRIC_PAIR_SPREAD_RANGES,
  SHIP_SLOT_OFFSET_RANGES,
  SHIP_SLOT_KEYS,
  SHIP_SLOT_ROTATION_RANGES,
  SHIP_SLOT_SCALE_RANGES,
  SHIP_VARIANT_OPTIONS,
  type ShipSlot,
} from '@/lib/models/ShipConfig'
import type { TransformMode } from '@/lib/managers/ShipBuilderSceneManager/types'
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
export const SYMMETRIC_AIM_ROTATION_RANGES = SHIP_SYMMETRIC_AIM_ROTATION_RANGES
export const SYMMETRIC_PAIR_SPREAD_RANGES = SHIP_SYMMETRIC_PAIR_SPREAD_RANGES

export const OFFSET_AXIS_OPTIONS: readonly OffsetAxisOption[] = [
  { axis: 'x', index: 0 },
  { axis: 'y', index: 1 },
  { axis: 'z', index: 2 },
]

export const TRANSFORM_MODE_OPTIONS: readonly TransformModeOption[] = [
  { value: 'translate', label: 'Move' },
  { value: 'rotate', label: 'Rotate' },
  { value: 'scale', label: 'Scale' },
  { value: 'pairSpread', label: 'Pair Spread', symmetricOnly: true },
  { value: 'aimRotate', label: 'Aim Rotate', symmetricOnly: true },
]

export const TRANSFORM_MODE_ICONS: Record<TransformMode, IconDefinition> = {
  translate: faArrowsUpDownLeftRight,
  rotate: faArrowsSpin,
  scale: faMaximize,
  pairSpread: faUpRightAndDownLeftFromCenter,
  aimRotate: faArrowsToCircle,
}
