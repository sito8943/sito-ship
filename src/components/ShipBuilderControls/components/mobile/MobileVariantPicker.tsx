import { faRotateLeft } from '@fortawesome/free-solid-svg-icons'
import { useShipBuilder } from '@/hooks/useShipBuilder'
import type { ShipSlot, ShipSlotConfigMap, ShipSlotPatch } from '@/lib/models/ShipConfig'
import { IconButton } from '@/components/ui'
import { SLOT_LABELS, SLOT_VARIANT_OPTIONS } from '@/components/ShipBuilderControls/constants'
import { formatVariantLabel } from '@/components/ShipBuilderControls/utils'

export type MobileVariantPickerProps = {
  panelVisibilityClassName: string
}

const MobileVariantPicker = ({ panelVisibilityClassName }: MobileVariantPickerProps) => {
  const { selectedSlot, shipConfig, updateSlot, resetSlot } = useShipBuilder()
  const activeSlotConfig = shipConfig[selectedSlot]

  const handleVariantChange = <TSlot extends ShipSlot>(
    slot: TSlot,
    variant: ShipSlotConfigMap[TSlot]['variant']
  ) => {
    updateSlot(slot, { variant } as ShipSlotPatch<TSlot>)
  }

  const handleColorChange = <TSlot extends ShipSlot>(slot: TSlot, color: string) => {
    updateSlot(slot, { color } as ShipSlotPatch<TSlot>)
  }

  return (
    <div
      className={`ship-builder-controls-panel ${panelVisibilityClassName} ship-builder-controls__mobile-variant-picker`}
    >
      <label className="ship-builder-controls__field">
        <span className="ship-builder-controls__field-label">
          Piece: {SLOT_LABELS[selectedSlot]}
        </span>
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

      <div className="ship-builder-controls__mobile-variant-picker-actions">
        <input
          className="ship-builder-controls__color"
          type="color"
          aria-label={`Color for ${SLOT_LABELS[selectedSlot]}`}
          value={activeSlotConfig.color}
          onChange={(event) => {
            handleColorChange(selectedSlot, event.target.value)
          }}
        />
        <IconButton
          className="ship-builder-controls__action-button"
          icon={faRotateLeft}
          label="Reset Slot"
          title="Reset Slot"
          onClick={() => {
            resetSlot(selectedSlot)
          }}
        />
      </div>
    </div>
  )
}

export default MobileVariantPicker
