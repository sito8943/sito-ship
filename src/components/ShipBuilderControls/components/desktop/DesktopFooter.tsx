import { faKeyboard, faRocket, faSliders } from '@fortawesome/free-solid-svg-icons'
import { IconButton } from '@/components/ui'
import type { ExperienceMode } from '@/lib/managers/ShipBuilderSceneManager/types'

export type DesktopFooterProps = {
  hideUI: boolean
  experienceMode: ExperienceMode
  onToggleHideUI: () => void
  onToggleExperienceMode: () => void
  onOpenKeyboardShortcuts: () => void
}

const DesktopFooter = ({
  hideUI,
  experienceMode,
  onToggleHideUI,
  onToggleExperienceMode,
  onOpenKeyboardShortcuts,
}: DesktopFooterProps) => {
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
        label={isFlightMode ? 'Back to Builder' : 'Open Flight View'}
        title={isFlightMode ? 'Return to builder mode (T)' : 'Open flight view (T)'}
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

export default DesktopFooter
