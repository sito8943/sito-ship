import { useState } from 'react'
import { faArrowsRotate, faFileExport, faFileImport } from '@fortawesome/free-solid-svg-icons'
import { useShipBuilder } from '@/hooks/useShipBuilder'
import { IconButton } from '@/components/ui'
import { SLOT_LABELS } from '@/components/ShipBuilderControls/constants'
import { readShipConfigJsonFromFile, saveShipConfigJsonToFile } from '@/lib/utils/ShipConfigFileIO'
import type { MobileImportExportProps } from '@/components/ShipBuilderControls/components/mobile/types'

const MobileImportExport = ({ isHidden, panelVisibilityClassName }: MobileImportExportProps) => {
  const {
    overlappingSlots,
    detachedSlots,
    message,
    exportShipConfigToJson,
    importShipConfigFromJson,
    resetShipConfig,
  } = useShipBuilder()
  const [importWarnings, setImportWarnings] = useState<string[]>([])

  const handleExportJson = () => {
    const exportedJson = exportShipConfigToJson()
    setImportWarnings([])
    void saveShipConfigJsonToFile(exportedJson)
  }

  const handleImportJson = () => {
    void (async () => {
      const rawJson = await readShipConfigJsonFromFile()
      if (!rawJson) {
        return
      }

      const importResult = importShipConfigFromJson(rawJson)
      if (!importResult.ok) {
        setImportWarnings([])
        return
      }

      setImportWarnings(importResult.warnings)
    })()
  }

  const isErrorMessage = message?.kind === 'error' || message?.kind === 'warning'

  return (
    <aside
      className={`ship-builder-controls-import-export ship-builder-controls-panel ${panelVisibilityClassName} ${
        isHidden ? 'ship-builder-controls-import-export--hidden' : ''
      }`}
      aria-label="Import Export Controls"
      aria-hidden={isHidden}
    >
      <section className="ship-builder-controls__io">
        <div className="ship-builder-controls__io-actions">
          <IconButton
            className="ship-builder-controls__action-button"
            icon={faFileExport}
            label="Export JSON"
            title="Export JSON"
            onClick={handleExportJson}
          />
          <IconButton
            className="ship-builder-controls__action-button"
            icon={faFileImport}
            label="Import JSON"
            title="Import JSON"
            onClick={handleImportJson}
          />
          <IconButton
            className="ship-builder-controls__action-button"
            icon={faArrowsRotate}
            label="Reset Ship"
            title="Reset Ship"
            onClick={resetShipConfig}
          />
        </div>

        {message && isErrorMessage ? (
          <p
            className={`ship-builder-controls__io-message ship-builder-controls__io-message--${message.kind}`}
          >
            {message.text}
          </p>
        ) : null}

        {overlappingSlots.length > 0 ? (
          <p className="ship-builder-controls__io-message ship-builder-controls__io-message--warning">
            Overlap alert: {overlappingSlots.map((slot) => SLOT_LABELS[slot]).join(', ')}
          </p>
        ) : null}

        {detachedSlots.length > 0 ? (
          <p className="ship-builder-controls__io-message ship-builder-controls__io-message--warning">
            Body contact violation: {detachedSlots.map((slot) => SLOT_LABELS[slot]).join(', ')}
          </p>
        ) : null}

        {importWarnings.length > 0 ? (
          <ul className="ship-builder-controls__warning-list">
            {importWarnings.map((warningMessage) => {
              return <li key={warningMessage}>{warningMessage}</li>
            })}
          </ul>
        ) : null}
      </section>
    </aside>
  )
}

export default MobileImportExport
