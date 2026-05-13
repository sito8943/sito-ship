import type {
  ShortcutSlotMap,
  ShortcutTransformModeMap,
} from '@/hooks/useShipBuilderKeyboardShortcuts/types'

export const SHORTCUT_KEYS = {
  F1: 'f1',
  TAB: 'tab',
  HOME: 'home',
  BACKSPACE: 'backspace',
  DELETE: 'delete',
  F: 'f',
  C: 'c',
  V: 'v',
  T: 't',
} as const

export const SHORTCUT_EXPORT_PROMPT_MESSAGE = 'Ship JSON (copy manually):'
export const SHORTCUT_IMPORT_PROMPT_MESSAGE = 'Paste ship JSON to import:'

export const SHORTCUT_SLOT_BY_KEY: ShortcutSlotMap = {
  '1': 'body',
  '2': 'cockpit',
  '3': 'wings',
  '4': 'engines',
  '5': 'weapons',
}

export const SHORTCUT_TRANSFORM_MODE_BY_KEY: ShortcutTransformModeMap = {
  g: 'translate',
  r: 'rotate',
  s: 'scale',
  p: 'pairSpread',
  a: 'aimRotate',
}
