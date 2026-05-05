import type { ShipConfig } from '@/lib/models/ShipConfig'

export type ImportShipConfigSuccess = {
  ok: true
  config: ShipConfig
  warnings: string[]
}

export type ImportShipConfigError = {
  ok: false
  error: string
}

export type ImportShipConfigResult = ImportShipConfigSuccess | ImportShipConfigError
