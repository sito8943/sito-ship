import { Dialog } from '@/components/ui'
import {
  SHIP_BUILDER_SHORTCUTS_DIALOG_TITLE,
  SHIP_BUILDER_SHORTCUTS_SECTIONS,
} from '@/components/ShipBuilderControls/components/ShipBuilderShortcutsDialog/constants'
import type { ShipBuilderShortcutsDialogProps } from '@/components/ShipBuilderControls/components/ShipBuilderShortcutsDialog/types'
import { splitShortcutKeys } from '@/components/ShipBuilderControls/components/ShipBuilderShortcutsDialog/utils'

const ShipBuilderShortcutsDialog = ({ isOpen, onClose }: ShipBuilderShortcutsDialogProps) => {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={SHIP_BUILDER_SHORTCUTS_DIALOG_TITLE}>
      <div className="ship-builder-shortcuts-dialog">
        {SHIP_BUILDER_SHORTCUTS_SECTIONS.map((section) => (
          <section key={section.title} className="ship-builder-shortcuts-dialog__section">
            <h3 className="ship-builder-shortcuts-dialog__section-title">{section.title}</h3>
            <ul className="ship-builder-shortcuts-dialog__list">
              {section.shortcuts.map((shortcut) => (
                <li
                  key={`${section.title}-${shortcut.key}`}
                  className="ship-builder-shortcuts-dialog__item"
                >
                  <span>{shortcut.description}</span>
                  <span className="ship-builder-shortcuts-dialog__keys">
                    {splitShortcutKeys(shortcut.key).map((keyPart) => (
                      <kbd key={`${section.title}-${shortcut.key}-${keyPart}`}>{keyPart}</kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Dialog>
  )
}

export default ShipBuilderShortcutsDialog
