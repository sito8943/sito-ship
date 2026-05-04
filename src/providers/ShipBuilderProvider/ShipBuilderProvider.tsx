import { useCallback, useEffect, useMemo, useState } from "react";
import { ShipConfigManager } from "@/lib/managers/ShipConfigManager";
import { ShipBuilderSceneManager } from "@/lib/managers/ShipBuilderSceneManager";
import type { ShipConfig } from "@/lib/models/ShipConfig";
import { ShipBuilderContext } from "@/providers/ShipBuilderProvider/context";
import type {
  ShipBuilderContextValue,
  ShipBuilderProviderProps,
  UpdateSlot,
} from "@/providers/ShipBuilderProvider/types";

const ShipBuilderProvider = ({ children }: ShipBuilderProviderProps) => {
  const sceneManager = useMemo(() => new ShipBuilderSceneManager(), []);
  const shipConfigManager = useMemo(() => new ShipConfigManager(), []);
  const [shipConfig, setShipConfig] = useState<ShipConfig>(() => {
    return shipConfigManager.createDefaultConfig();
  });

  useEffect(() => {
    return () => {
      sceneManager.destroy();
    };
  }, [sceneManager]);

  const updateSlot = useCallback<UpdateSlot>(
    (slot, patch) => {
      setShipConfig((currentConfig) => {
        return shipConfigManager.updateSlot(currentConfig, slot, patch);
      });
    },
    [shipConfigManager],
  );

  const resetShipConfig = useCallback(() => {
    setShipConfig(shipConfigManager.createDefaultConfig());
  }, [shipConfigManager]);

  const replaceShipConfig = useCallback(
    (config: ShipConfig) => {
      setShipConfig(shipConfigManager.replaceConfig(config));
    },
    [shipConfigManager],
  );

  const value = useMemo<ShipBuilderContextValue>(() => {
    return {
      sceneManager,
      shipConfig,
      updateSlot,
      resetShipConfig,
      replaceShipConfig,
    };
  }, [replaceShipConfig, resetShipConfig, sceneManager, shipConfig, updateSlot]);

  return (
    <ShipBuilderContext.Provider value={value}>
      {children}
    </ShipBuilderContext.Provider>
  );
};

export default ShipBuilderProvider;
