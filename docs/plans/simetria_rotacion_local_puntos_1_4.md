# Plan: Simetria de Rotacion Local (Puntos 1-4)

## 1. Objetivo de este plan

Definir un plan de implementacion para resolver solo estos puntos:

- 1. `ShipPart` data structure
- 2. Almacen de parte original y parte espejo
- 3. Calculo de posicion espejo
- 4. Calculo de rotacion espejo

Fuera de alcance en este documento:

- Rotacion alrededor de pivot local en runtime (punto 5)
- Actualizacion final de malla visual (punto 6)

---

## 2. Compatibilidad con el proyecto actual

Este plan esta pensado para encajar sin romper el flujo actual:

- Estado fuente: `ShipConfig` en [`src/lib/models/ShipConfig/types.ts`](../../src/lib/models/ShipConfig/types.ts)
- Gestion de estado: `ShipConfigManager`
- Construccion de geometria y grupos: `ShipBuilderModelManager`
- Interaccion de escena (gizmo, seleccion): `ShipBuilderSceneManager`

Restricciones de compatibilidad:

- Mantener `version: 1` de `ShipConfig` durante esta fase.
- No romper contratos actuales de `offset`, `rotation`, `scale` (tuplas `Vector3Tuple`).
- Introducir simetria avanzada como capa de dominio/runtime, no como cambio destructivo del JSON existente.
- Mantener el eje de simetria principal en X (left/right), consistente con el uso actual de espejo.

---

## 3. Fase 1 - Convenciones base de simetria

Objetivo: fijar reglas matematicas y de espacio de coordenadas antes de crear tipos nuevos.

Decisiones:

- Plano de simetria por defecto: `X = 0` en espacio local de `shipGroup`.
- Las operaciones de espejo se calculan en local ship-space, no en world-space.
- Rotacion canonica en runtime: `Quaternion` (aunque UI siga usando Euler por ahora).
- La pareja simetrica se representa como vinculacion logica (`pair/group id`), no como un unico objeto transformable.

Entregables:

- Constantes nuevas (ejemplo):
  - `SYMMETRY_PLANE_NORMAL = (-1, 0, 0)` o equivalente
  - `SYMMETRY_PLANE_OFFSET = 0`
- Nota tecnica en docs indicando formula de reflejo usada por el proyecto.

Archivos objetivo sugeridos:

- `src/lib/managers/ShipBuilderModelManager/constants.ts`
- `docs/plans/simetria_rotacion_local_puntos_1_4.md` (este plan como base)

Nota tecnica (formula de reflejo usada por el proyecto):

- Espacio de calculo: local de `shipGroup`.
- Plano de simetria: `X = 0`, equivalente a `n · p + d = 0` con `n = (-1, 0, 0)` y `d = 0`.
- Reflejo de punto general: `p' = p - 2 * (n · p + d) * n`.
- Forma simplificada para `X = 0`: si `p = (x, y, z)`, entonces `p' = (-x, y, z)`.

---

## 4. Fase 2 - Estructura de datos `ShipPart` (punto 1)

Objetivo: crear un modelo tipado para describir piezas individuales y metadatos de simetria.

Propuesta de modelo (nivel dominio/runtime):

- Identidad: `id`, `slot`, `variant`
- Transform base: `localPosition`, `localRotation`, `localScale`
- Anclaje/pivot logico: `pivotLocal` (se usara completo en punto 5)
- Simetria:
  - `mirrorRole`: `original | mirrored | none`
  - `symmetryGroupId`
  - `mirrorOfPartId` (si aplica)

Compatibilidad:

- `ShipPart` no reemplaza `ShipConfig` en esta fase.
- `ShipPart` se genera desde `ShipConfig` durante el build runtime de slots.

Archivos objetivo sugeridos:

- `src/lib/models/ShipPart/types.ts`
- `src/lib/models/ShipPart/constants.ts`
- `src/lib/models/ShipPart/index.ts`

---

## 5. Fase 3 - Almacen de original + espejo (punto 2)

Objetivo: dejar de depender de `clone + scale.x = -1` como unica fuente de verdad logica, y pasar a una representacion de pareja simetrica.

Propuesta:

- Crear un contenedor runtime por pareja:
  - `masterPart` (original editable)
  - `mirroredPart` (derivado)
- Para slots dobles (`wings`, `engines`, `weapons`), crear y mantener esta pareja de forma explicita.
- Regla de sincronizacion: cambios en `masterPart` recalculan `mirroredPart`.

Compatibilidad con flujo actual:

- `ShipBuilderModelManager` sigue construyendo `Group` por slot.
- Internamente, el slot dual obtiene su geometria desde `ShipPartPair` en lugar de clonar ciegamente un lado.

Archivos objetivo sugeridos:

- `src/lib/managers/ShipBuilderModelManager/types.ts`
- `src/lib/managers/ShipBuilderModelManager/ShipBuilderModelManager.ts`
- `src/lib/managers/ShipBuilderModelManager/utils.ts`

---

## 6. Fase 4 - Calculo de posicion espejo (punto 3)

Objetivo: calcular la posicion del mirrored part por reflejo matematico estable.

Formula base (plano `X = 0`):

- Si `p = (x, y, z)`, entonces `mirror(p) = (-x, y, z)`.

Formula general (plano `n · p + d = 0`):

- `p' = p - 2 * (n · p + d) * n`

Aplicacion en el proyecto:

- Entrada: `masterPart.localPosition`
- Salida: `mirroredPart.localPosition`
- Espacio: local de `shipGroup`

Validacion prevista:

- Tests unitarios de utilidades de espejo con casos simples:
  - `(-2, 0, 1)` <-> `(2, 0, 1)`
  - puntos en el plano (`x = 0`) permanecen iguales

Archivos objetivo sugeridos:

- `src/lib/managers/ShipBuilderModelManager/utils.ts`
- `src/lib/managers/ShipBuilderModelManager/__tests__/utils.symmetry.test.ts` (si se habilita test unitario)

---

## 7. Fase 5 - Calculo de rotacion espejo (punto 4)

Objetivo: derivar orientacion espejo correcta sin manipular Euler con reglas fragiles.

Estrategia recomendada:

- Convertir rotacion de `masterPart` a matriz `R`.
- Aplicar reflejo con matriz `S` del eje X:
  - `S = diag(-1, 1, 1)`
  - `R_mirror = S * R * S`
- Convertir `R_mirror` a quaternion para runtime.

Notas de compatibilidad:

- La UI puede seguir mostrando/guardando Euler en `ShipConfig.rotation`.
- Internamente, el calculo espejo debe ocurrir en quaternion/matriz para evitar errores de signos y gimbal.

Validacion prevista:

- Casos de yaw/pitch/roll aislados (0, 45, 90 grados)
- Confirmar que forward/right/up del mirrored part sean el reflejo del original respecto al plano X.

Archivos objetivo sugeridos:

- `src/lib/managers/ShipBuilderModelManager/utils.ts`
- `src/lib/managers/ShipBuilderModelManager/types.ts`

---

## 8. Orden de ejecucion recomendado

1. Fase 1: fijar convenciones globales.
2. Fase 2: introducir modelo `ShipPart`.
3. Fase 3: introducir `ShipPartPair` para slots simetricos.
4. Fase 4: util de posicion espejo.
5. Fase 5: util de rotacion espejo.

Este orden permite avanzar sin romper `ShipConfig` ni el pipeline actual de managers.

---

## 9. Riesgos y mitigaciones (solo puntos 1-4)

- Riesgo: mezcla de espacios local/world en formulas.
  - Mitigacion: fijar explicitamente `shipGroup local-space` en APIs de simetria.
- Riesgo: inconsistencias por usar Euler para espejo.
  - Mitigacion: espejo solo en matriz/quaternion; Euler solo para entrada/salida UI.
- Riesgo: regresion en slots no simetricos.
  - Mitigacion: `mirrorRole = none` y camino de ejecucion intacto para `body` y `cockpit`.

---

## 10. Definicion de terminado para esta etapa

- Existe un modelo `ShipPart` tipado y reutilizable.
- Existe estructura runtime para pareja original/espejo.
- Existe utilidad de calculo de posicion espejo validada.
- Existe utilidad de calculo de rotacion espejo validada.
- Todo lo anterior convive con `ShipConfig version 1` sin romper flujo de edicion actual.

---

## 11. Extension aplicada: punto 6 (actualizacion final de malla visual)

Estado aplicado en runtime:

- El `mirroredPart` se recalcula siempre desde `masterPart` durante `sync`.
- La malla visual de `masterSide` y `mirroredSide` se actualiza desde `ShipPartPair`.
- Se preserva el `id` del espejo para evitar churn innecesario de identidad.
- Slots no simetricos (`body`, `cockpit`) mantienen su camino de ejecucion sin cambios.

Archivo principal:

- `src/lib/managers/ShipBuilderModelManager/ShipBuilderModelManager.ts`

---

## 12. Extension aplicada: punto 5 (rotacion alrededor de pivot local)

Estado aplicado en runtime:

- Cada lado simetrico se renderiza como `wrapper + partContent`.
- La transformacion del wrapper usa `localPosition`, `localRotation` y `localScale`.
- Se aplica compensacion de pivot en `partContent` con `-pivotLocal`.
- Con esto, rotacion y escala ocurren alrededor de `pivotLocal` en local ship-space.

Archivo principal:

- `src/lib/managers/ShipBuilderModelManager/ShipBuilderModelManager.ts`

---

## 13. Extension aplicada: persistencia `ShipConfig` v2 + migracion v1

Estado aplicado:

- `ShipConfig` actual persiste en `version: 2` con `pivotLocal` por slot.
- Import JSON acepta `version: 1` y migra automaticamente a `version: 2`.
- `pivotLocal` se valida y clampa durante import/normalizacion.
- `pivotLocal` se edita desde UI via `updateSlot`, por lo que queda cubierto por `undo`/`redo`.
