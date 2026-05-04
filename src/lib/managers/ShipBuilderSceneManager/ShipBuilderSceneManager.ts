import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  AmbientLight,
  Clock,
  Color,
  DirectionalLight,
  GridHelper,
  Group,
  Mesh,
  PerspectiveCamera,
  PCFShadowMap,
  Scene,
  WebGLRenderer,
} from "three";
import { ShipBuilderModelManager } from "@/lib/managers/ShipBuilderModelManager";
import type { ShipConfig } from "@/lib/models/ShipConfig";
import {
  CAMERA_SETTINGS,
  MAX_DEVICE_PIXEL_RATIO,
  SCENE_COLORS,
} from "@/lib/managers/ShipBuilderSceneManager/constants";
import type { SceneSize } from "@/lib/managers/ShipBuilderSceneManager/types";

export class ShipBuilderSceneManager {
  private canvas: HTMLCanvasElement | null = null;
  private renderer: WebGLRenderer | null = null;
  private scene: Scene | null = null;
  private camera: PerspectiveCamera | null = null;
  private controls: OrbitControls | null = null;
  private clock: Clock | null = null;
  private shipGroup: Group | null = null;
  private shipModelManager: ShipBuilderModelManager | null = null;
  private pendingShipConfig: ShipConfig | null = null;
  private animationFrameId = 0;
  private isMounted = false;

  mount(canvas: HTMLCanvasElement) {
    if (this.canvas === canvas && this.isMounted) {
      return;
    }

    this.destroy();
    this.canvas = canvas;
    this.initialize();
    this.isMounted = true;

    window.addEventListener("resize", this.handleResize);
    this.resize();
    this.animate();
  }

  getShipGroup() {
    return this.shipGroup;
  }

  syncShipConfig(shipConfig: ShipConfig) {
    this.pendingShipConfig = shipConfig;
    this.shipModelManager?.sync(shipConfig);
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
    this.controls.target.set(0, 0.5, 0);

    this.clock = new Clock();

    this.initializeLights();
    this.initializeHelpers();
    this.initializeShipGroup();
  }

  private initializeLights() {
    if (!this.scene) {
      return;
    }

    const ambientLight = new AmbientLight("#dbeafe", 0.45);
    this.scene.add(ambientLight);

    const keyLight = new DirectionalLight("#fff6df", 2.2);
    keyLight.position.set(8, 12, 10);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    this.scene.add(keyLight);

    const rimLight = new DirectionalLight("#9ec5ff", 1.1);
    rimLight.position.set(-10, 8, -6);
    this.scene.add(rimLight);
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

    if (this.pendingShipConfig) {
      this.shipModelManager.sync(this.pendingShipConfig);
    }
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
