import {
  DEFAULT_SHIP_CONFIG,
  SHIP_CONFIG_VERSION,
  SHIP_SYMMETRIC_AIM_ROTATION_RANGES,
  SHIP_SYMMETRIC_PAIR_SPREAD_RANGES,
  SHIP_SLOT_KEYS,
  SHIP_SLOT_PIVOT_LOCAL_RANGES,
  SHIP_SLOT_ROTATION_RANGES,
  SHIP_SLOT_SCALE_RANGES,
  SHIP_VARIANT_OPTIONS,
  createDefaultShipConfig,
  type ShipConfig,
  type ShipSlot,
  type ShipSlotConfigMap,
  type Vector3Tuple,
} from '@/lib/models/ShipConfig'
import {
  ERROR_EMPTY_INPUT,
  ERROR_INVALID_JSON,
  ERROR_INVALID_ROOT,
  ERROR_UNSUPPORTED_VERSION,
  JSON_INDENT_SPACES,
} from '@/lib/managers/ShipConfigIOManager/constants'
import type { ImportShipConfigResult } from '@/lib/managers/ShipConfigIOManager/types'
import {
  cloneSlotState,
  isAllowedVariant,
  isHexColor,
  isPlainObject,
  isValidVector3Tuple,
  parseVector3Tuple,
} from '@/lib/managers/ShipConfigIOManager/utils'

export class ShipConfigIOManager {
  exportToJson(config: ShipConfig): string {
    return JSON.stringify(config, null, JSON_INDENT_SPACES)
  }

  importFromJson(rawInput: string): ImportShipConfigResult {
    const trimmedInput = rawInput.trim()
    if (!trimmedInput) {
      return {
        ok: false,
        error: ERROR_EMPTY_INPUT,
      }
    }

    let parsedJson: unknown
    try {
      parsedJson = JSON.parse(trimmedInput)
    } catch {
      return {
        ok: false,
        error: ERROR_INVALID_JSON,
      }
    }

    if (!isPlainObject(parsedJson)) {
      return {
        ok: false,
        error: ERROR_INVALID_ROOT,
      }
    }

    if (parsedJson.version !== SHIP_CONFIG_VERSION) {
      return {
        ok: false,
        error: `${ERROR_UNSUPPORTED_VERSION} Expected version ${SHIP_CONFIG_VERSION}.`,
      }
    }

    const nextConfig = createDefaultShipConfig()
    const warnings: string[] = []

    SHIP_SLOT_KEYS.forEach((slot) => {
      this.mergeSlotConfig({
        slot,
        sourceRoot: parsedJson,
        targetConfig: nextConfig,
        warnings,
      })
    })

    return {
      ok: true,
      config: nextConfig,
      warnings,
    }
  }

  private mergeSlotConfig<TSlot extends ShipSlot>({
    slot,
    sourceRoot,
    targetConfig,
    warnings,
  }: {
    slot: TSlot
    sourceRoot: Record<string, unknown>
    targetConfig: ShipSlotConfigMap
    warnings: string[]
  }) {
    const sourceSlot = sourceRoot[slot]
    if (!isPlainObject(sourceSlot)) {
      warnings.push(`Slot "${slot}" is missing or invalid. Using defaults.`)
      targetConfig[slot] = cloneSlotState(DEFAULT_SHIP_CONFIG, slot)
      return
    }

    const defaultSlot = cloneSlotState(DEFAULT_SHIP_CONFIG, slot)
    const nextSlot = cloneSlotState(targetConfig, slot)

    const variantValue = sourceSlot.variant
    const allowedVariants = SHIP_VARIANT_OPTIONS[slot]
    if (isAllowedVariant(variantValue, allowedVariants)) {
      nextSlot.variant = variantValue as ShipSlotConfigMap[TSlot]['variant']
    } else {
      warnings.push(`Slot "${slot}" has an invalid variant. Using "${defaultSlot.variant}".`)
      nextSlot.variant = defaultSlot.variant
    }

    const colorValue = sourceSlot.color
    if (isHexColor(colorValue)) {
      nextSlot.color = colorValue
    } else {
      warnings.push(`Slot "${slot}" has an invalid color. Using default color.`)
      nextSlot.color = defaultSlot.color
    }

    if (!isValidVector3Tuple(sourceSlot.scale)) {
      warnings.push(`Slot "${slot}" has an invalid scale. Using default scale.`)
    }
    const parsedScale = parseVector3Tuple(sourceSlot.scale, defaultSlot.scale)
    const clampedScale = this.clampScaleTuple(slot, parsedScale)
    if (this.hasTupleChanged(parsedScale, clampedScale)) {
      const range = SHIP_SLOT_SCALE_RANGES[slot]
      warnings.push(
        `Slot "${slot}" scale exceeded allowed range (${range.min} to ${range.max}) and was clamped.`
      )
    }
    nextSlot.scale = clampedScale

    if (!isValidVector3Tuple(sourceSlot.offset)) {
      warnings.push(`Slot "${slot}" has an invalid offset. Using default offset.`)
    }
    const parsedOffset = parseVector3Tuple(sourceSlot.offset, defaultSlot.offset)
    nextSlot.offset = parsedOffset

    const rotationValue = sourceSlot.rotation
    if (rotationValue !== undefined && !isValidVector3Tuple(rotationValue)) {
      warnings.push(`Slot "${slot}" has an invalid rotation. Using default rotation.`)
    }
    const parsedRotation = parseVector3Tuple(rotationValue, defaultSlot.rotation)
    const clampedRotation = this.clampRotationTuple(slot, parsedRotation)
    if (this.hasTupleChanged(parsedRotation, clampedRotation)) {
      const changedAxes = this.getChangedAxes(parsedRotation, clampedRotation).join(', ')
      warnings.push(
        `Slot "${slot}" rotation exceeded allowed range on axis ${changedAxes} and was clamped.`
      )
    }
    nextSlot.rotation = clampedRotation

    const pivotLocalValue = sourceSlot.pivotLocal
    if (pivotLocalValue !== undefined && !isValidVector3Tuple(pivotLocalValue)) {
      warnings.push(`Slot "${slot}" has an invalid pivotLocal. Using default pivotLocal.`)
    }
    const parsedPivotLocal = parseVector3Tuple(pivotLocalValue, defaultSlot.pivotLocal)
    const clampedPivotLocal = this.clampPivotLocalTuple(slot, parsedPivotLocal)
    if (this.hasTupleChanged(parsedPivotLocal, clampedPivotLocal)) {
      const changedAxes = this.getChangedAxes(parsedPivotLocal, clampedPivotLocal).join(', ')
      warnings.push(
        `Slot "${slot}" pivotLocal exceeded allowed range on axis ${changedAxes} and was clamped.`
      )
    }
    nextSlot.pivotLocal = clampedPivotLocal

    if (this.isSymmetricSlot(slot)) {
      const defaultSymmetricSlot = defaultSlot as
        | ShipSlotConfigMap['wings']
        | ShipSlotConfigMap['engines']
        | ShipSlotConfigMap['weapons']
      const nextSymmetricSlot = nextSlot as
        | ShipSlotConfigMap['wings']
        | ShipSlotConfigMap['engines']
        | ShipSlotConfigMap['weapons']
      const aimRotationValue = sourceSlot.aimRotation
      if (aimRotationValue !== undefined && !isValidVector3Tuple(aimRotationValue)) {
        warnings.push(`Slot "${slot}" has an invalid aimRotation. Using default aimRotation.`)
      }
      const parsedAimRotation = parseVector3Tuple(aimRotationValue, defaultSymmetricSlot.aimRotation)
      const clampedAimRotation = this.clampSymmetricAimRotationTuple(slot, parsedAimRotation)
      if (this.hasTupleChanged(parsedAimRotation, clampedAimRotation)) {
        const changedAxes = this.getChangedAxes(parsedAimRotation, clampedAimRotation).join(', ')
        warnings.push(
          `Slot "${slot}" aimRotation exceeded allowed range on axis ${changedAxes} and was clamped.`
        )
      }
      nextSymmetricSlot.aimRotation = clampedAimRotation

      const pairSpreadValue = sourceSlot.pairSpread
      if (
        pairSpreadValue !== undefined &&
        (typeof pairSpreadValue !== 'number' || !Number.isFinite(pairSpreadValue))
      ) {
        warnings.push(`Slot "${slot}" has an invalid pairSpread. Using default pairSpread.`)
      }
      const parsedPairSpread =
        typeof pairSpreadValue === 'number' && Number.isFinite(pairSpreadValue)
          ? pairSpreadValue
          : defaultSymmetricSlot.pairSpread
      const pairSpreadRange = SHIP_SYMMETRIC_PAIR_SPREAD_RANGES[slot]
      const clampedPairSpread = this.clampNumber(
        parsedPairSpread,
        pairSpreadRange.min,
        pairSpreadRange.max
      )
      if (parsedPairSpread !== clampedPairSpread) {
        warnings.push(`Slot "${slot}" pairSpread exceeded allowed range and was clamped.`)
      }
      nextSymmetricSlot.pairSpread = clampedPairSpread
    }

    targetConfig[slot] = nextSlot
  }

  private clampScaleTuple(slot: ShipSlot, scale: Vector3Tuple): Vector3Tuple {
    const range = SHIP_SLOT_SCALE_RANGES[slot]
    return [
      this.clampNumber(scale[0], range.min, range.max),
      this.clampNumber(scale[1], range.min, range.max),
      this.clampNumber(scale[2], range.min, range.max),
    ]
  }

  private clampRotationTuple(slot: ShipSlot, rotation: Vector3Tuple): Vector3Tuple {
    const range = SHIP_SLOT_ROTATION_RANGES[slot]
    return [
      this.clampNumber(rotation[0], range.x.min, range.x.max),
      this.clampNumber(rotation[1], range.y.min, range.y.max),
      this.clampNumber(rotation[2], range.z.min, range.z.max),
    ]
  }

  private clampPivotLocalTuple(slot: ShipSlot, pivotLocal: Vector3Tuple): Vector3Tuple {
    const range = SHIP_SLOT_PIVOT_LOCAL_RANGES[slot]
    return [
      this.clampNumber(pivotLocal[0], range.x.min, range.x.max),
      this.clampNumber(pivotLocal[1], range.y.min, range.y.max),
      this.clampNumber(pivotLocal[2], range.z.min, range.z.max),
    ]
  }

  private clampSymmetricAimRotationTuple(
    slot: 'wings' | 'engines' | 'weapons',
    aimRotation: Vector3Tuple
  ): Vector3Tuple {
    const range = SHIP_SYMMETRIC_AIM_ROTATION_RANGES[slot]
    return [
      this.clampNumber(aimRotation[0], range.x.min, range.x.max),
      this.clampNumber(aimRotation[1], range.y.min, range.y.max),
      this.clampNumber(aimRotation[2], range.z.min, range.z.max),
    ]
  }

  private isSymmetricSlot(slot: ShipSlot): slot is 'wings' | 'engines' | 'weapons' {
    return slot === 'wings' || slot === 'engines' || slot === 'weapons'
  }

  private clampNumber(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value))
  }

  private hasTupleChanged(current: Vector3Tuple, next: Vector3Tuple): boolean {
    return current[0] !== next[0] || current[1] !== next[1] || current[2] !== next[2]
  }

  private getChangedAxes(current: Vector3Tuple, next: Vector3Tuple): string[] {
    const axes: string[] = []

    if (current[0] !== next[0]) {
      axes.push('x')
    }
    if (current[1] !== next[1]) {
      axes.push('y')
    }
    if (current[2] !== next[2]) {
      axes.push('z')
    }

    return axes
  }
}
