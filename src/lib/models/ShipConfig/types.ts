export type Vector3Tuple = [number, number, number]

export type BodyVariant = 'box' | 'longBox' | 'tapered'
export type CockpitVariant = 'sphere' | 'oval' | 'bubble'
export type WingsVariant = 'rect' | 'triangular' | 'double'
export type EnginesVariant = 'cylinder' | 'cone' | 'cylinderDual'
export type WeaponsVariant = 'none' | 'singleCannon' | 'dualCannon'

export type ShipSlotBaseConfig = {
  color: string
  scale: Vector3Tuple
  offset: Vector3Tuple
  rotation: Vector3Tuple
  pivotLocal: Vector3Tuple
}

export type BodySlotConfig = ShipSlotBaseConfig & {
  variant: BodyVariant
}

export type CockpitSlotConfig = ShipSlotBaseConfig & {
  variant: CockpitVariant
}

export type WingsSlotConfig = ShipSlotBaseConfig & {
  variant: WingsVariant
}

export type EnginesSlotConfig = ShipSlotBaseConfig & {
  variant: EnginesVariant
  aimRotation: Vector3Tuple
  pairSpread: number
}

export type WeaponsSlotConfig = ShipSlotBaseConfig & {
  variant: WeaponsVariant
}

export type ShipSlotConfigMap = {
  body: BodySlotConfig
  cockpit: CockpitSlotConfig
  wings: WingsSlotConfig
  engines: EnginesSlotConfig
  weapons: WeaponsSlotConfig
}

export type ShipSlot = keyof ShipSlotConfigMap

export type ShipConfig = {
  version: 2
} & ShipSlotConfigMap

export type ShipConfigVersion = ShipConfig['version']

export type ShipSlotPatch<TSlot extends ShipSlot> = Partial<ShipSlotConfigMap[TSlot]>
