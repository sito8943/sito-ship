export const MAX_DEVICE_PIXEL_RATIO = 2;

export const CAMERA_SETTINGS = {
  fov: 60,
  near: 0.1,
  far: 200,
  position: {
    x: 8,
    y: 5,
    z: 10,
  },
} as const;

export const SCENE_COLORS = {
  background: "#05080f",
  grid: "#142032",
  gridCenter: "#355582",
} as const;
