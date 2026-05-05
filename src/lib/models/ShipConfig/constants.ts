import type {
  BodyVariant,
  CockpitVariant,
  EnginesVariant,
  ShipConfig,
  ShipSlot,
  WeaponsVariant,
  WingsVariant,
} from "@/lib/models/ShipConfig/types";

export const SHIP_CONFIG_VERSION = 1;

export const SHIP_SLOT_KEYS: readonly ShipSlot[] = [
  "body",
  "cockpit",
  "wings",
  "engines",
  "weapons",
];

export const SHIP_VARIANT_OPTIONS: {
  body: readonly BodyVariant[];
  cockpit: readonly CockpitVariant[];
  wings: readonly WingsVariant[];
  engines: readonly EnginesVariant[];
  weapons: readonly WeaponsVariant[];
} = {
  body: ["box", "longBox", "tapered"],
  cockpit: ["sphere", "oval", "bubble"],
  wings: ["rect", "triangular", "double"],
  engines: ["cylinder", "cone", "cylinderDual"],
  weapons: ["none", "singleCannon", "dualCannon"],
};

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
