import { useEffect, useMemo } from "react";
import { ShipBuilderSceneManager } from "../../lib/managers/ShipBuilderSceneManager";
import { ShipBuilderContext } from "./context";
import type { ShipBuilderContextValue, ShipBuilderProviderProps } from "./types";

const ShipBuilderProvider = ({ children }: ShipBuilderProviderProps) => {
  const sceneManager = useMemo(() => new ShipBuilderSceneManager(), []);

  useEffect(() => {
    return () => {
      sceneManager.destroy();
    };
  }, [sceneManager]);

  const value = useMemo<ShipBuilderContextValue>(() => {
    return { sceneManager };
  }, [sceneManager]);

  return (
    <ShipBuilderContext.Provider value={value}>
      {children}
    </ShipBuilderContext.Provider>
  );
};

export default ShipBuilderProvider;
