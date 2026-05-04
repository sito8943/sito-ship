import type { ShipConfig } from "./types";

export const SHIP_CONFIG_VERSION = 1;

export const DEFAULT_SHIP_CONFIG: ShipConfig = {
  version: SHIP_CONFIG_VERSION,
  body: {
    variant: "box",
    color: "#4f46e5",
    scale: [1, 1, 1],
    offset: [0, 0, 0],
  },
  cockpit: {
    variant: "sphere",
    color: "#38bdf8",
    scale: [1, 1, 1],
    offset: [0, 0.35, 0.2],
  },
  wings: {
    variant: "triangular",
    color: "#64748b",
    scale: [1, 1, 1],
    offset: [0, 0, 0],
  },
  engines: {
    variant: "cylinderDual",
    color: "#111827",
    scale: [1, 1, 1],
    offset: [0, 0, 0],
  },
  weapons: {
    variant: "none",
    color: "#94a3b8",
    scale: [1, 1, 1],
    offset: [0, 0, 0],
  },
};
