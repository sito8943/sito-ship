import type { PropsWithChildren } from "react";
import type {
  ShipConfig,
  ShipSlot,
  ShipSlotPatch,
} from "@/lib/models/ShipConfig";
import type { ImportShipConfigResult } from "@/lib/managers/ShipConfigIOManager";
import type { ShipBuilderSceneManager } from "@/lib/managers/ShipBuilderSceneManager";
import type { TransformMode } from "@/lib/managers/ShipBuilderSceneManager/types";

export type ShipBuilderProviderProps = PropsWithChildren;

export type UpdateSlotOptions = {
  commitHistory?: boolean;
};

export type UpdateSlot = <TSlot extends ShipSlot>(
  slot: TSlot,
  patch: ShipSlotPatch<TSlot>,
  options?: UpdateSlotOptions,
) => void;

export type ShipBuilderMessage = {
  kind: "info" | "success" | "warning" | "error";
  text: string;
};

export type ShipBuilderContextValue = {
  sceneManager: ShipBuilderSceneManager;
  shipConfig: ShipConfig;
  selectedSlot: ShipSlot;
  transformMode: TransformMode;
  canUndo: boolean;
  canRedo: boolean;
  overlappingSlots: ShipSlot[];
  message: ShipBuilderMessage | null;
  updateSlot: UpdateSlot;
  setSelectedSlot: (slot: ShipSlot) => void;
  setTransformMode: (mode: TransformMode) => void;
  undo: () => void;
  redo: () => void;
  resetSlot: (slot: ShipSlot) => void;
  resetShipConfig: () => void;
  replaceShipConfig: (config: ShipConfig) => void;
  exportShipConfigToJson: () => string;
  importShipConfigFromJson: (rawInput: string) => ImportShipConfigResult;
};
