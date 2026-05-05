import { useMemo, useState } from 'react'
import type { ShipSlot, ShipSlotConfigMap, ShipSlotPatch } from '@/lib/models/ShipConfig'
import { useShipBuilder } from '@/hooks/useShipBuilder'
import {
  OFFSET_AXIS_OPTIONS,
  SLOT_LABELS,
  SLOT_OFFSET_RANGES,
  SLOT_ORDER,
  SLOT_ROTATION_RANGES,
  SLOT_SCALE_RANGES,
  SLOT_VARIANT_OPTIONS,
  TRANSFORM_MODE_OPTIONS,
} from '@/components/ShipBuilderControls/constants'
import {
  createVector3Tuple,
  formatVariantLabel,
  getSlotConfig,
  getUniformScale,
  updateTupleAxis,
} from '@/components/ShipBuilderControls/utils'

const ShipBuilderControls = () => {
  const {
    shipConfig,
    selectedSlot,
    transformMode,
    canUndo,
    canRedo,
    overlappingSlots,
    detachedSlots,
    message,
    updateSlot,
    setSelectedSlot,
    setTransformMode,
    undo,
    redo,
    resetSlot,
    resetShipConfig,
    exportShipConfigToJson,
    importShipConfigFromJson,
  } = useShipBuilder()

  const [jsonInput, setJsonInput] = useState('')
  const [importWarnings, setImportWarnings] = useState<string[]>([])

  const activeSlotConfig = useMemo(() => {
    return getSlotConfig(shipConfig, selectedSlot)
  }, [selectedSlot, shipConfig])

  const handleVariantChange = <TSlot extends ShipSlot>(
    slot: TSlot,
    variant: ShipSlotConfigMap[TSlot]['variant']
  ) => {
    updateSlot(slot, {
      variant,
    } as ShipSlotPatch<TSlot>)
  }

  const handleColorChange = <TSlot extends ShipSlot>(slot: TSlot, color: string) => {
    updateSlot(slot, {
      color,
    } as ShipSlotPatch<TSlot>)
  }

  const handleScaleChange = <TSlot extends ShipSlot>(
    slot: TSlot,
    scale: number,
    options?: { commitHistory?: boolean }
  ) => {
    updateSlot(
      slot,
      {
        scale: createVector3Tuple(scale, scale, scale),
      } as ShipSlotPatch<TSlot>,
      {
        commitHistory: options?.commitHistory ?? false,
      }
    )
  }

  const handleOffsetAxisChange = <TSlot extends ShipSlot>(
    slot: TSlot,
    axisIndex: 0 | 1 | 2,
    value: number,
    options?: { commitHistory?: boolean }
  ) => {
    const slotConfig = getSlotConfig(shipConfig, slot)
    updateSlot(
      slot,
      {
        offset: updateTupleAxis(slotConfig.offset, axisIndex, value),
      } as ShipSlotPatch<TSlot>,
      {
        commitHistory: options?.commitHistory ?? false,
      }
    )
  }

  const handleRotationAxisChange = <TSlot extends ShipSlot>(
    slot: TSlot,
    axisIndex: 0 | 1 | 2,
    value: number,
    options?: { commitHistory?: boolean }
  ) => {
    const slotConfig = getSlotConfig(shipConfig, slot)
    updateSlot(
      slot,
      {
        rotation: updateTupleAxis(slotConfig.rotation, axisIndex, value),
      } as ShipSlotPatch<TSlot>,
      {
        commitHistory: options?.commitHistory ?? false,
      }
    )
  }

  const handleExportJson = () => {
    const exportedJson = exportShipConfigToJson()
    setJsonInput(exportedJson)
    setImportWarnings([])
  }

  const handleImportJson = () => {
    const importResult = importShipConfigFromJson(jsonInput)
    if (!importResult.ok) {
      setImportWarnings([])
      return
    }

    setImportWarnings(importResult.warnings)
  }

  const uniformScale = getUniformScale(activeSlotConfig.scale)

  return (
    <aside className="ship-builder-controls" aria-label="Ship Builder Controls">
      <header className="ship-builder-controls__header">
        <h2 className="ship-builder-controls__title">Ship Builder</h2>
        <div className="ship-builder-controls__header-actions">
          <button
            type="button"
            className="ship-builder-controls__action-button"
            onClick={undo}
            disabled={!canUndo}
          >
            Undo
          </button>
          <button
            type="button"
            className="ship-builder-controls__action-button"
            onClick={redo}
            disabled={!canRedo}
          >
            Redo
          </button>
          <button
            type="button"
            className="ship-builder-controls__action-button"
            onClick={resetShipConfig}
          >
            Reset Ship
          </button>
        </div>
      </header>

      <section className="ship-builder-controls__section">
        <span className="ship-builder-controls__section-title">Selected Slot</span>
        <div className="ship-builder-controls__slot-tabs">
          {SLOT_ORDER.map((slot) => {
            return (
              <button
                key={slot}
                type="button"
                className={`ship-builder-controls__slot-tab ${
                  selectedSlot === slot ? 'ship-builder-controls__slot-tab--active' : ''
                }`}
                onClick={() => {
                  setSelectedSlot(slot)
                }}
              >
                {SLOT_LABELS[slot]}
              </button>
            )
          })}
        </div>
      </section>

      <section className="ship-builder-controls__section">
        <span className="ship-builder-controls__section-title">Gizmo Mode</span>
        <div className="ship-builder-controls__mode-toggle">
          {TRANSFORM_MODE_OPTIONS.map((modeOption) => {
            return (
              <button
                key={modeOption.value}
                type="button"
                className={`ship-builder-controls__mode-button ${
                  transformMode === modeOption.value
                    ? 'ship-builder-controls__mode-button--active'
                    : ''
                }`}
                onClick={() => {
                  setTransformMode(modeOption.value)
                }}
              >
                {modeOption.label}
              </button>
            )
          })}
        </div>
      </section>

      <div className="ship-builder-controls__list">
        <article className="ship-builder-controls__card">
          <div className="ship-builder-controls__card-header">
            <h3 className="ship-builder-controls__card-title">{SLOT_LABELS[selectedSlot]}</h3>
            <button
              type="button"
              className="ship-builder-controls__action-button ship-builder-controls__action-button--small"
              onClick={() => {
                resetSlot(selectedSlot)
              }}
            >
              Reset Slot
            </button>
          </div>

          <label className="ship-builder-controls__field">
            <span className="ship-builder-controls__field-label">Variant</span>
            <select
              className="ship-builder-controls__select"
              value={activeSlotConfig.variant}
              onChange={(event) => {
                const nextVariant = event.target
                  .value as ShipSlotConfigMap[typeof selectedSlot]['variant']
                handleVariantChange(selectedSlot, nextVariant)
              }}
            >
              {SLOT_VARIANT_OPTIONS[selectedSlot].map((variant) => {
                return (
                  <option key={variant} value={variant}>
                    {formatVariantLabel(variant)}
                  </option>
                )
              })}
            </select>
          </label>

          <label className="ship-builder-controls__field ship-builder-controls__field--color">
            <span className="ship-builder-controls__field-label">Color</span>
            <input
              className="ship-builder-controls__color"
              type="color"
              value={activeSlotConfig.color}
              onChange={(event) => {
                handleColorChange(selectedSlot, event.target.value)
              }}
            />
          </label>

          <label className="ship-builder-controls__field">
            <span className="ship-builder-controls__field-label">
              Uniform Scale {uniformScale.toFixed(2)}
            </span>
            <input
              className="ship-builder-controls__range"
              type="range"
              min={SLOT_SCALE_RANGES[selectedSlot].min}
              max={SLOT_SCALE_RANGES[selectedSlot].max}
              step={SLOT_SCALE_RANGES[selectedSlot].step}
              value={uniformScale}
              onChange={(event) => {
                handleScaleChange(selectedSlot, Number(event.target.value))
              }}
              onPointerUp={(event) => {
                handleScaleChange(selectedSlot, Number(event.currentTarget.value), {
                  commitHistory: true,
                })
              }}
              onBlur={(event) => {
                handleScaleChange(selectedSlot, Number(event.currentTarget.value), {
                  commitHistory: true,
                })
              }}
            />
          </label>

          {OFFSET_AXIS_OPTIONS.map((axisOption) => {
            const axisValue = activeSlotConfig.offset[axisOption.index]
            const axisRange = SLOT_OFFSET_RANGES[selectedSlot][axisOption.axis]

            return (
              <label
                key={`${selectedSlot}-offset-${axisOption.axis}`}
                className="ship-builder-controls__field"
              >
                <span className="ship-builder-controls__field-label">
                  Offset {axisOption.axis.toUpperCase()} {axisValue.toFixed(2)}
                </span>
                <input
                  className="ship-builder-controls__range"
                  type="range"
                  min={axisRange.min}
                  max={axisRange.max}
                  step={axisRange.step}
                  value={axisValue}
                  onChange={(event) => {
                    handleOffsetAxisChange(
                      selectedSlot,
                      axisOption.index,
                      Number(event.target.value)
                    )
                  }}
                  onPointerUp={(event) => {
                    handleOffsetAxisChange(
                      selectedSlot,
                      axisOption.index,
                      Number(event.currentTarget.value),
                      { commitHistory: true }
                    )
                  }}
                  onBlur={(event) => {
                    handleOffsetAxisChange(
                      selectedSlot,
                      axisOption.index,
                      Number(event.currentTarget.value),
                      { commitHistory: true }
                    )
                  }}
                />
              </label>
            )
          })}

          {OFFSET_AXIS_OPTIONS.map((axisOption) => {
            const axisValue = activeSlotConfig.rotation[axisOption.index]
            const axisRange = SLOT_ROTATION_RANGES[selectedSlot][axisOption.axis]

            return (
              <label
                key={`${selectedSlot}-rotation-${axisOption.axis}`}
                className="ship-builder-controls__field"
              >
                <span className="ship-builder-controls__field-label">
                  Rotation {axisOption.axis.toUpperCase()} {axisValue.toFixed(2)}
                </span>
                <input
                  className="ship-builder-controls__range"
                  type="range"
                  min={axisRange.min}
                  max={axisRange.max}
                  step={axisRange.step}
                  value={axisValue}
                  onChange={(event) => {
                    handleRotationAxisChange(
                      selectedSlot,
                      axisOption.index,
                      Number(event.target.value)
                    )
                  }}
                  onPointerUp={(event) => {
                    handleRotationAxisChange(
                      selectedSlot,
                      axisOption.index,
                      Number(event.currentTarget.value),
                      { commitHistory: true }
                    )
                  }}
                  onBlur={(event) => {
                    handleRotationAxisChange(
                      selectedSlot,
                      axisOption.index,
                      Number(event.currentTarget.value),
                      { commitHistory: true }
                    )
                  }}
                />
              </label>
            )
          })}
        </article>
      </div>

      <section className="ship-builder-controls__io">
        <div className="ship-builder-controls__io-actions ship-builder-controls__io-actions--spaced">
          <button
            type="button"
            className="ship-builder-controls__action-button"
            onClick={handleExportJson}
          >
            Export JSON
          </button>
          <button
            type="button"
            className="ship-builder-controls__action-button"
            onClick={handleImportJson}
          >
            Import JSON
          </button>
        </div>

        <label className="ship-builder-controls__field">
          <span className="ship-builder-controls__field-label">Import / Export JSON</span>
          <textarea
            className="ship-builder-controls__textarea"
            value={jsonInput}
            placeholder='{"version":1,...}'
            onChange={(event) => {
              setJsonInput(event.target.value)
            }}
          />
        </label>

        {message ? (
          <p
            className={`ship-builder-controls__io-message ship-builder-controls__io-message--${message.kind}`}
          >
            {message.text}
          </p>
        ) : null}

        {overlappingSlots.length > 0 ? (
          <p className="ship-builder-controls__io-message ship-builder-controls__io-message--warning">
            Overlap alert: {overlappingSlots.map((slot) => SLOT_LABELS[slot]).join(', ')}
          </p>
        ) : null}

        {detachedSlots.length > 0 ? (
          <p className="ship-builder-controls__io-message ship-builder-controls__io-message--warning">
            Body contact enforced: {detachedSlots.map((slot) => SLOT_LABELS[slot]).join(', ')}
          </p>
        ) : null}

        {importWarnings.length > 0 ? (
          <ul className="ship-builder-controls__warning-list">
            {importWarnings.map((warningMessage) => {
              return <li key={warningMessage}>{warningMessage}</li>
            })}
          </ul>
        ) : null}
      </section>
    </aside>
  )
}

export default ShipBuilderControls
