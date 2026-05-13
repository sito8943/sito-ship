import { useState } from 'react'
import {
  ShipBuilderControlsFooter,
  ShipBuilderControlsImportExportAside,
  ShipBuilderControlsMainAside,
} from '@/components/ShipBuilderControls/components'

const ShipBuilderControls = () => {
  const [hideUI, setHideUI] = useState(false)
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
        onToggleHideUI={() => {
          setHideUI((previousValue) => !previousValue)
        }}
      />
    </>
  )
}

export default ShipBuilderControls
