import type {
  ShipSlot,
  ShipSlotConfigMap,
  Vector3Tuple,
} from "../../lib/models/ShipConfig";

export const createVector3Tuple = (
  x: number,
  y: number,
  z: number,
): Vector3Tuple => {
  return [x, y, z];
};

export const updateTupleAxis = (
  tuple: Vector3Tuple,
  index: 0 | 1 | 2,
  value: number,
): Vector3Tuple => {
  const nextTuple = [...tuple] as Vector3Tuple;
  nextTuple[index] = value;
  return nextTuple;
};

export const getUniformScale = (scale: Vector3Tuple): number => {
  return (scale[0] + scale[1] + scale[2]) / 3;
};

export const formatVariantLabel = (variant: string): string => {
  return variant
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase());
};

export const getSlotConfig = <TSlot extends ShipSlot>(
  shipConfig: {
    [TS in ShipSlot]: ShipSlotConfigMap[TS];
  },
  slot: TSlot,
) => {
  return shipConfig[slot];
};
