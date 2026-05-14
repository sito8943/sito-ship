# Sito Ship

A 3D spaceship builder and flight simulator running in the browser. Built with React, TypeScript, Three.js, and Vite. Players assemble a ship from modular slots (body, cockpit, wings, engines, weapons), then drop into a flight scene with thrusters, projectiles, post-processing bloom, and a streaming planet field.

## Modes

### Builder Mode

Modular ship editor with an orbit camera. Pick slots from categories, transform them with translate/rotate/scale gizmos, mirror symmetric pairs (wings/engines/weapons), validate overlap and body-contact constraints, save/load ship JSON, and undo/redo edits.

### Flight Mode

Take the assembled ship into space. Strafe and pitch, fire projectiles with muzzle flash, thrusters react to throttle, planets stream past with a textured pool and parallax star layers. Touch controls auto-enable on coarse-pointer devices.

## Screenshots

<!-- TODO: replace placeholders with real screenshots -->

| Builder                                                         | Flight                                                        |
| --------------------------------------------------------------- | ------------------------------------------------------------- |
| ![Builder screenshot placeholder](docs/screenshots/builder.png) | ![Flight screenshot placeholder](docs/screenshots/flight.png) |

## Getting Started

```bash
npm install
npm run dev
```

Then open the printed local URL.

Scripts:

- `npm run dev` — start Vite dev server
- `npm run build` — typecheck + production build
- `npm run typecheck` — `tsc -b`
- `npm run lint` — typecheck + ESLint (max-warnings=0)
- `npm run format` — Prettier write

## Development-Only Features

These only mount when `import.meta.env.DEV` is true.

### Builder — Debug GUI

A `lil-gui` panel titled **Debug Helpers** appears in the top-right of the builder canvas with toggles for:

- **Axes Helper** — world axes at origin
- **Light Helpers** — `DirectionalLightHelper` for key/rim/fill lights
- **Shadow Helpers** — `CameraHelper` for the shadow-casting key light

### Flight — Debug GUI

A `lil-gui` panel titled **Flight Debug** appears in the top-right of the flight canvas with two folders:

- **Helpers**
  - **Axes Helper**
  - **Grid Helper**
  - **Light Helpers**
- **Camera**
  - **Free Camera Orbit** — disables the fixed follow camera and enables `OrbitControls` (drag to orbit, scroll to zoom)

### Stats Panel

Three.js `Stats` overlay (MS panel) is fixed at top-left of both builder and flight scenes in dev.

## Keyboard Shortcuts (Builder)

| Action                                            | Key                         |
| ------------------------------------------------- | --------------------------- |
| Open keyboard shortcuts/help                      | `F1`                        |
| Export ship as JSON                               | `Ctrl+E`                    |
| Import ship JSON                                  | `Ctrl+I`                    |
| Save current ship                                 | `Ctrl+S`                    |
| Undo                                              | `Ctrl+Z`                    |
| Redo                                              | `Ctrl+Shift+Z`              |
| Hide/show controls panel                          | `Tab`                       |
| Toggle panoramic view                             | `Shift+Tab`                 |
| Select body / cockpit / wings / engines / weapons | `1` / `2` / `3` / `4` / `5` |
| Move / Rotate / Scale gizmo                       | `G` / `R` / `S`             |
| Toggle pair spread editing                        | `P`                         |
| Aim-rotate toward target                          | `A`                         |
| Delete selected part                              | `Delete`                    |
| Reset selected slot                               | `Backspace`                 |
| Reset entire ship                                 | `Ctrl+Backspace`            |
| Focus selected part                               | `F`                         |
| Zoom to fit entire ship                           | `Home`                      |
| Toggle cinematic view                             | `V`                         |

## Keyboard Shortcuts (Flight)

| Action                        | Key            |
| ----------------------------- | -------------- |
| Exit flight (back to builder) | `T` / `Escape` |
| Hide/show HUD                 | `Tab`          |

## Tech Stack

- React 19 + TypeScript 5.9
- Three.js 0.184
- `postprocessing` (bloom, FXAA)
- `lil-gui`, `Stats`, `OrbitControls`, `TransformControls` (three addons)
- Vite (rolldown) + React Compiler
- ESLint + Prettier + Husky + lint-staged
