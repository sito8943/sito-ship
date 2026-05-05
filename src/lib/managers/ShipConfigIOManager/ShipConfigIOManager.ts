import {
  DEFAULT_SHIP_CONFIG,
  SHIP_CONFIG_VERSION,
  SHIP_SLOT_KEYS,
  SHIP_VARIANT_OPTIONS,
  createDefaultShipConfig,
  type ShipConfig,
  type ShipSlot,
  type ShipSlotConfigMap,
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
    nextSlot.scale = parseVector3Tuple(sourceSlot.scale, defaultSlot.scale);

    if (!isValidVector3Tuple(sourceSlot.offset)) {
      warnings.push(`Slot "${slot}" has an invalid offset. Using default offset.`);
    }
    nextSlot.offset = parseVector3Tuple(sourceSlot.offset, defaultSlot.offset);

    targetConfig[slot] = nextSlot;
  }
}
