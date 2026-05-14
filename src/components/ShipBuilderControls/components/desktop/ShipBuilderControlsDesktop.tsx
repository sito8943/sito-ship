import { lazy, Suspense, useCallback, useState } from 'react'
import { useDialog } from '@/hooks/useDialog'
import { useShipBuilder } from '@/hooks/useShipBuilder'
import { useShipBuilderKeyboardShortcuts } from '@/hooks/useShipBuilderKeyboardShortcuts'
import { DIALOG_IDS } from '@/providers/DialogProvider'
import DesktopAside from '@/components/ShipBuilderControls/components/desktop/DesktopAside'
import DesktopImportExport from '@/components/ShipBuilderControls/components/desktop/DesktopImportExport'
import DesktopFooter from '@/components/ShipBuilderControls/components/desktop/DesktopFooter'

const ShipBuilderShortcutsDialog = lazy(
  () => import('@/components/ShipBuilderControls/components/ShipBuilderShortcutsDialog')
)

const ShipBuilderControlsDesktop = () => {
  const [hideUI, setHideUI] = useState(false)
  const { experienceMode, toggleExperienceMode } = useShipBuilder()
  const shortcutsDialog = useDialog(DIALOG_IDS.KEYBOARD_SHORTCUTS)

  const handleToggleHideUI = useCallback(() => {
    setHideUI((previousValue) => !previousValue)
  }, [])

  useShipBuilderKeyboardShortcuts({
    onToggleHideUI: handleToggleHideUI,
  })

  const panelVisibilityClassName = hideUI ? 'ship-builder-controls-panel--hidden' : ''

  return (
    <>
      <DesktopAside isHidden={hideUI} panelVisibilityClassName={panelVisibilityClassName} />
      <DesktopImportExport isHidden={hideUI} panelVisibilityClassName={panelVisibilityClassName} />
      <DesktopFooter
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

export default ShipBuilderControlsDesktop
