# Plan Post-MVP: Ship Builder (Editor Pulido)

## 1. Objetivo

Evolucionar el editor actual (MVP completado) hacia una version pulida con interaccion directa en canvas, reglas de integridad visual y persistencia robusta.

Resultado esperado: el usuario puede editar la nave desde UI y canvas 3D, con feedback claro, sin romper simetria ni generar combinaciones invalidas.

---

## 2. Alcance funcional (post-MVP)

Incluido:

- Seleccion de piezas desde canvas (click por slot)
- Gizmos de transformacion (translate/rotate/scale) con limites
- Simetria mantenida automaticamente en pares (`wings`, `engines`, `weapons`)
- Reglas anti-solape basicas con feedback visual
- Historial de cambios (`undo`/`redo`)
- Persistencia local automatica (`localStorage`) + compatibilidad con JSON
- Pulido de UX: estados, mensajes y bloqueos claros

Fuera de este plan:

- Multiplayer
- Progresion/desbloqueos de juego
- Persistencia remota en backend
- Editor libre tipo DCC (Blender-like)

---

## 3. Criterios tecnicos

- Mantener arquitectura modular actual (`SceneManager`, `ModelManager`, `ConfigManager`, `IOManager`)
- Evitar rebuild completo en cada cambio; priorizar actualizacion por slot
- Validar toda entrada externa (UI, canvas, JSON import)
- Compatibilidad hacia atras con `version: 1` y persistencia actual en `version: 2` de `ShipConfig`

---

## 4. Plan de implementacion por fases

## Fase 8: Seleccion en canvas y slot activo

- Raycast para seleccionar pieza en escena
- Mapeo mesh -> slot
- Estado global `selectedSlot` en provider
- Resaltado visual del slot seleccionado

Entregable: el usuario puede hacer click en una pieza y editar ese slot sin ambiguedad.

## Fase 9: Gizmos de transformacion acotados

- Integrar controles de transformacion en la pieza activa
- Modo `translate`/`rotate`/`scale` con toggles
- Clamps por slot para posicion, rotacion y escala
- Aplicacion de simetria al slot espejo cuando corresponda

Entregable: transformacion directa estable, con limites y sin romper simetria.

## Fase 10: Reglas de integridad visual

- Deteccion ligera de solapes severos por bounding volumes
- Reglas por slot para corregir offsets fuera de rango
- Feedback visual y mensaje de validacion cuando se autocorrige
- Revalidacion al importar JSON

Entregable: combinaciones invalidas no rompen la escena y se comunican claramente.

## Fase 11: UX de edicion avanzada

- Historial `undo`/`redo` con limite de snapshots
- Atajos de teclado basicos (`Ctrl/Cmd+Z`, `Shift+Ctrl/Cmd+Z`)
- Botones de reset por slot y reset global
- Mensajeria unificada para errores y confirmaciones

Entregable: flujo de edicion rapido y recuperable ante errores de usuario.

## Fase 12: Persistencia y cierre de release

- Auto-save de configuracion en `localStorage`
- Auto-restore al abrir Home
- Migracion de `ShipConfig` v1 -> v2 (si aplica)
- Test de regresion de import/export + checklist de rendimiento

Entregable: editor pulido listo para uso continuado sin perdida de trabajo.

---

## 5. Definition of Done (post-MVP)

- Seleccion y edicion en canvas funcional en al menos 5 slots
- Simetria consistente en todas las operaciones de gizmo
- `Undo`/`redo` estable durante una sesion de edicion normal
- Importar JSON invalido no rompe app y muestra error accionable
- Restauracion automatica de la ultima configuracion al recargar
- Rendimiento estable durante edicion (sin stutters severos)

---

## 6. Riesgos y mitigaciones

- Riesgo: conflicto entre `OrbitControls` y gizmos.
  - Mitigacion: lock de camara mientras el gizmo esta activo.
- Riesgo: degradacion de rendimiento por raycast y validaciones.
  - Mitigacion: throttling de chequeos y cache de referencias por slot.
- Riesgo: estados imposibles tras `undo`/`redo` + import.
  - Mitigacion: normalizar config antes de aplicar cualquier snapshot.

---

## 7. Proximos pasos inmediatos

1. Definir contrato de `selectedSlot` y eventos de seleccion.
2. Implementar raycast + highlight en `ShipBuilderSceneManager`.
3. Conectar panel UI para editar el slot activo.
4. Integrar primer gizmo solo para `wings` y validar simetria.
