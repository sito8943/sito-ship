import { DEFAULT_SHIP_CONFIG } from '@/lib/models/ShipConfig/constants'
import type { ShipConfig, ShipSlotBaseConfig, Vector3Tuple } from '@/lib/models/ShipConfig/types'

const cloneVector3Tuple = (vector: Vector3Tuple): Vector3Tuple => {
  return [vector[0], vector[1], vector[2]]
}

const cloneSlotConfig = <TSlotConfig extends ShipSlotBaseConfig>(
  slotConfig: TSlotConfig
): TSlotConfig => {
  return {
    ...slotConfig,
    scale: cloneVector3Tuple(slotConfig.scale),
    offset: cloneVector3Tuple(slotConfig.offset),
    rotation: cloneVector3Tuple(slotConfig.rotation),
  }
}

export const cloneShipConfig = (shipConfig: ShipConfig): ShipConfig => {
  return {
    version: shipConfig.version,
    body: cloneSlotConfig(shipConfig.body),
    cockpit: cloneSlotConfig(shipConfig.cockpit),
    wings: cloneSlotConfig(shipConfig.wings),
    engines: cloneSlotConfig(shipConfig.engines),
    weapons: cloneSlotConfig(shipConfig.weapons),
  }
}

export const createDefaultShipConfig = (): ShipConfig => {
  return cloneShipConfig(DEFAULT_SHIP_CONFIG)
}
