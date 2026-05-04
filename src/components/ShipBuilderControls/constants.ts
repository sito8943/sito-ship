import type { ShipSlot } from "../../lib/models/ShipConfig";
import type { OffsetAxisOption, SlotVariantOptionsMap } from "./types";

export const SLOT_ORDER: readonly ShipSlot[] = [
  "body",
  "cockpit",
  "wings",
  "engines",
  "weapons",
];

export const SLOT_LABELS: Record<ShipSlot, string> = {
  body: "Body",
  cockpit: "Cockpit",
  wings: "Wings",
  engines: "Engines",
  weapons: "Weapons",
};

export const SLOT_VARIANT_OPTIONS = {
  body: ["box", "longBox", "tapered"],
  cockpit: ["sphere", "oval", "bubble"],
  wings: ["rect", "triangular", "double"],
  engines: ["cylinder", "cone", "cylinderDual"],
  weapons: ["none", "singleCannon", "dualCannon"],
} satisfies SlotVariantOptionsMap;

export const SCALE_RANGE = {
  min: 0.6,
  max: 1.8,
  step: 0.05,
} as const;

export const OFFSET_AXIS_OPTIONS: readonly OffsetAxisOption[] = [
  { axis: "x", index: 0, min: -2.5, max: 2.5, step: 0.05 },
  { axis: "y", index: 1, min: -2, max: 2, step: 0.05 },
  { axis: "z", index: 2, min: -3.5, max: 3.5, step: 0.05 },
];
