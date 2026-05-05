import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  SphereGeometry,
  TorusGeometry,
  type BufferGeometry,
} from 'three'
import type {
  BodySlotConfig,
  CockpitSlotConfig,
  EnginesSlotConfig,
  ShipConfig,
  ShipSlot,
  ShipSlotConfigMap,
  WeaponsSlotConfig,
  WingsSlotConfig,
} from '@/lib/models/ShipConfig'
import {
  BODY_BASE_DEPTH,
  SHIP_SLOT_KEYS,
  SLOT_ANCHORS,
} from '@/lib/managers/ShipBuilderModelManager/constants'
import type {
  ShipSlotGroupMap,
  ShipSlotKey,
  ShipSlotSignatureMap,
  SlotBuilderMap,
} from '@/lib/managers/ShipBuilderModelManager/types'
import {
  applyShadowToObject,
  applySlotTransform,
  createSlotMaterial,
  createSlotRenderSignature,
  disposeGroupResources,
  markSlotInHierarchy,
  setSlotHighlight,
} from '@/lib/managers/ShipBuilderModelManager/utils'

export class ShipBuilderModelManager {
  private readonly rootGroup: Group
  private readonly slotGroups: ShipSlotGroupMap
  private readonly slotSignatures: Partial<ShipSlotSignatureMap>
  private readonly slotBuilders: SlotBuilderMap
  private selectedSlot: ShipSlot | null = null
  private invalidSlots = new Set<ShipSlot>()

  constructor(rootGroup: Group) {
    this.rootGroup = rootGroup
    this.slotGroups = this.createSlotGroups()
    this.slotSignatures = {}
    this.slotBuilders = {
      body: this.buildBodySlot,
      cockpit: this.buildCockpitSlot,
      wings: this.buildWingsSlot,
      engines: this.buildEnginesSlot,
      weapons: this.buildWeaponsSlot,
    }
  }

  sync(shipConfig: ShipConfig) {
    SHIP_SLOT_KEYS.forEach((slot) => {
      const slotConfig = shipConfig[slot]
      const nextSignature = createSlotRenderSignature(slotConfig)
      const previousSignature = this.slotSignatures[slot]

      if (previousSignature !== nextSignature) {
        this.rebuildSlot(slot, slotConfig)
        this.slotSignatures[slot] = nextSignature
      }

      const slotGroup = this.slotGroups[slot]
      applySlotTransform(slotGroup, slotConfig)
      this.applyVisualState(slot)
    })
  }

  setSelectedSlot(slot: ShipSlot | null) {
    this.selectedSlot = slot
    SHIP_SLOT_KEYS.forEach((slotKey) => {
      this.applyVisualState(slotKey)
    })
  }

  setInvalidSlots(slots: ShipSlot[]) {
    this.invalidSlots = new Set(slots)
    SHIP_SLOT_KEYS.forEach((slotKey) => {
      this.applyVisualState(slotKey)
    })
  }

  getSlotGroup(slot: ShipSlot): Group {
    return this.slotGroups[slot]
  }

  dispose() {
    SHIP_SLOT_KEYS.forEach((slot) => {
      const slotGroup = this.slotGroups[slot]
      disposeGroupResources(slotGroup)
      slotGroup.clear()
      this.rootGroup.remove(slotGroup)
      delete this.slotSignatures[slot]
    })
  }

  private createSlotGroups(): ShipSlotGroupMap {
    const slotGroups = {
      body: new Group(),
      cockpit: new Group(),
      wings: new Group(),
      engines: new Group(),
      weapons: new Group(),
    } satisfies ShipSlotGroupMap

    SHIP_SLOT_KEYS.forEach((slot) => {
      const slotGroup = slotGroups[slot]
      slotGroup.name = `${slot}SlotGroup`
      markSlotInHierarchy(slotGroup, slot)
      this.rootGroup.add(slotGroup)
    })

    return slotGroups
  }

  private rebuildSlot<TSlot extends ShipSlotKey>(
    slot: TSlot,
    slotConfig: ShipSlotConfigMap[TSlot]
  ) {
    const slotGroup = this.slotGroups[slot]

    disposeGroupResources(slotGroup)
    slotGroup.clear()

    const builder = this.slotBuilders[slot]
    const slotContent = builder(slotConfig)
    slotContent.name = `${slot}SlotContent`
    markSlotInHierarchy(slotContent, slot)
    slotGroup.add(slotContent)
    this.applyVisualState(slot)
  }

  private applyVisualState(slot: ShipSlot) {
    const slotGroup = this.slotGroups[slot]
    setSlotHighlight(slotGroup, {
      isSelected: this.selectedSlot === slot,
      isInvalid: this.invalidSlots.has(slot),
    })
  }

  private buildBodySlot = (slotConfig: BodySlotConfig): Group => {
    const group = new Group()
    const material = createSlotMaterial(slotConfig.color)

    const bodyMesh = new Mesh(this.createBodyGeometry(slotConfig), material)
    bodyMesh.position.z = BODY_BASE_DEPTH * 0.5 - 0.6
    group.add(bodyMesh)

    applyShadowToObject(group)
    return group
  }

  private createBodyGeometry(slotConfig: BodySlotConfig): BufferGeometry {
    if (slotConfig.variant === 'longBox') {
      return new BoxGeometry(2.25, 1.05, 7.1)
    }

    if (slotConfig.variant === 'tapered') {
      const geometry = new CylinderGeometry(0.72, 1.3, 6.3, 7, 1)
      geometry.rotateX(Math.PI / 2)
      return geometry
    }

    return new BoxGeometry(2.6, 1.15, 6)
  }

  private buildCockpitSlot = (slotConfig: CockpitSlotConfig): Group => {
    const group = new Group()
    const material = createSlotMaterial(slotConfig.color)

    const cockpitMesh = new Mesh(this.createCockpitGeometry(slotConfig), material)
    cockpitMesh.position.set(SLOT_ANCHORS.cockpit.x, SLOT_ANCHORS.cockpit.y, SLOT_ANCHORS.cockpit.z)
    group.add(cockpitMesh)

    if (slotConfig.variant === 'bubble') {
      const ringGeometry = new TorusGeometry(0.56, 0.08, 8, 20)
      const ring = new Mesh(ringGeometry, createSlotMaterial('#cbd5e1'))
      ring.rotation.x = Math.PI / 2
      ring.position.set(
        SLOT_ANCHORS.cockpit.x,
        SLOT_ANCHORS.cockpit.y - 0.12,
        SLOT_ANCHORS.cockpit.z
      )
      group.add(ring)
    }

    applyShadowToObject(group)
    return group
  }

  private createCockpitGeometry(slotConfig: CockpitSlotConfig): BufferGeometry {
    if (slotConfig.variant === 'oval') {
      const geometry = new SphereGeometry(0.58, 24, 16)
      geometry.scale(1.25, 0.82, 1.6)
      return geometry
    }

    if (slotConfig.variant === 'bubble') {
      return new SphereGeometry(0.78, 24, 16)
    }

    return new SphereGeometry(0.63, 24, 16)
  }

  private buildWingsSlot = (slotConfig: WingsSlotConfig): Group => {
    const material = createSlotMaterial(slotConfig.color)
    const group = this.createMirroredPair(() => {
      return this.createWingLeftSide(slotConfig, material)
    })

    applyShadowToObject(group)
    return group
  }

  private createWingLeftSide(
    slotConfig: WingsSlotConfig,
    material: ReturnType<typeof createSlotMaterial>
  ): Group {
    const sideGroup = new Group()

    if (slotConfig.variant === 'rect') {
      const wing = new Mesh(new BoxGeometry(2.2, 0.16, 1.5), material)
      wing.position.set(SLOT_ANCHORS.wing.x, SLOT_ANCHORS.wing.y, SLOT_ANCHORS.wing.z)
      sideGroup.add(wing)
      return sideGroup
    }

    if (slotConfig.variant === 'double') {
      const upperWing = new Mesh(new BoxGeometry(1.85, 0.14, 0.95), material)
      upperWing.position.set(
        SLOT_ANCHORS.wing.x + 0.2,
        SLOT_ANCHORS.wing.y + 0.12,
        SLOT_ANCHORS.wing.z + 0.5
      )
      sideGroup.add(upperWing)

      const lowerWing = new Mesh(new BoxGeometry(2.3, 0.12, 1.2), material)
      lowerWing.position.set(
        SLOT_ANCHORS.wing.x - 0.15,
        SLOT_ANCHORS.wing.y - 0.1,
        SLOT_ANCHORS.wing.z - 0.4
      )
      sideGroup.add(lowerWing)
      return sideGroup
    }

    const triangularWing = new Mesh(new ConeGeometry(0.85, 2.6, 4), material)
    triangularWing.rotation.z = Math.PI * 0.5
    triangularWing.position.set(SLOT_ANCHORS.wing.x, SLOT_ANCHORS.wing.y, SLOT_ANCHORS.wing.z)
    sideGroup.add(triangularWing)

    return sideGroup
  }

  private buildEnginesSlot = (slotConfig: EnginesSlotConfig): Group => {
    const material = createSlotMaterial(slotConfig.color)
    const group = this.createMirroredPair(() => {
      return this.createEngineLeftSide(slotConfig, material)
    })

    applyShadowToObject(group)
    return group
  }

  private createEngineLeftSide(
    slotConfig: EnginesSlotConfig,
    material: ReturnType<typeof createSlotMaterial>
  ): Group {
    const sideGroup = new Group()
    const anchor = SLOT_ANCHORS.engine

    if (slotConfig.variant === 'cylinder') {
      const engine = new Mesh(new CylinderGeometry(0.32, 0.38, 1.7, 18), material)
      engine.rotation.z = Math.PI / 2
      engine.position.set(anchor.x, anchor.y, anchor.z)
      sideGroup.add(engine)

      const nozzle = new Mesh(new ConeGeometry(0.26, 0.7, 18), createSlotMaterial('#1f2937'))
      nozzle.rotation.z = Math.PI / 2
      nozzle.position.set(anchor.x - 1.05, anchor.y, anchor.z)
      sideGroup.add(nozzle)

      return sideGroup
    }

    if (slotConfig.variant === 'cone') {
      const cone = new Mesh(new ConeGeometry(0.44, 1.85, 20), material)
      cone.rotation.z = Math.PI / 2
      cone.position.set(anchor.x - 0.15, anchor.y, anchor.z)
      sideGroup.add(cone)

      const core = new Mesh(
        new CylinderGeometry(0.12, 0.12, 1.2, 14),
        createSlotMaterial('#0f172a')
      )
      core.rotation.z = Math.PI / 2
      core.position.set(anchor.x - 0.6, anchor.y, anchor.z)
      sideGroup.add(core)

      return sideGroup
    }

    const topEngine = new Mesh(new CylinderGeometry(0.2, 0.28, 1.5, 14), material)
    topEngine.rotation.z = Math.PI / 2
    topEngine.position.set(anchor.x, anchor.y + 0.2, anchor.z)
    sideGroup.add(topEngine)

    const bottomEngine = new Mesh(new CylinderGeometry(0.2, 0.28, 1.5, 14), material)
    bottomEngine.rotation.z = Math.PI / 2
    bottomEngine.position.set(anchor.x, anchor.y - 0.2, anchor.z)
    sideGroup.add(bottomEngine)

    const bridge = new Mesh(new BoxGeometry(0.25, 0.22, 0.95), createSlotMaterial('#334155'))
    bridge.position.set(anchor.x + 0.2, anchor.y, anchor.z)
    sideGroup.add(bridge)

    return sideGroup
  }

  private buildWeaponsSlot = (slotConfig: WeaponsSlotConfig): Group => {
    if (slotConfig.variant === 'none') {
      return new Group()
    }

    const material = createSlotMaterial(slotConfig.color)
    const group = this.createMirroredPair(() => {
      return this.createWeaponLeftSide(slotConfig, material)
    })

    applyShadowToObject(group)
    return group
  }

  private createWeaponLeftSide(
    slotConfig: WeaponsSlotConfig,
    material: ReturnType<typeof createSlotMaterial>
  ): Group {
    const sideGroup = new Group()
    const anchor = SLOT_ANCHORS.weapon

    if (slotConfig.variant === 'singleCannon') {
      const cannon = new Mesh(new CylinderGeometry(0.09, 0.11, 1.35, 14), material)
      cannon.rotation.z = Math.PI / 2
      cannon.position.set(anchor.x, anchor.y, anchor.z)
      sideGroup.add(cannon)

      const tip = new Mesh(new ConeGeometry(0.1, 0.34, 12), createSlotMaterial('#0b1220'))
      tip.rotation.z = Math.PI / 2
      tip.position.set(anchor.x - 0.82, anchor.y, anchor.z)
      sideGroup.add(tip)

      return sideGroup
    }

    const upperCannon = new Mesh(new CylinderGeometry(0.07, 0.09, 1.15, 12), material)
    upperCannon.rotation.z = Math.PI / 2
    upperCannon.position.set(anchor.x, anchor.y + 0.12, anchor.z)
    sideGroup.add(upperCannon)

    const lowerCannon = new Mesh(new CylinderGeometry(0.07, 0.09, 1.15, 12), material)
    lowerCannon.rotation.z = Math.PI / 2
    lowerCannon.position.set(anchor.x, anchor.y - 0.12, anchor.z)
    sideGroup.add(lowerCannon)

    const mount = new Mesh(new BoxGeometry(0.25, 0.34, 0.26), createSlotMaterial('#1e293b'))
    mount.position.set(anchor.x + 0.3, anchor.y, anchor.z)
    sideGroup.add(mount)

    return sideGroup
  }

  private createMirroredPair(createLeftSide: () => Group): Group {
    const pairGroup = new Group()
    const leftSide = createLeftSide()
    leftSide.name = 'leftSide'

    const rightSide = leftSide.clone(true)
    rightSide.name = 'rightSide'
    rightSide.scale.x = -1

    pairGroup.add(leftSide)
    pairGroup.add(rightSide)

    return pairGroup
  }
}
