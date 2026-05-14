import type { ShipSlot, WeaponsVariant } from '@/lib/models/ShipConfig'
import { SHIP_BUILDER_STORAGE_KEY } from '@/providers/ShipBuilderProvider/constants'

export const isEditableKeyboardTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  const tagName = target.tagName.toLowerCase()
  if (tagName === 'input' || tagName === 'textarea' || target.isContentEditable) {
    return true
  }

  return false
}

export const normalizeKeyboardKey = (key: string): string => {
  return key.toLowerCase()
}

export const isCommandShortcutPressed = (event: KeyboardEvent): boolean => {
  return event.metaKey || event.ctrlKey
}

export const supportsSymmetricTransformModes = (
  selectedSlot: ShipSlot,
  weaponsVariant: WeaponsVariant
): boolean => {
  return (
    selectedSlot === 'wings' ||
    selectedSlot === 'engines' ||
    (selectedSlot === 'weapons' && weaponsVariant !== 'none')
  )
}

export const persistShipConfigToStorage = (jsonPayload: string) => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(SHIP_BUILDER_STORAGE_KEY, jsonPayload)
}
