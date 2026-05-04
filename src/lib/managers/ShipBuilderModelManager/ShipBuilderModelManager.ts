import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  SphereGeometry,
  TorusGeometry,
  type BufferGeometry,
} from "three";
import type {
  BodySlotConfig,
  CockpitSlotConfig,
  ShipConfig,
  ShipSlotConfigMap,
  WingsSlotConfig,
} from "../../models/ShipConfig";
import { BODY_BASE_DEPTH, SHIP_SLOT_KEYS } from "./constants";
import type {
  ShipSlotGroupMap,
  ShipSlotKey,
  ShipSlotSignatureMap,
  SlotBuilderMap,
} from "./types";
import {
  applyShadowToObject,
  applySlotTransform,
  createSlotMaterial,
  createSlotSignature,
  disposeGroupResources,
} from "./utils";

export class ShipBuilderModelManager {
  private readonly rootGroup: Group;
  private readonly slotGroups: ShipSlotGroupMap;
  private readonly slotSignatures: Partial<ShipSlotSignatureMap>;
  private readonly slotBuilders: SlotBuilderMap;

  constructor(rootGroup: Group) {
    this.rootGroup = rootGroup;
    this.slotGroups = this.createSlotGroups();
    this.slotSignatures = {};
    this.slotBuilders = {
      body: this.buildBodySlot,
      cockpit: this.buildCockpitSlot,
      wings: this.buildWingsSlot,
      engines: this.buildEnginesSlot,
      weapons: this.buildWeaponsSlot,
    };
  }

  sync(shipConfig: ShipConfig) {
    SHIP_SLOT_KEYS.forEach((slot) => {
      const slotConfig = shipConfig[slot];
      const nextSignature = createSlotSignature(slotConfig);
      const previousSignature = this.slotSignatures[slot];

      if (previousSignature === nextSignature) {
        return;
      }

      this.rebuildSlot(slot, slotConfig);
      this.slotSignatures[slot] = nextSignature;
    });
  }

  dispose() {
    SHIP_SLOT_KEYS.forEach((slot) => {
      const slotGroup = this.slotGroups[slot];
      disposeGroupResources(slotGroup);
      slotGroup.clear();
      this.rootGroup.remove(slotGroup);
      delete this.slotSignatures[slot];
    });
  }

  private createSlotGroups(): ShipSlotGroupMap {
    const slotGroups = {
      body: new Group(),
      cockpit: new Group(),
      wings: new Group(),
      engines: new Group(),
      weapons: new Group(),
    } satisfies ShipSlotGroupMap;

    SHIP_SLOT_KEYS.forEach((slot) => {
      const slotGroup = slotGroups[slot];
      slotGroup.name = `${slot}SlotGroup`;
      this.rootGroup.add(slotGroup);
    });

    return slotGroups;
  }

  private rebuildSlot<TSlot extends ShipSlotKey>(
    slot: TSlot,
    slotConfig: ShipSlotConfigMap[TSlot],
  ) {
    const slotGroup = this.slotGroups[slot];

    disposeGroupResources(slotGroup);
    slotGroup.clear();

    const builder = this.slotBuilders[slot];
    const slotContent = builder(slotConfig);
    slotContent.name = `${slot}SlotContent`;
    slotGroup.add(slotContent);
  }

  private buildBodySlot = (slotConfig: BodySlotConfig): Group => {
    const group = new Group();
    const material = createSlotMaterial(slotConfig.color);

    const bodyMesh = new Mesh(this.createBodyGeometry(slotConfig), material);
    bodyMesh.position.z = BODY_BASE_DEPTH * 0.5 - 0.6;
    group.add(bodyMesh);

    applyShadowToObject(group);
    applySlotTransform(group, slotConfig);

    return group;
  };

  private createBodyGeometry(slotConfig: BodySlotConfig): BufferGeometry {
    if (slotConfig.variant === "longBox") {
      return new BoxGeometry(2.25, 1.05, 7.1);
    }

    if (slotConfig.variant === "tapered") {
      const geometry = new CylinderGeometry(0.72, 1.3, 6.3, 7, 1);
      geometry.rotateX(Math.PI / 2);
      return geometry;
    }

    return new BoxGeometry(2.6, 1.15, 6);
  }

  private buildCockpitSlot = (slotConfig: CockpitSlotConfig): Group => {
    const group = new Group();
    const material = createSlotMaterial(slotConfig.color);

    const cockpitMesh = new Mesh(this.createCockpitGeometry(slotConfig), material);
    cockpitMesh.position.set(0, 0.58, 1.08);
    group.add(cockpitMesh);

    if (slotConfig.variant === "bubble") {
      const ringGeometry = new TorusGeometry(0.56, 0.08, 8, 20);
      const ring = new Mesh(ringGeometry, createSlotMaterial("#cbd5e1"));
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, 0.46, 1.08);
      group.add(ring);
    }

    applyShadowToObject(group);
    applySlotTransform(group, slotConfig);

    return group;
  };

  private createCockpitGeometry(slotConfig: CockpitSlotConfig): BufferGeometry {
    if (slotConfig.variant === "oval") {
      const geometry = new SphereGeometry(0.58, 24, 16);
      geometry.scale(1.25, 0.82, 1.6);
      return geometry;
    }

    if (slotConfig.variant === "bubble") {
      return new SphereGeometry(0.78, 24, 16);
    }

    return new SphereGeometry(0.63, 24, 16);
  }

  private buildWingsSlot = (slotConfig: WingsSlotConfig): Group => {
    const group = new Group();
    const material = createSlotMaterial(slotConfig.color);

    const leftWing = this.createWingSide("left", slotConfig, material);
    const rightWing = this.createWingSide("right", slotConfig, material);

    group.add(leftWing);
    group.add(rightWing);

    applyShadowToObject(group);
    applySlotTransform(group, slotConfig);

    return group;
  };

  private createWingSide(
    side: "left" | "right",
    slotConfig: WingsSlotConfig,
    material: ReturnType<typeof createSlotMaterial>,
  ): Group {
    const sideGroup = new Group();
    const sideFactor = side === "left" ? -1 : 1;

    if (slotConfig.variant === "rect") {
      const wing = new Mesh(new BoxGeometry(2.2, 0.16, 1.5), material);
      wing.position.set(2 * sideFactor, 0, 0.45);
      sideGroup.add(wing);
      return sideGroup;
    }

    if (slotConfig.variant === "double") {
      const upperWing = new Mesh(new BoxGeometry(1.85, 0.14, 0.95), material);
      upperWing.position.set(1.85 * sideFactor, 0.12, 0.95);
      sideGroup.add(upperWing);

      const lowerWing = new Mesh(new BoxGeometry(2.3, 0.12, 1.2), material);
      lowerWing.position.set(2.2 * sideFactor, -0.1, 0.05);
      sideGroup.add(lowerWing);
      return sideGroup;
    }

    const triangularWing = new Mesh(new ConeGeometry(0.85, 2.6, 4), material);
    triangularWing.rotation.z =
      side === "left" ? Math.PI * 0.5 : -Math.PI * 0.5;
    triangularWing.position.set(2.05 * sideFactor, 0, 0.45);
    sideGroup.add(triangularWing);

    return sideGroup;
  }

  private buildEnginesSlot = (): Group => {
    return new Group();
  };

  private buildWeaponsSlot = (): Group => {
    return new Group();
  };
}
