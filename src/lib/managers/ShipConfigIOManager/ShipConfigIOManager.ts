import {
  DEFAULT_SHIP_CONFIG,
  SHIP_CONFIG_VERSION,
  SHIP_SLOT_OFFSET_RANGES,
  SHIP_SLOT_KEYS,
  SHIP_SLOT_SCALE_RANGES,
  SHIP_VARIANT_OPTIONS,
  createDefaultShipConfig,
  type ShipConfig,
  type ShipSlot,
  type ShipSlotConfigMap,
  type Vector3Tuple,
} from "@/lib/models/ShipConfig";
import {
  ERROR_EMPTY_INPUT,
  ERROR_INVALID_JSON,
  ERROR_INVALID_ROOT,
  JSON_INDENT_SPACES,
} from "@/lib/managers/ShipConfigIOManager/constants";
import type { ImportShipConfigResult } from "@/lib/managers/ShipConfigIOManager/types";
import {
  cloneSlotState,
  isAllowedVariant,
  isHexColor,
  isPlainObject,
  isValidVector3Tuple,
  parseVector3Tuple,
} from "@/lib/managers/ShipConfigIOManager/utils";

export class ShipConfigIOManager {
  exportToJson(config: ShipConfig): string {
    return JSON.stringify(config, null, JSON_INDENT_SPACES);
  }

  importFromJson(rawInput: string): ImportShipConfigResult {
    const trimmedInput = rawInput.trim();
    if (!trimmedInput) {
      return {
        ok: false,
        error: ERROR_EMPTY_INPUT,
      };
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(trimmedInput);
    } catch {
      return {
        ok: false,
        error: ERROR_INVALID_JSON,
      };
    }

    if (!isPlainObject(parsedJson)) {
      return {
        ok: false,
        error: ERROR_INVALID_ROOT,
      };
    }

    const nextConfig = createDefaultShipConfig();
    const warnings: string[] = [];

    if (parsedJson.version !== SHIP_CONFIG_VERSION) {
      warnings.push(
        `Version mismatch detected. Using supported version ${SHIP_CONFIG_VERSION}.`,
      );
    }

    SHIP_SLOT_KEYS.forEach((slot) => {
      this.mergeSlotConfig({
        slot,
        sourceRoot: parsedJson,
        targetConfig: nextConfig,
        warnings,
      });
    });

    return {
      ok: true,
      config: nextConfig,
      warnings,
    };
  }

  private mergeSlotConfig<TSlot extends ShipSlot>({
    slot,
    sourceRoot,
    targetConfig,
    warnings,
  }: {
    slot: TSlot;
    sourceRoot: Record<string, unknown>;
    targetConfig: ShipConfig;
    warnings: string[];
  }) {
    const sourceSlot = sourceRoot[slot];
    if (!isPlainObject(sourceSlot)) {
      warnings.push(`Slot "${slot}" is missing or invalid. Using defaults.`);
      targetConfig[slot] = cloneSlotState(DEFAULT_SHIP_CONFIG, slot);
      return;
    }

    const defaultSlot = cloneSlotState(DEFAULT_SHIP_CONFIG, slot);
    const nextSlot = cloneSlotState(targetConfig, slot);

    const variantValue = sourceSlot.variant;
    const allowedVariants = SHIP_VARIANT_OPTIONS[slot];
    if (isAllowedVariant(variantValue, allowedVariants)) {
      nextSlot.variant = variantValue as ShipSlotConfigMap[TSlot]["variant"];
    } else {
      warnings.push(
        `Slot "${slot}" has an invalid variant. Using "${defaultSlot.variant}".`,
      );
      nextSlot.variant = defaultSlot.variant;
    }

    const colorValue = sourceSlot.color;
    if (isHexColor(colorValue)) {
      nextSlot.color = colorValue;
    } else {
      warnings.push(`Slot "${slot}" has an invalid color. Using default color.`);
      nextSlot.color = defaultSlot.color;
    }

    if (!isValidVector3Tuple(sourceSlot.scale)) {
      warnings.push(`Slot "${slot}" has an invalid scale. Using default scale.`);
    }
    const parsedScale = parseVector3Tuple(sourceSlot.scale, defaultSlot.scale);
    const clampedScale = this.clampScaleTuple(slot, parsedScale);
    if (this.hasTupleChanged(parsedScale, clampedScale)) {
      const range = SHIP_SLOT_SCALE_RANGES[slot];
      warnings.push(
        `Slot "${slot}" scale exceeded allowed range (${range.min} to ${range.max}) and was clamped.`,
      );
    }
    nextSlot.scale = clampedScale;

    if (!isValidVector3Tuple(sourceSlot.offset)) {
      warnings.push(`Slot "${slot}" has an invalid offset. Using default offset.`);
    }
    const parsedOffset = parseVector3Tuple(sourceSlot.offset, defaultSlot.offset);
    const clampedOffset = this.clampOffsetTuple(slot, parsedOffset);
    if (this.hasTupleChanged(parsedOffset, clampedOffset)) {
      const changedAxes = this.getChangedAxes(parsedOffset, clampedOffset).join(", ");
      warnings.push(
        `Slot "${slot}" offset exceeded allowed range on axis ${changedAxes} and was clamped.`,
      );
    }
    nextSlot.offset = clampedOffset;

    targetConfig[slot] = nextSlot;
  }

  private clampScaleTuple(slot: ShipSlot, scale: Vector3Tuple): Vector3Tuple {
    const range = SHIP_SLOT_SCALE_RANGES[slot];
    return [
      this.clampNumber(scale[0], range.min, range.max),
      this.clampNumber(scale[1], range.min, range.max),
      this.clampNumber(scale[2], range.min, range.max),
    ];
  }

  private clampOffsetTuple(slot: ShipSlot, offset: Vector3Tuple): Vector3Tuple {
    const range = SHIP_SLOT_OFFSET_RANGES[slot];
    return [
      this.clampNumber(offset[0], range.x.min, range.x.max),
      this.clampNumber(offset[1], range.y.min, range.y.max),
      this.clampNumber(offset[2], range.z.min, range.z.max),
    ];
  }

  private clampNumber(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  private hasTupleChanged(current: Vector3Tuple, next: Vector3Tuple): boolean {
    return current[0] !== next[0] || current[1] !== next[1] || current[2] !== next[2];
  }

  private getChangedAxes(current: Vector3Tuple, next: Vector3Tuple): string[] {
    const axes: string[] = [];

    if (current[0] !== next[0]) {
      axes.push("x");
    }
    if (current[1] !== next[1]) {
      axes.push("y");
    }
    if (current[2] !== next[2]) {
      axes.push("z");
    }

    return axes;
  }
}
