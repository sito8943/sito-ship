import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import Stats from 'three/addons/libs/stats.module.js'
import {
  BlendFunction,
  BloomEffect,
  EffectComposer,
  EffectPass,
  FXAAEffect,
  OutlineEffect,
  RenderPass,
} from 'postprocessing'
import {
  ACESFilmicToneMapping,
  AmbientLight,
  AxesHelper,
  Box3,
  CameraHelper,
  Clock,
  Color,
  DirectionalLight,
  DirectionalLightHelper,
  GridHelper,
  Group,
  Mesh,
  PerspectiveCamera,
  PCFShadowMap,
  Raycaster,
  Scene,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
  type Event as ThreeEvent,
  type Object3D,
} from 'three'
import { BUILDER_ENVIRONMENT_HDR_URL } from '@/assets/resources'
import { loadBuilderEnvironmentMap } from '@/lib/utils/BuilderEnvironmentMap'
import { ShipBuilderModelManager } from '@/lib/managers/ShipBuilderModelManager'
import {
  SHIP_SYMMETRIC_AIM_ROTATION_RANGES,
  SHIP_SYMMETRIC_PAIR_SPREAD_RANGES,
  type ShipConfig,
  type ShipSlot,
} from '@/lib/models/ShipConfig'
import {
  BUILDER_RENDERER_SETTINGS,
  BUILDER_SHADOW_SETTINGS,
  BODY_CONTACT_SLOTS,
  BODY_CONTACT_TOLERANCE,
  CAMERA_FOCUS_PADDING,
  CAMERA_SETTINGS,
  CINEMATIC_ROTATION_SPEED,
  IDLE_CINEMATIC_DELAY_MS,
  DEFAULT_ORBIT_CONSTRAINTS,
  FLIGHT_SETTINGS,
  MAX_DEVICE_PIXEL_RATIO,
  OVERLAP_SLOT_PAIRS,
  OVERLAP_VOLUME_RATIO_THRESHOLD,
  PANORAMIC_ORBIT_CONSTRAINTS,
  POST_PROCESSING_SETTINGS,
  SCENE_COLORS,
} from '@/lib/managers/ShipBuilderSceneManager/constants'
import type {
  DebugHelpersVisibility,
  ExperienceMode,
  FlightInputState,
  OrbitConstraintSet,
  SceneSize,
  SceneBodyContactHandler,
  SceneSlotSelectionHandler,
  SceneSlotTransformHandler,
  SceneValidationHandler,
  SymmetricSlot,
  TransformControlMode,
  TransformMode,
} from '@/lib/managers/ShipBuilderSceneManager/types'
import { isDisposableResource } from '@/lib/managers/ShipBuilderSceneManager/utils'

export class ShipBuilderSceneManager {
  private readonly isDevEnvironment = import.meta.env.DEV
  private canvas: HTMLCanvasElement | null = null
  private renderer: WebGLRenderer | null = null
  private scene: Scene | null = null
  private camera: PerspectiveCamera | null = null
  private controls: OrbitControls | null = null
  private debugGui: GUI | null = null
  private stats: Stats | null = null
  private composer: EffectComposer | null = null
  private bloomEffect: BloomEffect | null = null
  private outlineEffect: OutlineEffect | null = null
  private bloomPass: EffectPass | null = null
  private outlinePass: EffectPass | null = null
  private fxaaPass: EffectPass | null = null
  private postProcessingSettings = JSON.parse(JSON.stringify(POST_PROCESSING_SETTINGS)) as {
    bloom: { enabled: boolean; intensity: number; radius: number; threshold: number }
    fxaa: { enabled: boolean }
    outline: {
      enabled: boolean
      edgeStrength: number
      pulseSpeed: number
      visibleEdgeColor: number
      hiddenEdgeColor: number
      blur: boolean
      xRay: boolean
    }
  }
  private hoveredSlot: ShipSlot | null = null
  private axesHelper: AxesHelper | null = null
  private directionalLights: DirectionalLight[] = []
  private lightHelpers: DirectionalLightHelper[] = []
  private shadowHelpers: CameraHelper[] = []
  private debugHelpersVisibility: DebugHelpersVisibility = {
    axes: false,
    light: false,
    shadow: false,
  }
  private transformControls: TransformControls | null = null
  private transformControlHelper: Object3D | null = null
  private clock: Clock | null = null
  private shipGroup: Group | null = null
  private shipModelManager: ShipBuilderModelManager | null = null
  private pendingShipConfig: ShipConfig | null = null
  private animationFrameId = 0
  private isMounted = false
  private isPanoramicViewEnabled = false
  private isCinematicViewEnabled = false
  private isIdleCinematicActive = false
  private lastActivityAt = 0
  private experienceMode: ExperienceMode = 'builder'
  private selectedSlot: ShipSlot | null = 'body'
  private transformMode: TransformMode = 'translate'
  private readonly raycaster = new Raycaster()
  private readonly pointer = new Vector2()
  private readonly boxA = new Box3()
  private readonly boxB = new Box3()
  private readonly intersectionBox = new Box3()
  private readonly sizeA = new Vector3()
  private readonly sizeB = new Vector3()
  private readonly intersectionSize = new Vector3()
  private readonly cameraTarget = new Vector3()
  private readonly cameraDirection = new Vector3()
  private readonly cameraSize = new Vector3()
  private readonly defaultOrbitTarget = new Vector3(0, 0.35, 0.45)
  private readonly flightForward = new Vector3()
  private readonly flightUp = new Vector3()
  private readonly flightDesiredCameraPosition = new Vector3()
  private readonly flightDesiredLookTarget = new Vector3()
  private readonly flightInputState: FlightInputState = {
    throttleForward: false,
    throttleReverse: false,
    yawLeft: false,
    yawRight: false,
    pitchUp: false,
    pitchDown: false,
    rollLeft: false,
    rollRight: false,
    boost: false,
  }
  private flightSpeed = 0
  private slotSelectionHandler: SceneSlotSelectionHandler | null = null
  private slotTransformHandler: SceneSlotTransformHandler | null = null
  private slotValidationHandler: SceneValidationHandler | null = null
  private slotBodyContactHandler: SceneBodyContactHandler | null = null

  mount(canvas: HTMLCanvasElement) {
    if (this.canvas === canvas && this.isMounted) {
      return
    }

    this.destroy()
    this.canvas = canvas
    this.initialize()
    this.isMounted = true

    window.addEventListener('resize', this.handleResize)
    window.addEventListener('keydown', this.handleWindowKeyDown)
    window.addEventListener('keyup', this.handleWindowKeyUp)
    this.canvas.addEventListener('pointerdown', this.handleCanvasPointerDown)
    this.canvas.addEventListener('pointermove', this.handleCanvasPointerMove)
    this.canvas.addEventListener('pointerleave', this.handleCanvasPointerLeave)
    this.canvas.addEventListener('wheel', this.handleCanvasWheel, { passive: true })
    this.resize()
    this.animate()
  }

  getShipGroup() {
    return this.shipGroup
  }

  setSlotSelectionHandler(handler: SceneSlotSelectionHandler | null) {
    this.slotSelectionHandler = handler
  }

  setSlotTransformHandler(handler: SceneSlotTransformHandler | null) {
    this.slotTransformHandler = handler
  }

  setSlotValidationHandler(handler: SceneValidationHandler | null) {
    this.slotValidationHandler = handler
  }

  setSlotBodyContactHandler(handler: SceneBodyContactHandler | null) {
    this.slotBodyContactHandler = handler
  }

  setSelectedSlot(slot: ShipSlot | null) {
    this.selectedSlot = slot
    this.shipModelManager?.setSelectedSlot(slot)
    this.refreshTransformControlAttachment()
    this.refreshOutlineSelection()
  }

  setTransformMode(mode: TransformMode) {
    this.transformMode = mode
    this.refreshTransformControlAttachment()
  }

  setExperienceMode(mode: ExperienceMode) {
    if (this.experienceMode === mode) {
      return
    }

    this.experienceMode = mode
    if (mode === 'flight') {
      this.enableFlightMode()
      return
    }

    this.disableFlightMode()
  }

  togglePanoramicView() {
    if (this.experienceMode === 'flight') {
      return
    }

    this.isPanoramicViewEnabled = !this.isPanoramicViewEnabled
    this.applyCameraViewConstraints()
  }

  toggleCinematicView() {
    if (this.experienceMode === 'flight') {
      return
    }

    this.isCinematicViewEnabled = !this.isCinematicViewEnabled
    this.markActivity()

    if (!this.controls) {
      return
    }

    this.controls.autoRotate = this.isCinematicViewEnabled
    this.controls.autoRotateSpeed = CINEMATIC_ROTATION_SPEED
  }

  private markActivity = () => {
    this.lastActivityAt = performance.now()
    if (!this.isIdleCinematicActive) {
      return
    }
    this.isIdleCinematicActive = false
    if (this.controls && !this.isCinematicViewEnabled) {
      this.controls.autoRotate = false
    }
  }

  private updateIdleCinematic() {
    if (
      this.experienceMode !== 'builder' ||
      !this.controls ||
      this.isCinematicViewEnabled ||
      this.isPanoramicViewEnabled
    ) {
      return
    }

    const isIdle = performance.now() - this.lastActivityAt >= IDLE_CINEMATIC_DELAY_MS
    if (isIdle === this.isIdleCinematicActive) {
      return
    }

    this.isIdleCinematicActive = isIdle
    this.controls.autoRotate = isIdle
    this.controls.autoRotateSpeed = CINEMATIC_ROTATION_SPEED
  }

  private handleCanvasWheel = () => {
    this.markActivity()
  }

  focusSelectedSlot() {
    if (this.experienceMode === 'flight') {
      return
    }

    if (!this.camera || !this.controls || !this.shipModelManager) {
      return
    }

    const targetSlot = this.selectedSlot ?? 'body'
    const slotGroup = this.shipModelManager.getSlotGroup(targetSlot)
    this.boxA.setFromObject(slotGroup)
    if (this.boxA.isEmpty()) {
      return
    }

    this.boxA.getCenter(this.cameraTarget)
    const distance = this.camera.position.distanceTo(this.controls.target)
    this.cameraDirection.subVectors(this.camera.position, this.controls.target)
    if (this.cameraDirection.lengthSq() <= 0.000001) {
      this.cameraDirection.set(1, 0.35, 1)
    }
    this.cameraDirection.normalize()
    this.camera.position.copy(this.cameraTarget).add(this.cameraDirection.multiplyScalar(distance))
    this.controls.target.copy(this.cameraTarget)
    this.controls.update()
  }

  zoomToShip() {
    if (this.experienceMode === 'flight') {
      return
    }

    if (!this.camera || !this.controls || !this.shipGroup) {
      return
    }

    this.boxA.setFromObject(this.shipGroup)
    if (this.boxA.isEmpty()) {
      return
    }

    this.boxA.getCenter(this.cameraTarget)
    this.boxA.getSize(this.cameraSize)

    const maxSize = Math.max(this.cameraSize.x, this.cameraSize.y, this.cameraSize.z)
    const fovRadians = (this.camera.fov * Math.PI) / 180
    const fitDistance = maxSize / Math.tan(fovRadians * 0.5)
    const distance = Math.max(3, fitDistance * CAMERA_FOCUS_PADDING)

    this.cameraDirection.subVectors(this.camera.position, this.controls.target)
    if (this.cameraDirection.lengthSq() <= 0.000001) {
      this.cameraDirection.set(1, 0.35, 1)
    }
    this.cameraDirection.normalize()
    this.controls.target.copy(this.cameraTarget)
    this.camera.position.copy(this.cameraTarget).add(this.cameraDirection.multiplyScalar(distance))
    this.controls.update()
  }

  getDebugHelpersVisibility(): DebugHelpersVisibility {
    return { ...this.debugHelpersVisibility }
  }

  setDebugHelpersVisibility(visibility: Partial<DebugHelpersVisibility>) {
    if (visibility.axes !== undefined) {
      this.debugHelpersVisibility.axes = visibility.axes
    }
    if (visibility.light !== undefined) {
      this.debugHelpersVisibility.light = visibility.light
    }
    if (visibility.shadow !== undefined) {
      this.debugHelpersVisibility.shadow = visibility.shadow
    }
    this.updateDebugHelpersVisibility()
  }

  syncShipConfig(shipConfig: ShipConfig) {
    this.pendingShipConfig = shipConfig
    this.shipModelManager?.sync(shipConfig)
    this.shipModelManager?.setSelectedSlot(this.selectedSlot)
    this.refreshTransformControlAttachment()
    this.refreshValidationState()
  }

  resize() {
    if (!this.renderer || !this.camera || !this.canvas) {
      return
    }

    const { width, height } = this.getSceneSize()

    if (width <= 0 || height <= 0) {
      return
    }

    const devicePixelRatio = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO)

    this.renderer.setPixelRatio(devicePixelRatio)
    if (this.composer) {
      this.composer.setSize(width, height, false)
    } else {
      this.renderer.setSize(width, height, false)
    }

    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
  }

  destroy() {
    this.isMounted = false
    if (this.animationFrameId) {
      window.cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = 0
    }

    window.removeEventListener('resize', this.handleResize)
    window.removeEventListener('keydown', this.handleWindowKeyDown)
    window.removeEventListener('keyup', this.handleWindowKeyUp)
    this.canvas?.removeEventListener('pointerdown', this.handleCanvasPointerDown)
    this.canvas?.removeEventListener('pointermove', this.handleCanvasPointerMove)
    this.canvas?.removeEventListener('pointerleave', this.handleCanvasPointerLeave)
    this.canvas?.removeEventListener('wheel', this.handleCanvasWheel)
    this.resetFlightInputState()

    if (this.transformControls) {
      this.transformControls.removeEventListener(
        'dragging-changed',
        this.handleTransformDraggingChange
      )
      this.transformControls.removeEventListener('objectChange', this.handleObjectTransform)
      this.transformControls.removeEventListener('mouseUp', this.handleTransformMouseUp)
      this.transformControls.detach()
      this.transformControls.dispose()
    }

    if (this.transformControlHelper) {
      this.scene?.remove(this.transformControlHelper)
      this.transformControlHelper = null
    }

    this.controls?.dispose()
    this.disposeDebugGui()
    this.shipModelManager?.dispose()
    this.disposeDebugLightHelpers()
    if (this.axesHelper) {
      this.axesHelper.dispose()
      this.scene?.remove(this.axesHelper)
      this.axesHelper = null
    }

    if (this.scene) {
      this.scene.environment = null
      this.scene.traverse((object) => {
        if (!(object instanceof Mesh)) {
          return
        }

        const geometry: unknown = object.geometry
        if (isDisposableResource(geometry)) {
          geometry.dispose()
        }

        const material: unknown = object.material
        if (Array.isArray(material)) {
          material.forEach((entry) => {
            if (isDisposableResource(entry)) {
              entry.dispose()
            }
          })
        } else {
          if (isDisposableResource(material)) {
            material.dispose()
          }
        }
      })
      this.scene.clear()
    }

    this.composer?.dispose()
    this.renderer?.dispose()

    this.clock = null
    this.controls = null
    this.debugGui = null
    this.disposeStats()
    this.composer = null
    this.bloomEffect = null
    this.outlineEffect = null
    this.bloomPass = null
    this.outlinePass = null
    this.fxaaPass = null
    this.hoveredSlot = null
    this.directionalLights = []
    this.lightHelpers = []
    this.shadowHelpers = []
    this.transformControls = null
    this.transformControlHelper = null
    this.shipGroup = null
    this.shipModelManager = null
    this.pendingShipConfig = null
    this.camera = null
    this.scene = null
    this.renderer = null
    this.canvas = null
    this.isPanoramicViewEnabled = false
    this.isCinematicViewEnabled = false
  }

  private initialize() {
    if (!this.canvas) {
      return
    }

    this.renderer = new WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      alpha: false,
    })
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = PCFShadowMap
    this.renderer.outputColorSpace = SRGBColorSpace
    this.renderer.toneMapping = ACESFilmicToneMapping
    this.renderer.toneMappingExposure = BUILDER_RENDERER_SETTINGS.toneMappingExposure

    this.scene = new Scene()
    this.scene.background = new Color(SCENE_COLORS.background)

    this.camera = new PerspectiveCamera(
      CAMERA_SETTINGS.fov,
      1,
      CAMERA_SETTINGS.near,
      CAMERA_SETTINGS.far
    )
    this.camera.position.set(
      CAMERA_SETTINGS.position.x,
      CAMERA_SETTINGS.position.y,
      CAMERA_SETTINGS.position.z
    )

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.applyOrbitConstraints(DEFAULT_ORBIT_CONSTRAINTS)
    this.controls.target.copy(this.defaultOrbitTarget)
    this.controls.autoRotate = this.isCinematicViewEnabled
    this.controls.autoRotateSpeed = CINEMATIC_ROTATION_SPEED
    this.applyCameraViewConstraints()

    this.clock = new Clock()

    this.lastActivityAt = performance.now()
    this.initializeLights()
    this.initializeEnvironmentMap()
    this.initializeHelpers()
    this.initializeShipGroup()
    this.initializeTransformControls()
    this.initializePostProcessing()
    this.initializeStats()
    this.initializeDebugGui()

    if (this.experienceMode === 'flight') {
      this.enableFlightMode()
      return
    }

    this.disableFlightMode()
  }

  private initializeDebugGui() {
    if (!this.isDevEnvironment) {
      return
    }

    this.disposeDebugGui()
    this.debugGui = new GUI({
      title: 'Debug Helpers',
      width: 280,
    })

    this.debugGui
      .add(this.debugHelpersVisibility, 'axes')
      .name('Axes Helper')
      .onChange((value: boolean) => {
        this.setDebugHelpersVisibility({ axes: value })
      })
    this.debugGui
      .add(this.debugHelpersVisibility, 'light')
      .name('Light Helpers')
      .onChange((value: boolean) => {
        this.setDebugHelpersVisibility({ light: value })
      })
    this.debugGui
      .add(this.debugHelpersVisibility, 'shadow')
      .name('Shadow Helpers')
      .onChange((value: boolean) => {
        this.setDebugHelpersVisibility({ shadow: value })
      })

    this.initializePostProcessingDebugGui()
  }

  private initializePostProcessingDebugGui() {
    if (!this.debugGui) {
      return
    }

    const settings = this.postProcessingSettings
    const ppFolder = this.debugGui.addFolder('Post Processing')

    const bloomFolder = ppFolder.addFolder('Bloom')
    bloomFolder.add(settings.bloom, 'enabled').onChange((value: boolean) => {
      if (this.bloomPass) this.bloomPass.enabled = value
    })
    bloomFolder.add(settings.bloom, 'intensity', 0, 5, 0.01).onChange((value: number) => {
      if (this.bloomEffect) this.bloomEffect.intensity = value
    })
    bloomFolder.add(settings.bloom, 'threshold', 0, 1, 0.01).onChange((value: number) => {
      if (this.bloomEffect) this.bloomEffect.luminanceMaterial.threshold = value
    })

    const outlineFolder = ppFolder.addFolder('Outline')
    outlineFolder.add(settings.outline, 'enabled').onChange((value: boolean) => {
      if (this.outlinePass) this.outlinePass.enabled = value
    })
    outlineFolder.add(settings.outline, 'edgeStrength', 0, 20, 0.1).onChange((value: number) => {
      if (this.outlineEffect) this.outlineEffect.edgeStrength = value
    })
    outlineFolder.add(settings.outline, 'pulseSpeed', 0, 5, 0.01).onChange((value: number) => {
      if (this.outlineEffect) this.outlineEffect.pulseSpeed = value
    })
    outlineFolder.addColor(settings.outline, 'visibleEdgeColor').onChange((value: number) => {
      this.outlineEffect?.visibleEdgeColor.setHex(value)
    })
    outlineFolder.addColor(settings.outline, 'hiddenEdgeColor').onChange((value: number) => {
      this.outlineEffect?.hiddenEdgeColor.setHex(value)
    })
    outlineFolder.add(settings.outline, 'xRay').onChange((value: boolean) => {
      if (this.outlineEffect) this.outlineEffect.xRay = value
    })
    outlineFolder
      .add({ forceHoverBody: () => this.debugForceHover('body') }, 'forceHoverBody')
      .name('Test outline (body)')

    const fxaaFolder = ppFolder.addFolder('FXAA')
    fxaaFolder.add(settings.fxaa, 'enabled').onChange((value: boolean) => {
      if (this.fxaaPass) this.fxaaPass.enabled = value
    })
  }

  private debugForceHover(slot: ShipSlot) {
    this.hoveredSlot = slot
    this.refreshOutlineSelection()
    window.setTimeout(() => {
      if (this.hoveredSlot === slot) {
        this.hoveredSlot = null
        this.refreshOutlineSelection()
      }
    }, 3000)
  }

  private disposeDebugGui() {
    this.debugGui?.destroy()
    this.debugGui = null
  }

  private initializeStats() {
    if (!this.isDevEnvironment) {
      return
    }

    this.disposeStats()

    this.stats = new Stats()
    this.stats.showPanel(1) // 0: fps, 1: ms, 2: mb, 3+: custom
    this.stats.dom.style.position = 'fixed'
    this.stats.dom.style.left = '0'
    this.stats.dom.style.top = '0'
    this.stats.dom.style.zIndex = '12'
    document.body.appendChild(this.stats.dom)
  }

  private disposeStats() {
    if (this.stats?.dom?.parentNode) {
      this.stats.dom.parentNode.removeChild(this.stats.dom)
    }
    this.stats = null
  }

  private initializePostProcessing() {
    if (!this.renderer || !this.scene || !this.camera) {
      return
    }

    const settings = this.postProcessingSettings

    this.composer = new EffectComposer(this.renderer)
    this.composer.addPass(new RenderPass(this.scene, this.camera))

    this.bloomEffect = new BloomEffect({
      intensity: settings.bloom.intensity,
      radius: settings.bloom.radius,
      luminanceThreshold: settings.bloom.threshold,
      mipmapBlur: true,
    })
    this.bloomPass = new EffectPass(this.camera, this.bloomEffect)
    this.bloomPass.enabled = settings.bloom.enabled
    this.composer.addPass(this.bloomPass)

    this.outlineEffect = new OutlineEffect(this.scene, this.camera, {
      blendFunction: BlendFunction.SCREEN,
      edgeStrength: settings.outline.edgeStrength,
      pulseSpeed: settings.outline.pulseSpeed,
      visibleEdgeColor: settings.outline.visibleEdgeColor,
      hiddenEdgeColor: settings.outline.hiddenEdgeColor,
      blur: settings.outline.blur,
      xRay: settings.outline.xRay,
    })
    this.outlinePass = new EffectPass(this.camera, this.outlineEffect)
    this.outlinePass.enabled = settings.outline.enabled
    this.composer.addPass(this.outlinePass)

    this.fxaaPass = new EffectPass(this.camera, new FXAAEffect())
    this.fxaaPass.enabled = settings.fxaa.enabled
    this.composer.addPass(this.fxaaPass)

    this.refreshOutlineSelection()
  }

  private refreshOutlineSelection() {
    if (!this.outlineEffect || !this.shipModelManager) {
      return
    }

    const targets: Object3D[] = []
    if (this.hoveredSlot && this.hoveredSlot !== this.selectedSlot) {
      const slotGroup = this.shipModelManager.getSlotGroup(this.hoveredSlot)
      slotGroup.traverse((object) => {
        if (object instanceof Mesh) {
          targets.push(object)
        }
      })
    }
    this.outlineEffect.selection.set(targets)
  }

  private initializeLights() {
    if (!this.scene) {
      return
    }

    const ambientLight = new AmbientLight('#dbeafe', 0.55)
    this.scene.add(ambientLight)

    const keyLight = new DirectionalLight('#fff6df', 2)
    keyLight.position.set(7, 10, 9)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.set(BUILDER_SHADOW_SETTINGS.mapSize, BUILDER_SHADOW_SETTINGS.mapSize)
    keyLight.shadow.bias = BUILDER_SHADOW_SETTINGS.bias
    keyLight.shadow.camera.near = BUILDER_SHADOW_SETTINGS.cameraNear
    keyLight.shadow.camera.far = BUILDER_SHADOW_SETTINGS.cameraFar
    keyLight.shadow.camera.left = -BUILDER_SHADOW_SETTINGS.cameraBounds
    keyLight.shadow.camera.right = BUILDER_SHADOW_SETTINGS.cameraBounds
    keyLight.shadow.camera.top = BUILDER_SHADOW_SETTINGS.cameraBounds
    keyLight.shadow.camera.bottom = -BUILDER_SHADOW_SETTINGS.cameraBounds
    keyLight.shadow.camera.updateProjectionMatrix()
    this.scene.add(keyLight)

    const rimLight = new DirectionalLight('#9ec5ff', 1.2)
    rimLight.position.set(-9, 7, -7)
    this.scene.add(rimLight)

    const fillLight = new DirectionalLight('#a7f3d0', 0.35)
    fillLight.position.set(2.5, 3.5, -9)
    this.scene.add(fillLight)

    this.directionalLights = [keyLight, rimLight, fillLight]
    if (this.isDevEnvironment) {
      this.initializeDebugLightHelpers()
    }
  }

  private initializeEnvironmentMap() {
    if (!this.scene || !this.renderer || !BUILDER_ENVIRONMENT_HDR_URL) {
      return
    }

    const renderer = this.renderer
    loadBuilderEnvironmentMap(renderer, BUILDER_ENVIRONMENT_HDR_URL)
      .then((envMap) => {
        if (!this.scene) {
          return
        }
        this.scene.environment = envMap
      })
      .catch((error) => {
        console.warn('Builder environment HDR load failed', error)
      })
  }

  private initializeHelpers() {
    if (!this.scene) {
      return
    }

    const gridHelper = new GridHelper(40, 40, SCENE_COLORS.gridCenter, SCENE_COLORS.grid)
    gridHelper.position.y = -1
    this.scene.add(gridHelper)

    this.axesHelper = new AxesHelper(5)
    this.scene.add(this.axesHelper)
    this.updateDebugHelpersVisibility()
  }

  private initializeDebugLightHelpers() {
    if (!this.scene || this.directionalLights.length === 0) {
      return
    }

    this.disposeDebugLightHelpers()

    this.directionalLights.forEach((light) => {
      const lightHelper = new DirectionalLightHelper(light, 3.5)
      this.scene?.add(lightHelper)
      this.lightHelpers.push(lightHelper)

      if (!light.castShadow) {
        return
      }

      const shadowHelper = new CameraHelper(light.shadow.camera)
      this.scene?.add(shadowHelper)
      this.shadowHelpers.push(shadowHelper)
    })

    this.updateDebugHelpersVisibility()
  }

  private disposeDebugLightHelpers() {
    this.lightHelpers.forEach((helper) => {
      helper.dispose()
      this.scene?.remove(helper)
    })
    this.shadowHelpers.forEach((helper) => {
      helper.dispose()
      this.scene?.remove(helper)
    })
    this.lightHelpers = []
    this.shadowHelpers = []
  }

  private updateDebugHelpersVisibility() {
    if (this.axesHelper) {
      this.axesHelper.visible = this.debugHelpersVisibility.axes
    }

    this.lightHelpers.forEach((helper) => {
      helper.visible = this.debugHelpersVisibility.light
    })

    this.shadowHelpers.forEach((helper) => {
      helper.visible = this.debugHelpersVisibility.shadow
    })
  }

  private initializeShipGroup() {
    if (!this.scene) {
      return
    }

    this.shipGroup = new Group()
    this.shipGroup.name = 'shipGroup'
    this.scene.add(this.shipGroup)
    this.shipModelManager = new ShipBuilderModelManager(this.shipGroup)
    this.shipModelManager.setSelectedSlot(this.selectedSlot)

    if (this.pendingShipConfig) {
      this.shipModelManager.sync(this.pendingShipConfig)
    }
  }

  private initializeTransformControls() {
    if (!this.scene || !this.camera || !this.renderer) {
      return
    }

    this.transformControls = new TransformControls(this.camera, this.renderer.domElement)
    this.transformControls.setSpace('local')
    this.transformControls.size = 0.85
    this.transformControls.addEventListener('dragging-changed', this.handleTransformDraggingChange)
    this.transformControls.addEventListener('objectChange', this.handleObjectTransform)
    this.transformControls.addEventListener('mouseUp', this.handleTransformMouseUp)
    this.transformControlHelper = this.transformControls.getHelper()
    this.scene.add(this.transformControlHelper)
    this.refreshTransformControlAttachment()
  }

  private refreshTransformControlAttachment() {
    if (this.experienceMode !== 'builder') {
      this.transformControls?.detach()
      return
    }

    if (!this.transformControls || !this.shipModelManager || !this.selectedSlot) {
      this.transformControls?.detach()
      return
    }

    const target = this.getTransformControlTarget(this.selectedSlot)
    if (!target) {
      this.transformControls.detach()
      return
    }

    this.configureTransformControlsForMode(this.transformMode)
    this.transformControls.attach(target)
  }

  private getTransformControlTarget(slot: ShipSlot): Object3D | null {
    if (!this.shipModelManager) {
      return null
    }

    if (this.transformMode === 'pairSpread') {
      if (!this.isSymmetricSlot(slot)) {
        return null
      }

      return this.shipModelManager.getSymmetricMasterSideGroup(slot)
    }

    if (this.transformMode === 'aimRotate') {
      if (!this.isSymmetricSlot(slot)) {
        return null
      }

      return this.shipModelManager.getSymmetricAimPivotGroup(slot)
    }

    return this.shipModelManager.getSlotGroup(slot)
  }

  private configureTransformControlsForMode(mode: TransformMode) {
    if (!this.transformControls) {
      return
    }

    this.transformControls.setMode(this.resolveTransformControlMode(mode))
    this.transformControls.setSpace('local')

    if (mode === 'pairSpread') {
      this.transformControls.showX = true
      this.transformControls.showY = false
      this.transformControls.showZ = false
      return
    }

    this.transformControls.showX = true
    this.transformControls.showY = true
    this.transformControls.showZ = true
  }

  private resolveTransformControlMode(mode: TransformMode): TransformControlMode {
    if (mode === 'pairSpread') {
      return 'translate'
    }

    if (mode === 'aimRotate') {
      return 'rotate'
    }

    return mode
  }

  private applyOrbitConstraints(constraints: OrbitConstraintSet) {
    if (!this.controls) {
      return
    }

    this.controls.minDistance = constraints.minDistance
    this.controls.maxDistance = constraints.maxDistance
    this.controls.minPolarAngle = constraints.minPolarAngle
    this.controls.maxPolarAngle = constraints.maxPolarAngle
  }

  private applyCameraViewConstraints() {
    if (this.experienceMode === 'flight') {
      if (this.controls) {
        this.controls.enabled = false
      }
      return
    }

    const constraints = this.isPanoramicViewEnabled
      ? PANORAMIC_ORBIT_CONSTRAINTS
      : DEFAULT_ORBIT_CONSTRAINTS

    this.applyOrbitConstraints(constraints)
    if (this.controls) {
      this.controls.enabled = true
    }
    this.controls?.update()
  }

  private getSceneSize(): SceneSize {
    if (!this.canvas) {
      return { width: 0, height: 0 }
    }

    const parent = this.canvas.parentElement
    if (!parent) {
      return { width: window.innerWidth, height: window.innerHeight }
    }

    return {
      width: parent.clientWidth,
      height: parent.clientHeight,
    }
  }

  private handleResize = () => {
    if (!this.isMounted) {
      return
    }

    this.resize()
  }

  private handleCanvasPointerDown = (event: PointerEvent) => {
    this.markActivity()

    if (this.experienceMode !== 'builder') {
      return
    }

    if (!this.camera || !this.shipGroup || !this.canvas) {
      return
    }

    if (this.transformControls?.dragging) {
      return
    }

    const rect = this.canvas.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) {
      return
    }

    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    this.raycaster.setFromCamera(this.pointer, this.camera)
    const intersections = this.raycaster.intersectObject(this.shipGroup, true)

    const selectedSlot = intersections
      .map((intersection) => this.getSlotFromObject(intersection.object))
      .find((slot): slot is ShipSlot => slot !== null)

    if (!selectedSlot) {
      return
    }

    this.setSelectedSlot(selectedSlot)
    this.slotSelectionHandler?.(selectedSlot)
  }

  private handleCanvasPointerMove = (event: PointerEvent) => {
    if (this.experienceMode !== 'builder') {
      return
    }

    if (!this.camera || !this.shipGroup || !this.canvas) {
      return
    }

    if (this.transformControls?.dragging) {
      return
    }

    const rect = this.canvas.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) {
      return
    }

    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    this.raycaster.setFromCamera(this.pointer, this.camera)
    const intersections = this.raycaster.intersectObject(this.shipGroup, true)

    const hovered =
      intersections
        .map((intersection) => this.getSlotFromObject(intersection.object))
        .find((slot): slot is ShipSlot => slot !== null) ?? null

    if (hovered !== this.hoveredSlot) {
      this.hoveredSlot = hovered
      this.canvas.style.cursor = hovered ? 'pointer' : ''
      this.refreshOutlineSelection()
    }
  }

  private handleCanvasPointerLeave = () => {
    if (this.hoveredSlot === null) {
      return
    }
    this.hoveredSlot = null
    if (this.canvas) {
      this.canvas.style.cursor = ''
    }
    this.refreshOutlineSelection()
  }

  private getSlotFromObject(object: Object3D | null): ShipSlot | null {
    let node: Object3D | null = object

    while (node) {
      const slot: unknown = node.userData.shipSlot
      if (slot && this.isShipSlot(slot)) {
        return slot
      }

      node = node.parent
    }

    return null
  }

  private isShipSlot(value: unknown): value is ShipSlot {
    return (
      value === 'body' ||
      value === 'cockpit' ||
      value === 'wings' ||
      value === 'engines' ||
      value === 'weapons'
    )
  }

  private isSymmetricSlot(slot: ShipSlot): slot is SymmetricSlot {
    return slot === 'wings' || slot === 'engines' || slot === 'weapons'
  }

  private handleTransformDraggingChange = (
    event: { value: unknown } & ThreeEvent<'dragging-changed', TransformControls>
  ) => {
    if (this.controls) {
      this.controls.enabled = !event.value
    }
  }

  private handleObjectTransform = () => {
    this.emitTransformPatch(false)
  }

  private handleTransformMouseUp = () => {
    this.emitTransformPatch(true)
  }

  private emitTransformPatch(commitHistory: boolean) {
    if (this.experienceMode !== 'builder') {
      return
    }

    if (!this.selectedSlot || !this.shipModelManager) {
      return
    }

    if (this.transformMode === 'pairSpread') {
      this.emitPairSpreadPatch(commitHistory)
      return
    }

    if (this.transformMode === 'aimRotate') {
      this.emitAimRotationPatch(commitHistory)
      return
    }

    const slotGroup = this.shipModelManager.getSlotGroup(this.selectedSlot)

    if (this.transformMode === 'translate') {
      this.slotTransformHandler?.(
        this.selectedSlot,
        {
          offset: [slotGroup.position.x, slotGroup.position.y, slotGroup.position.z],
        },
        { commitHistory }
      )
      return
    }

    if (this.transformMode === 'rotate') {
      this.slotTransformHandler?.(
        this.selectedSlot,
        {
          rotation: [slotGroup.rotation.x, slotGroup.rotation.y, slotGroup.rotation.z],
        },
        { commitHistory }
      )
      return
    }

    this.slotTransformHandler?.(
      this.selectedSlot,
      {
        scale: [slotGroup.scale.x, slotGroup.scale.y, slotGroup.scale.z],
      },
      { commitHistory }
    )
  }

  private emitPairSpreadPatch(commitHistory: boolean) {
    if (!this.selectedSlot || !this.shipModelManager || !this.isSymmetricSlot(this.selectedSlot)) {
      return
    }

    const masterSide = this.shipModelManager.getSymmetricMasterSideGroup(this.selectedSlot)
    const slotPartPair = this.shipModelManager.getSlotPartPair(this.selectedSlot)
    if (!masterSide || !slotPartPair) {
      return
    }

    const range = SHIP_SYMMETRIC_PAIR_SPREAD_RANGES[this.selectedSlot]
    const rawPairSpread = slotPartPair.masterPart.pivotLocal[0] - masterSide.position.x
    const pairSpread = this.clampNumber(rawPairSpread, range.min, range.max)

    this.slotTransformHandler?.(
      this.selectedSlot,
      {
        pairSpread,
      },
      { commitHistory }
    )
  }

  private emitAimRotationPatch(commitHistory: boolean) {
    if (!this.selectedSlot || !this.shipModelManager || !this.isSymmetricSlot(this.selectedSlot)) {
      return
    }

    const aimPivot = this.shipModelManager.getSymmetricAimPivotGroup(this.selectedSlot)
    if (!aimPivot) {
      return
    }

    const range = SHIP_SYMMETRIC_AIM_ROTATION_RANGES[this.selectedSlot]
    this.slotTransformHandler?.(
      this.selectedSlot,
      {
        aimRotation: [
          this.clampNumber(aimPivot.rotation.x, range.x.min, range.x.max),
          this.clampNumber(aimPivot.rotation.y, range.y.min, range.y.max),
          this.clampNumber(aimPivot.rotation.z, range.z.min, range.z.max),
        ],
      },
      { commitHistory }
    )
  }

  private clampNumber(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value))
  }

  private enableFlightMode() {
    this.isCinematicViewEnabled = false
    this.isIdleCinematicActive = false
    this.resetFlightInputState()
    this.flightSpeed = 0

    if (this.controls) {
      this.controls.autoRotate = false
      this.controls.enabled = false
    }

    this.transformControls?.detach()
    this.refreshValidationState()
  }

  private disableFlightMode() {
    this.resetFlightInputState()
    this.flightSpeed = 0
    this.resetShipTransform()
    this.lastActivityAt = performance.now()
    this.isIdleCinematicActive = false

    if (this.camera && this.controls) {
      this.camera.position.set(
        CAMERA_SETTINGS.position.x,
        CAMERA_SETTINGS.position.y,
        CAMERA_SETTINGS.position.z
      )
      this.controls.target.copy(this.defaultOrbitTarget)
    }

    this.applyCameraViewConstraints()
    this.controls?.update()
    this.refreshTransformControlAttachment()
    this.refreshValidationState()
  }

  private resetShipTransform() {
    if (!this.shipGroup) {
      return
    }

    this.shipGroup.position.set(0, 0, 0)
    this.shipGroup.rotation.set(0, 0, 0)
  }

  private resetFlightInputState() {
    this.flightInputState.throttleForward = false
    this.flightInputState.throttleReverse = false
    this.flightInputState.yawLeft = false
    this.flightInputState.yawRight = false
    this.flightInputState.pitchUp = false
    this.flightInputState.pitchDown = false
    this.flightInputState.rollLeft = false
    this.flightInputState.rollRight = false
    this.flightInputState.boost = false
  }

  private getFlightAxisValue(positive: boolean, negative: boolean) {
    const positiveValue = positive ? 1 : 0
    const negativeValue = negative ? 1 : 0
    return positiveValue - negativeValue
  }

  private updateFlightSimulation(delta: number) {
    if (!this.shipGroup || !this.camera) {
      return
    }

    if (this.isDialogOpen()) {
      this.resetFlightInputState()
    }

    const throttleInput = this.getFlightAxisValue(
      this.flightInputState.throttleForward,
      this.flightInputState.throttleReverse
    )
    const yawInput = this.getFlightAxisValue(
      this.flightInputState.yawLeft,
      this.flightInputState.yawRight
    )
    const pitchInput = this.getFlightAxisValue(
      this.flightInputState.pitchUp,
      this.flightInputState.pitchDown
    )
    const rollInput = this.getFlightAxisValue(
      this.flightInputState.rollRight,
      this.flightInputState.rollLeft
    )

    const forwardBoostMultiplier = this.flightInputState.boost && throttleInput > 0 ? 1.45 : 1
    const targetSpeed =
      throttleInput >= 0
        ? throttleInput * FLIGHT_SETTINGS.maxForwardSpeed * forwardBoostMultiplier
        : throttleInput * FLIGHT_SETTINGS.maxReverseSpeed
    const accelerationPerSecond =
      Math.abs(targetSpeed) > Math.abs(this.flightSpeed)
        ? FLIGHT_SETTINGS.acceleration
        : FLIGHT_SETTINGS.brakeAcceleration
    const maxSpeedDelta = accelerationPerSecond * delta
    const speedDelta = targetSpeed - this.flightSpeed

    if (Math.abs(speedDelta) <= maxSpeedDelta) {
      this.flightSpeed = targetSpeed
    } else {
      this.flightSpeed += Math.sign(speedDelta) * maxSpeedDelta
    }

    if (throttleInput === 0) {
      const dragFactor = Math.max(0, 1 - FLIGHT_SETTINGS.drag * delta)
      this.flightSpeed *= dragFactor
      if (Math.abs(this.flightSpeed) < 0.02) {
        this.flightSpeed = 0
      }
    }

    if (pitchInput !== 0) {
      this.shipGroup.rotateX(pitchInput * FLIGHT_SETTINGS.pitchRate * delta)
    }
    if (yawInput !== 0) {
      this.shipGroup.rotateY(yawInput * FLIGHT_SETTINGS.yawRate * delta)
    }
    if (rollInput !== 0) {
      this.shipGroup.rotateZ(rollInput * FLIGHT_SETTINGS.rollRate * delta)
    }

    this.flightForward.set(0, 0, 1).applyQuaternion(this.shipGroup.quaternion).normalize()
    this.shipGroup.position.addScaledVector(this.flightForward, this.flightSpeed * delta)
    this.updateFlightCamera(delta)
  }

  private updateFlightCamera(delta: number) {
    if (!this.shipGroup || !this.camera) {
      return
    }

    this.flightForward.set(0, 0, 1).applyQuaternion(this.shipGroup.quaternion).normalize()
    this.flightUp.set(0, 1, 0).applyQuaternion(this.shipGroup.quaternion).normalize()

    this.flightDesiredCameraPosition
      .copy(this.shipGroup.position)
      .addScaledVector(this.flightUp, FLIGHT_SETTINGS.cameraFollowHeight)
      .addScaledVector(this.flightForward, -FLIGHT_SETTINGS.cameraFollowDistance)

    const smoothing = Math.min(1, FLIGHT_SETTINGS.cameraSmoothing * delta)
    this.camera.position.lerp(this.flightDesiredCameraPosition, smoothing)

    this.flightDesiredLookTarget
      .copy(this.shipGroup.position)
      .addScaledVector(this.flightForward, FLIGHT_SETTINGS.cameraLookAhead)

    this.camera.lookAt(this.flightDesiredLookTarget)
    this.controls?.target.copy(this.flightDesiredLookTarget)
  }

  private handleWindowKeyDown = (event: KeyboardEvent) => {
    this.markActivity()

    if (
      this.experienceMode !== 'flight' ||
      this.isEditableKeyboardTarget(event.target) ||
      this.isDialogOpen()
    ) {
      return
    }

    this.setFlightInputStateFromCode(event.code, true, event)
  }

  private handleWindowKeyUp = (event: KeyboardEvent) => {
    if (
      this.experienceMode !== 'flight' ||
      this.isEditableKeyboardTarget(event.target) ||
      this.isDialogOpen()
    ) {
      return
    }

    this.setFlightInputStateFromCode(event.code, false, event)
  }

  private setFlightInputStateFromCode(code: string, isPressed: boolean, event: KeyboardEvent) {
    switch (code) {
      case 'KeyW':
        this.flightInputState.throttleForward = isPressed
        break
      case 'KeyS':
        this.flightInputState.throttleReverse = isPressed
        break
      case 'KeyA':
        this.flightInputState.yawLeft = isPressed
        break
      case 'KeyD':
        this.flightInputState.yawRight = isPressed
        break
      case 'ArrowUp':
        this.flightInputState.pitchUp = isPressed
        break
      case 'ArrowDown':
        this.flightInputState.pitchDown = isPressed
        break
      case 'KeyQ':
        this.flightInputState.rollLeft = isPressed
        break
      case 'KeyE':
        this.flightInputState.rollRight = isPressed
        break
      case 'ShiftLeft':
      case 'ShiftRight':
        this.flightInputState.boost = isPressed
        break
      default:
        return
    }

    event.preventDefault()
  }

  private isEditableKeyboardTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
      return false
    }

    const tagName = target.tagName.toLowerCase()
    if (tagName === 'input' || tagName === 'textarea' || target.isContentEditable) {
      return true
    }

    return false
  }

  private isDialogOpen(): boolean {
    if (typeof document === 'undefined') {
      return false
    }

    return document.querySelector('.ui-dialog-backdrop') !== null
  }

  private detectSevereOverlaps(): ShipSlot[] {
    if (!this.shipModelManager) {
      return []
    }

    const overlappingSlots = new Set<ShipSlot>()

    OVERLAP_SLOT_PAIRS.forEach(([slotA, slotB]) => {
      const groupA = this.shipModelManager?.getSlotGroup(slotA)
      const groupB = this.shipModelManager?.getSlotGroup(slotB)
      if (!groupA || !groupB) {
        return
      }

      this.boxA.setFromObject(groupA)
      this.boxB.setFromObject(groupB)

      if (this.boxA.isEmpty() || this.boxB.isEmpty()) {
        return
      }

      this.intersectionBox.copy(this.boxA).intersect(this.boxB)
      if (this.intersectionBox.isEmpty()) {
        return
      }

      this.boxA.getSize(this.sizeA)
      this.boxB.getSize(this.sizeB)
      this.intersectionBox.getSize(this.intersectionSize)

      const volumeA = this.sizeA.x * this.sizeA.y * this.sizeA.z
      const volumeB = this.sizeB.x * this.sizeB.y * this.sizeB.z
      const intersectionVolume =
        this.intersectionSize.x * this.intersectionSize.y * this.intersectionSize.z
      const smallerVolume = Math.min(volumeA, volumeB)

      if (smallerVolume <= 0) {
        return
      }

      const ratio = intersectionVolume / smallerVolume
      if (ratio >= OVERLAP_VOLUME_RATIO_THRESHOLD) {
        overlappingSlots.add(slotA)
        overlappingSlots.add(slotB)
      }
    })

    return [...overlappingSlots]
  }

  private enforceBodyContactConstraint(): ShipSlot[] {
    if (!this.shipModelManager) {
      return []
    }

    const bodySlotGroup = this.shipModelManager.getSlotGroup('body')
    this.boxA.setFromObject(bodySlotGroup)
    if (this.boxA.isEmpty()) {
      return []
    }

    const bodyContactBox = this.intersectionBox
      .copy(this.boxA)
      .expandByScalar(BODY_CONTACT_TOLERANCE)
    const detachedSlots: ShipSlot[] = []

    BODY_CONTACT_SLOTS.forEach((slot) => {
      const slotGroup = this.shipModelManager?.getSlotGroup(slot)
      if (!slotGroup) {
        return
      }

      this.boxB.setFromObject(slotGroup)
      if (this.boxB.isEmpty() || bodyContactBox.intersectsBox(this.boxB)) {
        return
      }

      detachedSlots.push(slot)
    })

    return detachedSlots
  }

  private refreshValidationState() {
    const detachedSlots = this.enforceBodyContactConstraint()
    this.slotBodyContactHandler?.(detachedSlots)

    const overlappingSlots = this.detectSevereOverlaps()
    this.shipModelManager?.setInvalidSlots([...new Set([...overlappingSlots, ...detachedSlots])])
    this.slotValidationHandler?.(overlappingSlots)
  }

  private animate = () => {
    if (!this.isMounted || !this.renderer || !this.scene || !this.camera) {
      return
    }

    this.stats?.begin()

    const delta = this.clock?.getDelta() ?? 0
    if (this.experienceMode === 'flight') {
      this.updateFlightSimulation(delta)
    } else {
      this.updateIdleCinematic()
      this.controls?.update(delta)
    }
    if (this.isDevEnvironment) {
      this.lightHelpers.forEach((helper) => helper.update())
      this.shadowHelpers.forEach((helper) => helper.update())
    }
    if (this.composer) {
      this.composer.render()
    } else {
      this.renderer.render(this.scene, this.camera)
    }

    this.stats?.end()

    this.animationFrameId = window.requestAnimationFrame(this.animate)
  }
}
