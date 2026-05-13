import { faKeyboard, faRocket, faSliders } from '@fortawesome/free-solid-svg-icons'
import { IconButton } from '@/components/ui'
import type { ShipBuilderControlsFooterProps } from '@/components/ShipBuilderControls/components/ShipBuilderControlsFooter/types'

const ShipBuilderControlsFooter = ({
  hideUI,
  experienceMode,
  onToggleHideUI,
  onToggleExperienceMode,
  onOpenKeyboardShortcuts,
}: ShipBuilderControlsFooterProps) => {
  const isFlightMode = experienceMode === 'flight'

  return (
    <footer className="ship-builder-controls-footer">
      <IconButton
        className="ship-builder-controls__action-button ship-builder-controls-footer__toggle"
        icon={faKeyboard}
        label="Keyboard Shortcuts"
        title="Open keyboard shortcuts"
        onClick={onOpenKeyboardShortcuts}
      />
      <IconButton
        className={`ship-builder-controls__action-button ship-builder-controls-footer__toggle ${
          isFlightMode ? 'ship-builder-controls-footer__toggle--flight-active' : ''
        }`}
        icon={faRocket}
        label={isFlightMode ? 'Back to Builder' : 'Flight Test'}
        title={isFlightMode ? 'Return to builder mode (T)' : 'Enable flight test mode (T)'}
        onClick={onToggleExperienceMode}
        variant={isFlightMode ? 'ghost' : 'solid'}
      />
      <IconButton
        className={`ship-builder-controls__action-button ship-builder-controls-footer__toggle ${
          hideUI ? 'ship-builder-controls-footer__toggle--collapsed' : ''
        }`}
        icon={faSliders}
        label={hideUI ? 'Show UI' : 'Hide UI'}
        title={hideUI ? 'Show controls panels' : 'Hide controls panels'}
        onClick={onToggleHideUI}
        variant={hideUI ? 'ghost' : 'solid'}
      />
    </footer>
  )
}

export default ShipBuilderControlsFooter
