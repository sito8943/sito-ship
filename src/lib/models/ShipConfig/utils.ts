import { DEFAULT_SHIP_CONFIG } from '@/lib/models/ShipConfig/constants'
import type { ShipConfig, ShipSlotBaseConfig, Vector3Tuple } from '@/lib/models/ShipConfig/types'

const cloneVector3Tuple = (vector: Vector3Tuple): Vector3Tuple => {
  return [vector[0], vector[1], vector[2]]
}

const cloneSlotBaseConfig = <TSlotConfig extends ShipSlotBaseConfig>(
  slotConfig: TSlotConfig
): TSlotConfig => {
  return {
    ...slotConfig,
    scale: cloneVector3Tuple(slotConfig.scale),
    offset: cloneVector3Tuple(slotConfig.offset),
    rotation: cloneVector3Tuple(slotConfig.rotation),
    pivotLocal: cloneVector3Tuple(slotConfig.pivotLocal),
  }
}

export const cloneShipConfig = (shipConfig: ShipConfig): ShipConfig => {
  return {
    version: shipConfig.version,
    body: cloneSlotBaseConfig(shipConfig.body),
    cockpit: cloneSlotBaseConfig(shipConfig.cockpit),
    wings: {
      ...cloneSlotBaseConfig(shipConfig.wings),
      aimRotation: cloneVector3Tuple(shipConfig.wings.aimRotation),
    },
    engines: {
      ...cloneSlotBaseConfig(shipConfig.engines),
      aimRotation: cloneVector3Tuple(shipConfig.engines.aimRotation),
    },
    weapons: {
      ...cloneSlotBaseConfig(shipConfig.weapons),
      aimRotation: cloneVector3Tuple(shipConfig.weapons.aimRotation),
    },
  }
}

export const createDefaultShipConfig = (): ShipConfig => {
  return cloneShipConfig(DEFAULT_SHIP_CONFIG)
}
