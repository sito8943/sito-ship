import type { Group } from "three";
import type {
  ShipSlot,
  ShipSlotConfigMap,
} from "../../models/ShipConfig";

export type ShipSlotKey = ShipSlot;

export type ShipSlotGroupMap = Record<ShipSlotKey, Group>;

export type ShipSlotSignatureMap = Record<ShipSlotKey, string>;

export type SlotBuilderMap = {
  [TSlot in ShipSlotKey]: (slotConfig: ShipSlotConfigMap[TSlot]) => Group;
};
