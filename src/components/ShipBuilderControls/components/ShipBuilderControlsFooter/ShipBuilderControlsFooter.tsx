import { faKeyboard, faSliders } from '@fortawesome/free-solid-svg-icons'
import { IconButton } from '@/components/ui'
import type { ShipBuilderControlsFooterProps } from '@/components/ShipBuilderControls/components/ShipBuilderControlsFooter/types'

const ShipBuilderControlsFooter = ({
  hideUI,
  onToggleHideUI,
  onOpenKeyboardShortcuts,
}: ShipBuilderControlsFooterProps) => {
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
