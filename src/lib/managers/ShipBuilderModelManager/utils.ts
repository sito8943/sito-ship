import {
  Color,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  type Group,
  type Object3D,
} from 'three'
import {
  SHIP_LOCAL_SYMMETRY_PLANE_NORMAL,
  SHIP_LOCAL_SYMMETRY_PLANE_OFFSET,
  SHIP_RIM_COLOR,
  SHIP_RIM_INTENSITY,
  SHIP_RIM_POWER,
} from '@/lib/managers/ShipBuilderModelManager/constants'
import type { DisposableResource } from '@/lib/managers/ShipBuilderModelManager/types'
import type { QuaternionTuple } from '@/lib/models'
import type { ShipSlot, ShipSlotConfigMap, Vector3Tuple } from '@/lib/models/ShipConfig'

const isDisposableResource = (value: unknown): value is DisposableResource => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'dispose' in value &&
    typeof value.dispose === 'function'
  )
}

export const createSlotMaterial = (color: string): MeshStandardMaterial => {
  const material = new MeshStandardMaterial({
    color,
    roughness: 0.42,
    metalness: 0.38,
    flatShading: false,
  })

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uRimColor = { value: new Color(SHIP_RIM_COLOR) }
    shader.uniforms.uRimPower = { value: SHIP_RIM_POWER }
    shader.uniforms.uRimIntensity = { value: SHIP_RIM_INTENSITY }

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `#include <common>
uniform vec3 uRimColor;
uniform float uRimPower;
uniform float uRimIntensity;`
    )

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
{
  vec3 nrm = normalize(normal);
  vec3 viewDir = normalize(vViewPosition);
  float rim = 1.0 - max(0.0, dot(nrm, viewDir));
  rim = pow(rim, uRimPower) * uRimIntensity;
  totalEmissiveRadiance += uRimColor * rim;
}`
    )
  }

  material.customProgramCacheKey = () => 'ship-rim'

  return material
}

export const applyShadowToObject = (object: Object3D) => {
  object.traverse((node) => {
    if (!(node instanceof Mesh)) {
      return
    }

    node.castShadow = true
    node.receiveShadow = true
  })
}

export const applySlotTransform = (group: Group, slotConfig: ShipSlotConfigMap[ShipSlot]) => {
  group.position.set(slotConfig.offset[0], slotConfig.offset[1], slotConfig.offset[2])
  group.rotation.set(slotConfig.rotation[0], slotConfig.rotation[1], slotConfig.rotation[2])
  group.scale.set(slotConfig.scale[0], slotConfig.scale[1], slotConfig.scale[2])
}

export const mirrorPointAcrossPlane = (
  point: Vector3Tuple,
  planeNormal: Vector3Tuple,
  planeOffset: number
): Vector3Tuple => {
  const [nx, ny, nz] = planeNormal
  const normalSquaredLength = nx * nx + ny * ny + nz * nz

  if (normalSquaredLength === 0) {
    return point
  }

  const signedDistance = nx * point[0] + ny * point[1] + nz * point[2] + planeOffset
  const scalar = (2 * signedDistance) / normalSquaredLength

  return [point[0] - scalar * nx, point[1] - scalar * ny, point[2] - scalar * nz]
}

export const mirrorPointAcrossShipLocalSymmetryPlane = (point: Vector3Tuple): Vector3Tuple => {
  return mirrorPointAcrossPlane(
    point,
    SHIP_LOCAL_SYMMETRY_PLANE_NORMAL,
    SHIP_LOCAL_SYMMETRY_PLANE_OFFSET
  )
}

export const mirrorQuaternionAcrossPlane = (
  quaternion: QuaternionTuple,
  planeNormal: Vector3Tuple
): QuaternionTuple => {
  const [nx, ny, nz] = planeNormal
  const normalSquaredLength = nx * nx + ny * ny + nz * nz

  if (normalSquaredLength === 0) {
    return quaternion
  }

  const normalLength = Math.sqrt(normalSquaredLength)
  const unitNormalX = nx / normalLength
  const unitNormalY = ny / normalLength
  const unitNormalZ = nz / normalLength

  const reflectionMatrix = new Matrix4().set(
    1 - 2 * unitNormalX * unitNormalX,
    -2 * unitNormalX * unitNormalY,
    -2 * unitNormalX * unitNormalZ,
    0,
    -2 * unitNormalY * unitNormalX,
    1 - 2 * unitNormalY * unitNormalY,
    -2 * unitNormalY * unitNormalZ,
    0,
    -2 * unitNormalZ * unitNormalX,
    -2 * unitNormalZ * unitNormalY,
    1 - 2 * unitNormalZ * unitNormalZ,
    0,
    0,
    0,
    0,
    1
  )

  const rotationMatrix = new Matrix4().makeRotationFromQuaternion(
    new Quaternion(quaternion[0], quaternion[1], quaternion[2], quaternion[3])
  )

  const mirroredRotationMatrix = reflectionMatrix
    .clone()
    .multiply(rotationMatrix)
    .multiply(reflectionMatrix)
  const mirroredQuaternion = new Quaternion()
    .setFromRotationMatrix(mirroredRotationMatrix)
    .normalize()

  return [mirroredQuaternion.x, mirroredQuaternion.y, mirroredQuaternion.z, mirroredQuaternion.w]
}

export const mirrorQuaternionAcrossShipLocalSymmetryPlane = (
  quaternion: QuaternionTuple
): QuaternionTuple => {
  return mirrorQuaternionAcrossPlane(quaternion, SHIP_LOCAL_SYMMETRY_PLANE_NORMAL)
}

export const createSlotRenderSignature = (slotConfig: ShipSlotConfigMap[ShipSlot]): string => {
  return [slotConfig.variant, slotConfig.color].join('|')
}

export const markSlotInHierarchy = (object: Object3D, slot: ShipSlot) => {
  object.userData.shipSlot = slot
  object.traverse((node) => {
    node.userData.shipSlot = slot
  })
}

export const setSlotHighlight = (
  object: Object3D,
  options: {
    isSelected: boolean
    isInvalid: boolean
  }
) => {
  object.traverse((node) => {
    if (!(node instanceof Mesh)) {
      return
    }

    const materials = Array.isArray(node.material) ? node.material : [node.material]
    materials.forEach((material) => {
      if (!(material instanceof MeshStandardMaterial)) {
        return
      }

      if (options.isInvalid) {
        material.emissive.set('#dc2626')
        material.emissiveIntensity = 0.45
        return
      }

      if (options.isSelected) {
        material.emissive.set('#38bdf8')
        material.emissiveIntensity = 0.35
        return
      }

      material.emissive.set('#000000')
      material.emissiveIntensity = 0
    })
  })
}

export const disposeGroupResources = (group: Group) => {
  const resources = new Set<DisposableResource>()

  group.traverse((node) => {
    if (!(node instanceof Mesh)) {
      return
    }

    const geometry: unknown = node.geometry
    if (isDisposableResource(geometry)) {
      resources.add(geometry)
    }

    const material: unknown = node.material
    if (Array.isArray(material)) {
      material.forEach((entry) => {
        const materialEntry: unknown = entry
        if (isDisposableResource(materialEntry)) {
          resources.add(materialEntry)
        }
      })
    } else {
      if (isDisposableResource(material)) {
        resources.add(material)
      }
    }
  })

  resources.forEach((resource) => resource.dispose())
}
