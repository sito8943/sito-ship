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
| Texture URLs                                                       | `src/assets/resources.ts`                                                                        |

---

## 3. Renderer / WebGL Surface Setup

`WebGLRenderer`, pixel-ratio clamping, shadow map, and clear color.

- Builder renderer + shadow map type — `src/lib/managers/ShipBuilderSceneManager/ShipBuilderSceneManager.ts:427-429`
  - `WebGLRenderer({ canvas, antialias: false, alpha: false })`
  - `renderer.shadowMap.enabled = true`
  - `renderer.shadowMap.type = PCFShadowMap`
- DPR clamp + dynamic resize — `src/lib/managers/ShipBuilderSceneManager/ShipBuilderSceneManager.ts:312-329`
  - `Math.min(window.devicePixelRatio, MAX_DEVICE_PIXEL_RATIO)`
  - `setPixelRatio` + `composer.setSize` / `renderer.setSize`
- Flight renderer + clear color + fog — `src/lib/managers/ShipFlightSceneManager/ShipFlightSceneManager.ts:241-252`
  - `WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' })`
  - `renderer.setClearColor(new Color(...), 1)`
  - `scene.background = new Color(...)`
  - `scene.fog = new FogExp2(color, density)`
- Renderer tuning constants — `src/lib/managers/ShipBuilderSceneManager/constants.ts:3` (`MAX_DEVICE_PIXEL_RATIO`), `src/lib/managers/ShipFlightSceneManager/constants.ts` (`FLIGHT_SCENE_RENDERER`)

---

## 4. Scene Graph

- Root `Scene` + named `Group`s for the ship — `src/lib/managers/ShipBuilderSceneManager/ShipBuilderSceneManager.ts:655-669` (`initializeShipGroup`)
- Flight `Scene` with nested ship group + model group (Y-flipped so the ship faces -Z) — `src/lib/managers/ShipFlightSceneManager/ShipFlightSceneManager.ts:504-525` (`initializeShip`)
- Per-slot groups + symmetric pivots are managed by `ShipBuilderModelManager` and stored in `userData` for picking — see `src/lib/managers/ShipBuilderModelManager/ShipBuilderModelManager.ts:67-78`, `markSlotInHierarchy` in `src/lib/managers/ShipBuilderModelManager/utils.ts:175`.

---

## 5. Cameras & Controls

- `PerspectiveCamera` builder — `src/lib/managers/ShipBuilderSceneManager/ShipBuilderSceneManager.ts:438-449`
- `PerspectiveCamera` flight (mobile vs desktop config) — `src/lib/managers/ShipFlightSceneManager/ShipFlightSceneManager.ts:254-265`
- `OrbitControls` (damping + constraints + auto-rotate cinematic mode) — `src/lib/managers/ShipBuilderSceneManager/ShipBuilderSceneManager.ts:451-456` and `applyOrbitConstraints` near `DEFAULT_ORBIT_CONSTRAINTS` / `PANORAMIC_ORBIT_CONSTRAINTS` in `constants.ts:36-48`
- `TransformControls` (gizmo) attach/detach + per-axis visibility for the "pair spread" custom mode — `src/lib/managers/ShipBuilderSceneManager/ShipBuilderSceneManager.ts:671-749`
- Camera framing (`focusSelectedSlot`, `zoomToShip`) using `Box3` to fit the model in view — `ShipBuilderSceneManager.ts:227-311`

---

## 6. Lights & Shadows

- Three-point lighting (key/rim/fill) in both scenes:
  - Builder — `src/lib/managers/ShipBuilderSceneManager/ShipBuilderSceneManager.ts:557-585`
  - Flight — `src/lib/managers/ShipFlightSceneManager/ShipFlightSceneManager.ts:322-346`
- Shadow map sizing + bias + ortho shadow camera bounds (key light) — `ShipBuilderSceneManager.ts:565-573`, parameters in `constants.ts:17-23` (`BUILDER_SHADOW_SETTINGS`)
- `castShadow` / `receiveShadow` applied recursively per mesh — `src/lib/managers/ShipBuilderModelManager/utils.ts:69-78` (`applyShadowToObject`)

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
| Engine thruster particles (additive, life-driven color ramp)   | `src/lib/shaders/thruster.ts`    | `ShipFlightSceneManager.initializeThrusters` — `ShipFlightSceneManager.ts:757-813`     |
| Plasma projectiles (per-instance billboard, pulse via `uTime`) | `src/lib/shaders/projectile.ts`  | `ShipFlightSceneManager.initializeProjectiles` — `ShipFlightSceneManager.ts:552-620`   |
| Muzzle flash sprites (radial + cross "ray" pattern)            | `src/lib/shaders/muzzleFlash.ts` | `ShipFlightSceneManager.initializeMuzzleFlash` — `ShipFlightSceneManager.ts:1133-1184` |

All three:

- Use `gl_PointSize` (or `instanceMatrix` for projectiles) with `uPixelRatio` clamping to keep size consistent across devices.
- Discard out-of-circle fragments (`if (d > 0.5) discard;`).
- Render with `transparent: true`, `depthWrite: false`, `blending: AdditiveBlending`.

---

## 10. Particle Systems (`Points` + raw buffers)

Both thruster and muzzle-flash fields use **CPU-driven particle pools**: typed arrays for positions/lives/ages/lifetimes, recycled by index. The GPU only consumes a `BufferGeometry` with `position` + `aLife` attributes and a custom `ShaderMaterial`.

- Allocation + buffer attributes — `ShipFlightSceneManager.ts:762-799` (thrusters), `:1138-1172` (muzzle flash)
- Per-frame update writing back to `BufferAttribute.needsUpdate = true` — search for `lifeAttribute.needsUpdate` (around `ShipFlightSceneManager.ts:1130`) and `positionAttribute.needsUpdate`.

---

## 11. Instanced Rendering

Projectiles are a single `InstancedMesh` of size `FLIGHT_SCENE_PROJECTILES.poolSize`, with per-instance matrices built each frame from a position + quaternion pool.

- `InstancedMesh` setup — `src/lib/managers/ShipFlightSceneManager/ShipFlightSceneManager.ts:599-610`
- Per-instance matrix updates use the scratch instances `PROJECTILE_TMP_MATRIX`, `PROJECTILE_TMP_POS`, `PROJECTILE_TMP_SCALE`, `PROJECTILE_TMP_QUAT` (declared in `ShipFlightSceneManager/constants.ts`) to avoid per-frame allocations.
- Hidden slots are zeroed via `Matrix4().makeScale(0,0,0)` (`ShipFlightSceneManager.ts:604-608`).

---

## 12. Post-Processing (`postprocessing` library on top of Three)

Both scenes share the same pipeline: `EffectComposer` → `RenderPass` → `BloomEffect` (mipmap blur) → `FXAAEffect`.

- Builder pipeline — `src/lib/managers/ShipBuilderSceneManager/ShipBuilderSceneManager.ts:534-552`
- Flight pipeline — `src/lib/managers/ShipFlightSceneManager/ShipFlightSceneManager.ts:279-296`
- Tuning constants — `ShipBuilderSceneManager/constants.ts:5-15` (`POST_PROCESSING_SETTINGS`) and `ShipFlightSceneManager/constants.ts` (`FLIGHT_SCENE_POST_PROCESSING`).

Render loop fallback: when no composer is available, `renderer.render(scene, camera)` is used directly — see `animate` at `ShipBuilderSceneManager.ts:1329-1355` and `ShipFlightSceneManager.ts:1305-1340`.

---

## 13. Texture Loading & Caching

Planets use shared `Texture`s loaded once via `TextureLoader`, cached per URL, with an in-flight `Promise` map to deduplicate concurrent requests. sRGB color space is set on success.

- `src/lib/utils/PlanetTextureCache/PlanetTextureCache.ts`
- Texture URLs — `src/assets/resources.ts`
- Consumer — `ShipFlightSceneManager.ts:858-867` in `spawnPlanet` (texture passed via `MeshStandardMaterial.map`, with a color fallback while the texture loads).

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

## 20. Suggested Review Order

If you want to read the WebGL/Three.js code linearly, this order matches the data flow:

1. `src/lib/managers/ShipBuilderModelManager/ShipBuilderModelManager.ts` — how the ship is built from primitives.
2. `src/lib/managers/ShipBuilderModelManager/utils.ts` — `onBeforeCompile` rim-light injection and quaternion mirroring.
3. `src/lib/managers/ShipBuilderSceneManager/ShipBuilderSceneManager.ts` — renderer, lights, shadows, gizmos, raycasting, `Box3` validation, post-processing.
4. `src/lib/managers/ShipFlightSceneManager/ShipFlightSceneManager.ts` — fog, stars, planets, instanced projectiles, particle systems.
5. `src/lib/shaders/*.ts` — the three GLSL programs used in flight mode.

Everything else is glue (React canvases at `src/components/SceneCanvas/SceneCanvas.tsx` and `src/components/FlightSceneCanvas/FlightSceneCanvas.tsx`, providers, state) and is not central to the WebGL grading.
