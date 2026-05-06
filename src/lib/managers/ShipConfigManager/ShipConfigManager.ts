import {
  cloneShipConfig,
  createDefaultShipConfig,
  SHIP_SYMMETRIC_AIM_ROTATION_RANGES,
  SHIP_SYMMETRIC_PAIR_SPREAD_RANGES,
  SHIP_SLOT_KEYS,
  SHIP_SLOT_OFFSET_RANGES,
  SHIP_SLOT_PIVOT_LOCAL_RANGES,
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
    if (patch.pivotLocal) {
      clonedPatch.pivotLocal = this.cloneTupleForSlot(patch.pivotLocal)
    }
    if (this.isSymmetricSlot(slot)) {
      const symmetricPatch = patch as
        | ShipSlotPatchInput<'wings'>
        | ShipSlotPatchInput<'engines'>
        | ShipSlotPatchInput<'weapons'>
      const clonedSymmetricPatch = clonedPatch as
        | ShipSlotPatchInput<'wings'>
        | ShipSlotPatchInput<'engines'>
        | ShipSlotPatchInput<'weapons'>
      if (symmetricPatch.pairSpread !== undefined) {
        clonedSymmetricPatch.pairSpread = symmetricPatch.pairSpread
      }
      if (symmetricPatch.aimRotation) {
        clonedSymmetricPatch.aimRotation = this.cloneTupleForSlot(symmetricPatch.aimRotation)
      }
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
      pivotLocal: cloneVector3Tuple(defaultConfig[slot].pivotLocal),
    }
    if (this.isSymmetricSlot(slot)) {
      const nextSymmetricSlot = nextConfig[slot] as
        | ShipConfig['wings']
        | ShipConfig['engines']
        | ShipConfig['weapons']
      const defaultSymmetricSlot = defaultConfig[slot] as
        | ShipConfig['wings']
        | ShipConfig['engines']
        | ShipConfig['weapons']
      nextSymmetricSlot.aimRotation = cloneVector3Tuple(defaultSymmetricSlot.aimRotation)
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

    const pivotRange = SHIP_SLOT_PIVOT_LOCAL_RANGES[slot]
    const pivotBefore = this.cloneTupleForSlot(slotConfig.pivotLocal)
    slotConfig.pivotLocal = [
      clampNumber(pivotBefore[0], pivotRange.x.min, pivotRange.x.max),
      clampNumber(pivotBefore[1], pivotRange.y.min, pivotRange.y.max),
      clampNumber(pivotBefore[2], pivotRange.z.min, pivotRange.z.max),
    ]
    if (hasTupleChanged(pivotBefore, slotConfig.pivotLocal)) {
      const axes = getTupleChangedAxes(pivotBefore, slotConfig.pivotLocal).join(', ')
      warnings.push(`Slot "${slot}" pivotLocal was clamped on axis ${axes}.`)
    }

    if (this.isSymmetricSlot(slot)) {
      const symmetricSlotConfig = slotConfig as
        | ShipConfig['wings']
        | ShipConfig['engines']
        | ShipConfig['weapons']
      const aimRange = SHIP_SYMMETRIC_AIM_ROTATION_RANGES[slot]
      const aimRotationBefore = this.cloneTupleForSlot(symmetricSlotConfig.aimRotation)
      symmetricSlotConfig.aimRotation = [
        clampNumber(aimRotationBefore[0], aimRange.x.min, aimRange.x.max),
        clampNumber(aimRotationBefore[1], aimRange.y.min, aimRange.y.max),
        clampNumber(aimRotationBefore[2], aimRange.z.min, aimRange.z.max),
      ]
      if (hasTupleChanged(aimRotationBefore, symmetricSlotConfig.aimRotation)) {
        const axes = getTupleChangedAxes(aimRotationBefore, symmetricSlotConfig.aimRotation).join(
          ', '
        )
        warnings.push(`Slot "${slot}" aimRotation was clamped on axis ${axes}.`)
      }

      const pairSpreadRange = SHIP_SYMMETRIC_PAIR_SPREAD_RANGES[slot]
      const pairSpreadBefore = symmetricSlotConfig.pairSpread
      symmetricSlotConfig.pairSpread = clampNumber(
        pairSpreadBefore,
        pairSpreadRange.min,
        pairSpreadRange.max
      )
      if (pairSpreadBefore !== symmetricSlotConfig.pairSpread) {
        warnings.push(`Slot "${slot}" pairSpread was clamped.`)
      }
    }
  }

  private cloneTupleForSlot(vector: Vector3Tuple): Vector3Tuple {
    return cloneVector3Tuple(vector)
  }

  private isSymmetricSlot(slot: ShipSlot): slot is (typeof SYMMETRIC_SLOT_KEYS)[number] {
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
