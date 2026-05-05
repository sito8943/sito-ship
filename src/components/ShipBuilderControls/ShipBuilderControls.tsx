import { useMemo, useState } from "react";
import type {
  ShipSlot,
  ShipSlotConfigMap,
  ShipSlotPatch,
} from "@/lib/models/ShipConfig";
import { useShipBuilder } from "@/hooks/useShipBuilder";
import {
  OFFSET_AXIS_OPTIONS,
  SLOT_OFFSET_RANGES,
  SLOT_LABELS,
  SLOT_ORDER,
  SLOT_SCALE_RANGES,
  SLOT_VARIANT_OPTIONS,
} from "@/components/ShipBuilderControls/constants";
import {
  createVector3Tuple,
  formatVariantLabel,
  getSlotConfig,
  getUniformScale,
  updateTupleAxis,
} from "@/components/ShipBuilderControls/utils";

const ShipBuilderControls = () => {
  const {
    shipConfig,
    updateSlot,
    resetShipConfig,
    exportShipConfigToJson,
    importShipConfigFromJson,
  } = useShipBuilder();
  const [jsonInput, setJsonInput] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [ioStatusMessage, setIoStatusMessage] = useState<string | null>(null);

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

  const handleExportJson = () => {
    const exportedJson = exportShipConfigToJson();
    setJsonInput(exportedJson);
    setImportError(null);
    setImportWarnings([]);
    setIoStatusMessage("Current configuration exported to JSON.");
  };

  const handleImportJson = () => {
    const importResult = importShipConfigFromJson(jsonInput);
    if (!importResult.ok) {
      setImportError(importResult.error);
      setImportWarnings([]);
      setIoStatusMessage(null);
      return;
    }

    setImportError(null);
    setImportWarnings(importResult.warnings);
    setIoStatusMessage("Configuration imported.");
  };

  return (
    <aside className="ship-builder-controls" aria-label="Ship Builder Controls">
      <header className="ship-builder-controls__header">
        <h2 className="ship-builder-controls__title">Ship Builder</h2>
        <div className="ship-builder-controls__header-actions">
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
            onClick={resetShipConfig}
          >
            Reset
          </button>
        </div>
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
                  min={SLOT_SCALE_RANGES[slot].min}
                  max={SLOT_SCALE_RANGES[slot].max}
                  step={SLOT_SCALE_RANGES[slot].step}
                  value={uniformScale}
                  onChange={(event) => {
                    handleScaleChange(slot, Number(event.target.value));
                  }}
                />
              </label>

              {OFFSET_AXIS_OPTIONS.map((axisOption) => {
                const axisValue = slotConfig.offset[axisOption.index];
                const axisRange = SLOT_OFFSET_RANGES[slot][axisOption.axis];

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
                      min={axisRange.min}
                      max={axisRange.max}
                      step={axisRange.step}
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

      <section className="ship-builder-controls__io">
        <label className="ship-builder-controls__field">
          <span className="ship-builder-controls__field-label">Import / Export JSON</span>
          <textarea
            className="ship-builder-controls__textarea"
            value={jsonInput}
            placeholder='{"version":1,...}'
            onChange={(event) => {
              setJsonInput(event.target.value);
            }}
          />
        </label>

        <div className="ship-builder-controls__io-actions">
          <button
            type="button"
            className="ship-builder-controls__action-button"
            onClick={handleImportJson}
          >
            Import JSON
          </button>
        </div>

        {ioStatusMessage ? (
          <p className="ship-builder-controls__io-message ship-builder-controls__io-message--success">
            {ioStatusMessage}
          </p>
        ) : null}

        {importError ? (
          <p className="ship-builder-controls__io-message ship-builder-controls__io-message--error">
            {importError}
          </p>
        ) : null}

        {importWarnings.length > 0 ? (
          <ul className="ship-builder-controls__warning-list">
            {importWarnings.map((warningMessage) => {
              return <li key={warningMessage}>{warningMessage}</li>;
            })}
          </ul>
        ) : null}
      </section>
    </aside>
  );
};

export default ShipBuilderControls;
