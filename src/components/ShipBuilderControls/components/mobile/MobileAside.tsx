import { faArrowRotateLeft, faArrowRotateRight } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useShipBuilder } from '@/hooks/useShipBuilder'
import { IconButton } from '@/components/ui'
import {
  TRANSFORM_MODE_ICONS,
  TRANSFORM_MODE_OPTIONS,
} from '@/components/ShipBuilderControls/constants'
import { getSymmetricSlot, hasSymmetricSlotControls } from '@/components/ShipBuilderControls/utils'
import type { SymmetricSlot } from '@/components/ShipBuilderControls/types'
import type { MobileAsideProps } from '@/components/ShipBuilderControls/components/mobile/types'

const MobileAside = ({ isHidden, panelVisibilityClassName }: MobileAsideProps) => {
  const {
    shipConfig,
    selectedSlot,
    transformMode,
    canUndo,
    canRedo,
    setTransformMode,
    undo,
    redo,
  } = useShipBuilder()

  const symmetricSlot: SymmetricSlot | null = getSymmetricSlot(selectedSlot)
  const hasSymmetricControls = hasSymmetricSlotControls(shipConfig, symmetricSlot)

  return (
    <aside
      className={`ship-builder-controls ship-builder-controls-panel ${panelVisibilityClassName} ${
        isHidden ? 'ship-builder-controls--hidden' : ''
      }`}
      aria-label="Ship Builder Controls"
      aria-hidden={isHidden}
    >
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
      </div>

      <div className="ship-builder-controls__mode-toggle">
        {TRANSFORM_MODE_OPTIONS.map((modeOption) => {
          const isDisabled = modeOption.symmetricOnly === true && !hasSymmetricControls
          const modeIcon = TRANSFORM_MODE_ICONS[modeOption.value] ?? null

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
              aria-label={modeOption.label}
              title={modeOption.label}
              onClick={() => {
                setTransformMode(modeOption.value)
              }}
            >
              {modeIcon ? <FontAwesomeIcon icon={modeIcon} fixedWidth /> : modeOption.label}
            </button>
          )
        })}
      </div>
    </aside>
  )
}

export default MobileAside
