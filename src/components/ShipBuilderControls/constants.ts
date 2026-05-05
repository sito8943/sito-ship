import {
  SHIP_SLOT_OFFSET_RANGES,
  SHIP_SLOT_KEYS,
  SHIP_SLOT_SCALE_RANGES,
  SHIP_VARIANT_OPTIONS,
  type ShipSlot,
} from "@/lib/models/ShipConfig";
import type { OffsetAxisOption } from "@/components/ShipBuilderControls/types";

export const SLOT_ORDER: readonly ShipSlot[] = SHIP_SLOT_KEYS;

export const SLOT_LABELS: Record<ShipSlot, string> = {
  body: "Body",
  cockpit: "Cockpit",
  wings: "Wings",
  engines: "Engines",
  weapons: "Weapons",
};

export const SLOT_VARIANT_OPTIONS = SHIP_VARIANT_OPTIONS;

export const SLOT_SCALE_RANGES = SHIP_SLOT_SCALE_RANGES;
export const SLOT_OFFSET_RANGES = SHIP_SLOT_OFFSET_RANGES;

export const OFFSET_AXIS_OPTIONS: readonly OffsetAxisOption[] = [
  { axis: "x", index: 0 },
  { axis: "y", index: 1 },
  { axis: "z", index: 2 },
];
