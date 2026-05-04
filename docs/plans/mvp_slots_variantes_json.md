# Plan MVP: Ship Builder (Slots + Variantes + JSON)

## 1. Objetivo del MVP

Construir un editor básico de naves en la pantalla Home usando Three.js, con:

- Estructura por slots
- Variantes visuales por slot
- Edición simple desde UI (sin drag & drop 3D)
- Guardar y cargar configuración en JSON

Resultado esperado: cualquier usuario puede crear una nave, cambiar sus piezas, guardar su configuración y volver a cargarla.

---

## 2. Alcance funcional (primera versión)

Incluido en MVP:

- Slots: `body`, `cockpit`, `wings`, `engines`, `weapons`
- Variantes predefinidas por slot
- Color por slot
- Escala por slot (solo donde tenga sentido)
- Simetría automática en piezas dobles (`wings`, `engines`, `weapons`)
- Exportar JSON (copiar/descargar)
- Importar JSON (pegar/cargar)
- Render en Home con una nave siempre visible

Fuera de MVP:

- Drag & drop 3D
- Gizmos de transformación (translate/rotate/scale interactivo)
- Colisiones avanzadas entre piezas
- Sistema de desbloqueo/progresión
- Persistencia remota

---

## 3. Diseño técnico

### 3.1 Modelo de datos base

Definir un `ShipConfig` tipado:

- `version` (para migraciones futuras)
- Un bloque por slot:
  - `variant`
  - `color`
  - `scale` (si aplica)
  - `offset` (si aplica)

Ejemplo mínimo:

```json
{
  "version": 1,
  "body": { "variant": "box", "color": "#4f46e5", "scale": [1, 1, 1] },
  "cockpit": { "variant": "sphere", "color": "#38bdf8", "offset": [0, 0.35, 0.2] },
  "wings": { "variant": "triangular", "color": "#64748b", "scale": [1, 1, 1] },
  "engines": { "variant": "cylinderDual", "color": "#111827", "scale": [1, 1, 1] },
  "weapons": { "variant": "none", "color": "#94a3b8" }
}
```

### 3.2 Sistema de slots

Crear un `THREE.Group` raíz `shipGroup` y construir cada slot en subgrupos:

- `bodyGroup`
- `cockpitGroup`
- `leftWingGroup` + `rightWingGroup`
- `leftEngineGroup` + `rightEngineGroup`
- `leftWeaponGroup` + `rightWeaponGroup`

Regla: cada cambio en config reconstruye solo el slot afectado (no toda la escena).

### 3.3 Variantes por slot (catálogo inicial)

- `body`: `box`, `longBox`, `tapered`
- `cockpit`: `sphere`, `oval`, `bubble`
- `wings`: `rect`, `triangular`, `double`
- `engines`: `cylinder`, `cone`, `cylinderDual`
- `weapons`: `none`, `singleCannon`, `dualCannon`

Todas las variantes se construyen con primitivas de Three.js (`Box`, `Sphere`, `Cylinder`, `Cone`, `Torus`).

### 3.4 Simetría

Implementar helper:

- Dada una pieza izquierda: clonar y espejar en eje X para la derecha.
- Mantener misma geometría/material con posición opuesta.
- Ajustar rotaciones cuando una variante lo requiera.

### 3.5 UI del Home

Panel lateral simple con:

- Select por slot (variant)
- Color picker por slot
- Sliders de escala/offset acotados
- Botones `Export JSON` / `Import JSON` / `Reset`

Sin manipulación directa en canvas para este MVP.

### 3.6 Validación JSON

Al importar:

- Parse JSON
- Validar estructura mínima (`version`, slots requeridos)
- Fallback a defaults si falta un campo no crítico
- Error visible si JSON inválido

---

## 4. Plan de implementación por fases

## Fase 1: Base en Home

- Montar escena, cámara, luces y renderer
- Crear `shipGroup` vacío
- Render loop funcional

Entregable: Home muestra escena 3D estable.

## Fase 2: Datos y defaults

- Definir `ShipConfig` + `defaultShipConfig`
- Añadir estado global/local de configuración
- Función `updateSlot(slot, patch)`

Entregable: estado editable sin romper tipado.

## Fase 3: Builder por slots

- Implementar factory por slot/variante
- Montaje en `shipGroup`
- Rebuild selectivo por slot

Entregable: cambio de variante en un slot actualiza la nave.

## Fase 4: Simetría automática

- Wings/engines/weapons espejo automático
- Ajustes de posición base por slot

Entregable: piezas dobles siempre simétricas.

## Fase 5: UI de edición

- Panel con selects + colores + sliders
- Conectar UI con `ShipConfig`

Entregable: usuario puede personalizar sin tocar código.

## Fase 6: Export/Import JSON

- Botón export (texto JSON usable)
- Input/textarea de import
- Validación + errores

Entregable: ida y vuelta JSON completa.

## Fase 7: Pulido mínimo

- Defaults visuales coherentes
- Límites de sliders para evitar combinaciones rotas
- Ajuste de cámara y luces

Entregable: MVP presentable y estable.

---

## 5. Criterios de aceptación (Definition of Done)

- Se puede crear una nave cambiando al menos 3 slots distintos.
- Wings y engines mantienen simetría en todos los cambios.
- Exportar JSON y reimportarlo reconstruye la misma nave.
- Importar JSON inválido no rompe la app y muestra error claro.
- Rendimiento estable en Home durante edición básica.

---

## 6. Riesgos y mitigaciones

- Riesgo: combinaciones visualmente feas.
  - Mitigación: offsets por variante + clamps en sliders.
- Riesgo: geometrías superpuestas.
  - Mitigación: definir anclajes por slot respecto a `body`.
- Riesgo: código difícil de mantener.
  - Mitigación: separar factories por slot y tipar todo.

---

## 7. Próximos pasos inmediatos

1. Crear estructura de carpetas de `ship-builder` dentro de Home.
2. Implementar `ShipConfig` y defaults.
3. Levantar primer builder con `body + cockpit + wings`.
4. Conectar primer panel UI (solo variants y color).
