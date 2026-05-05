import {
  cloneShipConfig,
  createDefaultShipConfig,
  SHIP_SLOT_KEYS,
  SHIP_SLOT_OFFSET_RANGES,
  SHIP_SLOT_ROTATION_RANGES,
  SHIP_SLOT_SCALE_RANGES,
  type ShipConfig,
  type ShipSlot,
  type Vector3Tuple,
} from '@/lib/models/ShipConfig'
import { SYMMETRIC_SLOT_KEYS } from '@/lib/managers/ShipConfigManager/constants'
import type {
  ShipConfigNormalizationResult,
  ShipSlotPatchInput,
} from '@/lib/managers/ShipConfigManager/types'
import {
  clampNumber,
  cloneVector3Tuple,
  formatRange,
  getTupleChangedAxes,
  hasTupleChanged,
} from '@/lib/managers/ShipConfigManager/utils'

export class ShipConfigManager {
  createDefaultConfig(): ShipConfig {
    return createDefaultShipConfig()
  }

  replaceConfig(config: ShipConfig): ShipConfigNormalizationResult {
    return this.normalizeConfig(config)
  }

  updateSlot<TSlot extends ShipSlot>(
    config: ShipConfig,
    slot: TSlot,
    patch: ShipSlotPatchInput<TSlot>
  ): ShipConfigNormalizationResult {
    const nextConfig = cloneShipConfig(config)
    const clonedPatch = { ...patch } as ShipSlotPatchInput<TSlot>

    if (patch.scale) {
      clonedPatch.scale = this.cloneTupleForSlot(patch.scale)
    }
    if (patch.offset) {
      clonedPatch.offset = this.cloneTupleForSlot(patch.offset)
    }
    if (patch.rotation) {
      clonedPatch.rotation = this.cloneTupleForSlot(patch.rotation)
    }

    nextConfig[slot] = {
      ...nextConfig[slot],
      ...clonedPatch,
    }

    return this.normalizeConfig(nextConfig)
  }

  resetSlot(config: ShipConfig, slot: ShipSlot): ShipConfigNormalizationResult {
    const nextConfig = cloneShipConfig(config)
    const defaultConfig = createDefaultShipConfig()

    nextConfig[slot] = {
      ...defaultConfig[slot],
      scale: cloneVector3Tuple(defaultConfig[slot].scale),
      offset: cloneVector3Tuple(defaultConfig[slot].offset),
      rotation: cloneVector3Tuple(defaultConfig[slot].rotation),
    }

    return this.normalizeConfig(nextConfig)
  }

  normalizeConfig(config: ShipConfig): ShipConfigNormalizationResult {
    const nextConfig = cloneShipConfig(config)
    const warnings: string[] = []

    SHIP_SLOT_KEYS.forEach((slot) => {
      this.normalizeSlot({
        config: nextConfig,
        slot,
        warnings,
      })
    })

    return {
      config: nextConfig,
      warnings,
    }
  }

  private normalizeSlot({
    config,
    slot,
    warnings,
  }: {
    config: ShipConfig
    slot: ShipSlot
    warnings: string[]
  }) {
    const slotConfig = config[slot]
    const scaleRange = SHIP_SLOT_SCALE_RANGES[slot]

    const scaleBefore = this.cloneTupleForSlot(slotConfig.scale)
    slotConfig.scale = [
      clampNumber(scaleBefore[0], scaleRange.min, scaleRange.max),
      clampNumber(scaleBefore[1], scaleRange.min, scaleRange.max),
      clampNumber(scaleBefore[2], scaleRange.min, scaleRange.max),
    ]
    if (hasTupleChanged(scaleBefore, slotConfig.scale)) {
      warnings.push(
        `Slot "${slot}" scale was clamped to allowed range (${formatRange(scaleRange.min, scaleRange.max)}).`
      )
    }

    const offsetRange = SHIP_SLOT_OFFSET_RANGES[slot]
    const offsetBefore = this.cloneTupleForSlot(slotConfig.offset)
    slotConfig.offset = [
      this.sanitizeOffsetValue(offsetBefore[0], offsetRange.x.min, offsetRange.x.max),
      this.sanitizeOffsetValue(offsetBefore[1], offsetRange.y.min, offsetRange.y.max),
      this.sanitizeOffsetValue(offsetBefore[2], offsetRange.z.min, offsetRange.z.max),
    ]

    const rotationRange = SHIP_SLOT_ROTATION_RANGES[slot]
    const rotationBefore = this.cloneTupleForSlot(slotConfig.rotation)
    slotConfig.rotation = [
      clampNumber(rotationBefore[0], rotationRange.x.min, rotationRange.x.max),
      clampNumber(rotationBefore[1], rotationRange.y.min, rotationRange.y.max),
      clampNumber(rotationBefore[2], rotationRange.z.min, rotationRange.z.max),
    ]
    if (hasTupleChanged(rotationBefore, slotConfig.rotation)) {
      const axes = getTupleChangedAxes(rotationBefore, slotConfig.rotation).join(', ')
      warnings.push(`Slot "${slot}" rotation was clamped on axis ${axes}.`)
    }

    if (this.isSymmetricSlot(slot) && slotConfig.offset[0] !== 0) {
      // Keep paired slots centered to avoid visual asymmetry drift in mirrored groups.
      slotConfig.offset[0] = 0
      warnings.push(`Slot "${slot}" offset on axis x was centered to preserve symmetry.`)
    }
  }

  private cloneTupleForSlot(vector: Vector3Tuple): Vector3Tuple {
    return cloneVector3Tuple(vector)
  }

  private isSymmetricSlot(slot: ShipSlot): boolean {
    return SYMMETRIC_SLOT_KEYS.some((symmetrySlot) => symmetrySlot === slot)
  }

  private sanitizeOffsetValue(value: number, minFallback: number, maxFallback: number): number {
    if (!Number.isFinite(value)) {
      return clampNumber(0, minFallback, maxFallback)
    }

    // Keep offsets editable without arbitrary slot clamps while still protecting
    // against extreme values that can break the scene.
    const HARD_LIMIT = 50
    return clampNumber(value, -HARD_LIMIT, HARD_LIMIT)
  }
}
