import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  AmbientLight,
  AxesHelper,
  BufferAttribute,
  BufferGeometry,
  Clock,
  Color,
  DirectionalLight,
  DirectionalLightHelper,
  DoubleSide,
  FogExp2,
  GridHelper,
  Group,
  InstancedMesh,
  MathUtils,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
  type Material,
} from 'three'
import { thrusterFragmentShader, thrusterVertexShader } from '@/lib/shaders/thruster'
import { projectileFragmentShader, projectileVertexShader } from '@/lib/shaders/projectile'
import { muzzleFlashFragmentShader, muzzleFlashVertexShader } from '@/lib/shaders/muzzleFlash'
import { starFieldFragmentShader, starFieldVertexShader } from '@/lib/shaders/starField'
import {
  BlendFunction,
  BloomEffect,
  EffectComposer,
  EffectPass,
  FXAAEffect,
  NoiseEffect,
  RenderPass,
} from 'postprocessing'
import Stats from 'three/addons/libs/stats.module.js'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { ShipBuilderModelManager } from '@/lib/managers/ShipBuilderModelManager'
import { getRendererQualityProfile, type RendererQualityProfile } from '@/lib/utils/RendererQuality'
import type { ShipConfig } from '@/lib/models/ShipConfig'
import { PLANET_TEXTURE_URLS } from '@/assets/resources'
import { getCachedPlanetTexture, loadPlanetTexture } from '@/lib/utils/PlanetTextureCache'
import {
  FLIGHT_SCENE_BANK,
  FLIGHT_SCENE_CAMERA,
  MOBILE_FLIGHT_SCENE_CAMERA,
  FLIGHT_SCENE_MUZZLE_FLASH,
  FLIGHT_SCENE_PLANET_POOL_SIZE,
  FLIGHT_SCENE_POST_PROCESSING,
  FLIGHT_SCENE_PROJECTILES,
  FLIGHT_SCENE_RENDERER,
  FLIGHT_SCENE_SPACE,
  FLIGHT_SCENE_STAR_LAYERS,
  FLIGHT_SCENE_PARALLAX,
  FLIGHT_SCENE_STRAFE,
  FLIGHT_SCENE_THRUSTERS,
  MAX_ENGINE_EXHAUSTS,
  PROJECTILE_LOCAL_FORWARD,
  PROJECTILE_TMP_MATRIX,
  PROJECTILE_TMP_POS,
  PROJECTILE_TMP_QUAT,
  PROJECTILE_TMP_SCALE,
  THRUSTER_CORE_COLOR,
  THRUSTER_MID_COLOR,
  THRUSTER_TAIL_COLOR,
} from '@/lib/managers/ShipFlightSceneManager/constants'
import type {
  FlightDebugHelpersVisibility,
  FlightSceneCameraConfig,
  FlightScenePlanetEntry,
  FlightSceneInputState,
  FlightSceneMuzzleFlashField,
  FlightSceneProjectileField,
  FlightSceneSize,
  FlightSceneStarField,
  FlightSceneThrusterField,
  FlightSceneTouchInput,
} from '@/lib/managers/ShipFlightSceneManager/types'
import {
  createDefaultInputState,
  isDisposableResource,
  pickRandomTemplate,
  randomInRange,
} from '@/lib/managers/ShipFlightSceneManager/utils'

export class ShipFlightSceneManager {
  private readonly isDevEnvironment = import.meta.env.DEV
  private canvas: HTMLCanvasElement | null = null
  private renderer: WebGLRenderer | null = null
  private scene: Scene | null = null
  private camera: PerspectiveCamera | null = null
  private clock: Clock | null = null
  private stats: Stats | null = null
  private debugGui: GUI | null = null
  private axesHelper: AxesHelper | null = null
  private gridHelper: GridHelper | null = null
  private directionalLights: DirectionalLight[] = []
  private lightHelpers: DirectionalLightHelper[] = []
  private debugHelpersVisibility: FlightDebugHelpersVisibility = {
    axes: false,
    grid: false,
    light: false,
  }
  private orbitControls: OrbitControls | null = null
  private isFreeCameraEnabled = false
  private composer: EffectComposer | null = null
  private qualityProfile: RendererQualityProfile = getRendererQualityProfile()
  private noiseEffect: NoiseEffect | null = null
  private noiseSettings = {
    enabled: FLIGHT_SCENE_POST_PROCESSING.noise.enabled as boolean,
    opacity: FLIGHT_SCENE_POST_PROCESSING.noise.opacity as number,
    premultiply: FLIGHT_SCENE_POST_PROCESSING.noise.premultiply as boolean,
  }
  private shipGroup: Group | null = null
  private shipModelGroup: Group | null = null
  private planetsLayer: Group | null = null
  private shipModelManager: ShipBuilderModelManager | null = null
  private pendingShipConfig: ShipConfig | null = null
  private animationFrameId = 0
  private isMounted = false
  private strafe = 0
  private targetStrafe = 0
  private strafeBound = 0
  private pitch = 0
  private targetPitch = 0
  private pitchBound = 0
  private readonly inputState: FlightSceneInputState = createDefaultInputState()
  private touchStrafe = 0
  private touchPitch = 0
  private touchFire = false
  private parallaxX = 0
  private parallaxY = 0
  private targetParallaxX = 0
  private targetParallaxY = 0
  private activeCameraConfig: FlightSceneCameraConfig = FLIGHT_SCENE_CAMERA
  private readonly lookTarget = new Vector3(
    FLIGHT_SCENE_CAMERA.lookAt.x,
    FLIGHT_SCENE_CAMERA.lookAt.y,
    FLIGHT_SCENE_CAMERA.lookAt.z
  )
  private readonly starFields: FlightSceneStarField[] = []
  private readonly planets: FlightScenePlanetEntry[] = []
  private thrusterField: FlightSceneThrusterField | null = null
  private projectileField: FlightSceneProjectileField | null = null
  private muzzleFlashField: FlightSceneMuzzleFlashField | null = null
  private fireCooldown = 0
  private readonly shipForwardWorld = new Vector3()

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
    window.addEventListener('blur', this.handleWindowBlur)
    window.addEventListener('pointermove', this.handleWindowPointerMove)
    this.resize()
    this.animate()
  }

  syncShipConfig(shipConfig: ShipConfig) {
    this.pendingShipConfig = shipConfig
    this.shipModelManager?.sync(shipConfig)
    this.shipModelManager?.setSelectedSlot(null)
  }

  setTouchInput(input: FlightSceneTouchInput) {
    if (input.strafe !== undefined) {
      this.touchStrafe = MathUtils.clamp(input.strafe, -1, 1)
    }
    if (input.pitch !== undefined) {
      this.touchPitch = MathUtils.clamp(input.pitch, -1, 1)
    }
    if (input.fire !== undefined) {
      this.touchFire = input.fire
    }
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
    window.removeEventListener('blur', this.handleWindowBlur)
    window.removeEventListener('pointermove', this.handleWindowPointerMove)
    this.resetInputState()

    this.shipModelManager?.dispose()
    this.disposeStarFields()
    this.disposeAllPlanets()
    this.disposeThrusters()
    this.disposeMuzzleFlash()
    this.disposeProjectiles()
    this.disposeSceneObjects()
    this.disposeDebugGui()
    this.disposeDebugHelpers()
    this.disposeOrbitControls()
    this.disposeStats()
    this.composer?.dispose()
    this.renderer?.dispose()

    this.composer = null
    this.noiseEffect = null
    this.renderer = null
    this.scene = null
    this.camera = null
    this.clock = null
    this.shipGroup = null
    this.shipModelGroup = null
    this.planetsLayer = null
    this.shipModelManager = null
    this.pendingShipConfig = null
    this.directionalLights = []
    this.isFreeCameraEnabled = false
    this.canvas = null
    this.strafe = 0
    this.targetStrafe = 0
    this.strafeBound = 0
    this.pitch = 0
    this.targetPitch = 0
    this.pitchBound = 0
    this.starFields.length = 0
    this.planets.length = 0
    this.thrusterField = null
    this.projectileField = null
    this.muzzleFlashField = null
    this.fireCooldown = 0
    this.touchStrafe = 0
    this.touchPitch = 0
    this.touchFire = false
  }

  private initialize() {
    if (!this.canvas) {
      return
    }

    this.activeCameraConfig = this.resolveCameraConfig()
    this.lookTarget.set(
      this.activeCameraConfig.lookAt.x,
      this.activeCameraConfig.lookAt.y,
      this.activeCameraConfig.lookAt.z
    )

    this.renderer = new WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance',
    })
    this.renderer.setClearColor(new Color(FLIGHT_SCENE_RENDERER.clearColor), 1)
    this.renderer.shadowMap.enabled = FLIGHT_SCENE_RENDERER.enableShadows
    this.renderer.outputColorSpace = SRGBColorSpace
    this.renderer.toneMapping = ACESFilmicToneMapping
    this.renderer.toneMappingExposure = FLIGHT_SCENE_RENDERER.toneMappingExposure

    this.scene = new Scene()
    this.scene.background = new Color(FLIGHT_SCENE_RENDERER.clearColor)
    this.scene.fog = new FogExp2(FLIGHT_SCENE_RENDERER.clearColor, FLIGHT_SCENE_RENDERER.fogDensity)

    this.camera = new PerspectiveCamera(
      this.activeCameraConfig.fov,
      1,
      this.activeCameraConfig.near,
      this.activeCameraConfig.far
    )
    this.camera.position.set(
      this.activeCameraConfig.position.x,
      this.activeCameraConfig.position.y,
      this.activeCameraConfig.position.z
    )
    this.camera.lookAt(this.lookTarget)

    this.clock = new Clock()
    this.initializeLights()
    this.initializeShip()
    this.initializeSpace()
    this.initializePostProcessing()
    this.initializeStats()
    this.initializeDebugGui()
  }

  private initializePostProcessing() {
    if (!this.renderer || !this.scene || !this.camera) {
      return
    }

    this.composer = new EffectComposer(this.renderer)
    this.composer.addPass(new RenderPass(this.scene, this.camera))

    const bloomEffect = new BloomEffect({
      intensity: FLIGHT_SCENE_POST_PROCESSING.bloom.intensity,
      radius: FLIGHT_SCENE_POST_PROCESSING.bloom.radius,
      luminanceThreshold: FLIGHT_SCENE_POST_PROCESSING.bloom.threshold,
      mipmapBlur: true,
    })
    const bloomPass = new EffectPass(this.camera, bloomEffect)
    bloomPass.enabled =
      FLIGHT_SCENE_POST_PROCESSING.bloom.enabled && this.qualityProfile.bloomEnabled
    this.composer.addPass(bloomPass)

    const fxaaPass = new EffectPass(this.camera, new FXAAEffect())
    fxaaPass.enabled = FLIGHT_SCENE_POST_PROCESSING.fxaa.enabled
    this.composer.addPass(fxaaPass)

    const noiseEffect = new NoiseEffect({
      blendFunction: BlendFunction.SOFT_LIGHT,
      premultiply: this.noiseSettings.premultiply,
    })
    noiseEffect.blendMode.opacity.value = this.noiseSettings.opacity
    noiseEffect.blendMode.blendFunction = this.noiseSettings.enabled
      ? BlendFunction.SOFT_LIGHT
      : BlendFunction.SKIP
    const noisePass = new EffectPass(this.camera, noiseEffect)
    this.composer.addPass(noisePass)
    this.noiseEffect = noiseEffect
  }

  private initializeStats() {
    if (!this.isDevEnvironment) {
      return
    }

    this.disposeStats()

    this.stats = new Stats()
    this.stats.showPanel(1)
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

  private initializeLights() {
    if (!this.scene) {
      return
    }

    const ambient = new AmbientLight('#d7e2f0', 0.2)
    this.scene.add(ambient)

    const keyLight = new DirectionalLight('#fff4d6', 1.6)
    keyLight.position.set(6.5, 7.5, 8.4)
    this.scene.add(keyLight)

    const rimLight = new DirectionalLight('#bfdcff', 0.42)
    rimLight.position.set(-7.2, 3.8, -9.5)
    this.scene.add(rimLight)

    const fillLight = new DirectionalLight('#f3f7ff', 0.18)
    fillLight.position.set(0, 2.6, 10.5)
    this.scene.add(fillLight)

    this.directionalLights = [keyLight, rimLight, fillLight]
    if (this.isDevEnvironment) {
      this.initializeDebugHelpers()
    }
  }

  private initializeDebugHelpers() {
    if (!this.scene) {
      return
    }

    this.disposeDebugHelpers()

    this.axesHelper = new AxesHelper(5)
    this.scene.add(this.axesHelper)

    this.gridHelper = new GridHelper(40, 40, 0x4f6d8a, 0x223044)
    this.scene.add(this.gridHelper)

    this.directionalLights.forEach((light) => {
      const helper = new DirectionalLightHelper(light, 3.5)
      this.scene?.add(helper)
      this.lightHelpers.push(helper)
    })

    this.updateDebugHelpersVisibility()
  }

  private disposeDebugHelpers() {
    if (this.axesHelper) {
      this.scene?.remove(this.axesHelper)
      this.axesHelper.dispose()
      this.axesHelper = null
    }
    if (this.gridHelper) {
      this.scene?.remove(this.gridHelper)
      this.gridHelper.dispose()
      this.gridHelper = null
    }
    this.lightHelpers.forEach((helper) => {
      helper.dispose()
      this.scene?.remove(helper)
    })
    this.lightHelpers = []
  }

  private updateDebugHelpersVisibility() {
    if (this.axesHelper) {
      this.axesHelper.visible = this.debugHelpersVisibility.axes
    }
    if (this.gridHelper) {
      this.gridHelper.visible = this.debugHelpersVisibility.grid
    }
    this.lightHelpers.forEach((helper) => {
      helper.visible = this.debugHelpersVisibility.light
    })
  }

  private setDebugHelpersVisibility(visibility: Partial<FlightDebugHelpersVisibility>) {
    if (visibility.axes !== undefined) {
      this.debugHelpersVisibility.axes = visibility.axes
    }
    if (visibility.grid !== undefined) {
      this.debugHelpersVisibility.grid = visibility.grid
    }
    if (visibility.light !== undefined) {
      this.debugHelpersVisibility.light = visibility.light
    }
    this.updateDebugHelpersVisibility()
  }

  private initializeDebugGui() {
    if (!this.isDevEnvironment) {
      return
    }

    this.disposeDebugGui()
    this.debugGui = new GUI({
      title: 'Flight Debug',
      width: 280,
    })

    const helpersFolder = this.debugGui.addFolder('Helpers')
    helpersFolder
      .add(this.debugHelpersVisibility, 'axes')
      .name('Axes Helper')
      .onChange((value: boolean) => {
        this.setDebugHelpersVisibility({ axes: value })
      })
    helpersFolder
      .add(this.debugHelpersVisibility, 'grid')
      .name('Grid Helper')
      .onChange((value: boolean) => {
        this.setDebugHelpersVisibility({ grid: value })
      })
    helpersFolder
      .add(this.debugHelpersVisibility, 'light')
      .name('Light Helpers')
      .onChange((value: boolean) => {
        this.setDebugHelpersVisibility({ light: value })
      })

    const cameraFolder = this.debugGui.addFolder('Camera')
    const cameraOptions = { freeOrbit: this.isFreeCameraEnabled }
    cameraFolder
      .add(cameraOptions, 'freeOrbit')
      .name('Free Camera Orbit')
      .onChange((value: boolean) => {
        this.setFreeCameraEnabled(value)
      })

    const postFolder = this.debugGui.addFolder('Post Processing')
    const noiseFolder = postFolder.addFolder('Noise')
    noiseFolder
      .add(this.noiseSettings, 'enabled')
      .name('Enabled')
      .onChange((value: boolean) => {
        if (this.noiseEffect) {
          this.noiseEffect.blendMode.blendFunction = value
            ? BlendFunction.SOFT_LIGHT
            : BlendFunction.SKIP
        }
      })
    noiseFolder
      .add(this.noiseSettings, 'opacity', 0, 1, 0.01)
      .name('Opacity')
      .onChange((value: number) => {
        if (this.noiseEffect) this.noiseEffect.blendMode.opacity.value = value
      })
    noiseFolder
      .add(this.noiseSettings, 'premultiply')
      .name('Premultiply')
      .onChange((value: boolean) => {
        if (this.noiseEffect) this.noiseEffect.premultiply = value
      })
  }

  private setFreeCameraEnabled(enabled: boolean) {
    if (this.isFreeCameraEnabled === enabled) {
      return
    }

    this.isFreeCameraEnabled = enabled
    if (enabled) {
      this.enableFreeCamera()
      return
    }

    this.disableFreeCamera()
  }

  private enableFreeCamera() {
    if (!this.camera || !this.canvas) {
      return
    }

    this.disposeOrbitControls()
    this.orbitControls = new OrbitControls(this.camera, this.canvas)
    this.orbitControls.enableDamping = true
    this.orbitControls.dampingFactor = 0.08
    this.orbitControls.target.copy(this.lookTarget)
    this.orbitControls.update()
  }

  private disableFreeCamera() {
    this.disposeOrbitControls()
    if (!this.camera) {
      return
    }
    this.camera.position.set(
      this.activeCameraConfig.position.x,
      this.activeCameraConfig.position.y,
      this.activeCameraConfig.position.z
    )
    this.camera.lookAt(this.lookTarget)
  }

  private disposeOrbitControls() {
    this.orbitControls?.dispose()
    this.orbitControls = null
  }

  private disposeDebugGui() {
    this.debugGui?.destroy()
    this.debugGui = null
  }

  private initializeShip() {
    if (!this.scene) {
      return
    }

    this.shipGroup = new Group()
    this.shipGroup.name = 'flightShipGroup'
    this.scene.add(this.shipGroup)

    this.shipModelGroup = new Group()
    this.shipModelGroup.name = 'flightShipModelGroup'
    this.shipModelGroup.rotation.y = Math.PI
    this.shipGroup.add(this.shipModelGroup)

    this.shipModelManager = new ShipBuilderModelManager(this.shipModelGroup)
    this.shipModelManager.setSelectedSlot(null)

    if (this.pendingShipConfig) {
      this.shipModelManager.sync(this.pendingShipConfig)
      this.shipModelManager.setSelectedSlot(null)
    }
  }

  private initializeSpace() {
    if (!this.scene) {
      return
    }

    FLIGHT_SCENE_STAR_LAYERS.forEach((layerConfig, layerIndex) => {
      const field = this.createStarField(layerConfig)
      field.points.name = `flightStarsLayer-${layerIndex}`
      this.scene?.add(field.points)
      this.starFields.push(field)
    })

    this.planetsLayer = new Group()
    this.planetsLayer.name = 'flightPlanetsLayer'
    this.scene.add(this.planetsLayer)

    for (let i = 0; i < FLIGHT_SCENE_PLANET_POOL_SIZE; i += 1) {
      this.spawnPlanet(false)
    }

    this.initializeThrusters()
    this.initializeMuzzleFlash()
    this.initializeProjectiles()
  }

  private initializeProjectiles() {
    if (!this.scene) {
      return
    }

    const capacity = FLIGHT_SCENE_PROJECTILES.poolSize
    const positions = new Float32Array(capacity * 3)
    const velocities = new Float32Array(capacity * 3)
    const ages = new Float32Array(capacity)
    const alive = new Uint8Array(capacity)
    const quaternions = new Float32Array(capacity * 4)

    const size = FLIGHT_SCENE_PROJECTILES.size
    const geometry = new BufferGeometry()
    const vertices = new Float32Array([
      0,
      0,
      -size * 3.2,
      -size * 0.22,
      0,
      size * 0.5,
      size * 0.22,
      0,
      size * 0.5,
    ])
    geometry.setAttribute('position', new BufferAttribute(vertices, 3))
    geometry.setIndex([0, 1, 2])
    geometry.computeVertexNormals()

    const coreColor = new Color('#ffffff')
    const edgeColor = new Color(FLIGHT_SCENE_PROJECTILES.color).multiplyScalar(1.8)
    const material = new ShaderMaterial({
      vertexShader: projectileVertexShader,
      fragmentShader: projectileFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uCoreColor: { value: coreColor },
        uEdgeColor: { value: edgeColor },
        uSize: { value: size },
      },
      transparent: true,
      side: DoubleSide,
      blending: AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    })

    const mesh = new InstancedMesh(geometry, material, capacity)
    mesh.name = 'flightProjectiles'
    mesh.frustumCulled = false
    mesh.count = capacity

    const hiddenMatrix = new Matrix4().makeScale(0, 0, 0)
    for (let i = 0; i < capacity; i += 1) {
      mesh.setMatrixAt(i, hiddenMatrix)
    }
    mesh.instanceMatrix.needsUpdate = true

    this.scene.add(mesh)

    this.projectileField = {
      mesh,
      positions,
      velocities,
      ages,
      alive,
      quaternions,
      capacity,
      muzzleWorldPositions: [],
      muzzleCount: 0,
    }
  }

  private disposeProjectiles() {
    const field = this.projectileField
    if (!field) {
      return
    }
    this.scene?.remove(field.mesh)
    field.mesh.geometry.dispose()
    const material = field.mesh.material
    if (Array.isArray(material)) {
      material.forEach((entry) => entry.dispose())
    } else {
      ;(material as Material | null)?.dispose()
    }
    field.mesh.dispose()
    field.muzzleWorldPositions.length = 0
    this.projectileField = null
  }

  private spawnProjectiles() {
    const field = this.projectileField
    if (!field || !this.shipGroup || !this.shipModelManager) {
      return
    }

    field.muzzleCount = this.shipModelManager.getWeaponMuzzleWorldPositions(
      field.muzzleWorldPositions
    )
    if (field.muzzleCount === 0) {
      return
    }

    this.spawnMuzzleFlash(field.muzzleWorldPositions, field.muzzleCount)

    this.shipForwardWorld.set(0, 0, -1).applyQuaternion(this.shipGroup.quaternion).normalize()
    PROJECTILE_TMP_QUAT.setFromUnitVectors(PROJECTILE_LOCAL_FORWARD, this.shipForwardWorld)

    const speed = FLIGHT_SCENE_PROJECTILES.speed

    for (let m = 0; m < field.muzzleCount; m += 1) {
      const slot = this.findFreeProjectileSlot(field)
      if (slot === -1) {
        return
      }

      const origin = field.muzzleWorldPositions[m]
      const offset = slot * 3
      field.positions[offset] = origin.x
      field.positions[offset + 1] = origin.y
      field.positions[offset + 2] = origin.z

      field.velocities[offset] = this.shipForwardWorld.x * speed
      field.velocities[offset + 1] = this.shipForwardWorld.y * speed
      field.velocities[offset + 2] = this.shipForwardWorld.z * speed

      const qOffset = slot * 4
      field.quaternions[qOffset] = PROJECTILE_TMP_QUAT.x
      field.quaternions[qOffset + 1] = PROJECTILE_TMP_QUAT.y
      field.quaternions[qOffset + 2] = PROJECTILE_TMP_QUAT.z
      field.quaternions[qOffset + 3] = PROJECTILE_TMP_QUAT.w

      field.ages[slot] = 0
      field.alive[slot] = 1
    }
  }

  private findFreeProjectileSlot(field: FlightSceneProjectileField): number {
    for (let i = 0; i < field.capacity; i += 1) {
      if (field.alive[i] === 0) {
        return i
      }
    }
    return -1
  }

  private updateProjectiles(delta: number) {
    const field = this.projectileField
    if (!field) {
      return
    }

    this.fireCooldown = Math.max(0, this.fireCooldown - delta)
    const firing = this.inputState.fire || this.touchFire
    if (firing && this.fireCooldown === 0) {
      this.spawnProjectiles()
      this.fireCooldown = FLIGHT_SCENE_PROJECTILES.cooldown
    }

    const lifetime = FLIGHT_SCENE_PROJECTILES.lifetime
    const hiddenScale = 0
    let needsUpdate = false

    for (let i = 0; i < field.capacity; i += 1) {
      if (field.alive[i] === 0) {
        continue
      }

      field.ages[i] += delta
      if (field.ages[i] >= lifetime) {
        field.alive[i] = 0
        PROJECTILE_TMP_MATRIX.makeScale(hiddenScale, hiddenScale, hiddenScale)
        field.mesh.setMatrixAt(i, PROJECTILE_TMP_MATRIX)
        needsUpdate = true
        continue
      }

      const offset = i * 3
      field.positions[offset] += field.velocities[offset] * delta
      field.positions[offset + 1] += field.velocities[offset + 1] * delta
      field.positions[offset + 2] += field.velocities[offset + 2] * delta

      PROJECTILE_TMP_POS.set(
        field.positions[offset],
        field.positions[offset + 1],
        field.positions[offset + 2]
      )
      const qOffset = i * 4
      PROJECTILE_TMP_QUAT.set(
        field.quaternions[qOffset],
        field.quaternions[qOffset + 1],
        field.quaternions[qOffset + 2],
        field.quaternions[qOffset + 3]
      )
      PROJECTILE_TMP_MATRIX.compose(PROJECTILE_TMP_POS, PROJECTILE_TMP_QUAT, PROJECTILE_TMP_SCALE)
      field.mesh.setMatrixAt(i, PROJECTILE_TMP_MATRIX)
      needsUpdate = true
    }

    if (needsUpdate) {
      field.mesh.instanceMatrix.needsUpdate = true
    }
  }

  private initializeThrusters() {
    if (!this.scene || !this.shipGroup) {
      return
    }

    const capacity = MAX_ENGINE_EXHAUSTS * FLIGHT_SCENE_THRUSTERS.particlesPerEngine
    const seeds = new Float32Array(capacity * 3)
    const spawnPhases = new Float32Array(capacity)
    const lifetimes = new Float32Array(capacity)
    const emitterIndices = new Float32Array(capacity)
    const positions = new Float32Array(capacity * 3)

    const lifetimeMin = FLIGHT_SCENE_THRUSTERS.lifetimeMin
    const lifetimeMax = FLIGHT_SCENE_THRUSTERS.lifetimeMax
    for (let i = 0; i < capacity; i += 1) {
      const offset = i * 3
      seeds[offset] = Math.random()
      seeds[offset + 1] = Math.random()
      seeds[offset + 2] = Math.random()
      spawnPhases[i] = Math.random()
      lifetimes[i] = lifetimeMin + Math.random() * (lifetimeMax - lifetimeMin)
      emitterIndices[i] = i % MAX_ENGINE_EXHAUSTS
    }

    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(positions, 3))
    geometry.setAttribute('aSeed', new BufferAttribute(seeds, 3))
    geometry.setAttribute('aSpawnPhase', new BufferAttribute(spawnPhases, 1))
    geometry.setAttribute('aLifetime', new BufferAttribute(lifetimes, 1))
    geometry.setAttribute('aEmitterIndex', new BufferAttribute(emitterIndices, 1))

    const exhaustLocalPositions: Vector3[] = []
    for (let i = 0; i < MAX_ENGINE_EXHAUSTS; i += 1) {
      exhaustLocalPositions.push(new Vector3())
    }

    const pixelRatio = Math.min(window.devicePixelRatio || 1, this.qualityProfile.maxPixelRatio)
    const material = new ShaderMaterial({
      vertexShader: thrusterVertexShader,
      fragmentShader: thrusterFragmentShader,
      defines: {
        MAX_EXHAUSTS: MAX_ENGINE_EXHAUSTS,
      },
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: FLIGHT_SCENE_THRUSTERS.size },
        uPixelRatio: { value: pixelRatio },
        uCoreColor: { value: THRUSTER_CORE_COLOR.clone() },
        uMidColor: { value: THRUSTER_MID_COLOR.clone() },
        uTailColor: { value: THRUSTER_TAIL_COLOR.clone() },
        uExhaustLocal: { value: exhaustLocalPositions },
        uExhaustCount: { value: 0 },
        uExhaustSpeed: { value: FLIGHT_SCENE_THRUSTERS.exhaustSpeed },
        uJitter: { value: FLIGHT_SCENE_THRUSTERS.jitter },
        uSpawnSpread: { value: FLIGHT_SCENE_THRUSTERS.spawnSpread },
      },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    })

    const points = new Points(geometry, material)
    points.name = 'flightThrusterParticles'
    points.frustumCulled = false
    this.shipGroup.add(points)

    this.thrusterField = {
      points,
      capacity,
      exhaustLocalPositions,
      exhaustCount: 0,
      material,
    }

    this.refreshThrusterEmitters()
  }

  private refreshThrusterEmitters() {
    const field = this.thrusterField
    if (!field || !this.shipGroup || !this.shipModelManager) {
      return
    }

    const count = this.shipModelManager.getEngineExhaustLocalPositions(
      this.shipGroup,
      field.exhaustLocalPositions
    )
    field.exhaustCount = count
    field.material.uniforms.uExhaustCount.value = count
    field.material.uniforms.uExhaustLocal.value = field.exhaustLocalPositions
  }

  private createStarField(config: (typeof FLIGHT_SCENE_STAR_LAYERS)[number]): FlightSceneStarField {
    const seeds = new Float32Array(config.count * 3)
    for (let i = 0; i < config.count; i += 1) {
      const offset = i * 3
      seeds[offset] = Math.random()
      seeds[offset + 1] = Math.random()
      seeds[offset + 2] = Math.random()
    }

    const positions = new Float32Array(config.count * 3)
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(positions, 3))
    geometry.setAttribute('aSeed', new BufferAttribute(seeds, 3))
    geometry.boundingSphere = null

    const travelSpeed = FLIGHT_SCENE_SPACE.travelSpeed * config.speedMultiplier
    const zPeriod = FLIGHT_SCENE_SPACE.zSpawnAheadMax + FLIGHT_SCENE_SPACE.zDespawnBehind
    const zBaseOffset = -FLIGHT_SCENE_SPACE.zSpawnAheadMax
    const zSpawnRange = FLIGHT_SCENE_SPACE.zSpawnAheadMax - FLIGHT_SCENE_SPACE.zSpawnAheadMin
    const maxRadius = config.spread * 0.5
    const pixelRatio = Math.min(window.devicePixelRatio || 1, this.qualityProfile.maxPixelRatio)

    const material = new ShaderMaterial({
      vertexShader: starFieldVertexShader,
      fragmentShader: starFieldFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uTravelSpeed: { value: travelSpeed },
        uLateralOffset: { value: 0 },
        uCameraZ: { value: 0 },
        uZPeriod: { value: zPeriod },
        uZBaseOffset: { value: zBaseOffset },
        uZSpawnRange: { value: zSpawnRange },
        uFadeNear: { value: FLIGHT_SCENE_SPACE.zSpawnAheadMin },
        uFadeFar: { value: FLIGHT_SCENE_SPACE.zSpawnAheadMax },
        uMinRadius: { value: config.minRadius },
        uMaxRadius: { value: maxRadius },
        uVerticalSquash: { value: config.verticalSquash },
        uSize: { value: config.size },
        uPixelRatio: { value: pixelRatio },
        uColor: { value: new Color(config.color) },
        uOpacity: { value: config.opacity },
      },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    })

    const points = new Points(geometry, material)
    points.frustumCulled = false

    return {
      points,
      count: config.count,
      material,
      travelSpeed,
      speedMultiplier: config.speedMultiplier,
      lateralOffset: 0,
    }
  }

  private spawnPlanet(spawnAhead: boolean) {
    if (!this.planetsLayer) {
      return
    }

    const template = pickRandomTemplate()
    const radius = randomInRange(template.radiusRange[0], template.radiusRange[1])
    const textureUrl = PLANET_TEXTURE_URLS[Math.floor(Math.random() * PLANET_TEXTURE_URLS.length)]
    const cachedTexture = getCachedPlanetTexture(textureUrl)
    const material = new MeshStandardMaterial({
      color: cachedTexture ? '#ffffff' : template.color,
      emissive: template.emissive,
      emissiveIntensity: 0.35,
      roughness: 0.92,
      metalness: 0.04,
      map: cachedTexture ?? null,
    })
    const mesh = new Mesh(new SphereGeometry(radius, 32, 28), material)

    const xySpread = FLIGHT_SCENE_SPACE.xySpread
    const cameraZ = this.camera?.position.z ?? this.activeCameraConfig.position.z
    const x = (Math.random() - 0.5) * xySpread
    const y = (Math.random() - 0.5) * xySpread * 0.6
    const z = spawnAhead
      ? cameraZ -
        randomInRange(FLIGHT_SCENE_SPACE.zSpawnAheadMin, FLIGHT_SCENE_SPACE.zSpawnAheadMax)
      : cameraZ - randomInRange(20, FLIGHT_SCENE_SPACE.zSpawnAheadMax)
    mesh.position.set(x, y, z)
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0)

    this.planetsLayer.add(mesh)
    const entry: FlightScenePlanetEntry = {
      mesh,
      speedMultiplier: template.speedMultiplier,
      rotationAxisY: randomInRange(0.4, 1.0),
      rotationAxisX: randomInRange(0.1, 0.4),
    }
    this.planets.push(entry)

    if (!cachedTexture) {
      loadPlanetTexture(textureUrl)
        .then((texture) => {
          if (!this.planets.includes(entry)) {
            return
          }
          material.map = texture
          material.color.set('#ffffff')
          material.needsUpdate = true
        })
        .catch((error) => {
          console.warn('Planet texture load failed', error)
        })
    }
  }

  private despawnPlanet(index: number) {
    const entry = this.planets[index]
    if (!entry) {
      return
    }

    this.planetsLayer?.remove(entry.mesh)
    entry.mesh.geometry.dispose()
    const material = entry.mesh.material
    if (Array.isArray(material)) {
      material.forEach((entry) => entry.dispose())
    } else {
      ;(material as Material | null)?.dispose()
    }
    this.planets.splice(index, 1)
  }

  private getSceneSize(): FlightSceneSize {
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

  private resize() {
    if (!this.renderer || !this.camera) {
      return
    }

    this.applyCameraConfig(this.resolveCameraConfig())

    const { width, height } = this.getSceneSize()
    if (width <= 0 || height <= 0) {
      return
    }

    const pixelRatio = Math.min(window.devicePixelRatio || 1, this.qualityProfile.maxPixelRatio)
    this.renderer.setPixelRatio(pixelRatio)
    this.renderer.setSize(width, height, false)
    if (this.composer) {
      this.composer.setSize(width, height, false)
    }
    if (this.thrusterField) {
      this.thrusterField.material.uniforms.uPixelRatio.value = pixelRatio
    }
    if (this.muzzleFlashField) {
      this.muzzleFlashField.material.uniforms.uPixelRatio.value = pixelRatio
    }

    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()

    const shipZ = this.shipGroup?.position.z ?? 0
    const distance = Math.abs(this.camera.position.z - shipZ)
    const visibleHeight = 2 * distance * Math.tan((this.camera.fov * Math.PI) / 360)
    const visibleWidth = visibleHeight * this.camera.aspect
    this.strafeBound = (visibleWidth / 2) * FLIGHT_SCENE_STRAFE.edgeMargin
    this.pitchBound = (visibleHeight / 2) * FLIGHT_SCENE_STRAFE.edgeMargin
  }

  private advanceAxis(currentTarget: number, input: number, delta: number): number {
    const step = FLIGHT_SCENE_STRAFE.speed * delta
    if (input === 0) {
      return Math.abs(currentTarget) <= step ? 0 : currentTarget - Math.sign(currentTarget) * step
    }
    return MathUtils.clamp(
      currentTarget + input * FLIGHT_SCENE_STRAFE.speed * delta,
      -FLIGHT_SCENE_STRAFE.range,
      FLIGHT_SCENE_STRAFE.range
    )
  }

  private updateStrafeState(delta: number) {
    const keyStrafe = this.getAxisInput(this.inputState.strafeRight, this.inputState.strafeLeft)
    const keyPitch = this.getAxisInput(this.inputState.pitchUp, this.inputState.pitchDown)
    const strafeInput = MathUtils.clamp(keyStrafe + this.touchStrafe, -1, 1)
    const pitchInput = MathUtils.clamp(keyPitch + this.touchPitch, -1, 1)

    this.targetStrafe = this.advanceAxis(this.targetStrafe, strafeInput, delta)
    this.targetPitch = this.advanceAxis(this.targetPitch, pitchInput, delta)

    this.strafe = MathUtils.damp(
      this.strafe,
      this.targetStrafe,
      FLIGHT_SCENE_STRAFE.smoothing,
      delta
    )
    this.pitch = MathUtils.damp(this.pitch, this.targetPitch, FLIGHT_SCENE_STRAFE.smoothing, delta)

    if (!this.shipGroup) {
      return
    }

    const normalizedStrafe = this.strafe / FLIGHT_SCENE_STRAFE.range
    const normalizedPitch = this.pitch / FLIGHT_SCENE_STRAFE.range
    this.shipGroup.position.x = normalizedStrafe * this.strafeBound
    this.shipGroup.position.y = normalizedPitch * this.pitchBound
    this.shipGroup.rotation.z = -this.strafe * FLIGHT_SCENE_BANK.rollFactor
    this.shipGroup.rotation.y = this.strafe * FLIGHT_SCENE_BANK.yawFactor
    this.shipGroup.rotation.x = (this.pitch - this.strafe) * FLIGHT_SCENE_BANK.pitchFactor
  }

  private updateSpaceMotion(delta: number) {
    const cameraZ = this.camera?.position.z ?? this.activeCameraConfig.position.z
    const despawnZ = cameraZ + FLIGHT_SCENE_SPACE.zDespawnBehind
    const yawDriftSpeed = -this.strafe * FLIGHT_SCENE_SPACE.yawDrift

    this.starFields.forEach((field) => {
      field.lateralOffset += yawDriftSpeed * field.speedMultiplier * delta
      const uniforms = field.material.uniforms
      uniforms.uTime.value += delta
      uniforms.uCameraZ.value = cameraZ
      uniforms.uLateralOffset.value = field.lateralOffset
    })

    for (let i = this.planets.length - 1; i >= 0; i -= 1) {
      const entry = this.planets[i]
      const forwardSpeed = FLIGHT_SCENE_SPACE.travelSpeed * entry.speedMultiplier * delta
      entry.mesh.position.z += forwardSpeed
      entry.mesh.position.x += yawDriftSpeed * entry.speedMultiplier * delta
      entry.mesh.rotation.y += delta * entry.rotationAxisY
      entry.mesh.rotation.x += delta * entry.rotationAxisX
      if (entry.mesh.position.z > despawnZ) {
        this.despawnPlanet(i)
        this.spawnPlanet(true)
      }
    }
  }

  private updateThrusters() {
    const field = this.thrusterField
    if (!field) {
      return
    }
    this.refreshThrusterEmitters()
  }

  private initializeMuzzleFlash() {
    if (!this.scene) {
      return
    }

    const capacity = FLIGHT_SCENE_MUZZLE_FLASH.poolSize
    const positions = new Float32Array(capacity * 3)
    const lives = new Float32Array(capacity)
    const ages = new Float32Array(capacity)
    const lifetimes = new Float32Array(capacity)

    for (let i = 0; i < capacity; i += 1) {
      ages[i] = Infinity
      lifetimes[i] = 1
      lives[i] = 1
    }

    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(positions, 3))
    geometry.setAttribute('aLife', new BufferAttribute(lives, 1))

    const pixelRatio = Math.min(window.devicePixelRatio || 1, this.qualityProfile.maxPixelRatio)
    const material = new ShaderMaterial({
      vertexShader: muzzleFlashVertexShader,
      fragmentShader: muzzleFlashFragmentShader,
      uniforms: {
        uSize: { value: FLIGHT_SCENE_MUZZLE_FLASH.size },
        uPixelRatio: { value: pixelRatio },
        uCoreColor: { value: new Color(FLIGHT_SCENE_MUZZLE_FLASH.coreColor) },
        uEdgeColor: { value: new Color(FLIGHT_SCENE_MUZZLE_FLASH.edgeColor) },
      },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    })

    const points = new Points(geometry, material)
    points.name = 'flightMuzzleFlashParticles'
    points.frustumCulled = false
    this.scene.add(points)

    this.muzzleFlashField = {
      points,
      positions,
      lives,
      ages,
      lifetimes,
      capacity,
      cursor: 0,
      material,
    }
  }

  private disposeMuzzleFlash() {
    const field = this.muzzleFlashField
    if (!field) {
      return
    }
    this.scene?.remove(field.points)
    field.points.geometry.dispose()
    const material = field.points.material
    if (Array.isArray(material)) {
      material.forEach((entry) => entry.dispose())
    } else {
      ;(material as Material | null)?.dispose()
    }
    this.muzzleFlashField = null
  }

  private spawnMuzzleFlash(origins: Vector3[], count: number) {
    const field = this.muzzleFlashField
    if (!field || count === 0) {
      return
    }

    const lifetimeMin = FLIGHT_SCENE_MUZZLE_FLASH.lifetimeMin
    const lifetimeMax = FLIGHT_SCENE_MUZZLE_FLASH.lifetimeMax

    for (let m = 0; m < count; m += 1) {
      const origin = origins[m]
      const slot = field.cursor
      field.cursor = (field.cursor + 1) % field.capacity

      const offset = slot * 3
      field.positions[offset] = origin.x
      field.positions[offset + 1] = origin.y
      field.positions[offset + 2] = origin.z
      field.ages[slot] = 0
      field.lifetimes[slot] = lifetimeMin + Math.random() * (lifetimeMax - lifetimeMin)
      field.lives[slot] = 0
    }

    const positionAttribute = field.points.geometry.getAttribute('position') as BufferAttribute
    positionAttribute.needsUpdate = true
  }

  private updateMuzzleFlash(delta: number) {
    const field = this.muzzleFlashField
    if (!field) {
      return
    }

    let dirty = false
    for (let i = 0; i < field.capacity; i += 1) {
      if (field.ages[i] >= field.lifetimes[i]) {
        if (field.lives[i] !== 1) {
          field.lives[i] = 1
          dirty = true
        }
        continue
      }
      field.ages[i] += delta
      field.lives[i] = Math.min(field.ages[i] / field.lifetimes[i], 1)
      dirty = true
    }

    if (dirty) {
      const lifeAttribute = field.points.geometry.getAttribute('aLife') as BufferAttribute
      lifeAttribute.needsUpdate = true
    }
  }

  private disposeThrusters() {
    const field = this.thrusterField
    if (!field) {
      return
    }
    field.points.parent?.remove(field.points)
    field.points.geometry.dispose()
    const material = field.points.material
    if (Array.isArray(material)) {
      material.forEach((entry) => entry.dispose())
    } else {
      ;(material as Material | null)?.dispose()
    }
    field.exhaustLocalPositions.length = 0
    this.thrusterField = null
  }

  private getAxisInput(positive: boolean, negative: boolean): number {
    return (positive ? 1 : 0) - (negative ? 1 : 0)
  }

  private resolveCameraConfig(): FlightSceneCameraConfig {
    if (typeof window === 'undefined') {
      return FLIGHT_SCENE_CAMERA
    }

    const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches
    const isNarrowViewport = window.matchMedia('(max-width: 900px)').matches

    if (hasCoarsePointer || isNarrowViewport) {
      return MOBILE_FLIGHT_SCENE_CAMERA
    }

    return FLIGHT_SCENE_CAMERA
  }

  private applyCameraConfig(config: FlightSceneCameraConfig) {
    this.activeCameraConfig = config
    this.lookTarget.set(config.lookAt.x, config.lookAt.y, config.lookAt.z)

    if (!this.camera) {
      return
    }

    this.camera.fov = config.fov
    this.camera.near = config.near
    this.camera.far = config.far
    this.camera.position.set(config.position.x, config.position.y, config.position.z)
  }

  private animate = () => {
    if (!this.isMounted || !this.renderer || !this.scene || !this.camera) {
      return
    }

    this.stats?.begin()

    const delta = this.clock?.getDelta() ?? 0
    const elapsed = this.clock?.getElapsedTime() ?? 0
    this.updateStrafeState(delta)
    this.updateSpaceMotion(delta)
    this.updateThrusters()
    this.updateProjectiles(delta)
    this.updateMuzzleFlash(delta)
    if (this.thrusterField) {
      this.thrusterField.material.uniforms.uTime.value = elapsed
    }
    if (this.projectileField) {
      const projectileMaterial = this.projectileField.mesh.material as ShaderMaterial
      projectileMaterial.uniforms.uTime.value = elapsed
    }
    if (this.isFreeCameraEnabled && this.orbitControls) {
      this.orbitControls.update()
    } else {
      this.parallaxX = MathUtils.damp(
        this.parallaxX,
        this.targetParallaxX,
        FLIGHT_SCENE_PARALLAX.smoothing,
        delta
      )
      this.parallaxY = MathUtils.damp(
        this.parallaxY,
        this.targetParallaxY,
        FLIGHT_SCENE_PARALLAX.smoothing,
        delta
      )
      const base = this.activeCameraConfig.position
      this.camera.position.set(
        base.x + this.parallaxX * FLIGHT_SCENE_PARALLAX.offsetX,
        base.y + this.parallaxY * FLIGHT_SCENE_PARALLAX.offsetY,
        base.z
      )
      this.camera.lookAt(this.lookTarget)
    }
    if (this.composer) {
      this.composer.render()
    } else {
      this.renderer.render(this.scene, this.camera)
    }

    this.stats?.end()

    this.animationFrameId = window.requestAnimationFrame(this.animate)
  }

  private resetInputState() {
    this.inputState.strafeLeft = false
    this.inputState.strafeRight = false
    this.inputState.pitchUp = false
    this.inputState.pitchDown = false
    this.inputState.fire = false
    this.touchStrafe = 0
    this.touchPitch = 0
    this.touchFire = false
  }

  private setInputFromCode(code: string, isPressed: boolean): boolean {
    if (code === 'KeyA') {
      this.inputState.strafeLeft = isPressed
      return true
    }
    if (code === 'KeyD') {
      this.inputState.strafeRight = isPressed
      return true
    }
    if (code === 'KeyW') {
      this.inputState.pitchUp = isPressed
      return true
    }
    if (code === 'KeyS') {
      this.inputState.pitchDown = isPressed
      return true
    }
    if (code === 'Space') {
      this.inputState.fire = isPressed
      return true
    }

    return false
  }

  private isEditableKeyboardTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
      return false
    }

    const tagName = target.tagName.toLowerCase()
    return tagName === 'input' || tagName === 'textarea' || target.isContentEditable
  }

  private handleWindowKeyDown = (event: KeyboardEvent) => {
    if (this.isEditableKeyboardTarget(event.target)) {
      return
    }

    if (this.setInputFromCode(event.code, true)) {
      event.preventDefault()
    }
  }

  private handleWindowKeyUp = (event: KeyboardEvent) => {
    if (this.isEditableKeyboardTarget(event.target)) {
      return
    }

    if (this.setInputFromCode(event.code, false)) {
      event.preventDefault()
    }
  }

  private handleResize = () => {
    if (!this.isMounted) {
      return
    }

    this.resize()
  }

  private handleWindowBlur = () => {
    this.resetInputState()
  }

  private handleWindowPointerMove = (event: PointerEvent) => {
    const width = window.innerWidth
    const height = window.innerHeight
    if (width === 0 || height === 0) {
      return
    }
    this.targetParallaxX = (event.clientX / width) * 2 - 1
    this.targetParallaxY = -((event.clientY / height) * 2 - 1)
  }

  private disposeStarFields() {
    this.starFields.forEach((field) => {
      this.scene?.remove(field.points)
      field.points.geometry.dispose()
      const material = field.points.material
      if (Array.isArray(material)) {
        material.forEach((entry) => entry.dispose())
      } else {
        ;(material as Material | null)?.dispose()
      }
    })
  }

  private disposeAllPlanets() {
    while (this.planets.length > 0) {
      this.despawnPlanet(this.planets.length - 1)
    }
  }

  private disposeSceneObjects() {
    if (!this.scene) {
      return
    }

    this.scene.traverse((object) => {
      if (object instanceof Mesh || object instanceof Points) {
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
      }
    })

    this.scene.clear()
  }
}
