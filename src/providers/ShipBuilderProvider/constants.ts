import type { ShipSlot } from "@/lib/models/ShipConfig";
import type { TransformMode } from "@/lib/managers/ShipBuilderSceneManager/types";

export const SHIP_BUILDER_HISTORY_LIMIT = 80;
export const SHIP_BUILDER_STORAGE_KEY = "sito-ship-builder-config:v1";
export const DEFAULT_SELECTED_SLOT: ShipSlot = "body";
export const DEFAULT_TRANSFORM_MODE: TransformMode = "translate";
