import {
  faArrowRotateLeft,
  faArrowRotateRight,
  faArrowsToCircle,
  faArrowsSpin,
  faArrowsUpDownLeftRight,
  faMaximize,
  faUpRightAndDownLeftFromCenter,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useShipBuilder } from '@/hooks/useShipBuilder'
import { IconButton } from '@/components/ui'
import { TRANSFORM_MODE_OPTIONS } from '@/components/ShipBuilderControls/constants'
import type { SymmetricSlot } from '@/components/ShipBuilderControls/types'

export type MobileAsideProps = {
  isHidden: boolean
  panelVisibilityClassName: string
}

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

  const symmetricSlot: SymmetricSlot | null =
    selectedSlot === 'wings' || selectedSlot === 'engines' || selectedSlot === 'weapons'
      ? selectedSlot
      : null
  const hasSymmetricControls =
    symmetricSlot !== null && (symmetricSlot !== 'weapons' || shipConfig.weapons.variant !== 'none')

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
          const modeIcon =
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
