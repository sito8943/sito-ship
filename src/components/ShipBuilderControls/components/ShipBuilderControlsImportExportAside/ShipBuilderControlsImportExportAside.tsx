import { useState } from 'react'
import { faFileExport, faFileImport } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useShipBuilder } from '@/hooks/useShipBuilder'
import { Button } from '@/components/ui'
import { SLOT_LABELS } from '@/components/ShipBuilderControls/constants'
import type { ShipBuilderControlsImportExportAsideProps } from '@/components/ShipBuilderControls/components/ShipBuilderControlsImportExportAside/types'

const ShipBuilderControlsImportExportAside = ({
  isHidden,
  panelVisibilityClassName,
}: ShipBuilderControlsImportExportAsideProps) => {
  const {
    overlappingSlots,
    detachedSlots,
    message,
    exportShipConfigToJson,
    importShipConfigFromJson,
  } = useShipBuilder()
  const [jsonInput, setJsonInput] = useState('')
  const [importWarnings, setImportWarnings] = useState<string[]>([])

  const handleExportJson = () => {
    const exportedJson = exportShipConfigToJson()
    setJsonInput(exportedJson)
    setImportWarnings([])
  }

  const handleImportJson = () => {
    const importResult = importShipConfigFromJson(jsonInput)
    if (!importResult.ok) {
      setImportWarnings([])
      return
    }

    setImportWarnings(importResult.warnings)
  }

  return (
    <aside
      className={`ship-builder-controls-import-export ship-builder-controls-panel ${panelVisibilityClassName} ${
        isHidden ? 'ship-builder-controls-import-export--hidden' : ''
      }`}
      aria-label="Import Export Controls"
      aria-hidden={isHidden}
    >
      <section className="ship-builder-controls__io">
        <div className="ship-builder-controls__io-actions ship-builder-controls__io-actions--spaced">
          <Button
            className="ship-builder-controls__action-button"
            onClick={handleExportJson}
            leadingIcon={<FontAwesomeIcon icon={faFileExport} fixedWidth />}
          >
            Export JSON
          </Button>
          <Button
            className="ship-builder-controls__action-button"
            onClick={handleImportJson}
            leadingIcon={<FontAwesomeIcon icon={faFileImport} fixedWidth />}
          >
            Import JSON
          </Button>
        </div>

        <label className="ship-builder-controls__field">
          <span className="ship-builder-controls__field-label">Import / Export JSON</span>
          <textarea
            className="ship-builder-controls__textarea"
            value={jsonInput}
            placeholder='{"version":2,...}'
            onChange={(event) => {
              setJsonInput(event.target.value)
            }}
          />
        </label>

        {message ? (
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

export default ShipBuilderControlsImportExportAside
