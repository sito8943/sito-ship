import { useCallback, useState } from 'react'
import { useShipBuilder } from '@/hooks/useShipBuilder'
import { useShipBuilderKeyboardShortcuts } from '@/hooks/useShipBuilderKeyboardShortcuts'
import MobileTitle from '@/components/ShipBuilderControls/components/mobile/MobileTitle'
import MobileVariantPicker from '@/components/ShipBuilderControls/components/mobile/MobileVariantPicker'
import MobileAside from '@/components/ShipBuilderControls/components/mobile/MobileAside'
import MobileImportExport from '@/components/ShipBuilderControls/components/mobile/MobileImportExport'
import MobileFooter from '@/components/ShipBuilderControls/components/mobile/MobileFooter'

const ShipBuilderControlsMobile = () => {
  const [hideUI, setHideUI] = useState(false)
  const { experienceMode, toggleExperienceMode } = useShipBuilder()

  const handleToggleHideUI = useCallback(() => {
    setHideUI((previousValue) => !previousValue)
  }, [])

  useShipBuilderKeyboardShortcuts({
    onToggleHideUI: handleToggleHideUI,
  })

  const panelVisibilityClassName = hideUI ? 'ship-builder-controls-panel--hidden' : ''

  return (
    <>
      <MobileTitle />
      <MobileVariantPicker panelVisibilityClassName={panelVisibilityClassName} />
      <MobileAside isHidden={hideUI} panelVisibilityClassName={panelVisibilityClassName} />
      <MobileImportExport isHidden={hideUI} panelVisibilityClassName={panelVisibilityClassName} />
      <MobileFooter
        hideUI={hideUI}
        experienceMode={experienceMode}
        onToggleHideUI={handleToggleHideUI}
        onToggleExperienceMode={toggleExperienceMode}
      />
    </>
  )
}

export default ShipBuilderControlsMobile
