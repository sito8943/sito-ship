import type {
  ShipConfig,
  ShipSlot,
  ShipSlotPatch,
} from "@/lib/models/ShipConfig";

export type ShipConfigNormalizationResult = {
  config: ShipConfig;
  warnings: string[];
};

export type ShipSlotPatchInput<TSlot extends ShipSlot> = ShipSlotPatch<TSlot>;
