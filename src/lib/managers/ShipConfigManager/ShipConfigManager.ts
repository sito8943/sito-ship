import {
  cloneShipConfig,
  createDefaultShipConfig,
} from "../../models/ShipConfig";
import type {
  ShipConfig,
  ShipSlot,
  ShipSlotPatch,
  ShipSlotConfigMap,
  Vector3Tuple,
} from "../../models/ShipConfig";

export class ShipConfigManager {
  createDefaultConfig(): ShipConfig {
    return createDefaultShipConfig();
  }

  replaceConfig(config: ShipConfig): ShipConfig {
    return cloneShipConfig(config);
  }

  updateSlot<TSlot extends ShipSlot>(
    config: ShipConfig,
    slot: TSlot,
    patch: ShipSlotPatch<TSlot>,
  ): ShipConfig {
    const nextConfig = cloneShipConfig(config);
    const clonedPatch = { ...patch } as ShipSlotPatch<TSlot>;

    if (patch.scale) {
      clonedPatch.scale = this.cloneVector3Tuple(
        patch.scale,
      ) as ShipSlotConfigMap[TSlot]["scale"];
    }

    if (patch.offset) {
      clonedPatch.offset = this.cloneVector3Tuple(
        patch.offset,
      ) as ShipSlotConfigMap[TSlot]["offset"];
    }

    nextConfig[slot] = {
      ...nextConfig[slot],
      ...clonedPatch,
    };
    return nextConfig;
  }

  private cloneVector3Tuple(vector: Vector3Tuple): Vector3Tuple {
    return [vector[0], vector[1], vector[2]];
  }
}
