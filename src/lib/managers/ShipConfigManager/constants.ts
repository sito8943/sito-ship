import type { ShipSlot } from "@/lib/models/ShipConfig";
import type { ShipSlotOffsetRule } from "@/lib/managers/ShipConfigManager/types";

export const SYMMETRIC_SLOT_KEYS = ["wings", "engines", "weapons"] as const;

export const SLOT_OFFSET_RULES: Partial<Record<ShipSlot, ShipSlotOffsetRule>> = {
  cockpit: {
    y: { min: 0, max: 0.95 },
  },
  wings: {
    x: { min: -0.12, max: 0.12 },
  },
  engines: {
    x: { min: -0.12, max: 0.12 },
    z: { min: 0.15, max: 1.75 },
  },
  weapons: {
    x: { min: -0.12, max: 0.12 },
    z: { min: -0.1, max: 1.25 },
  },
};
