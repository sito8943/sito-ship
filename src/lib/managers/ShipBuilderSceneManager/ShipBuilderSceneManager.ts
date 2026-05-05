import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import {
  AmbientLight,
  Box3,
  Clock,
  Color,
  DirectionalLight,
  GridHelper,
  Group,
  Mesh,
  PerspectiveCamera,
  PCFShadowMap,
  Raycaster,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
  type Object3D,
} from "three";
import { ShipBuilderModelManager } from "@/lib/managers/ShipBuilderModelManager";
import type { ShipConfig, ShipSlot } from "@/lib/models/ShipConfig";
import {
  BODY_CONTACT_MAX_STEPS,
  BODY_CONTACT_SLOTS,
  BODY_CONTACT_SNAP_STEP,
  BODY_CONTACT_TOLERANCE,
  CAMERA_SETTINGS,
  MAX_DEVICE_PIXEL_RATIO,
  OVERLAP_SLOT_PAIRS,
  OVERLAP_VOLUME_RATIO_THRESHOLD,
  SCENE_COLORS,
} from "@/lib/managers/ShipBuilderSceneManager/constants";
import type {
  SceneSize,
  SceneBodyContactHandler,
  SceneSlotSelectionHandler,
  SceneSlotTransformHandler,
  SceneValidationHandler,
  TransformMode,
} from "@/lib/managers/ShipBuilderSceneManager/types";

export class ShipBuilderSceneManager {
  private canvas: HTMLCanvasElement | null = null;
  private renderer: WebGLRenderer | null = null;
  private scene: Scene | null = null;
  private camera: PerspectiveCamera | null = null;
  private controls: OrbitControls | null = null;
  private transformControls: TransformControls | null = null;
  private transformControlHelper: Object3D | null = null;
  private clock: Clock | null = null;
  private shipGroup: Group | null = null;
  private shipModelManager: ShipBuilderModelManager | null = null;
  private pendingShipConfig: ShipConfig | null = null;
  private animationFrameId = 0;
  private isMounted = false;
  private selectedSlot: ShipSlot | null = "body";
  private transformMode: TransformMode = "translate";
  private readonly raycaster = new Raycaster();
  private readonly pointer = new Vector2();
  private readonly boxA = new Box3();
  private readonly boxB = new Box3();
  private readonly intersectionBox = new Box3();
  private readonly sizeA = new Vector3();
  private readonly sizeB = new Vector3();
  private readonly intersectionSize = new Vector3();
  private slotSelectionHandler: SceneSlotSelectionHandler | null = null;
  private slotTransformHandler: SceneSlotTransformHandler | null = null;
  private slotValidationHandler: SceneValidationHandler | null = null;
  private slotBodyContactHandler: SceneBodyContactHandler | null = null;

  mount(canvas: HTMLCanvasElement) {
    if (this.canvas === canvas && this.isMounted) {
      return;
    }

    this.destroy();
    this.canvas = canvas;
    this.initialize();
    this.isMounted = true;

    window.addEventListener("resize", this.handleResize);
    this.canvas.addEventListener("pointerdown", this.handleCanvasPointerDown);
    this.resize();
    this.animate();
  }

  getShipGroup() {
    return this.shipGroup;
  }

  setSlotSelectionHandler(handler: SceneSlotSelectionHandler | null) {
    this.slotSelectionHandler = handler;
  }

  setSlotTransformHandler(handler: SceneSlotTransformHandler | null) {
    this.slotTransformHandler = handler;
  }

  setSlotValidationHandler(handler: SceneValidationHandler | null) {
    this.slotValidationHandler = handler;
  }

  setSlotBodyContactHandler(handler: SceneBodyContactHandler | null) {
    this.slotBodyContactHandler = handler;
  }

  setSelectedSlot(slot: ShipSlot | null) {
    this.selectedSlot = slot;
    this.shipModelManager?.setSelectedSlot(slot);
    this.refreshTransformControlAttachment();
  }

  setTransformMode(mode: TransformMode) {
    this.transformMode = mode;
    this.transformControls?.setMode(mode);
  }

  syncShipConfig(shipConfig: ShipConfig) {
    this.pendingShipConfig = shipConfig;
    this.shipModelManager?.sync(shipConfig);
    this.shipModelManager?.setSelectedSlot(this.selectedSlot);
    this.refreshTransformControlAttachment();

    const detachedSlots = this.enforceBodyContactConstraint();
    this.slotBodyContactHandler?.(detachedSlots);

    const overlappingSlots = this.detectSevereOverlaps();
    this.shipModelManager?.setInvalidSlots([
      ...new Set([...overlappingSlots, ...detachedSlots]),
    ]);
    this.slotValidationHandler?.(overlappingSlots);
  }

  resize() {
    if (!this.renderer || !this.camera || !this.canvas) {
      return;
    }

    const { width, height } = this.getSceneSize();

    if (width <= 0 || height <= 0) {
      return;
    }

    const devicePixelRatio = Math.min(
      window.devicePixelRatio || 1,
      MAX_DEVICE_PIXEL_RATIO,
    );

    this.renderer.setPixelRatio(devicePixelRatio);
    this.renderer.setSize(width, height, false);

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  destroy() {
    this.isMounted = false;
    if (this.animationFrameId) {
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = 0;
    }

    window.removeEventListener("resize", this.handleResize);
    this.canvas?.removeEventListener("pointerdown", this.handleCanvasPointerDown);

    if (this.transformControls) {
      this.transformControls.removeEventListener(
        "dragging-changed",
        this.handleTransformDraggingChange,
      );
      this.transformControls.removeEventListener("objectChange", this.handleObjectTransform);
      this.transformControls.removeEventListener("mouseUp", this.handleTransformMouseUp);
      this.transformControls.detach();
      this.transformControls.dispose();
    }

    if (this.transformControlHelper) {
      this.scene?.remove(this.transformControlHelper);
      this.transformControlHelper = null;
    }

    this.controls?.dispose();
    this.shipModelManager?.dispose();

    if (this.scene) {
      this.scene.traverse((object) => {
        if (!(object instanceof Mesh)) {
          return;
        }

        object.geometry?.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose());
        } else {
          object.material?.dispose();
        }
      });
      this.scene.clear();
    }

    this.renderer?.dispose();

    this.clock = null;
    this.controls = null;
    this.transformControls = null;
    this.transformControlHelper = null;
    this.shipGroup = null;
    this.shipModelManager = null;
    this.pendingShipConfig = null;
    this.camera = null;
    this.scene = null;
    this.renderer = null;
    this.canvas = null;
  }

  private initialize() {
    if (!this.canvas) {
      return;
    }

    this.renderer = new WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
    });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFShadowMap;

    this.scene = new Scene();
    this.scene.background = new Color(SCENE_COLORS.background);

    this.camera = new PerspectiveCamera(
      CAMERA_SETTINGS.fov,
      1,
      CAMERA_SETTINGS.near,
      CAMERA_SETTINGS.far,
    );
    this.camera.position.set(
      CAMERA_SETTINGS.position.x,
      CAMERA_SETTINGS.position.y,
      CAMERA_SETTINGS.position.z,
    );

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.minDistance = 5.5;
    this.controls.maxDistance = 20;
    this.controls.minPolarAngle = Math.PI * 0.2;
    this.controls.maxPolarAngle = Math.PI * 0.48;
    this.controls.target.set(0, 0.35, 0.45);

    this.clock = new Clock();

    this.initializeLights();
    this.initializeHelpers();
    this.initializeShipGroup();
    this.initializeTransformControls();
  }

  private initializeLights() {
    if (!this.scene) {
      return;
    }

    const ambientLight = new AmbientLight("#dbeafe", 0.55);
    this.scene.add(ambientLight);

    const keyLight = new DirectionalLight("#fff6df", 2);
    keyLight.position.set(7, 10, 9);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1536, 1536);
    keyLight.shadow.bias = -0.0002;
    this.scene.add(keyLight);

    const rimLight = new DirectionalLight("#9ec5ff", 1.2);
    rimLight.position.set(-9, 7, -7);
    this.scene.add(rimLight);

    const fillLight = new DirectionalLight("#a7f3d0", 0.35);
    fillLight.position.set(2.5, 3.5, -9);
    this.scene.add(fillLight);
  }

  private initializeHelpers() {
    if (!this.scene) {
      return;
    }

    const gridHelper = new GridHelper(40, 40, SCENE_COLORS.gridCenter, SCENE_COLORS.grid);
    gridHelper.position.y = -1;
    this.scene.add(gridHelper);
  }

  private initializeShipGroup() {
    if (!this.scene) {
      return;
    }

    this.shipGroup = new Group();
    this.shipGroup.name = "shipGroup";
    this.scene.add(this.shipGroup);
    this.shipModelManager = new ShipBuilderModelManager(this.shipGroup);
    this.shipModelManager.setSelectedSlot(this.selectedSlot);

    if (this.pendingShipConfig) {
      this.shipModelManager.sync(this.pendingShipConfig);
    }
  }

  private initializeTransformControls() {
    if (!this.scene || !this.camera || !this.renderer) {
      return;
    }

    this.transformControls = new TransformControls(this.camera, this.renderer.domElement);
    this.transformControls.setMode(this.transformMode);
    this.transformControls.setSpace("local");
    this.transformControls.size = 0.85;
    this.transformControls.addEventListener(
      "dragging-changed",
      this.handleTransformDraggingChange,
    );
    this.transformControls.addEventListener("objectChange", this.handleObjectTransform);
    this.transformControls.addEventListener("mouseUp", this.handleTransformMouseUp);
    this.transformControlHelper = this.transformControls.getHelper();
    this.scene.add(this.transformControlHelper);
    this.refreshTransformControlAttachment();
  }

  private refreshTransformControlAttachment() {
    if (!this.transformControls || !this.shipModelManager || !this.selectedSlot) {
      this.transformControls?.detach();
      return;
    }

    const slotGroup = this.shipModelManager.getSlotGroup(this.selectedSlot);
    this.transformControls.setMode(this.transformMode);
    this.transformControls.attach(slotGroup);
  }

  private getSceneSize(): SceneSize {
    if (!this.canvas) {
      return { width: 0, height: 0 };
    }

    const parent = this.canvas.parentElement;
    if (!parent) {
      return { width: window.innerWidth, height: window.innerHeight };
    }

    return {
      width: parent.clientWidth,
      height: parent.clientHeight,
    };
  }

  private handleResize = () => {
    if (!this.isMounted) {
      return;
    }

    this.resize();
  };

  private handleCanvasPointerDown = (event: PointerEvent) => {
    if (!this.camera || !this.shipGroup || !this.canvas) {
      return;
    }

    if (this.transformControls?.dragging) {
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }

    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersections = this.raycaster.intersectObject(this.shipGroup, true);

    const selectedSlot = intersections
      .map((intersection) => this.getSlotFromObject(intersection.object))
      .find((slot): slot is ShipSlot => slot !== null);

    if (!selectedSlot) {
      return;
    }

    this.setSelectedSlot(selectedSlot);
    this.slotSelectionHandler?.(selectedSlot);
  };

  private getSlotFromObject(object: Object3D | null): ShipSlot | null {
    let node: Object3D | null = object;

    while (node) {
      const slot = node.userData.shipSlot;
      if (slot && this.isShipSlot(slot)) {
        return slot;
      }

      node = node.parent;
    }

    return null;
  }

  private isShipSlot(value: unknown): value is ShipSlot {
    return (
      value === "body" ||
      value === "cockpit" ||
      value === "wings" ||
      value === "engines" ||
      value === "weapons"
    );
  }

  private handleTransformDraggingChange = (event: Event) => {
    const draggingEvent = event as Event & { value: boolean };
    if (this.controls) {
      this.controls.enabled = !draggingEvent.value;
    }
  };

  private handleObjectTransform = () => {
    this.emitTransformPatch(false);
  };

  private handleTransformMouseUp = () => {
    this.emitTransformPatch(true);
  };

  private emitTransformPatch(commitHistory: boolean) {
    if (!this.selectedSlot || !this.shipModelManager) {
      return;
    }

    const slotGroup = this.shipModelManager.getSlotGroup(this.selectedSlot);

    if (this.transformMode === "translate") {
      this.slotTransformHandler?.(
        this.selectedSlot,
        {
          offset: [slotGroup.position.x, slotGroup.position.y, slotGroup.position.z],
        },
        { commitHistory },
      );
      return;
    }

    if (this.transformMode === "rotate") {
      this.slotTransformHandler?.(
        this.selectedSlot,
        {
          rotation: [slotGroup.rotation.x, slotGroup.rotation.y, slotGroup.rotation.z],
        },
        { commitHistory },
      );
      return;
    }

    this.slotTransformHandler?.(
      this.selectedSlot,
      {
        scale: [slotGroup.scale.x, slotGroup.scale.y, slotGroup.scale.z],
      },
      { commitHistory },
    );
  }

  private detectSevereOverlaps(): ShipSlot[] {
    if (!this.shipModelManager) {
      return [];
    }

    const overlappingSlots = new Set<ShipSlot>();

    OVERLAP_SLOT_PAIRS.forEach(([slotA, slotB]) => {
      const groupA = this.shipModelManager?.getSlotGroup(slotA);
      const groupB = this.shipModelManager?.getSlotGroup(slotB);
      if (!groupA || !groupB) {
        return;
      }

      this.boxA.setFromObject(groupA);
      this.boxB.setFromObject(groupB);

      if (this.boxA.isEmpty() || this.boxB.isEmpty()) {
        return;
      }

      this.intersectionBox.copy(this.boxA).intersect(this.boxB);
      if (this.intersectionBox.isEmpty()) {
        return;
      }

      this.boxA.getSize(this.sizeA);
      this.boxB.getSize(this.sizeB);
      this.intersectionBox.getSize(this.intersectionSize);

      const volumeA = this.sizeA.x * this.sizeA.y * this.sizeA.z;
      const volumeB = this.sizeB.x * this.sizeB.y * this.sizeB.z;
      const intersectionVolume =
        this.intersectionSize.x * this.intersectionSize.y * this.intersectionSize.z;
      const smallerVolume = Math.min(volumeA, volumeB);

      if (smallerVolume <= 0) {
        return;
      }

      const ratio = intersectionVolume / smallerVolume;
      if (ratio >= OVERLAP_VOLUME_RATIO_THRESHOLD) {
        overlappingSlots.add(slotA);
        overlappingSlots.add(slotB);
      }
    });

    return [...overlappingSlots];
  }

  private enforceBodyContactConstraint(): ShipSlot[] {
    if (!this.shipModelManager) {
      return [];
    }

    const bodySlotGroup = this.shipModelManager.getSlotGroup("body");
    this.boxA.setFromObject(bodySlotGroup);
    if (this.boxA.isEmpty()) {
      return [];
    }

    const bodyCenter = this.sizeA;
    this.boxA.getCenter(bodyCenter);
    const bodyContactBox = this.intersectionBox.copy(this.boxA).expandByScalar(
      BODY_CONTACT_TOLERANCE,
    );
    const detachedSlots: ShipSlot[] = [];

    BODY_CONTACT_SLOTS.forEach((slot) => {
      const slotGroup = this.shipModelManager?.getSlotGroup(slot);
      if (!slotGroup) {
        return;
      }

      this.boxB.setFromObject(slotGroup);
      if (this.boxB.isEmpty() || bodyContactBox.intersectsBox(this.boxB)) {
        return;
      }

      detachedSlots.push(slot);
      this.snapSlotGroupToBody(slotGroup, bodyContactBox, bodyCenter);

      const correctedOffset: [number, number, number] = [
        slotGroup.position.x,
        slotGroup.position.y,
        slotGroup.position.z,
      ];

      if (!this.shouldEmitOffsetCorrection(slot, correctedOffset)) {
        return;
      }

      this.slotTransformHandler?.(
        slot,
        {
          offset: correctedOffset,
        },
        { commitHistory: false },
      );
    });

    return detachedSlots;
  }

  private snapSlotGroupToBody(slotGroup: Group, bodyContactBox: Box3, bodyCenter: Vector3) {
    this.boxB.setFromObject(slotGroup);
    this.boxB.getCenter(this.sizeB);
    this.intersectionSize.subVectors(bodyCenter, this.sizeB);

    if (this.intersectionSize.lengthSq() <= Number.EPSILON) {
      this.intersectionSize.set(0, 0, 1);
    } else {
      this.intersectionSize.normalize();
    }

    for (let index = 0; index < BODY_CONTACT_MAX_STEPS; index += 1) {
      if (bodyContactBox.intersectsBox(this.boxB)) {
        return;
      }

      slotGroup.position.addScaledVector(this.intersectionSize, BODY_CONTACT_SNAP_STEP);
      slotGroup.updateMatrixWorld(true);
      this.boxB.setFromObject(slotGroup);
    }
  }

  private shouldEmitOffsetCorrection(
    slot: ShipSlot,
    offset: [number, number, number],
  ): boolean {
    const sourceOffset = this.pendingShipConfig?.[slot].offset;
    if (!sourceOffset) {
      return true;
    }

    const epsilon = 0.001;
    return (
      Math.abs(sourceOffset[0] - offset[0]) > epsilon ||
      Math.abs(sourceOffset[1] - offset[1]) > epsilon ||
      Math.abs(sourceOffset[2] - offset[2]) > epsilon
    );
  }

  private animate = () => {
    if (!this.isMounted || !this.renderer || !this.scene || !this.camera) {
      return;
    }

    const delta = this.clock?.getDelta() ?? 0;
    this.controls?.update(delta);
    this.renderer.render(this.scene, this.camera);

    this.animationFrameId = window.requestAnimationFrame(this.animate);
  };
}
