import type { ShipFlightSceneManager } from '@/lib/managers/ShipFlightSceneManager'
import type { ShipConfig } from '@/lib/models/ShipConfig'

export type FlightSceneCanvasProps = {
  shipConfig: ShipConfig
  sceneManager: ShipFlightSceneManager
}
