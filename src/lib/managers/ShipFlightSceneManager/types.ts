import type { Mesh, Points, Vector3 } from 'three'

export type FlightSceneInputState = {
  strafeLeft: boolean
  strafeRight: boolean
  pitchUp: boolean
  pitchDown: boolean
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

export type FlightSceneThrusterField = {
  points: Points
  positions: Float32Array
  colors: Float32Array
  velocities: Float32Array
  ages: Float32Array
  lifetimes: Float32Array
  capacity: number
  exhaustWorldPositions: Vector3[]
  exhaustCount: number
}
