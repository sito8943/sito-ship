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

## Tech Stack

- React 19
- TypeScript 5.9
- Three.js
- `postprocessing`
- Font Awesome
- Vite with `@vitejs/plugin-react` and the React Compiler Babel plugin
- ESLint, Prettier, Husky, and lint-staged
