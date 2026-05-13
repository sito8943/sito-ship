import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  SphereGeometry,
  TorusGeometry,
  Vector3,
  type BufferGeometry,
} from 'three'
import type {
  BodySlotConfig,
  CockpitSlotConfig,
  EnginesSlotConfig,
  ShipConfig,
  ShipSlot,
  ShipSlotConfigMap,
  Vector3Tuple,
  WeaponsSlotConfig,
  WingsSlotConfig,
} from '@/lib/models/ShipConfig'
import type { ShipPart, ShipPartMirrorRole } from '@/lib/models'
import {
  BODY_BASE_DEPTH,
  SHIP_SLOT_KEYS,
  SLOT_ANCHORS,
} from '@/lib/managers/ShipBuilderModelManager/constants'
import type {
  ShipPartPair,
  ShipPartPairMap,
  ShipSlotGroupMap,
  ShipSlotKey,
  ShipSlotSignatureMap,
  ShipSymmetricSlotKey,
  SlotBuilderMap,
} from '@/lib/managers/ShipBuilderModelManager/types'
import {
  applyShadowToObject,
  applySlotTransform,
  createSlotMaterial,
  createSlotRenderSignature,
  disposeGroupResources,
  markSlotInHierarchy,
  mirrorPointAcrossShipLocalSymmetryPlane,
  mirrorQuaternionAcrossShipLocalSymmetryPlane,
  setSlotHighlight,
} from '@/lib/managers/ShipBuilderModelManager/utils'

export class ShipBuilderModelManager {
  private static readonly PART_CONTENT_GROUP_NAME = 'partContent'
  private static readonly SYMMETRIC_AIM_PIVOT_GROUP_NAME = 'symmetricAimPivot'
  private static readonly SYMMETRIC_AIM_CONTENT_GROUP_NAME = 'symmetricAimContent'
  private static readonly ENGINE_OUTER_TIP_OFFSET_X = -0.85

  private readonly rootGroup: Group
  private readonly slotGroups: ShipSlotGroupMap
  private readonly slotSignatures: Partial<ShipSlotSignatureMap>
  private readonly slotPartPairs: ShipPartPairMap
  private readonly slotBuilders: SlotBuilderMap
  private selectedSlot: ShipSlot | null = null
  private invalidSlots = new Set<ShipSlot>()
  private symmetryGroupIdCounter = 0
  private partIdCounter = 0

  constructor(rootGroup: Group) {
    this.rootGroup = rootGroup
    this.slotGroups = this.createSlotGroups()
    this.slotSignatures = {}
    this.slotPartPairs = {}
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
      if (this.isSymmetricSlot(slot)) {
        const symmetricSlotConfig = slotConfig as
          | ShipSlotConfigMap['wings']
          | ShipSlotConfigMap['engines']
          | ShipSlotConfigMap['weapons']
        this.syncSymmetricSlotVisual(slot, slotConfig.pivotLocal, symmetricSlotConfig.pairSpread)
        this.applySymmetricAimVisual(slot, symmetricSlotConfig.aimRotation)
      }
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

  getSlotPartPair<TSlot extends ShipSymmetricSlotKey>(slot: TSlot): ShipPartPair<TSlot> | null {
    const slotPair = this.slotPartPairs[slot]
    return slotPair ? (slotPair as ShipPartPair<TSlot>) : null
  }

  getSymmetricMasterSideGroup(slot: ShipSlot): Group | null {
    if (!this.isSymmetricSlot(slot)) {
      return null
    }

    return this.findSymmetricMasterSideGroup(slot)
  }

  getEngineExhaustWorldPositions(out: Vector3[]): number {
    const enginesGroup = this.slotGroups.engines
    enginesGroup.updateMatrixWorld(true)
    let count = 0
    enginesGroup.traverse((obj) => {
      if (obj.userData.isEngineExhaust !== true) {
        return
      }
      let target = out[count]
      if (!target) {
        target = new Vector3()
        out[count] = target
      }
      obj.getWorldPosition(target)
      count += 1
    })
    return count
  }

  getSymmetricAimPivotGroup(slot: ShipSlot): Group | null {
    const masterSide = this.getSymmetricMasterSideGroup(slot)
    if (!masterSide) {
      return null
    }

    const aimPivot = masterSide.getObjectByName(
      ShipBuilderModelManager.SYMMETRIC_AIM_PIVOT_GROUP_NAME
    )
    return aimPivot instanceof Group ? aimPivot : null
  }

  dispose() {
    SHIP_SLOT_KEYS.forEach((slot) => {
      const slotGroup = this.slotGroups[slot]
      disposeGroupResources(slotGroup)
      slotGroup.clear()
      this.rootGroup.remove(slotGroup)
      delete this.slotSignatures[slot]
    })

    delete this.slotPartPairs.wings
    delete this.slotPartPairs.engines
    delete this.slotPartPairs.weapons
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

  private findSymmetricMasterSideGroup(slot: ShipSymmetricSlotKey): Group | null {
    const slotGroup = this.slotGroups[slot]
    const slotContent = slotGroup.children[0]
    if (!(slotContent instanceof Group)) {
      return null
    }

    const masterSide = slotContent.children.find(
      (node): node is Group => node instanceof Group && node.name === 'masterSide'
    )
    return masterSide ?? null
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
    const group = this.createSymmetricSlotPair(
      'wings',
      slotConfig.variant,
      slotConfig.pivotLocal,
      () => {
        return this.createWingLeftSide(slotConfig, material)
      }
    )

    applyShadowToObject(group)
    return group
  }

  private createWingLeftSide(
    slotConfig: WingsSlotConfig,
    material: ReturnType<typeof createSlotMaterial>
  ): Group {
    const sideGroup = new Group()
    const aimPivot = this.createSymmetricAimPivotGroup({
      slot: 'wings',
      aimRotation: slotConfig.aimRotation,
      pivotPoint: [SLOT_ANCHORS.wing.x, SLOT_ANCHORS.wing.y, SLOT_ANCHORS.wing.z],
    })
    const aimContent = this.getSymmetricAimContentGroup(aimPivot)

    if (slotConfig.variant === 'rect') {
      const wing = new Mesh(new BoxGeometry(2.2, 0.16, 1.5), material)
      wing.position.set(SLOT_ANCHORS.wing.x, SLOT_ANCHORS.wing.y, SLOT_ANCHORS.wing.z)
      aimContent.add(wing)
      sideGroup.add(aimPivot)
      return sideGroup
    }

    if (slotConfig.variant === 'double') {
      const upperWing = new Mesh(new BoxGeometry(1.85, 0.14, 0.95), material)
      upperWing.position.set(
        SLOT_ANCHORS.wing.x + 0.2,
        SLOT_ANCHORS.wing.y + 0.12,
        SLOT_ANCHORS.wing.z + 0.5
      )
      aimContent.add(upperWing)

      const lowerWing = new Mesh(new BoxGeometry(2.3, 0.12, 1.2), material)
      lowerWing.position.set(
        SLOT_ANCHORS.wing.x - 0.15,
        SLOT_ANCHORS.wing.y - 0.1,
        SLOT_ANCHORS.wing.z - 0.4
      )
      aimContent.add(lowerWing)
      sideGroup.add(aimPivot)
      return sideGroup
    }

    const triangularWing = new Mesh(new ConeGeometry(0.85, 2.6, 4), material)
    triangularWing.rotation.z = Math.PI * 0.5
    triangularWing.position.set(SLOT_ANCHORS.wing.x, SLOT_ANCHORS.wing.y, SLOT_ANCHORS.wing.z)
    aimContent.add(triangularWing)

    sideGroup.add(aimPivot)
    return sideGroup
  }

  private buildEnginesSlot = (slotConfig: EnginesSlotConfig): Group => {
    const material = createSlotMaterial(slotConfig.color)
    const group = this.createSymmetricSlotPair(
      'engines',
      slotConfig.variant,
      slotConfig.pivotLocal,
      () => {
        return this.createEngineLeftSide(slotConfig, material)
      }
    )

    applyShadowToObject(group)
    return group
  }

  private createEngineLeftSide(
    slotConfig: EnginesSlotConfig,
    material: ReturnType<typeof createSlotMaterial>
  ): Group {
    const sideGroup = new Group()
    const anchor = SLOT_ANCHORS.engine
    const aimPivot = this.createEngineAimPivotGroup(slotConfig, anchor)
    const aimContent = this.getSymmetricAimContentGroup(aimPivot)

    if (slotConfig.variant === 'cylinder') {
      const engine = new Mesh(new CylinderGeometry(0.32, 0.38, 1.7, 18), material)
      engine.rotation.z = Math.PI / 2
      engine.position.set(anchor.x, anchor.y, anchor.z)
      aimContent.add(engine)

      const nozzle = new Mesh(new ConeGeometry(0.26, 0.7, 18), createSlotMaterial('#1f2937'))
      nozzle.rotation.z = Math.PI / 2
      nozzle.position.set(anchor.x - 1.05, anchor.y, anchor.z)
      aimContent.add(nozzle)

      this.addEngineExhaustMarker(aimContent, anchor.x - 1.4, anchor.y, anchor.z)

      sideGroup.add(aimPivot)
      return sideGroup
    }

    if (slotConfig.variant === 'cone') {
      const cone = new Mesh(new ConeGeometry(0.44, 1.85, 20), material)
      cone.rotation.z = Math.PI / 2
      cone.position.set(anchor.x - 0.15, anchor.y, anchor.z)
      aimContent.add(cone)

      const core = new Mesh(
        new CylinderGeometry(0.12, 0.12, 1.2, 14),
        createSlotMaterial('#0f172a')
      )
      core.rotation.z = Math.PI / 2
      core.position.set(anchor.x - 0.6, anchor.y, anchor.z)
      aimContent.add(core)

      this.addEngineExhaustMarker(aimContent, anchor.x - 1.07, anchor.y, anchor.z)

      sideGroup.add(aimPivot)
      return sideGroup
    }

    const topEngine = new Mesh(new CylinderGeometry(0.2, 0.28, 1.5, 14), material)
    topEngine.rotation.z = Math.PI / 2
    topEngine.position.set(anchor.x, anchor.y + 0.2, anchor.z)
    aimContent.add(topEngine)

    const bottomEngine = new Mesh(new CylinderGeometry(0.2, 0.28, 1.5, 14), material)
    bottomEngine.rotation.z = Math.PI / 2
    bottomEngine.position.set(anchor.x, anchor.y - 0.2, anchor.z)
    aimContent.add(bottomEngine)

    const bridge = new Mesh(new BoxGeometry(0.25, 0.22, 0.95), createSlotMaterial('#334155'))
    bridge.position.set(anchor.x + 0.2, anchor.y, anchor.z)
    aimContent.add(bridge)

    this.addEngineExhaustMarker(aimContent, anchor.x - 0.75, anchor.y + 0.2, anchor.z)
    this.addEngineExhaustMarker(aimContent, anchor.x - 0.75, anchor.y - 0.2, anchor.z)

    sideGroup.add(aimPivot)
    return sideGroup
  }

  private addEngineExhaustMarker(parent: Group, x: number, y: number, z: number) {
    const marker = new Group()
    marker.name = 'engineExhaustMarker'
    marker.position.set(x, y, z)
    marker.userData.isEngineExhaust = true
    parent.add(marker)
  }

  private buildWeaponsSlot = (slotConfig: WeaponsSlotConfig): Group => {
    if (slotConfig.variant === 'none') {
      delete this.slotPartPairs.weapons
      return new Group()
    }

    const material = createSlotMaterial(slotConfig.color)
    const group = this.createSymmetricSlotPair(
      'weapons',
      slotConfig.variant,
      slotConfig.pivotLocal,
      () => {
        return this.createWeaponLeftSide(slotConfig, material)
      }
    )

    applyShadowToObject(group)
    return group
  }

  private createWeaponLeftSide(
    slotConfig: WeaponsSlotConfig,
    material: ReturnType<typeof createSlotMaterial>
  ): Group {
    const sideGroup = new Group()
    const anchor = SLOT_ANCHORS.weapon
    const aimPivot = this.createSymmetricAimPivotGroup({
      slot: 'weapons',
      aimRotation: slotConfig.aimRotation,
      pivotPoint: [anchor.x, anchor.y, anchor.z],
    })
    const aimContent = this.getSymmetricAimContentGroup(aimPivot)

    if (slotConfig.variant === 'singleCannon') {
      const cannon = new Mesh(new CylinderGeometry(0.09, 0.11, 1.35, 14), material)
      cannon.rotation.z = Math.PI / 2
      cannon.position.set(anchor.x, anchor.y, anchor.z)
      aimContent.add(cannon)

      const tip = new Mesh(new ConeGeometry(0.1, 0.34, 12), createSlotMaterial('#0b1220'))
      tip.rotation.z = Math.PI / 2
      tip.position.set(anchor.x - 0.82, anchor.y, anchor.z)
      aimContent.add(tip)

      sideGroup.add(aimPivot)
      return sideGroup
    }

    const upperCannon = new Mesh(new CylinderGeometry(0.07, 0.09, 1.15, 12), material)
    upperCannon.rotation.z = Math.PI / 2
    upperCannon.position.set(anchor.x, anchor.y + 0.12, anchor.z)
    aimContent.add(upperCannon)

    const lowerCannon = new Mesh(new CylinderGeometry(0.07, 0.09, 1.15, 12), material)
    lowerCannon.rotation.z = Math.PI / 2
    lowerCannon.position.set(anchor.x, anchor.y - 0.12, anchor.z)
    aimContent.add(lowerCannon)

    const mount = new Mesh(new BoxGeometry(0.25, 0.34, 0.26), createSlotMaterial('#1e293b'))
    mount.position.set(anchor.x + 0.3, anchor.y, anchor.z)
    aimContent.add(mount)

    sideGroup.add(aimPivot)
    return sideGroup
  }

  private createSymmetricSlotPair<TSlot extends ShipSymmetricSlotKey>(
    slot: TSlot,
    variant: ShipSlotConfigMap[TSlot]['variant'],
    pivotLocal: Vector3Tuple,
    createMasterSide: () => Group
  ): Group {
    const pairGroup = new Group()
    const masterSide = this.createPartSideGroup('masterSide', createMasterSide())

    const symmetryGroupId = this.createNextSymmetryGroupId(slot)
    const masterPart = this.createSymmetricPartFromGroup(
      slot,
      variant,
      'original',
      symmetryGroupId,
      null,
      masterSide
    )
    masterPart.pivotLocal = [...pivotLocal] as Vector3Tuple
    const mirroredPart = this.createMirroredPart(masterPart)
    this.slotPartPairs[slot] = {
      symmetryGroupId,
      masterPart,
      mirroredPart,
    }

    const mirroredSide = masterSide.clone(true)
    mirroredSide.name = 'mirroredSide'
    this.applyMirroredContentReflection(mirroredSide)

    this.applyPartTransform(masterSide, masterPart)
    this.applyPartTransform(mirroredSide, mirroredPart)

    masterSide.userData.shipPartId = masterPart.id
    masterSide.userData.mirrorRole = masterPart.mirrorRole
    mirroredSide.userData.shipPartId = mirroredPart.id
    mirroredSide.userData.mirrorRole = mirroredPart.mirrorRole

    pairGroup.add(masterSide)
    pairGroup.add(mirroredSide)

    return pairGroup
  }

  private createSymmetricPartFromGroup<TSlot extends ShipSymmetricSlotKey>(
    slot: TSlot,
    variant: ShipSlotConfigMap[TSlot]['variant'],
    mirrorRole: ShipPartMirrorRole,
    symmetryGroupId: string | null,
    mirrorOfPartId: string | null,
    group: Group
  ): ShipPart<TSlot> {
    return {
      id: this.createNextPartId(slot, mirrorRole),
      slot,
      variant,
      mirrorRole,
      symmetryGroupId,
      mirrorOfPartId,
      localPosition: [group.position.x, group.position.y, group.position.z],
      localRotation: [
        group.quaternion.x,
        group.quaternion.y,
        group.quaternion.z,
        group.quaternion.w,
      ],
      localScale: [group.scale.x, group.scale.y, group.scale.z],
      pivotLocal: [0, 0, 0],
    }
  }

  private createMirroredPart<TSlot extends ShipSymmetricSlotKey>(
    masterPart: ShipPart<TSlot>,
    mirroredPartId?: string
  ): ShipPart<TSlot> {
    return {
      ...masterPart,
      id: mirroredPartId ?? this.createNextPartId(masterPart.slot, 'mirrored'),
      mirrorRole: 'mirrored',
      mirrorOfPartId: masterPart.id,
      localPosition: mirrorPointAcrossShipLocalSymmetryPlane(masterPart.localPosition),
      localRotation: mirrorQuaternionAcrossShipLocalSymmetryPlane(masterPart.localRotation),
      localScale: [...masterPart.localScale] as Vector3Tuple,
      pivotLocal: mirrorPointAcrossShipLocalSymmetryPlane(masterPart.pivotLocal),
    }
  }

  private isSymmetricSlot(slot: ShipSlot): slot is ShipSymmetricSlotKey {
    return slot === 'wings' || slot === 'engines' || slot === 'weapons'
  }

  private syncSymmetricSlotVisual(
    slot: ShipSymmetricSlotKey,
    pivotLocal?: Vector3Tuple,
    pairSpread?: number
  ) {
    const slotPair = this.slotPartPairs[slot]
    if (!slotPair) {
      return
    }

    if (pivotLocal) {
      slotPair.masterPart = {
        ...slotPair.masterPart,
        pivotLocal: [...pivotLocal] as Vector3Tuple,
      }
    }
    if (pairSpread !== undefined) {
      slotPair.masterPart = {
        ...slotPair.masterPart,
        localPosition: [
          -pairSpread,
          slotPair.masterPart.localPosition[1],
          slotPair.masterPart.localPosition[2],
        ],
      }
    }

    slotPair.mirroredPart = this.createMirroredPart(slotPair.masterPart, slotPair.mirroredPart.id)

    const slotGroup = this.slotGroups[slot]
    const slotContent = slotGroup.children[0]
    if (!(slotContent instanceof Group)) {
      return
    }

    const masterSide = slotContent.children.find(
      (node): node is Group => node instanceof Group && node.name === 'masterSide'
    )
    const mirroredSide = slotContent.children.find(
      (node): node is Group => node instanceof Group && node.name === 'mirroredSide'
    )

    if (!masterSide || !mirroredSide) {
      return
    }

    this.applyPartTransform(masterSide, slotPair.masterPart)
    this.applyPartTransform(mirroredSide, slotPair.mirroredPart)

    masterSide.userData.shipPartId = slotPair.masterPart.id
    masterSide.userData.mirrorRole = slotPair.masterPart.mirrorRole
    mirroredSide.userData.shipPartId = slotPair.mirroredPart.id
    mirroredSide.userData.mirrorRole = slotPair.mirroredPart.mirrorRole
  }

  private applyPartTransform(group: Group, part: ShipPart) {
    const positionWithPivot = [
      part.localPosition[0] + part.pivotLocal[0],
      part.localPosition[1] + part.pivotLocal[1],
      part.localPosition[2] + part.pivotLocal[2],
    ] as const
    group.position.set(positionWithPivot[0], positionWithPivot[1], positionWithPivot[2])
    group.quaternion.set(
      part.localRotation[0],
      part.localRotation[1],
      part.localRotation[2],
      part.localRotation[3]
    )
    group.scale.set(part.localScale[0], part.localScale[1], part.localScale[2])

    // Pivot compensation lets rotation/scale happen around part.pivotLocal.
    const partContent = group.children.find(
      (node): node is Group =>
        node instanceof Group && node.name === ShipBuilderModelManager.PART_CONTENT_GROUP_NAME
    )
    if (!partContent) {
      return
    }

    partContent.position.set(-part.pivotLocal[0], -part.pivotLocal[1], -part.pivotLocal[2])
  }

  private applyMirroredContentReflection(sideGroup: Group) {
    const partContent = sideGroup.children.find(
      (node): node is Group =>
        node instanceof Group && node.name === ShipBuilderModelManager.PART_CONTENT_GROUP_NAME
    )
    if (!partContent) {
      return
    }

    partContent.scale.x = -Math.abs(partContent.scale.x)
  }

  private createPartSideGroup(name: 'masterSide' | 'mirroredSide', content: Group): Group {
    const sideGroup = new Group()
    sideGroup.name = name
    content.name = ShipBuilderModelManager.PART_CONTENT_GROUP_NAME
    sideGroup.add(content)
    return sideGroup
  }

  private createEngineAimPivotGroup(
    slotConfig: EnginesSlotConfig,
    anchor: { x: number; y: number; z: number }
  ): Group {
    const pivotPoint: Vector3Tuple = [
      anchor.x + ShipBuilderModelManager.ENGINE_OUTER_TIP_OFFSET_X,
      anchor.y,
      anchor.z,
    ]
    return this.createSymmetricAimPivotGroup({
      slot: 'engines',
      aimRotation: slotConfig.aimRotation,
      pivotPoint,
    })
  }

  private createSymmetricAimPivotGroup({
    slot,
    aimRotation,
    pivotPoint,
  }: {
    slot: ShipSymmetricSlotKey
    aimRotation: Vector3Tuple
    pivotPoint: Vector3Tuple
  }): Group {
    const aimPivot = new Group()
    aimPivot.name = ShipBuilderModelManager.SYMMETRIC_AIM_PIVOT_GROUP_NAME
    aimPivot.userData.aimSlot = slot
    aimPivot.position.set(pivotPoint[0], pivotPoint[1], pivotPoint[2])
    aimPivot.rotation.set(aimRotation[0], aimRotation[1], aimRotation[2], 'YXZ')

    const aimContent = new Group()
    aimContent.name = ShipBuilderModelManager.SYMMETRIC_AIM_CONTENT_GROUP_NAME
    // Pivot compensation so aim rotations happen around pivotPoint.
    aimContent.position.set(-pivotPoint[0], -pivotPoint[1], -pivotPoint[2])
    aimPivot.add(aimContent)

    return aimPivot
  }

  private getSymmetricAimContentGroup(aimPivot: Group): Group {
    const existingAimContent = aimPivot.children.find(
      (node): node is Group =>
        node instanceof Group &&
        node.name === ShipBuilderModelManager.SYMMETRIC_AIM_CONTENT_GROUP_NAME
    )
    if (existingAimContent) {
      return existingAimContent
    }

    const aimContent = new Group()
    aimContent.name = ShipBuilderModelManager.SYMMETRIC_AIM_CONTENT_GROUP_NAME
    aimPivot.add(aimContent)
    return aimContent
  }

  private applySymmetricAimVisual(slot: ShipSymmetricSlotKey, aimRotation: Vector3Tuple) {
    const slotGroup = this.slotGroups[slot]
    const slotContent = slotGroup.children[0]
    if (!(slotContent instanceof Group)) {
      return
    }

    const aimPivots = this.collectSymmetricAimPivots(slotContent)
    aimPivots.forEach((aimPivot) => {
      aimPivot.rotation.set(aimRotation[0], aimRotation[1], aimRotation[2], 'YXZ')
    })
  }

  private collectSymmetricAimPivots(root: Group): Group[] {
    const aimPivots: Group[] = []
    root.traverse((node) => {
      if (
        node instanceof Group &&
        node.name === ShipBuilderModelManager.SYMMETRIC_AIM_PIVOT_GROUP_NAME
      ) {
        aimPivots.push(node)
      }
    })
    return aimPivots
  }

  private createNextSymmetryGroupId(slot: ShipSymmetricSlotKey): string {
    this.symmetryGroupIdCounter += 1
    return `${slot}SymmetryGroup${this.symmetryGroupIdCounter}`
  }

  private createNextPartId(slot: ShipSlot, mirrorRole: ShipPartMirrorRole): string {
    this.partIdCounter += 1
    return `${slot}Part${mirrorRole}${this.partIdCounter}`
  }
}
