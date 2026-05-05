import type { ShipSlot, Vector3Tuple } from "@/lib/models/ShipConfig";

export type SceneSize = {
  width: number;
  height: number;
};

export type TransformMode = "translate" | "rotate" | "scale";

export type SceneSlotTransformPatch = {
  offset?: Vector3Tuple;
  rotation?: Vector3Tuple;
  scale?: Vector3Tuple;
};

export type SceneSlotSelectionHandler = (slot: ShipSlot | null) => void;

export type SceneSlotTransformHandler = (
  slot: ShipSlot,
  patch: SceneSlotTransformPatch,
  options: {
    commitHistory: boolean;
  },
) => void;

export type SceneValidationHandler = (slots: ShipSlot[]) => void;
