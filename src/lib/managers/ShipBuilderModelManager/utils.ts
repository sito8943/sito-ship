import {
  Mesh,
  MeshStandardMaterial,
  type BufferGeometry,
  type Group,
  type Material,
  type Object3D,
} from "three";
import type { ShipSlot, ShipSlotConfigMap } from "../../models/ShipConfig";

export const createSlotMaterial = (color: string): MeshStandardMaterial => {
  return new MeshStandardMaterial({
    color,
    roughness: 0.55,
    metalness: 0.2,
    flatShading: false,
  });
};

export const applyShadowToObject = (object: Object3D) => {
  object.traverse((node) => {
    if (!(node instanceof Mesh)) {
      return;
    }

    node.castShadow = true;
    node.receiveShadow = true;
  });
};

export const applySlotTransform = (
  group: Group,
  slotConfig: ShipSlotConfigMap[ShipSlot],
) => {
  group.position.set(
    slotConfig.offset[0],
    slotConfig.offset[1],
    slotConfig.offset[2],
  );
  group.scale.set(slotConfig.scale[0], slotConfig.scale[1], slotConfig.scale[2]);
};

export const createSlotSignature = (
  slotConfig: ShipSlotConfigMap[ShipSlot],
): string => {
  return [
    slotConfig.variant,
    slotConfig.color,
    slotConfig.scale.join(","),
    slotConfig.offset.join(","),
  ].join("|");
};

export const disposeGroupResources = (group: Group) => {
  const geometries = new Set<BufferGeometry>();
  const materials = new Set<Material>();

  group.traverse((node) => {
    if (!(node instanceof Mesh)) {
      return;
    }

    geometries.add(node.geometry);
    if (Array.isArray(node.material)) {
      node.material.forEach((material) => materials.add(material));
    } else {
      materials.add(node.material);
    }
  });

  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
};
