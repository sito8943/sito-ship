import type { Mesh, Points } from 'three'

export type FlightSceneInputState = {
  strafeLeft: boolean
  strafeRight: boolean
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
