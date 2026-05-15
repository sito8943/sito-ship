# Three.js / WebGL Review Guide

This document is the entry point for grading the WebGL & Three.js content of the project. It maps every Three.js / WebGL technique used to the exact file and line where it lives, so the reviewer can jump straight to the relevant code.

The React/UI layer is intentionally out of scope here. Everything below targets rendering, scene composition, GPU resources, shaders, and Three.js APIs.

---

## 1. Architecture & Conventions

The whole codebase follows a single rulebook:

- `docs/ARCHITECTURE_RULES.md` — mandatory architecture rules (folder layout, per-feature file split, `constants.ts` / `types.ts` / `utils.ts` separation, managers + providers, etc.).

Every Three.js subsystem is structured the same way:

```
FeatureName/
  FeatureName.ts     # The class (one per file)
  constants.ts       # All tunable parameters as exported consts
  types.ts           # All type aliases / interfaces
  utils.ts           # Pure helper functions
  index.ts           # Public re-exports
```

Examples to verify the convention:

- `src/lib/managers/ShipBuilderSceneManager/`
- `src/lib/managers/ShipFlightSceneManager/`
- `src/lib/managers/ShipBuilderModelManager/`

---

## 2. Where the WebGL/Three.js Code Lives

The project is split in three Three.js "managers" plus a shader folder. The rest of `src/` is plumbing (React/UI/state).

| Concern                                                            | Path                                                                                             |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Builder scene (orbit camera, gizmos, picking, shadows)             | `src/lib/managers/ShipBuilderSceneManager/ShipBuilderSceneManager.ts`                            |
| Flight scene (fog, stars, planets, thrusters, projectiles)         | `src/lib/managers/ShipFlightSceneManager/ShipFlightSceneManager.ts`                              |
| Procedural ship model (geometries, materials, mirroring)           | `src/lib/managers/ShipBuilderModelManager/ShipBuilderModelManager.ts`                            |
| Ship model helpers (rim-light injection, disposal, mirroring math) | `src/lib/managers/ShipBuilderModelManager/utils.ts`                                              |
| Custom GLSL shaders                                                | `src/lib/shaders/thruster.ts`, `src/lib/shaders/projectile.ts`, `src/lib/shaders/muzzleFlash.ts` |
| Texture cache (planets)                                            | `src/lib/utils/PlanetTextureCache/PlanetTextureCache.ts`                                         |
| Builder HDR environment map (PMREM + RGBELoader, cached)           | `src/lib/utils/BuilderEnvironmentMap/BuilderEnvironmentMap.ts`                                   |
| Runtime quality tier (mobile DPR cap + bloom/outline gating)       | `src/lib/utils/RendererQuality/RendererQuality.ts`                                               |
| Texture / HDR URLs                                                 | `src/assets/resources.ts`                                                                        |

---

## 3. Renderer / WebGL Surface Setup

`WebGLRenderer`, pixel-ratio clamping, shadow map, tone mapping, sRGB output, and clear color.

- Builder renderer — `src/lib/managers/ShipBuilderSceneManager/ShipBuilderSceneManager.ts` (`initialize`)
  - `WebGLRenderer({ canvas, antialias: false, alpha: false })`
  - `renderer.shadowMap.enabled = true`, `renderer.shadowMap.type = PCFShadowMap`
  - `renderer.outputColorSpace = SRGBColorSpace`
  - `renderer.toneMapping = ACESFilmicToneMapping`
  - `renderer.toneMappingExposure = BUILDER_RENDERER_SETTINGS.toneMappingExposure`
- DPR clamp + dynamic resize — `src/lib/managers/ShipBuilderSceneManager/ShipBuilderSceneManager.ts` (`resize`)
  - `Math.min(window.devicePixelRatio, this.qualityProfile.maxPixelRatio)`
  - `setPixelRatio` + `composer.setSize` / `renderer.setSize`
- Flight renderer + clear color + fog — `src/lib/managers/ShipFlightSceneManager/ShipFlightSceneManager.ts` (`initialize`)
  - `WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' })`
  - `renderer.setClearColor(new Color(...), 1)`
  - `renderer.outputColorSpace = SRGBColorSpace`
  - `renderer.toneMapping = ACESFilmicToneMapping`
  - `renderer.toneMappingExposure = FLIGHT_SCENE_RENDERER.toneMappingExposure`
  - `scene.background = new Color(...)`, `scene.fog = new FogExp2(color, density)`
- Renderer tuning constants — `ShipBuilderSceneManager/constants.ts` (`BUILDER_RENDERER_SETTINGS`), `ShipFlightSceneManager/constants.ts` (`FLIGHT_SCENE_RENDERER` incl. `maxPixelRatio` and `toneMappingExposure`)
- Runtime quality tier — `src/lib/utils/RendererQuality/RendererQuality.ts` returns a profile (`tier`, `maxPixelRatio`, `bloomEnabled`, `outlineEnabled`) based on `matchMedia('(pointer: coarse)')` or `(max-width: 900px)`. Low tier caps DPR at 1.0 and disables bloom + outline passes. Both managers read it once at construction.

---

## 4. Scene Graph

- Root `Scene` + named `Group`s for the ship — `src/lib/managers/ShipBuilderSceneManager/ShipBuilderSceneManager.ts:655-669` (`initializeShipGroup`)
- Flight `Scene` with nested ship group + model group (Y-flipped so the ship faces -Z) — `src/lib/managers/ShipFlightSceneManager/ShipFlightSceneManager.ts:504-525` (`initializeShip`)
- Per-slot groups + symmetric pivots are managed by `ShipBuilderModelManager` and stored in `userData` for picking — see `src/lib/managers/ShipBuilderModelManager/ShipBuilderModelManager.ts:67-78`, `markSlotInHierarchy` in `src/lib/managers/ShipBuilderModelManager/utils.ts:175`.

---

## 5. Cameras & Controls

- `PerspectiveCamera` builder — `src/lib/managers/ShipBuilderSceneManager/ShipBuilderSceneManager.ts:438-449`
- `PerspectiveCamera` flight (mobile vs desktop config) — `src/lib/managers/ShipFlightSceneManager/ShipFlightSceneManager.ts:254-265`
- `OrbitControls` (damping + constraints + auto-rotate cinematic mode) — `ShipBuilderSceneManager.ts` `initialize` + `applyOrbitConstraints`; constraints in `constants.ts` (`DEFAULT_ORBIT_CONSTRAINTS`, `PANORAMIC_ORBIT_CONSTRAINTS`, `CINEMATIC_ROTATION_SPEED`)
- Idle cinematic — when the builder camera has had no input for `IDLE_CINEMATIC_DELAY_MS` (6s), `updateIdleCinematic` quietly enables `controls.autoRotate`; activity events (canvas `pointerdown`, `wheel`, window `keydown`, manual `V` toggle) call `markActivity` to cancel it. The manual `V` toggle takes priority. See `ShipBuilderSceneManager.ts` (`markActivity`, `updateIdleCinematic`, `toggleCinematicView`).
- Flight mouse parallax — a window-level `pointermove` listener normalizes the pointer to `(-1, 1)`. Each frame `MathUtils.damp` smooths the target and offsets the camera by `FLIGHT_SCENE_PARALLAX.offsetX/Y` (no allocation). Skipped when free-orbit is active. See `ShipFlightSceneManager.ts` (`handleWindowPointerMove`, parallax block inside `animate`).
- `TransformControls` (gizmo) attach/detach + per-axis visibility for the "pair spread" custom mode — `ShipBuilderSceneManager.ts` (`initializeTransformControls`, `setTransformMode`)
- Camera framing (`focusSelectedSlot`, `zoomToShip`) using `Box3` to fit the model in view — `ShipBuilderSceneManager.ts`

---

## 6. Lights & Shadows

- Three-point lighting (key/rim/fill) plus an `AmbientLight` in both scenes — `initializeLights` in each manager.
- Shadow map sizing + bias + ortho shadow camera bounds (key light) — `ShipBuilderSceneManager.initializeLights`, parameters in `constants.ts` (`BUILDER_SHADOW_SETTINGS`).
- Shadows are enabled in the builder scene only. Flight disables them via `FLIGHT_SCENE_RENDERER.enableShadows = false` because the open-space scene has no ground plane to receive them — skipping the shadow-map pass saves work every frame.
- `castShadow` / `receiveShadow` applied recursively per ship mesh — `src/lib/managers/ShipBuilderModelManager/utils.ts` (`applyShadowToObject`).
- Optional HDR environment map for builder PBR reflections — `initializeEnvironmentMap` lazy-loads an `.hdr` via `RGBELoader`, processes it with `PMREMGenerator`, and assigns the result to `scene.environment`. Cached in `src/lib/utils/BuilderEnvironmentMap/`. URL is `BUILDER_ENVIRONMENT_HDR_URL` in `src/assets/resources.ts`; when empty the scene falls back to the 3-light setup with no network cost.

Dev-only helpers (toggleable via lil-gui in dev):

- `AxesHelper`, `GridHelper`, `DirectionalLightHelper`, `CameraHelper` for shadow frustum — see `initializeHelpers`, `initializeDebugLightHelpers`, `updateDebugHelpersVisibility` in `ShipBuilderSceneManager.ts`.

---

## 7. Procedural Geometry (Ship Builder)

The ship is built procedurally from primitives every time a variant/parameter changes. There are no external `.gltf` ship assets.

- `BoxGeometry`, `SphereGeometry`, `ConeGeometry`, `CylinderGeometry`, `TorusGeometry` are composed per slot in `src/lib/managers/ShipBuilderModelManager/ShipBuilderModelManager.ts`:
  - Body: `buildBodySlot` / `createBodyGeometry` — lines 258-282
  - Cockpit: `buildCockpitSlot` / `createCockpitGeometry` (incl. `TorusGeometry` ring) — lines 284-320
  - Wings: `buildWingsSlot` (Box + Cone for triangular variant) — lines 322-385
  - Engines: `buildEnginesSlot` (Cylinder + Cone nozzles, two/three-engine variants) — lines 386-475
  - Weapons: `buildWeaponsSlot` (Cylinder cannons + Cone tips + Box mount) — lines 476-end

Each slot lives in its own `Group` with full `position` / `rotation` / `scale` exposed to the UI (the gizmo translates/rotates/scales these groups directly).

---

## 8. Materials & Custom Shader Injection

Two patterns are used.

### 8.1 `MeshStandardMaterial` with shader patching (`onBeforeCompile`)

Used by every ship part to add a Fresnel rim light without leaving the PBR pipeline. The fragment shader is rewritten by string-replacing standard chunks (`#include <common>`, `#include <emissivemap_fragment>`):

- `src/lib/managers/ShipBuilderModelManager/utils.ts:30-67` (`createSlotMaterial`)
- Uniforms `uRimColor`, `uRimPower`, `uRimIntensity` are pushed via `shader.uniforms`
- `material.customProgramCacheKey = () => 'ship-rim'` so all rim-lit materials share one compiled program

Rim constants live in `src/lib/managers/ShipBuilderModelManager/constants.ts` (`SHIP_RIM_COLOR`, `SHIP_RIM_POWER`, `SHIP_RIM_INTENSITY`).

### 8.2 Slot highlight via emissive override

Selecting / flagging a slot temporarily writes `material.emissive` / `material.emissiveIntensity` on every `MeshStandardMaterial` under the slot group — `src/lib/managers/ShipBuilderModelManager/utils.ts:178-212` (`setSlotHighlight`).

---

## 9. Custom GLSL Shaders

Three full vertex+fragment shader pairs, all written in raw GLSL and wired through `ShaderMaterial`:

| Effect                                                         | Shader file                      | Consumer                                                                               |
| -------------------------------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------- |
| Engine thruster particles (analytic GPU, additive)             | `src/lib/shaders/thruster.ts`    | `ShipFlightSceneManager.initializeThrusters` — `ShipFlightSceneManager.ts:757-813`     |
| Plasma projectiles (per-instance billboard, pulse via `uTime`) | `src/lib/shaders/projectile.ts`  | `ShipFlightSceneManager.initializeProjectiles` — `ShipFlightSceneManager.ts:552-620`   |
| Muzzle flash sprites (radial + cross "ray" pattern)            | `src/lib/shaders/muzzleFlash.ts` | `ShipFlightSceneManager.initializeMuzzleFlash` — `ShipFlightSceneManager.ts:1133-1184` |

All three:

- Use `gl_PointSize` (or `instanceMatrix` for projectiles) with `uPixelRatio` clamping to keep size consistent across devices.
- Discard out-of-circle fragments (`if (d > 0.5) discard;`).
- Render with `transparent: true`, `depthWrite: false`, `blending: AdditiveBlending`.

The thruster shader is a fully analytic GPU particle system. The vertex shader computes life, emitter origin, jitter, and final local-space position purely from per-particle static attributes (`aSeed`, `aSpawnPhase`, `aLifetime`, `aEmitterIndex`) and uniforms (`uTime`, `uExhaustLocal[MAX_EXHAUSTS]`, `uExhaustCount`, `uExhaustSpeed`, `uJitter`, `uSpawnSpread`). `MAX_EXHAUSTS` is injected via `material.defines` from `MAX_ENGINE_EXHAUSTS` in `ShipFlightSceneManager/constants.ts`. There is no per-frame CPU integration loop and no `BufferAttribute.needsUpdate`.

---

## 10. Particle Systems (`Points` + raw buffers)

Two different patterns coexist:

### 10.1 Thrusters — analytic GPU particles (no CPU integration)

The thruster field is fully GPU-driven. Per-particle static attributes (`aSeed`, `aSpawnPhase`, `aLifetime`, `aEmitterIndex`) are filled once at init with `Math.random()` and never re-uploaded. The vertex shader (`src/lib/shaders/thruster.ts`) derives the particle's life and local-space position every frame analytically from those attributes plus the `uTime` and `uExhaustLocal[MAX_EXHAUSTS]` uniforms — there is no `BufferAttribute.needsUpdate`, no JS loop over the particle pool, and no CPU→GPU position re-upload per frame.

- Static attribute setup — `ShipFlightSceneManager.initializeThrusters` (`src/lib/managers/ShipFlightSceneManager/ShipFlightSceneManager.ts`).
- Uniform-only refresh of engine nozzle origins on config change — `refreshThrusterEmitters` calls `ShipBuilderModelManager.getEngineExhaustLocalPositions(shipGroup, out)` and writes the result into `uExhaustLocal` + `uExhaustCount`.
- The `Points` object is parented to `shipGroup` so the exhaust origins stay in ship-local space and inherit ship transforms automatically through `modelViewMatrix`.

### 10.2 Muzzle flash — CPU pool (event-driven)

Muzzle flash uses a small CPU-driven ring buffer because it is event-driven (only fires when the weapon shoots) and writes are sparse. The GPU consumes a `BufferGeometry` with `position` + `aLife` attributes and a custom `ShaderMaterial`.

- Allocation + buffer attributes — `ShipFlightSceneManager.initializeMuzzleFlash`.
- Per-spawn position write and per-frame `aLife` update with `BufferAttribute.needsUpdate = true` — see `spawnMuzzleFlash` and `updateMuzzleFlash`.

---

## 11. Instanced Rendering

Projectiles are a single `InstancedMesh` of size `FLIGHT_SCENE_PROJECTILES.poolSize`, with per-instance matrices built each frame from a position + quaternion pool.

- `InstancedMesh` setup — `src/lib/managers/ShipFlightSceneManager/ShipFlightSceneManager.ts:599-610`
- Per-instance matrix updates use the scratch instances `PROJECTILE_TMP_MATRIX`, `PROJECTILE_TMP_POS`, `PROJECTILE_TMP_SCALE`, `PROJECTILE_TMP_QUAT` (declared in `ShipFlightSceneManager/constants.ts`) to avoid per-frame allocations.
- Hidden slots are zeroed via `Matrix4().makeScale(0,0,0)` (`ShipFlightSceneManager.ts:604-608`).

---

## 12. Post-Processing (`postprocessing` library on top of Three)

Both scenes use `EffectComposer` with `RenderPass` first, then differ:

- Builder pipeline — `EffectComposer` → `RenderPass` → `BloomEffect` (mipmap blur) → `OutlineEffect` (selection highlight) → `FXAAEffect`. See `ShipBuilderSceneManager.initializePostProcessing`. Bloom and outline passes are gated by the runtime quality profile and are disabled on low-tier (mobile) devices.
- Flight pipeline — `EffectComposer` → `RenderPass` → `BloomEffect` → `FXAAEffect` → `NoiseEffect` (soft-light blend, low opacity for filmic grain). See `ShipFlightSceneManager.initializePostProcessing`. Bloom is gated by the quality profile.
- Tuning constants — `ShipBuilderSceneManager/constants.ts` (`POST_PROCESSING_SETTINGS`) and `ShipFlightSceneManager/constants.ts` (`FLIGHT_SCENE_POST_PROCESSING` incl. `noise`).
- Dev controls — both managers expose `lil-gui` folders for tuning bloom, outline, FXAA, and (flight) noise opacity/premultiply at runtime.

Render loop fallback: when no composer is available, `renderer.render(scene, camera)` is used directly — see `animate` in both managers.

---

## 13. Texture Loading & Caching

Planets use shared `Texture`s loaded once via `TextureLoader`, cached per URL, with an in-flight `Promise` map to deduplicate concurrent requests. sRGB color space is set on success.

- `src/lib/utils/PlanetTextureCache/PlanetTextureCache.ts`
- Texture URLs — `src/assets/resources.ts`
- Consumer — `ShipFlightSceneManager.spawnPlanet` (texture passed via `MeshStandardMaterial.map`, with a color fallback while the texture loads).

The same dedup-and-cache pattern is reused for the optional builder HDR environment map (`src/lib/utils/BuilderEnvironmentMap/BuilderEnvironmentMap.ts`): the `.hdr` is loaded once, processed through `PMREMGenerator`, and the resulting cubemap texture is cached. The PMREM generator is disposed after a single use so it doesn't sit in memory.

---

## 14. Raycasting / Mouse Picking

Clicking the builder scene selects a ship slot by raycasting through the scene graph and walking up parents to find a `userData.shipSlot` tag set by `markSlotInHierarchy`.

- Pointer → NDC + raycast — `ShipBuilderSceneManager.ts:836-852` (`handleCanvasPointerDown`)
- Slot lookup via `userData` — `ShipBuilderSceneManager.ts:854-877` (`getSlotFromObject`, `isShipSlot`)
- `userData.shipSlot` annotation — `src/lib/managers/ShipBuilderModelManager/utils.ts:175` (`markSlotInHierarchy`)

---

## 15. AABB Collision / Overlap Detection (`Box3`)

The builder validates ship configurations in real time using axis-aligned bounding boxes:

- `Box3.setFromObject` per slot — `ShipBuilderSceneManager.ts:1251-1252`
- `Box3.intersect` to get the overlap volume — `:1258`
- Volume-ratio threshold against `OVERLAP_VOLUME_RATIO_THRESHOLD` to flag "severe" overlaps — `:1263-1265`
- Body-contact constraint (each non-body slot must touch the body) — `enforceBodyContactConstraint` near `:1293`

This drives the red highlight (`setSlotHighlight` with `isInvalid: true`) and the UI overlap/contact warnings.

---

## 16. Symmetry / Mirroring Math

Symmetric slots (wings, engines, weapons) are kept in sync across the ship's local YZ-plane:

- Plane definition — `src/lib/managers/ShipBuilderModelManager/constants.ts:7-9`
  - `SHIP_LOCAL_SYMMETRY_PLANE_NORMAL = [-1, 0, 0]`
  - `SHIP_LOCAL_SYMMETRY_PLANE_OFFSET = 0`
- Point reflection through the plane — `mirrorPointAcrossPlane` in `ShipBuilderModelManager/utils.ts:86-102`
- Quaternion mirroring via `Matrix4` reflection + `setFromRotationMatrix` — `mirrorQuaternionAcrossPlane` in `ShipBuilderModelManager/utils.ts:112-160`
- Applied when generating mirrored parts — `ShipBuilderModelManager.ts:636` (`localRotation: mirrorQuaternionAcrossShipLocalSymmetryPlane(...)`)

---

## 17. Flight Simulation (Camera + Ship)

- Custom flight integrator (forward/yaw/pitch/roll, drag, boost) lives entirely in `ShipBuilderSceneManager.updateFlightSimulation` (search for `updateFlightSimulation` in `ShipBuilderSceneManager.ts`) and uses `Clock.getDelta()`-driven dt.
- Flight tuning — `ShipBuilderSceneManager/constants.ts:73-86` (`FLIGHT_SETTINGS`).
- Stars are infinite-scrolled by wrapping particle Z around the camera (`createStarField` + per-frame update in `ShipFlightSceneManager.ts:815-849` and the corresponding animation step).
- Planets are pool-spawned with `MeshStandardMaterial` + texture, `ShipFlightSceneManager.ts:851-` (`spawnPlanet`).

---

## 18. Resource Disposal

Both managers explicitly dispose GPU resources on unmount to avoid leaks:

- Generic disposer for any `{ dispose(): void }` — `src/lib/managers/ShipBuilderSceneManager/utils.ts` (`isDisposableResource`), and the analogous one in `ShipFlightSceneManager/utils.ts`.
- `disposeGroupResources` walks a Three.js `Group` and disposes all geometries + materials it owns — `src/lib/managers/ShipBuilderModelManager/utils.ts:215-256`.
- Scene-level `destroy()` removes listeners, disposes the composer, renderer, controls, transform controls, helpers, and clears the scene — `ShipBuilderSceneManager.ts:362-450` and `ShipFlightSceneManager.ts:185-225`.

---

## 19. Animation Loop

Standard `requestAnimationFrame` loop bound to the manager instance:

- Builder — `ShipBuilderSceneManager.ts:1329-1355`
  - Reads `Clock.getDelta()`, updates either flight or orbit controls, optionally updates helpers, then renders through the composer.
- Flight — `ShipFlightSceneManager.ts:1305-1340`
  - Drives star field scrolling, planet rotation, thruster/projectile/muzzle-flash updates, ship banking, camera follow, then composer render.

---

## 20. Performance Budget

The renderer keeps a tight budget so the flight scene targets 60fps on a mid-range phone:

- Procedural geometry means zero asset download and no decode step on first paint.
- `setPixelRatio` is clamped (1.5 on desktop, 1.0 on low-tier devices) so HiDPI screens never burn 4× the fragment work.
- FXAA is preferred over hardware MSAA: post passes write into a render target where MSAA can't AA the composited result. One screen-space FXAA pass after bloom + outline + (flight) noise gives a single consistent edge.
- Projectiles render through a single `InstancedMesh`, so fire-rate scales without growing the draw-call count.
- Shadows are disabled in the flight scene (no ground plane to receive them), saving a full shadow-map pass every frame.
- Frustum culling is left at three's default (per-`Mesh` bounding-sphere test).
- Runtime quality tier (`src/lib/utils/RendererQuality/`) detects coarse-pointer / narrow-viewport devices and switches both managers to a low profile (DPR 1.0, bloom + outline off). Read once at scene construction.

## 21. Suggested Review Order

If you want to read the WebGL/Three.js code linearly, this order matches the data flow:

1. `src/lib/managers/ShipBuilderModelManager/ShipBuilderModelManager.ts` — how the ship is built from primitives.
2. `src/lib/managers/ShipBuilderModelManager/utils.ts` — `onBeforeCompile` rim-light injection and quaternion mirroring.
3. `src/lib/managers/ShipBuilderSceneManager/ShipBuilderSceneManager.ts` — renderer, lights, shadows, gizmos, raycasting, `Box3` validation, post-processing.
4. `src/lib/managers/ShipFlightSceneManager/ShipFlightSceneManager.ts` — fog, stars, planets, instanced projectiles, particle systems.
5. `src/lib/shaders/*.ts` — the three GLSL programs used in flight mode.
6. `src/lib/utils/BuilderEnvironmentMap/` and `src/lib/utils/RendererQuality/` — opt-in PBR env map and the runtime quality tier.

Everything else is glue (React canvases at `src/components/SceneCanvas/SceneCanvas.tsx` and `src/components/FlightSceneCanvas/FlightSceneCanvas.tsx`, providers, state) and is not central to the WebGL grading.
