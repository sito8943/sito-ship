import { useCallback, useEffect, useMemo, useState } from "react";
import { ShipConfigManager } from "@/lib/managers/ShipConfigManager";
import {
  ShipConfigIOManager,
  type ImportShipConfigResult,
} from "@/lib/managers/ShipConfigIOManager";
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
  const shipConfigIOManager = useMemo(() => new ShipConfigIOManager(), []);
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

  const exportShipConfigToJson = useCallback(() => {
    return shipConfigIOManager.exportToJson(shipConfig);
  }, [shipConfig, shipConfigIOManager]);

  const importShipConfigFromJson = useCallback(
    (rawInput: string): ImportShipConfigResult => {
      const result = shipConfigIOManager.importFromJson(rawInput);
      if (result.ok) {
        setShipConfig(result.config);
      }
      return result;
    },
    [shipConfigIOManager],
  );

  const value = useMemo<ShipBuilderContextValue>(() => {
    return {
      sceneManager,
      shipConfig,
      updateSlot,
      resetShipConfig,
      replaceShipConfig,
      exportShipConfigToJson,
      importShipConfigFromJson,
    };
  }, [
    exportShipConfigToJson,
    importShipConfigFromJson,
    replaceShipConfig,
    resetShipConfig,
    sceneManager,
    shipConfig,
    updateSlot,
  ]);

  return (
    <ShipBuilderContext.Provider value={value}>
      {children}
    </ShipBuilderContext.Provider>
  );
};

export default ShipBuilderProvider;
