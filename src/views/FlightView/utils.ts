import { ShipConfigIOManager } from '@/lib/managers/ShipConfigIOManager'
import { ShipConfigManager } from '@/lib/managers/ShipConfigManager'
import type { ShipConfig } from '@/lib/models/ShipConfig'
import { SHIP_BUILDER_STORAGE_KEY } from '@/providers/ShipBuilderProvider/constants'

export const resolveFlightShipConfig = (fallbackConfig: ShipConfig): ShipConfig => {
  if (typeof window === 'undefined') {
    return fallbackConfig
  }

  const persistedConfig = window.localStorage.getItem(SHIP_BUILDER_STORAGE_KEY)
  if (!persistedConfig) {
    return fallbackConfig
  }

  const ioManager = new ShipConfigIOManager()
  const configManager = new ShipConfigManager()
  const importResult = ioManager.importFromJson(persistedConfig)

  if (!importResult.ok) {
    return fallbackConfig
  }

  return configManager.replaceConfig(importResult.config).config
}
