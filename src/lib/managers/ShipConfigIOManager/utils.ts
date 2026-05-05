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

export const isValidVector3Tuple = (value: unknown): value is Vector3Tuple => {
  if (!Array.isArray(value) || value.length !== 3) {
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

export const cloneSlotState = <TSlot extends ShipSlot>(
  config: ShipSlotConfigMap,
  slot: TSlot
): ShipSlotConfigMap[TSlot] => {
  const slotState = config[slot]
  const clonedBaseSlotState = {
    ...slotState,
    scale: [slotState.scale[0], slotState.scale[1], slotState.scale[2]],
    offset: [slotState.offset[0], slotState.offset[1], slotState.offset[2]],
    rotation: [slotState.rotation[0], slotState.rotation[1], slotState.rotation[2]],
    pivotLocal: [slotState.pivotLocal[0], slotState.pivotLocal[1], slotState.pivotLocal[2]],
  }

  if (slot === 'engines') {
    const engineSlotState = slotState as ShipSlotConfigMap['engines']
    return {
      ...clonedBaseSlotState,
      aimRotation: [
        engineSlotState.aimRotation[0],
        engineSlotState.aimRotation[1],
        engineSlotState.aimRotation[2],
      ],
    } as ShipSlotConfigMap[TSlot]
  }

  return clonedBaseSlotState as ShipSlotConfigMap[TSlot]
}
