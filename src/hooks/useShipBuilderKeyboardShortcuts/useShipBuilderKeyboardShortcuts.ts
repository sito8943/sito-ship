import { useEffect } from 'react'
import { useDialog } from '@/hooks/useDialog'
import { useShipBuilder } from '@/hooks/useShipBuilder'
import {
  SHORTCUT_EXPORT_PROMPT_MESSAGE,
  SHORTCUT_IMPORT_PROMPT_MESSAGE,
  SHORTCUT_KEYS,
  SHORTCUT_SLOT_BY_KEY,
  SHORTCUT_TRANSFORM_MODE_BY_KEY,
} from '@/hooks/useShipBuilderKeyboardShortcuts/constants'
import type { UseShipBuilderKeyboardShortcutsOptions } from '@/hooks/useShipBuilderKeyboardShortcuts/types'
import {
  isCommandShortcutPressed,
  isEditableKeyboardTarget,
  normalizeKeyboardKey,
  persistShipConfigToStorage,
  supportsSymmetricTransformModes,
} from '@/hooks/useShipBuilderKeyboardShortcuts/utils'
import { DIALOG_IDS } from '@/providers/DialogProvider'

export const useShipBuilderKeyboardShortcuts = ({
  onToggleHideUI,
}: UseShipBuilderKeyboardShortcutsOptions) => {
  const {
    sceneManager,
    shipConfig,
    selectedSlot,
    experienceMode,
    setSelectedSlot,
    toggleExperienceMode,
    setTransformMode,
    undo,
    redo,
    resetSlot,
    resetShipConfig,
    exportShipConfigToJson,
    importShipConfigFromJson,
  } = useShipBuilder()
  const shortcutsDialog = useDialog(DIALOG_IDS.KEYBOARD_SHORTCUTS)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableKeyboardTarget(event.target) || event.repeat) {
        return
      }

      const normalizedKey = normalizeKeyboardKey(event.key)
      const isCommandPressed = isCommandShortcutPressed(event)

      if (normalizedKey === SHORTCUT_KEYS.F1) {
        event.preventDefault()
        shortcutsDialog.toggle()
        return
      }

      if (shortcutsDialog.isOpen) {
        return
      }

      if (normalizedKey === SHORTCUT_KEYS.T) {
        event.preventDefault()
        toggleExperienceMode()
        return
      }

      if (isCommandPressed) {
        if (normalizedKey === 'z') {
          event.preventDefault()
          if (event.shiftKey) {
            redo()
            return
          }

          undo()
          return
        }

        if (normalizedKey === 'e') {
          event.preventDefault()
          const exportedJson = exportShipConfigToJson()
          window.prompt(SHORTCUT_EXPORT_PROMPT_MESSAGE, exportedJson)
          return
        }

        if (normalizedKey === 'i') {
          event.preventDefault()
          const rawInput = window.prompt(SHORTCUT_IMPORT_PROMPT_MESSAGE)
          if (!rawInput) {
            return
          }

          importShipConfigFromJson(rawInput)
          return
        }

        if (normalizedKey === 's') {
          event.preventDefault()
          persistShipConfigToStorage(exportShipConfigToJson())
          return
        }

        if (normalizedKey === SHORTCUT_KEYS.BACKSPACE) {
          event.preventDefault()
          resetShipConfig()
          return
        }

        return
      }

      if (normalizedKey === SHORTCUT_KEYS.TAB) {
        event.preventDefault()
        if (event.shiftKey) {
          sceneManager?.togglePanoramicView()
          return
        }

        onToggleHideUI()
        return
      }

      if (experienceMode === 'flight') {
        return
      }

      const nextSelectedSlot = SHORTCUT_SLOT_BY_KEY[normalizedKey]
      if (nextSelectedSlot) {
        event.preventDefault()
        setSelectedSlot(nextSelectedSlot)
        return
      }

      const nextTransformMode = SHORTCUT_TRANSFORM_MODE_BY_KEY[normalizedKey]
      if (nextTransformMode) {
        if (
          (nextTransformMode === 'pairSpread' || nextTransformMode === 'aimRotate') &&
          !supportsSymmetricTransformModes(selectedSlot, shipConfig.weapons.variant)
        ) {
          return
        }

        event.preventDefault()
        setTransformMode(nextTransformMode)
        return
      }

      if (normalizedKey === SHORTCUT_KEYS.BACKSPACE || normalizedKey === SHORTCUT_KEYS.DELETE) {
        event.preventDefault()
        resetSlot(selectedSlot)
        return
      }

      if (normalizedKey === SHORTCUT_KEYS.F) {
        event.preventDefault()
        sceneManager?.focusSelectedSlot()
        return
      }

      if (normalizedKey === SHORTCUT_KEYS.C) {
        event.preventDefault()
        sceneManager?.toggleFreeCamera()
        return
      }

      if (normalizedKey === SHORTCUT_KEYS.HOME) {
        event.preventDefault()
        sceneManager?.zoomToShip()
        return
      }

      if (normalizedKey === SHORTCUT_KEYS.V) {
        event.preventDefault()
        sceneManager?.toggleCinematicView()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [
    exportShipConfigToJson,
    experienceMode,
    importShipConfigFromJson,
    onToggleHideUI,
    redo,
    resetShipConfig,
    resetSlot,
    sceneManager,
    selectedSlot,
    setSelectedSlot,
    setTransformMode,
    shipConfig.weapons.variant,
    shortcutsDialog,
    toggleExperienceMode,
    undo,
  ])
}
