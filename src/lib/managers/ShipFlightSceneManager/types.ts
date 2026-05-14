import type { InstancedMesh, Mesh, Points, Vector3 } from 'three'

export type FlightSceneInputState = {
  strafeLeft: boolean
  strafeRight: boolean
  pitchUp: boolean
  pitchDown: boolean
  fire: boolean
}

export type FlightSceneTouchInput = {
  strafe?: number
  pitch?: number
  fire?: boolean
}

export type FlightSceneProjectileField = {
  mesh: InstancedMesh
  positions: Float32Array
  velocities: Float32Array
  ages: Float32Array
  alive: Uint8Array
  quaternions: Float32Array
  capacity: number
  muzzleWorldPositions: Vector3[]
  muzzleCount: number
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
  minRadius: number
  verticalSquash: number
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
  lives: Float32Array
  velocities: Float32Array
  ages: Float32Array
  lifetimes: Float32Array
  capacity: number
  exhaustWorldPositions: Vector3[]
  exhaustCount: number
  material: import('three').ShaderMaterial
}
