import type { PropsWithChildren } from "react";
import type {
  ShipConfig,
  ShipSlot,
  ShipSlotPatch,
} from "@/lib/models/ShipConfig";
import type { ImportShipConfigResult } from "@/lib/managers/ShipConfigIOManager";
import type { ShipBuilderSceneManager } from "@/lib/managers/ShipBuilderSceneManager";

export type ShipBuilderProviderProps = PropsWithChildren;

export type UpdateSlot = <TSlot extends ShipSlot>(
  slot: TSlot,
  patch: ShipSlotPatch<TSlot>,
) => void;

export type ShipBuilderContextValue = {
  sceneManager: ShipBuilderSceneManager;
  shipConfig: ShipConfig;
  updateSlot: UpdateSlot;
  resetShipConfig: () => void;
  replaceShipConfig: (config: ShipConfig) => void;
  exportShipConfigToJson: () => string;
  importShipConfigFromJson: (rawInput: string) => ImportShipConfigResult;
};
