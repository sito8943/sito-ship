import { FLIGHT_SCENE_PLANET_TEMPLATES } from '@/lib/managers/ShipFlightSceneManager/constants'
import type {
  DisposableResource,
  FlightSceneInputState,
} from '@/lib/managers/ShipFlightSceneManager/types'

export const createDefaultInputState = (): FlightSceneInputState => {
  return {
    strafeLeft: false,
    strafeRight: false,
    pitchUp: false,
    pitchDown: false,
    fire: false,
  }
}

export const isDisposableResource = (value: unknown): value is DisposableResource => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'dispose' in value &&
    typeof value.dispose === 'function'
  )
}

export const randomInRange = (min: number, max: number) => min + Math.random() * (max - min)

export const pickRandomTemplate = () => {
  const index = Math.floor(Math.random() * FLIGHT_SCENE_PLANET_TEMPLATES.length)
  return FLIGHT_SCENE_PLANET_TEMPLATES[index]
}
