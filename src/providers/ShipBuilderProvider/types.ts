import type { PropsWithChildren } from "react";
import type { ShipBuilderSceneManager } from "../../lib/managers/ShipBuilderSceneManager";

export type ShipBuilderProviderProps = PropsWithChildren;

export type ShipBuilderContextValue = {
  sceneManager: ShipBuilderSceneManager;
};
