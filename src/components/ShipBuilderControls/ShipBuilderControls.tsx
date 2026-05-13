import { useCallback, useState } from 'react'
import { useDialog } from '@/hooks/useDialog'
import { useShipBuilderKeyboardShortcuts } from '@/hooks/useShipBuilderKeyboardShortcuts'
import { DIALOG_IDS } from '@/providers/DialogProvider'
import {
  ShipBuilderControlsFooter,
  ShipBuilderControlsImportExportAside,
  ShipBuilderControlsMainAside,
  ShipBuilderShortcutsDialog,
} from '@/components/ShipBuilderControls/components'

const ShipBuilderControls = () => {
  const [hideUI, setHideUI] = useState(false)
  const shortcutsDialog = useDialog(DIALOG_IDS.KEYBOARD_SHORTCUTS)
  const handleToggleHideUI = useCallback(() => {
    setHideUI((previousValue) => !previousValue)
  }, [])

  useShipBuilderKeyboardShortcuts({
    onToggleHideUI: handleToggleHideUI,
  })

  const controlsPanelVisibilityClass = hideUI ? 'ship-builder-controls-panel--hidden' : ''

  return (
    <>
      <ShipBuilderControlsMainAside
        isHidden={hideUI}
        panelVisibilityClassName={controlsPanelVisibilityClass}
      />
      <ShipBuilderControlsImportExportAside
        isHidden={hideUI}
        panelVisibilityClassName={controlsPanelVisibilityClass}
      />
      <ShipBuilderControlsFooter
        hideUI={hideUI}
        onToggleHideUI={handleToggleHideUI}
        onOpenKeyboardShortcuts={shortcutsDialog.open}
      />
      <ShipBuilderShortcutsDialog isOpen={shortcutsDialog.isOpen} onClose={shortcutsDialog.close} />
    </>
  )
}

export default ShipBuilderControls
