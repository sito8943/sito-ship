import type { ShipSlot, ShipSlotConfigMap, Vector3Tuple } from '@/lib/models/ShipConfig'
import { HEX_COLOR_PATTERN } from '@/lib/managers/ShipConfigIOManager/constants'

export const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export const isHexColor = (value: unknown): value is string => {
  return typeof value === 'string' && HEX_COLOR_PATTERN.test(value)
}

export const parseVector3Tuple = (value: unknown, fallback: Vector3Tuple): Vector3Tuple => {
  if (!isValidVector3Tuple(value)) {
    return fallback
  }

  return [value[0], value[1], value[2]]
}

const isUnknownTuple3 = (value: unknown): value is [unknown, unknown, unknown] => {
  return Array.isArray(value) && value.length === 3
}

export const isValidVector3Tuple = (value: unknown): value is Vector3Tuple => {
  if (!isUnknownTuple3(value)) {
    return false
  }

  const [x, y, z] = value
  if (
    typeof x !== 'number' ||
    !Number.isFinite(x) ||
    typeof y !== 'number' ||
    !Number.isFinite(y) ||
    typeof z !== 'number' ||
    !Number.isFinite(z)
  ) {
    return false
  }

  return true
}

export const isAllowedVariant = <TSlot extends ShipSlot>(
  value: unknown,
  allowedVariants: readonly ShipSlotConfigMap[TSlot]['variant'][]
): value is ShipSlotConfigMap[TSlot]['variant'] => {
  if (typeof value !== 'string') {
    return false
  }

  return allowedVariants.some((variant) => variant === value)
}

const cloneVector3Tuple = (value: Vector3Tuple): Vector3Tuple => {
  return [value[0], value[1], value[2]]
}

export const cloneSlotState = <TSlot extends ShipSlot>(
  config: ShipSlotConfigMap,
  slot: TSlot
): ShipSlotConfigMap[TSlot] => {
  const clonedConfig = {
    body: {
      ...config.body,
      scale: cloneVector3Tuple(config.body.scale),
      offset: cloneVector3Tuple(config.body.offset),
      rotation: cloneVector3Tuple(config.body.rotation),
      pivotLocal: cloneVector3Tuple(config.body.pivotLocal),
    },
    cockpit: {
      ...config.cockpit,
      scale: cloneVector3Tuple(config.cockpit.scale),
      offset: cloneVector3Tuple(config.cockpit.offset),
      rotation: cloneVector3Tuple(config.cockpit.rotation),
      pivotLocal: cloneVector3Tuple(config.cockpit.pivotLocal),
    },
    wings: {
      ...config.wings,
      scale: cloneVector3Tuple(config.wings.scale),
      offset: cloneVector3Tuple(config.wings.offset),
      rotation: cloneVector3Tuple(config.wings.rotation),
      pivotLocal: cloneVector3Tuple(config.wings.pivotLocal),
      aimRotation: cloneVector3Tuple(config.wings.aimRotation),
    },
    engines: {
      ...config.engines,
      scale: cloneVector3Tuple(config.engines.scale),
      offset: cloneVector3Tuple(config.engines.offset),
      rotation: cloneVector3Tuple(config.engines.rotation),
      pivotLocal: cloneVector3Tuple(config.engines.pivotLocal),
      aimRotation: cloneVector3Tuple(config.engines.aimRotation),
    },
    weapons: {
      ...config.weapons,
      scale: cloneVector3Tuple(config.weapons.scale),
      offset: cloneVector3Tuple(config.weapons.offset),
      rotation: cloneVector3Tuple(config.weapons.rotation),
      pivotLocal: cloneVector3Tuple(config.weapons.pivotLocal),
      aimRotation: cloneVector3Tuple(config.weapons.aimRotation),
    },
  } satisfies ShipSlotConfigMap

  return clonedConfig[slot]
}
