import type { Mesh, Points } from 'three'

export type FlightSceneInputState = {
  yawLeft: boolean
  yawRight: boolean
  rollLeft: boolean
  rollRight: boolean
}

export type FlightSceneSize = {
  width: number
  height: number
}

export type FlightSceneStarField = {
  points: Points
  positions: Float32Array
  count: number
  speedMultiplier: number
  spread: number
}

export type FlightScenePlanetEntry = {
  mesh: Mesh
  speedMultiplier: number
  rotationAxisY: number
  rotationAxisX: number
}
