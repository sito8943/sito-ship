import type { ShortcutSection } from '@/components/ShipBuilderControls/components/ShipBuilderShortcutsDialog/types'

export const SHIP_BUILDER_SHORTCUTS_DIALOG_TITLE = 'Keyboard Shortcuts'

export const SHIP_BUILDER_SHORTCUTS_SECTIONS: ShortcutSection[] = [
  {
    title: 'General',
    shortcuts: [
      { key: 'F1', description: 'Open keyboard shortcuts/help' },
      { key: 'Ctrl+E', description: 'Export ship as JSON' },
      { key: 'Ctrl+I', description: 'Import ship JSON' },
      { key: 'Ctrl+S', description: 'Save current ship' },
      { key: 'Ctrl+Z', description: 'Undo last action' },
      { key: 'Ctrl+Shift+Z', description: 'Redo last action' },
      { key: 'T', description: 'Toggle flight test mode' },
      { key: 'Tab', description: 'Hide/show controls panel' },
      { key: 'Shift+Tab', description: 'Toggle panoramic view' },
    ],
  },
  {
    title: 'Categories',
    shortcuts: [
      { key: '1', description: 'Select body parts category' },
      { key: '2', description: 'Select cockpit category' },
      { key: '3', description: 'Select wings category' },
      { key: '4', description: 'Select engines category' },
      { key: '5', description: 'Select weapons category' },
    ],
  },
  {
    title: 'Transform Tools',
    shortcuts: [
      { key: 'G', description: 'Move selected part' },
      { key: 'R', description: 'Rotate selected part' },
      { key: 'S', description: 'Scale selected part' },
    ],
  },
  {
    title: 'Advanced Editing',
    shortcuts: [
      { key: 'P', description: 'Toggle pair spread editing' },
      { key: 'A', description: 'Rotate part toward target direction' },
      { key: 'Delete', description: 'Delete selected part' },
    ],
  },
  {
    title: 'Flight View',
    shortcuts: [
      { key: 'A / D', description: 'Bank turn (strafe + roll + slight yaw + pitch)' },
      { key: 'T / Esc', description: 'Return to builder view' },
    ],
  },
  {
    title: 'Reset',
    shortcuts: [
      { key: 'Backspace', description: 'Reset selected slot' },
      { key: 'Ctrl+Backspace', description: 'Reset entire ship' },
    ],
  },
  {
    title: 'Camera',
    shortcuts: [
      { key: 'F', description: 'Focus selected part' },
      { key: 'C', description: 'Toggle free camera' },
      { key: 'Home', description: 'Zoom to fit entire ship' },
      { key: 'V', description: 'Toggle cinematic view' },
    ],
  },
]
