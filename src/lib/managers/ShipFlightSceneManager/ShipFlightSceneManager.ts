import {
  AdditiveBlending,
  AmbientLight,
  BufferAttribute,
  BufferGeometry,
  Clock,
  Color,
  DirectionalLight,
  FogExp2,
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
  type Material,
} from 'three'
import { ShipBuilderModelManager } from '@/lib/managers/ShipBuilderModelManager'
import type { ShipConfig } from '@/lib/models/ShipConfig'
import { PLANET_TEXTURE_URLS } from '@/assets/resources'
import {
  getCachedPlanetTexture,
  loadPlanetTexture,
} from '@/lib/utils/PlanetTextureCache'
import {
  FLIGHT_SCENE_BANK,
  FLIGHT_SCENE_CAMERA,
  FLIGHT_SCENE_PLANET_POOL_SIZE,
  FLIGHT_SCENE_PLANET_TEMPLATES,
  FLIGHT_SCENE_RENDERER,
  FLIGHT_SCENE_SPACE,
  FLIGHT_SCENE_STAR_LAYERS,
  FLIGHT_SCENE_STRAFE,
} from '@/lib/managers/ShipFlightSceneManager/constants'
import type {
  FlightScenePlanetEntry,
  FlightSceneInputState,
  FlightSceneSize,
  FlightSceneStarField,
} from '@/lib/managers/ShipFlightSceneManager/types'

const createDefaultInputState = (): FlightSceneInputState => {
  return {
    strafeLeft: false,
    strafeRight: false,
    pitchUp: false,
    pitchDown: false,
  }
}

const randomInRange = (min: number, max: number) => min + Math.random() * (max - min)

const pickRandomTemplate = () => {
  const index = Math.floor(Math.random() * FLIGHT_SCENE_PLANET_TEMPLATES.length)
  return FLIGHT_SCENE_PLANET_TEMPLATES[index]
}

export class ShipFlightSceneManager {
  private canvas: HTMLCanvasElement | null = null
  private renderer: WebGLRenderer | null = null
  private scene: Scene | null = null
  private camera: PerspectiveCamera | null = null
  private clock: Clock | null = null
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
  private readonly lookTarget = new Vector3(
    FLIGHT_SCENE_CAMERA.lookAt.x,
    FLIGHT_SCENE_CAMERA.lookAt.y,
    FLIGHT_SCENE_CAMERA.lookAt.z
  )
  private readonly starFields: FlightSceneStarField[] = []
  private readonly planets: FlightScenePlanetEntry[] = []

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
    this.resize()
    this.animate()
  }

  syncShipConfig(shipConfig: ShipConfig) {
    this.pendingShipConfig = shipConfig
    this.shipModelManager?.sync(shipConfig)
    this.shipModelManager?.setSelectedSlot(null)
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
    this.resetInputState()

    this.shipModelManager?.dispose()
    this.disposeStarFields()
    this.disposeAllPlanets()
    this.disposeSceneObjects()
    this.renderer?.dispose()

    this.renderer = null
    this.scene = null
    this.camera = null
    this.clock = null
    this.shipGroup = null
    this.shipModelGroup = null
    this.planetsLayer = null
    this.shipModelManager = null
    this.pendingShipConfig = null
    this.canvas = null
    this.strafe = 0
    this.targetStrafe = 0
    this.strafeBound = 0
    this.pitch = 0
    this.targetPitch = 0
    this.pitchBound = 0
    this.starFields.length = 0
    this.planets.length = 0
  }

  private initialize() {
    if (!this.canvas) {
      return
    }

    this.renderer = new WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    })
    this.renderer.setClearColor(new Color(FLIGHT_SCENE_RENDERER.clearColor), 1)
    this.renderer.shadowMap.enabled = true

    this.scene = new Scene()
    this.scene.background = new Color(FLIGHT_SCENE_RENDERER.clearColor)
    this.scene.fog = new FogExp2(FLIGHT_SCENE_RENDERER.clearColor, 0.006)

    this.camera = new PerspectiveCamera(
      FLIGHT_SCENE_CAMERA.fov,
      1,
      FLIGHT_SCENE_CAMERA.near,
      FLIGHT_SCENE_CAMERA.far
    )
    this.camera.position.set(
      FLIGHT_SCENE_CAMERA.position.x,
      FLIGHT_SCENE_CAMERA.position.y,
      FLIGHT_SCENE_CAMERA.position.z
    )
    this.camera.lookAt(this.lookTarget)

    this.clock = new Clock()
    this.initializeLights()
    this.initializeShip()
    this.initializeSpace()
  }

  private initializeLights() {
    if (!this.scene) {
      return
    }

    const ambient = new AmbientLight('#b8d7ff', 0.52)
    this.scene.add(ambient)

    const keyLight = new DirectionalLight('#fef3c7', 1.38)
    keyLight.position.set(4.5, 5.8, 7.2)
    this.scene.add(keyLight)

    const rimLight = new DirectionalLight('#93c5fd', 0.92)
    rimLight.position.set(-6.4, 3.1, -8.2)
    this.scene.add(rimLight)
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
  }

  private createStarField(config: (typeof FLIGHT_SCENE_STAR_LAYERS)[number]): FlightSceneStarField {
    const positions = new Float32Array(config.count * 3)
    for (let i = 0; i < config.count; i += 1) {
      const offset = i * 3
      positions[offset] = (Math.random() - 0.5) * config.spread
      positions[offset + 1] = (Math.random() - 0.5) * config.spread * 0.72
      positions[offset + 2] = (Math.random() - 0.5) * config.spread
    }

    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(positions, 3))

    const material = new PointsMaterial({
      color: config.color,
      size: config.size,
      transparent: true,
      opacity: config.opacity,
      sizeAttenuation: true,
      depthWrite: false,
      blending: AdditiveBlending,
    })

    return {
      points: new Points(geometry, material),
      positions,
      count: config.count,
      speedMultiplier: config.speedMultiplier,
      spread: config.spread,
    }
  }

  private spawnPlanet(spawnAhead: boolean) {
    if (!this.planetsLayer) {
      return
    }

    const template = pickRandomTemplate()
    const radius = randomInRange(template.radiusRange[0], template.radiusRange[1])
    const textureUrl =
      PLANET_TEXTURE_URLS[Math.floor(Math.random() * PLANET_TEXTURE_URLS.length)]
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
    const cameraZ = this.camera?.position.z ?? FLIGHT_SCENE_CAMERA.position.z
    const x = (Math.random() - 0.5) * xySpread
    const y = (Math.random() - 0.5) * xySpread * 0.6
    const z = spawnAhead
      ? cameraZ - randomInRange(FLIGHT_SCENE_SPACE.zSpawnAheadMin, FLIGHT_SCENE_SPACE.zSpawnAheadMax)
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

    const { width, height } = this.getSceneSize()
    if (width <= 0 || height <= 0) {
      return
    }

    const pixelRatio = Math.min(window.devicePixelRatio || 1, FLIGHT_SCENE_RENDERER.maxPixelRatio)
    this.renderer.setPixelRatio(pixelRatio)
    this.renderer.setSize(width, height, false)

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
    const strafeInput = this.getAxisInput(this.inputState.strafeRight, this.inputState.strafeLeft)
    const pitchInput = this.getAxisInput(this.inputState.pitchUp, this.inputState.pitchDown)

    this.targetStrafe = this.advanceAxis(this.targetStrafe, strafeInput, delta)
    this.targetPitch = this.advanceAxis(this.targetPitch, pitchInput, delta)

    this.strafe = MathUtils.damp(this.strafe, this.targetStrafe, FLIGHT_SCENE_STRAFE.smoothing, delta)
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
    this.shipGroup.rotation.x = (this.strafe + this.pitch) * FLIGHT_SCENE_BANK.pitchFactor
  }

  private updateSpaceMotion(delta: number) {
    const cameraZ = this.camera?.position.z ?? FLIGHT_SCENE_CAMERA.position.z
    const despawnZ = cameraZ + FLIGHT_SCENE_SPACE.zDespawnBehind
    const yawDriftSpeed = -this.strafe * FLIGHT_SCENE_SPACE.yawDrift

    this.starFields.forEach((field) => {
      const forwardSpeed = FLIGHT_SCENE_SPACE.travelSpeed * field.speedMultiplier * delta
      const lateralSpeed = yawDriftSpeed * field.speedMultiplier * delta
      const positions = field.positions
      for (let i = 0; i < field.count; i += 1) {
        const offset = i * 3
        positions[offset] += lateralSpeed
        positions[offset + 2] += forwardSpeed
        if (positions[offset + 2] > despawnZ) {
          positions[offset] = (Math.random() - 0.5) * field.spread
          positions[offset + 1] = (Math.random() - 0.5) * field.spread * 0.72
          positions[offset + 2] =
            cameraZ -
            randomInRange(FLIGHT_SCENE_SPACE.zSpawnAheadMin, FLIGHT_SCENE_SPACE.zSpawnAheadMax)
        }
      }
      const attribute = field.points.geometry.getAttribute('position') as BufferAttribute
      attribute.needsUpdate = true
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

  private getAxisInput(positive: boolean, negative: boolean): number {
    return (positive ? 1 : 0) - (negative ? 1 : 0)
  }

  private animate = () => {
    if (!this.isMounted || !this.renderer || !this.scene || !this.camera) {
      return
    }

    const delta = this.clock?.getDelta() ?? 0
    this.updateStrafeState(delta)
    this.updateSpaceMotion(delta)
    this.camera.lookAt(this.lookTarget)
    this.renderer.render(this.scene, this.camera)

    this.animationFrameId = window.requestAnimationFrame(this.animate)
  }

  private resetInputState() {
    this.inputState.strafeLeft = false
    this.inputState.strafeRight = false
    this.inputState.pitchUp = false
    this.inputState.pitchDown = false
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
        object.geometry?.dispose()

        const material = object.material
        if (Array.isArray(material)) {
          material.forEach((entry) => entry.dispose())
        } else {
          ;(material as Material | null)?.dispose()
        }
      }
    })

    this.scene.clear()
  }
}
