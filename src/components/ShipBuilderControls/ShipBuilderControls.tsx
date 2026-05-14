import { lazy, Suspense, useCallback, useState } from 'react'
import { useDialog } from '@/hooks/useDialog'
import { useShipBuilder } from '@/hooks/useShipBuilder'
import { useShipBuilderKeyboardShortcuts } from '@/hooks/useShipBuilderKeyboardShortcuts'
import { DIALOG_IDS } from '@/providers/DialogProvider'
import {
  ShipBuilderControlsFooter,
  ShipBuilderControlsMainAside,
} from '@/components/ShipBuilderControls/components'

const ShipBuilderControlsImportExportAside = lazy(
  () => import('@/components/ShipBuilderControls/components/ShipBuilderControlsImportExportAside')
)
const ShipBuilderShortcutsDialog = lazy(
  () => import('@/components/ShipBuilderControls/components/ShipBuilderShortcutsDialog')
)

const ShipBuilderControls = () => {
  const [hideUI, setHideUI] = useState(false)
  const { experienceMode, toggleExperienceMode } = useShipBuilder()
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
      <h2 className="ship-builder-mobile-title">Ship Builder</h2>
      <ShipBuilderControlsMainAside
        isHidden={hideUI}
        panelVisibilityClassName={controlsPanelVisibilityClass}
      />
      <Suspense fallback={null}>
        <ShipBuilderControlsImportExportAside
          isHidden={hideUI}
          panelVisibilityClassName={controlsPanelVisibilityClass}
        />
      </Suspense>
      <ShipBuilderControlsFooter
        hideUI={hideUI}
        experienceMode={experienceMode}
        onToggleHideUI={handleToggleHideUI}
        onToggleExperienceMode={toggleExperienceMode}
        onOpenKeyboardShortcuts={shortcutsDialog.open}
      />
      {shortcutsDialog.isOpen ? (
        <Suspense fallback={null}>
          <ShipBuilderShortcutsDialog isOpen onClose={shortcutsDialog.close} />
        </Suspense>
      ) : null}
    </>
  )
}

export default ShipBuilderControls
