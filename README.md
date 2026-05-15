# Sito Ship

Browser-based 3D spaceship builder and flight sandbox built with React, TypeScript, Three.js, and Vite.

Create a ship from modular parts, tweak transforms in the builder, export or import configs as JSON, then switch into a flight scene with thrusters, weapons, bloom, and mobile touch controls.

## Features

### Builder Mode

- Modular ship assembly for body, cockpit, wings, engines, and weapons
- Transform tools for move, rotate, scale, pair spread, and aim rotation
- Validation feedback for overlapping parts and body-contact violations
- Undo/redo history
- Desktop and mobile control layouts

### Flight Mode

- Instant switch from builder to flight with `T`
- Keyboard flight controls on desktop
- Touch flight controls on coarse-pointer devices
- Projectile fire, thruster feedback, and streaming space scenery

### Persistence and IO

- `Ctrl+S` saves the current ship to browser `localStorage`
- The last saved session is restored automatically when possible
- `Ctrl+E` exports the current ship as JSON
- `Ctrl+I` imports a ship config from JSON

## Screenshots

| Builder                                                                                                                                     | Flight                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| <img width="2940" height="1490" alt="Builder mode" src="https://github.com/user-attachments/assets/23fc5bc6-8062-4d77-ad9b-8da534577516" /> | <img width="2928" height="1490" alt="Flight mode" src="https://github.com/user-attachments/assets/ea937ab5-d4ac-45f1-80b9-f11cb63df703" /> |

## Getting Started

Requires Node.js as pinned in [`.nvmrc`](./.nvmrc) (currently 20.20.0). Run `nvm use` to match.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Available Scripts

- `npm run dev` starts the Vite dev server
- `npm run build` runs TypeScript build mode and creates a production bundle
- `npm run preview` serves the production build locally
- `npm run typecheck` runs `tsc -b --pretty false`
- `npm run lint` runs typecheck and ESLint with `--max-warnings=0`
- `npm run lint:fix` applies ESLint fixes
- `npm run format` formats the project with Prettier
- `npm run format:check` checks formatting with Prettier

## Keyboard Shortcuts

### Builder

| Action                                            | Key                         |
| ------------------------------------------------- | --------------------------- |
| Open keyboard shortcuts                           | `F1`                        |
| Toggle builder / flight mode                      | `T`                         |
| Export ship JSON                                  | `Ctrl+E`                    |
| Import ship JSON                                  | `Ctrl+I`                    |
| Save ship to browser storage                      | `Ctrl+S`                    |
| Undo                                              | `Ctrl+Z`                    |
| Redo                                              | `Ctrl+Shift+Z`              |
| Hide or show builder UI                           | `Tab`                       |
| Toggle panoramic view                             | `Shift+Tab`                 |
| Select body / cockpit / wings / engines / weapons | `1` / `2` / `3` / `4` / `5` |
| Move / rotate / scale                             | `G` / `R` / `S`             |
| Toggle pair spread editing                        | `P`                         |
| Aim-rotate toward target                          | `A`                         |
| Reset selected slot                               | `Backspace` / `Delete`      |
| Reset entire ship                                 | `Ctrl+Backspace`            |
| Focus selected part                               | `F`                         |
| Zoom to fit ship                                  | `Home`                      |
| Toggle cinematic view                             | `V`                         |

### Flight

| Action              | Key            |
| ------------------- | -------------- |
| Strafe left / right | `A` / `D`      |
| Move up / down      | `W` / `S`      |
| Fire weapons        | `Space`        |
| Hide or show HUD    | `Tab`          |
| Return to builder   | `T` / `Escape` |

## Development Notes

In development mode only, both scenes mount a `Stats` panel and a `lil-gui` debug panel. The builder debug panel is titled `Debug Helpers` and the flight panel is titled `Flight Debug`.

## Design Decisions

### Procedural geometry, no GLTF

No GLTF, no external 3D models, zero asset weight. Every ship is the sum of primitives assembled at runtime — boxes, cylinders, and cones combined under the modular slot system with transforms applied in the builder. Geometry is procedural, materials are code-defined, and the entire ship config serializes to a small JSON document. This keeps the bundle light, removes the asset pipeline, and lets ships be shared as plain text.

Textures are limited to planet surfaces, served from a CDN and cached at runtime — they add zero bundle weight and load lazily per planet. Everything else (ship parts, thrusters, projectiles, scenery) uses procedural geometry and code-defined materials, so the build has no texture budget to manage.

### Lighting (lights over HDRI)

Both scenes use one `AmbientLight` plus three `DirectionalLight`s (key, rim, fill) instead of an HDRI environment map. A 1k–2k HDRI would cost 200 KB–4 MB even compressed, and the flight scene's black background means most env reflection would be wasted. Four lights cost zero bytes, render cheaply, and give full control over hue per scene.

The builder scene supports an **optional** 1k HDR for PBR reflections on metallic ship parts. Set `BUILDER_ENVIRONMENT_HDR_URL` in `src/assets/resources.ts` to a hosted `.hdr` file — the builder will lazy-load it via `RGBELoader` + `PMREMGenerator` and assign it to `scene.environment`. When left empty, the scene falls back to the 3-light setup with no network cost.

### Shadows (builder-only)

Shadows are enabled in the builder scene only. The key light casts, and every ship part mesh gets `castShadow` and `receiveShadow` via `applyShadowToObject` (in `ShipBuilderModelManager/utils.ts`) so parts self-shadow as the ship is assembled. The flight scene disables shadows entirely (`FLIGHT_SCENE_RENDERER.enableShadows = false`) — in open space there is no ground plane for shadows to land on, so the extra shadow map pass would render onto nothing. Skipping it saves a full pass per frame on every flight frame.

### Shaders on meshes

Shader work appears in both scenes. The flight scene runs three full `ShaderMaterial`s with custom GLSL — `thruster`, `projectile`, and `muzzleFlash` — each with time-driven uniforms and life-curve fades (see `src/lib/shaders/`). The builder scene extends `MeshStandardMaterial` via `onBeforeCompile` (`ShipBuilderModelManager/utils.ts:createSlotMaterial`) to inject a fresnel rim glow into the PBR fragment program for every ship part, with `uRimColor`, `uRimPower`, and `uRimIntensity` uniforms. Selection highlight is driven through the same material via `emissive` + `emissiveIntensity`, layered with a screen-space `OutlineEffect` post pass.

### Post-processing and AA (FXAA over MSAA)

Both scenes render through `postprocessing`'s `EffectComposer` with FXAA, Bloom, and (in the builder) Outline passes. FXAA was chosen over hardware MSAA because the post-processing pipeline writes to a render target where MSAA cannot anti-alias the composited result, and a screen-space FXAA pass after bloom/outline produces a consistent edge across all effects. WebGL renderer `antialias` is therefore set to `false` in both managers. The cost is a single full-screen pass — far cheaper than running MSAA samples through every post effect.

The flight scene adds a final low-opacity `NoiseEffect` pass (soft-light blend, ~0.08 opacity) for a filmic grain over space, dialed through `FLIGHT_SCENE_POST_PROCESSING.noise` in `constants.ts`.

### Instanced projectiles

Flight projectiles render through a single `InstancedMesh` rather than one mesh per shot. Per-frame matrix updates write into a shared instance buffer, so the GPU sees one draw call regardless of how many bullets are alive. This keeps fire-rate scaling cheap and avoids the per-shot allocation churn that one-mesh-per-projectile would incur.

### Performance budget

The renderer keeps a tight budget so the flight scene stays at 60fps on a mid-range phone. Procedural geometry means zero download cost and no decode step on first paint. Both renderers clamp `setPixelRatio` so HiDPI screens never burn 4× the fragment work for marginal visual gain. The flight composer chains Render → Bloom → FXAA → Noise — three passes total — chosen over hardware MSAA so anti-aliasing happens once at the end of the chain on the composited image. Projectiles render through a single `InstancedMesh` so fire rate scales without growing the draw-call count. Shadows are disabled in the flight scene because there is no ground plane for them to fall on, saving a full shadow-map pass every frame. Frustum culling is left at three's default (every `Mesh` is culled by its bounding sphere), which is exactly what the procedural geometry produces.

A runtime quality tier (`src/lib/utils/RendererQuality`) detects coarse-pointer devices and narrow viewports and switches both managers to a low profile: pixel ratio capped at `1.0` instead of `1.5`, bloom and outline passes disabled. The tier is read once at scene construction, so a user landing on a phone immediately gets the lighter pipeline without flipping flags by hand.

### Renderer correctness

Both renderers set `outputColorSpace = SRGBColorSpace` and `toneMapping = ACESFilmicToneMapping` (exposure exposed as a typed config in each manager's `constants.ts`). Pixel ratio is clamped via `setPixelRatio(Math.min(window.devicePixelRatio, MAX_*))` to bound work on retina/HiDPI displays, and resize handlers update the renderer, camera aspect, and composer in lockstep.

## Tech Stack

- React 19
- TypeScript 5.9
- Three.js
- `postprocessing`
- Font Awesome
- Vite with `@vitejs/plugin-react` and the React Compiler Babel plugin
- ESLint, Prettier, Husky, and lint-staged
