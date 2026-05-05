import type { Vector3Tuple } from '@/lib/models/ShipConfig'

export const clampNumber = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value))
}

export const cloneVector3Tuple = (vector: Vector3Tuple): Vector3Tuple => {
  return [vector[0], vector[1], vector[2]]
}

export const hasTupleChanged = (current: Vector3Tuple, next: Vector3Tuple): boolean => {
  return current[0] !== next[0] || current[1] !== next[1] || current[2] !== next[2]
}

export const getTupleChangedAxes = (current: Vector3Tuple, next: Vector3Tuple): string[] => {
  const axes: string[] = []

  if (current[0] !== next[0]) {
    axes.push('x')
  }
  if (current[1] !== next[1]) {
    axes.push('y')
  }
  if (current[2] !== next[2]) {
    axes.push('z')
  }

  return axes
}

export const formatRange = (min: number, max: number): string => {
  return `${min} to ${max}`
}
