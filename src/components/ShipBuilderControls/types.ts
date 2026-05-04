import type { ShipSlot, ShipSlotConfigMap } from "../../lib/models/ShipConfig";

export type SlotVariantOptionsMap = {
  [TSlot in ShipSlot]: readonly ShipSlotConfigMap[TSlot]["variant"][];
};

export type OffsetAxis = "x" | "y" | "z";
export type OffsetAxisOption = {
  axis: OffsetAxis;
  index: 0 | 1 | 2;
  min: number;
  max: number;
  step: number;
};
