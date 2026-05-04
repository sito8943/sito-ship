import { useMemo } from "react";
import type {
  ShipSlot,
  ShipSlotConfigMap,
  ShipSlotPatch,
} from "../../lib/models/ShipConfig";
import { useShipBuilder } from "../../hooks/useShipBuilder";
import {
  OFFSET_AXIS_OPTIONS,
  SCALE_RANGE,
  SLOT_LABELS,
  SLOT_ORDER,
  SLOT_VARIANT_OPTIONS,
} from "./constants";
import {
  createVector3Tuple,
  formatVariantLabel,
  getSlotConfig,
  getUniformScale,
  updateTupleAxis,
} from "./utils";

const ShipBuilderControls = () => {
  const { shipConfig, updateSlot, resetShipConfig } = useShipBuilder();

  const slotEntries = useMemo(() => {
    return SLOT_ORDER.map((slot) => {
      return {
        slot,
        slotConfig: getSlotConfig(shipConfig, slot),
      };
    });
  }, [shipConfig]);

  const handleVariantChange = <TSlot extends ShipSlot>(
    slot: TSlot,
    variant: ShipSlotConfigMap[TSlot]["variant"],
  ) => {
    updateSlot(slot, {
      variant,
    } as ShipSlotPatch<TSlot>);
  };

  const handleColorChange = <TSlot extends ShipSlot>(slot: TSlot, color: string) => {
    updateSlot(slot, {
      color,
    } as ShipSlotPatch<TSlot>);
  };

  const handleScaleChange = <TSlot extends ShipSlot>(slot: TSlot, scale: number) => {
    updateSlot(slot, {
      scale: createVector3Tuple(scale, scale, scale),
    } as ShipSlotPatch<TSlot>);
  };

  const handleOffsetAxisChange = <TSlot extends ShipSlot>(
    slot: TSlot,
    axisIndex: 0 | 1 | 2,
    value: number,
  ) => {
    const slotConfig = getSlotConfig(shipConfig, slot);
    updateSlot(slot, {
      offset: updateTupleAxis(slotConfig.offset, axisIndex, value),
    } as ShipSlotPatch<TSlot>);
  };

  return (
    <aside className="ship-builder-controls" aria-label="Ship Builder Controls">
      <header className="ship-builder-controls__header">
        <h2 className="ship-builder-controls__title">Ship Builder</h2>
        <button
          type="button"
          className="ship-builder-controls__reset"
          onClick={resetShipConfig}
        >
          Reset
        </button>
      </header>

      <div className="ship-builder-controls__list">
        {slotEntries.map(({ slot, slotConfig }) => {
          const uniformScale = getUniformScale(slotConfig.scale);

          return (
            <article key={slot} className="ship-builder-controls__card">
              <h3 className="ship-builder-controls__card-title">{SLOT_LABELS[slot]}</h3>

              <label className="ship-builder-controls__field">
                <span className="ship-builder-controls__field-label">Variant</span>
                <select
                  className="ship-builder-controls__select"
                  value={slotConfig.variant}
                  onChange={(event) => {
                    const nextVariant = event.target
                      .value as ShipSlotConfigMap[typeof slot]["variant"];
                    handleVariantChange(slot, nextVariant);
                  }}
                >
                  {SLOT_VARIANT_OPTIONS[slot].map((variant) => {
                    return (
                      <option key={variant} value={variant}>
                        {formatVariantLabel(variant)}
                      </option>
                    );
                  })}
                </select>
              </label>

              <label className="ship-builder-controls__field ship-builder-controls__field--color">
                <span className="ship-builder-controls__field-label">Color</span>
                <input
                  className="ship-builder-controls__color"
                  type="color"
                  value={slotConfig.color}
                  onChange={(event) => {
                    handleColorChange(slot, event.target.value);
                  }}
                />
              </label>

              <label className="ship-builder-controls__field">
                <span className="ship-builder-controls__field-label">
                  Scale {uniformScale.toFixed(2)}
                </span>
                <input
                  className="ship-builder-controls__range"
                  type="range"
                  min={SCALE_RANGE.min}
                  max={SCALE_RANGE.max}
                  step={SCALE_RANGE.step}
                  value={uniformScale}
                  onChange={(event) => {
                    handleScaleChange(slot, Number(event.target.value));
                  }}
                />
              </label>

              {OFFSET_AXIS_OPTIONS.map((axisOption) => {
                const axisValue = slotConfig.offset[axisOption.index];

                return (
                  <label
                    key={`${slot}-offset-${axisOption.axis}`}
                    className="ship-builder-controls__field"
                  >
                    <span className="ship-builder-controls__field-label">
                      Offset {axisOption.axis.toUpperCase()} {axisValue.toFixed(2)}
                    </span>
                    <input
                      className="ship-builder-controls__range"
                      type="range"
                      min={axisOption.min}
                      max={axisOption.max}
                      step={axisOption.step}
                      value={axisValue}
                      onChange={(event) => {
                        handleOffsetAxisChange(
                          slot,
                          axisOption.index,
                          Number(event.target.value),
                        );
                      }}
                    />
                  </label>
                );
              })}
            </article>
          );
        })}
      </div>
    </aside>
  );
};

export default ShipBuilderControls;
