import { useMemo } from 'react'
import {
  faArrowRotateLeft,
  faArrowRotateRight,
  faArrowsToCircle,
  faArrowsRotate,
  faArrowsSpin,
  faArrowsUpDownLeftRight,
  faMaximize,
  faRotateLeft,
  faUpRightAndDownLeftFromCenter,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { ShipSlot, ShipSlotConfigMap, ShipSlotPatch } from '@/lib/models/ShipConfig'
import { useShipBuilder } from '@/hooks/useShipBuilder'
import { Button, IconButton } from '@/components/ui'
import {
  OFFSET_AXIS_OPTIONS,
  SLOT_LABELS,
  SLOT_OFFSET_RANGES,
  SLOT_ORDER,
  SLOT_ROTATION_RANGES,
  SLOT_SCALE_RANGES,
  SLOT_VARIANT_OPTIONS,
  SYMMETRIC_AIM_ROTATION_RANGES,
  SYMMETRIC_PAIR_SPREAD_RANGES,
  TRANSFORM_MODE_OPTIONS,
} from '@/components/ShipBuilderControls/constants'
import {
  createVector3Tuple,
  formatVariantLabel,
  getSlotConfig,
  getUniformScale,
  updateTupleAxis,
} from '@/components/ShipBuilderControls/utils'
import type {
  ShipBuilderControlsMainAsideProps,
  SymmetricSlot,
} from '@/components/ShipBuilderControls/components/ShipBuilderControlsMainAside/types'

const ShipBuilderControlsMainAside = ({
  isHidden,
  panelVisibilityClassName,
}: ShipBuilderControlsMainAsideProps) => {
  const {
    shipConfig,
    selectedSlot,
    transformMode,
    canUndo,
    canRedo,
    updateSlot,
    setSelectedSlot,
    setTransformMode,
    undo,
    redo,
    resetSlot,
    resetShipConfig,
  } = useShipBuilder()

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

  const handleAimAxisChange = (
    slot: SymmetricSlot,
    axisIndex: 0 | 1 | 2,
    value: number,
    options?: { commitHistory?: boolean }
  ) => {
    updateSlot(
      slot,
      {
        aimRotation: updateTupleAxis(shipConfig[slot].aimRotation, axisIndex, value),
      },
      {
        commitHistory: options?.commitHistory ?? false,
      }
    )
  }

  const handlePairSpreadChange = (
    slot: SymmetricSlot,
    value: number,
    options?: { commitHistory?: boolean }
  ) => {
    updateSlot(
      slot,
      {
        pairSpread: value,
      },
      {
        commitHistory: options?.commitHistory ?? false,
      }
    )
  }

  const uniformScale = getUniformScale(activeSlotConfig.scale)
  const symmetricSlot: SymmetricSlot | null =
    selectedSlot === 'wings' || selectedSlot === 'engines' || selectedSlot === 'weapons'
      ? selectedSlot
      : null
  const hasSymmetricControls =
    symmetricSlot !== null && (symmetricSlot !== 'weapons' || shipConfig.weapons.variant !== 'none')
  const showScaleControls = transformMode === 'scale'
  const showOffsetControls = transformMode === 'translate'
  const showRotationControls = transformMode === 'rotate'
  const showPairSpreadControl = transformMode === 'pairSpread'
  const showAimRotationControls = transformMode === 'aimRotate'

  return (
    <aside
      className={`ship-builder-controls ship-builder-controls-panel ${panelVisibilityClassName} ${
        isHidden ? 'ship-builder-controls--hidden' : ''
      }`}
      aria-label="Ship Builder Controls"
      aria-hidden={isHidden}
    >
      <header className="ship-builder-controls__header">
        <h2 className="ship-builder-controls__title">Ship Builder</h2>
        <div className="ship-builder-controls__header-actions">
          <IconButton
            className="ship-builder-controls__action-button"
            icon={faArrowRotateLeft}
            label="Undo"
            title="Undo last change"
            onClick={undo}
            disabled={!canUndo}
          />
          <IconButton
            className="ship-builder-controls__action-button"
            icon={faArrowRotateRight}
            label="Redo"
            title="Redo last change"
            onClick={redo}
            disabled={!canRedo}
          />
          <Button
            className="ship-builder-controls__action-button ship-builder-controls__reset-action-button ship-builder-controls__reset-action-button--desktop"
            onClick={resetShipConfig}
            leadingIcon={<FontAwesomeIcon icon={faArrowsRotate} fixedWidth />}
          >
            Reset Ship
          </Button>
          <IconButton
            className="ship-builder-controls__action-button ship-builder-controls__reset-action-button ship-builder-controls__reset-action-button--mobile"
            icon={faArrowsRotate}
            label="Reset Ship"
            title="Reset Ship"
            onClick={resetShipConfig}
          />
        </div>
      </header>

      <section className="ship-builder-controls__section">
        <span className="ship-builder-controls__section-title ship-builder-controls__section-title--selected-slot">
          Selected Slot
        </span>
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
            const isDisabled = modeOption.symmetricOnly === true && !hasSymmetricControls
            const mobileModeIcon =
              modeOption.value === 'translate'
                ? faArrowsUpDownLeftRight
                : modeOption.value === 'rotate'
                  ? faArrowsSpin
                  : modeOption.value === 'scale'
                    ? faMaximize
                    : modeOption.value === 'pairSpread'
                      ? faUpRightAndDownLeftFromCenter
                      : modeOption.value === 'aimRotate'
                        ? faArrowsToCircle
                        : null

            return (
              <button
                key={modeOption.value}
                type="button"
                className={`ship-builder-controls__mode-button ${
                  transformMode === modeOption.value
                    ? 'ship-builder-controls__mode-button--active'
                    : ''
                }`}
                disabled={isDisabled}
                onClick={() => {
                  setTransformMode(modeOption.value)
                }}
              >
                {mobileModeIcon ? (
                  <>
                    <span className="ship-builder-controls__mode-button-label">
                      {modeOption.label}
                    </span>
                    <span className="ship-builder-controls__mode-button-icon" aria-hidden="true">
                      <FontAwesomeIcon icon={mobileModeIcon} fixedWidth />
                    </span>
                  </>
                ) : (
                  modeOption.label
                )}
              </button>
            )
          })}
        </div>
      </section>

      <div className="ship-builder-controls__list">
        <article className="ship-builder-controls__card">
          <div className="ship-builder-controls__card-header">
            <h3 className="ship-builder-controls__card-title">{SLOT_LABELS[selectedSlot]}</h3>
            <Button
              size="sm"
              className="ship-builder-controls__action-button ship-builder-controls__action-button--small ship-builder-controls__reset-action-button ship-builder-controls__reset-action-button--desktop"
              onClick={() => {
                resetSlot(selectedSlot)
              }}
              leadingIcon={<FontAwesomeIcon icon={faRotateLeft} fixedWidth />}
            >
              Reset Slot
            </Button>
            <IconButton
              size="sm"
              className="ship-builder-controls__action-button ship-builder-controls__action-button--small ship-builder-controls__reset-action-button ship-builder-controls__reset-action-button--mobile"
              icon={faRotateLeft}
              label="Reset Slot"
              title="Reset Slot"
              onClick={() => {
                resetSlot(selectedSlot)
              }}
            />
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

          {showScaleControls ? (
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
          ) : null}

          {showOffsetControls
            ? OFFSET_AXIS_OPTIONS.map((axisOption) => {
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
              })
            : null}

          {showRotationControls
            ? OFFSET_AXIS_OPTIONS.map((axisOption) => {
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
              })
            : null}

          {showPairSpreadControl && hasSymmetricControls && symmetricSlot ? (
            <label key={`${selectedSlot}-pair-spread`} className="ship-builder-controls__field">
              <span className="ship-builder-controls__field-label">
                Pair Spread {shipConfig[symmetricSlot].pairSpread.toFixed(2)}
              </span>
              <input
                className="ship-builder-controls__range"
                type="range"
                min={SYMMETRIC_PAIR_SPREAD_RANGES[symmetricSlot].min}
                max={SYMMETRIC_PAIR_SPREAD_RANGES[symmetricSlot].max}
                step={SYMMETRIC_PAIR_SPREAD_RANGES[symmetricSlot].step}
                value={shipConfig[symmetricSlot].pairSpread}
                onChange={(event) => {
                  handlePairSpreadChange(symmetricSlot, Number(event.target.value))
                }}
                onPointerUp={(event) => {
                  handlePairSpreadChange(symmetricSlot, Number(event.currentTarget.value), {
                    commitHistory: true,
                  })
                }}
                onBlur={(event) => {
                  handlePairSpreadChange(symmetricSlot, Number(event.currentTarget.value), {
                    commitHistory: true,
                  })
                }}
              />
            </label>
          ) : null}

          {showAimRotationControls && hasSymmetricControls && symmetricSlot
            ? OFFSET_AXIS_OPTIONS.map((axisOption) => {
                const axisValue = shipConfig[symmetricSlot].aimRotation[axisOption.index]
                const axisRange = SYMMETRIC_AIM_ROTATION_RANGES[symmetricSlot][axisOption.axis]

                return (
                  <label
                    key={`${selectedSlot}-aim-rotation-${axisOption.axis}`}
                    className="ship-builder-controls__field"
                  >
                    <span className="ship-builder-controls__field-label">
                      Aim Rotation {axisOption.axis.toUpperCase()} {axisValue.toFixed(2)}
                    </span>
                    <input
                      className="ship-builder-controls__range"
                      type="range"
                      min={axisRange.min}
                      max={axisRange.max}
                      step={axisRange.step}
                      value={axisValue}
                      onChange={(event) => {
                        handleAimAxisChange(
                          symmetricSlot,
                          axisOption.index,
                          Number(event.target.value)
                        )
                      }}
                      onPointerUp={(event) => {
                        handleAimAxisChange(
                          symmetricSlot,
                          axisOption.index,
                          Number(event.currentTarget.value),
                          { commitHistory: true }
                        )
                      }}
                      onBlur={(event) => {
                        handleAimAxisChange(
                          symmetricSlot,
                          axisOption.index,
                          Number(event.currentTarget.value),
                          { commitHistory: true }
                        )
                      }}
                    />
                  </label>
                )
              })
            : null}
        </article>
      </div>
    </aside>
  )
}

export default ShipBuilderControlsMainAside
