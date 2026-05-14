import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ShipConfigManager,
  type ShipConfigNormalizationResult,
} from '@/lib/managers/ShipConfigManager'
import {
  ShipConfigIOManager,
  type ImportShipConfigResult,
} from '@/lib/managers/ShipConfigIOManager'
import type { ShipBuilderSceneManager } from '@/lib/managers/ShipBuilderSceneManager'
import type { ExperienceMode } from '@/lib/managers/ShipBuilderSceneManager/types'
import type { ShipConfig, ShipSlot } from '@/lib/models/ShipConfig'
import { ShipBuilderContext } from '@/providers/ShipBuilderProvider/context'
import {
  DEFAULT_EXPERIENCE_MODE,
  DEFAULT_SELECTED_SLOT,
  DEFAULT_TRANSFORM_MODE,
  SHIP_BUILDER_HISTORY_LIMIT,
  SHIP_BUILDER_STORAGE_KEY,
} from '@/providers/ShipBuilderProvider/constants'
import type {
  ShipBuilderContextValue,
  ShipBuilderMessage,
  ShipBuilderProviderProps,
  UpdateSlot,
} from '@/providers/ShipBuilderProvider/types'
import { pushHistorySnapshot } from '@/providers/ShipBuilderProvider/utils'

type ShipBuilderState = {
  shipConfig: ShipConfig
  historyEntries: ShipConfig[]
  historyIndex: number
}

const ShipBuilderProvider = ({ children }: ShipBuilderProviderProps) => {
  const [sceneManager, setSceneManager] = useState<ShipBuilderSceneManager | null>(null)
  const sceneManagerRef = useRef<ShipBuilderSceneManager | null>(null)
  const shipConfigManager = useMemo(() => new ShipConfigManager(), [])
  const shipConfigIOManager = useMemo(() => new ShipConfigIOManager(), [])

  const [builderState, setBuilderState] = useState<ShipBuilderState>(() => {
    const initialConfig = shipConfigManager.createDefaultConfig()
    return {
      shipConfig: initialConfig,
      historyEntries: [initialConfig],
      historyIndex: 0,
    }
  })
  const builderStateRef = useRef(builderState)
  const [selectedSlot, setSelectedSlot] = useState<ShipSlot>(DEFAULT_SELECTED_SLOT)
  const [experienceMode, setExperienceModeState] = useState(DEFAULT_EXPERIENCE_MODE)
  const [transformMode, setTransformMode] = useState(DEFAULT_TRANSFORM_MODE)
  const [overlappingSlots, setOverlappingSlots] = useState<ShipSlot[]>([])
  const [detachedSlots, setDetachedSlots] = useState<ShipSlot[]>([])
  const [message, setMessage] = useState<ShipBuilderMessage | null>(null)
  const [hasHydratedStorage, setHasHydratedStorage] = useState(false)
  const hasRestoredStorageRef = useRef(false)
  const hasInitializedExperienceModeRef = useRef(false)

  const setBuilderStateAndRef = useCallback((nextState: ShipBuilderState) => {
    builderStateRef.current = nextState
    setBuilderState(nextState)
  }, [])

  const applyNormalizationWarnings = useCallback(
    (warnings: string[]) => {
      if (warnings.length === 0) {
        return
      }

      setMessage({
        kind: 'warning',
        text: warnings[0],
      })
    },
    [setMessage]
  )

  const applyNextConfig = useCallback(
    ({
      result,
      commitHistory,
      successMessage,
    }: {
      result: ShipConfigNormalizationResult
      commitHistory: boolean
      successMessage?: string
    }) => {
      const currentState = builderStateRef.current
      let nextState: ShipBuilderState = {
        shipConfig: result.config,
        historyEntries: currentState.historyEntries,
        historyIndex: currentState.historyIndex,
      }

      if (commitHistory) {
        const historyResult = pushHistorySnapshot({
          entries: currentState.historyEntries,
          currentIndex: currentState.historyIndex,
          snapshot: result.config,
          maxEntries: SHIP_BUILDER_HISTORY_LIMIT,
        })

        nextState = {
          shipConfig: result.config,
          historyEntries: historyResult.entries,
          historyIndex: historyResult.currentIndex,
        }
      }

      setBuilderStateAndRef(nextState)
      applyNormalizationWarnings(result.warnings)

      if (successMessage && result.warnings.length === 0) {
        setMessage({
          kind: 'success',
          text: successMessage,
        })
      }
    },
    [applyNormalizationWarnings, setBuilderStateAndRef]
  )

  useEffect(() => {
    builderStateRef.current = builderState
  }, [builderState])

  useEffect(() => {
    let isCancelled = false

    const initializeSceneManager = async () => {
      const { ShipBuilderSceneManager } = await import('@/lib/managers/ShipBuilderSceneManager')
      if (isCancelled) {
        return
      }

      const nextSceneManager = new ShipBuilderSceneManager()
      sceneManagerRef.current = nextSceneManager
      setSceneManager(nextSceneManager)
    }

    void initializeSceneManager()

    return () => {
      isCancelled = true
      sceneManagerRef.current?.destroy()
      sceneManagerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (hasRestoredStorageRef.current) {
      return
    }
    hasRestoredStorageRef.current = true

    if (typeof window === 'undefined') {
      setHasHydratedStorage(true)
      return
    }

    const persistedValue = window.localStorage.getItem(SHIP_BUILDER_STORAGE_KEY)
    if (!persistedValue) {
      setHasHydratedStorage(true)
      return
    }

    const imported = shipConfigIOManager.importFromJson(persistedValue)
    if (!imported.ok) {
      setMessage({
        kind: 'warning',
        text: 'Saved configuration was invalid and could not be restored.',
      })
      setHasHydratedStorage(true)
      return
    }

    const normalized = shipConfigManager.replaceConfig(imported.config)
    applyNextConfig({
      result: normalized,
      commitHistory: true,
    })

    const restoreWarnings = [...imported.warnings, ...normalized.warnings]
    if (restoreWarnings.length > 0) {
      setMessage({
        kind: 'warning',
        text: restoreWarnings[0],
      })
      setHasHydratedStorage(true)
      return
    }

    setMessage({
      kind: 'success',
      text: 'Previous session restored from local storage.',
    })
    setHasHydratedStorage(true)
  }, [applyNextConfig, shipConfigIOManager, shipConfigManager])

  const updateSlot = useCallback<UpdateSlot>(
    (slot, patch, options) => {
      const result = shipConfigManager.updateSlot(builderStateRef.current.shipConfig, slot, patch)

      applyNextConfig({
        result,
        commitHistory: options?.commitHistory ?? true,
      })
    },
    [applyNextConfig, shipConfigManager]
  )

  const resetSlot = useCallback(
    (slot: ShipSlot) => {
      const result = shipConfigManager.resetSlot(builderStateRef.current.shipConfig, slot)
      applyNextConfig({
        result,
        commitHistory: true,
        successMessage: `Slot "${slot}" reset.`,
      })
    },
    [applyNextConfig, shipConfigManager]
  )

  const resetShipConfig = useCallback(() => {
    const defaultConfig = shipConfigManager.createDefaultConfig()
    const result = shipConfigManager.replaceConfig(defaultConfig)
    applyNextConfig({
      result,
      commitHistory: true,
      successMessage: 'Ship configuration reset.',
    })
  }, [applyNextConfig, shipConfigManager])

  const replaceShipConfig = useCallback(
    (config: ShipConfig) => {
      const result = shipConfigManager.replaceConfig(config)
      applyNextConfig({
        result,
        commitHistory: true,
      })
    },
    [applyNextConfig, shipConfigManager]
  )

  const undo = useCallback(() => {
    const currentState = builderStateRef.current
    if (currentState.historyIndex <= 0) {
      return
    }

    const nextHistoryIndex = currentState.historyIndex - 1
    const snapshot = currentState.historyEntries[nextHistoryIndex]
    const normalized = shipConfigManager.replaceConfig(snapshot)
    const nextState: ShipBuilderState = {
      shipConfig: normalized.config,
      historyEntries: currentState.historyEntries,
      historyIndex: nextHistoryIndex,
    }

    setBuilderStateAndRef(nextState)
    applyNormalizationWarnings(normalized.warnings)
    if (normalized.warnings.length === 0) {
      setMessage({
        kind: 'info',
        text: 'Undo applied.',
      })
    }
  }, [applyNormalizationWarnings, setBuilderStateAndRef, shipConfigManager])

  const redo = useCallback(() => {
    const currentState = builderStateRef.current
    if (currentState.historyIndex >= currentState.historyEntries.length - 1) {
      return
    }

    const nextHistoryIndex = currentState.historyIndex + 1
    const snapshot = currentState.historyEntries[nextHistoryIndex]
    const normalized = shipConfigManager.replaceConfig(snapshot)
    const nextState: ShipBuilderState = {
      shipConfig: normalized.config,
      historyEntries: currentState.historyEntries,
      historyIndex: nextHistoryIndex,
    }

    setBuilderStateAndRef(nextState)
    applyNormalizationWarnings(normalized.warnings)
    if (normalized.warnings.length === 0) {
      setMessage({
        kind: 'info',
        text: 'Redo applied.',
      })
    }
  }, [applyNormalizationWarnings, setBuilderStateAndRef, shipConfigManager])

  const exportShipConfigToJson = useCallback(() => {
    return shipConfigIOManager.exportToJson(builderStateRef.current.shipConfig)
  }, [shipConfigIOManager])

  const importShipConfigFromJson = useCallback(
    (rawInput: string): ImportShipConfigResult => {
      const importResult = shipConfigIOManager.importFromJson(rawInput)
      if (!importResult.ok) {
        setMessage({
          kind: 'error',
          text: importResult.error,
        })
        return importResult
      }

      const normalized = shipConfigManager.replaceConfig(importResult.config)
      const warnings = [...importResult.warnings, ...normalized.warnings]
      applyNextConfig({
        result: normalized,
        commitHistory: true,
        successMessage: 'Configuration imported.',
      })

      if (warnings.length > 0) {
        setMessage({
          kind: 'warning',
          text: warnings[0],
        })
      }

      return {
        ok: true,
        config: normalized.config,
        warnings,
      }
    },
    [applyNextConfig, shipConfigIOManager, shipConfigManager]
  )

  const setExperienceMode = useCallback((mode: ExperienceMode) => {
    setExperienceModeState(mode)
  }, [])

  const toggleExperienceMode = useCallback(() => {
    setExperienceModeState((previousMode) => (previousMode === 'builder' ? 'flight' : 'builder'))
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !hasHydratedStorage) {
      return
    }

    const serialized = shipConfigIOManager.exportToJson(builderState.shipConfig)
    window.localStorage.setItem(SHIP_BUILDER_STORAGE_KEY, serialized)
  }, [builderState.shipConfig, hasHydratedStorage, shipConfigIOManager])

  useEffect(() => {
    if (!hasInitializedExperienceModeRef.current) {
      hasInitializedExperienceModeRef.current = true
      return
    }

    setMessage({
      kind: 'info',
      text:
        experienceMode === 'flight'
          ? 'Flight view enabled: ship loaded from local storage. Controls: A/D bank turn.'
          : 'Builder view enabled: transform gizmos and slot selection restored.',
    })
  }, [experienceMode])

  useEffect(() => {
    if (!sceneManager) {
      return
    }

    sceneManager.setSlotSelectionHandler((slot) => {
      if (!slot) {
        return
      }

      setSelectedSlot(slot)
    })

    sceneManager.setSlotTransformHandler((slot, patch, options) => {
      updateSlot(slot, patch, {
        commitHistory: options.commitHistory,
      })
    })

    sceneManager.setSlotValidationHandler((slots) => {
      setOverlappingSlots(slots)

      if (slots.length === 0) {
        return
      }

      setMessage({
        kind: 'warning',
        text: `Severe overlap detected for slots: ${slots.join(', ')}.`,
      })
    })

    sceneManager.setSlotBodyContactHandler((slots) => {
      setDetachedSlots(slots)
      if (slots.length === 0) {
        return
      }

      setMessage({
        kind: 'warning',
        text: `Body contact violation for slots: ${slots.join(', ')}.`,
      })
    })

    return () => {
      sceneManager.setSlotSelectionHandler(null)
      sceneManager.setSlotTransformHandler(null)
      sceneManager.setSlotValidationHandler(null)
      sceneManager.setSlotBodyContactHandler(null)
    }
  }, [sceneManager, updateSlot])

  useEffect(() => {
    if (!sceneManager) {
      return
    }

    sceneManager.setSelectedSlot(selectedSlot)
  }, [sceneManager, selectedSlot])

  useEffect(() => {
    if (!sceneManager) {
      return
    }

    sceneManager.setExperienceMode(experienceMode)
  }, [sceneManager, experienceMode])

  useEffect(() => {
    const supportsSymmetricGizmos =
      selectedSlot === 'wings' ||
      selectedSlot === 'engines' ||
      (selectedSlot === 'weapons' && builderState.shipConfig.weapons.variant !== 'none')

    if (
      (transformMode === 'pairSpread' || transformMode === 'aimRotate') &&
      !supportsSymmetricGizmos
    ) {
      setTransformMode('translate')
    }
  }, [builderState.shipConfig.weapons.variant, selectedSlot, transformMode])

  useEffect(() => {
    if (!sceneManager) {
      return
    }

    sceneManager.setTransformMode(transformMode)
  }, [sceneManager, transformMode])

  const canUndo = builderState.historyIndex > 0
  const canRedo = builderState.historyIndex < builderState.historyEntries.length - 1

  const value = useMemo<ShipBuilderContextValue>(() => {
    return {
      sceneManager,
      shipConfig: builderState.shipConfig,
      selectedSlot,
      experienceMode,
      transformMode,
      canUndo,
      canRedo,
      overlappingSlots,
      detachedSlots,
      message,
      updateSlot,
      setSelectedSlot,
      setExperienceMode,
      toggleExperienceMode,
      setTransformMode,
      undo,
      redo,
      resetSlot,
      resetShipConfig,
      replaceShipConfig,
      exportShipConfigToJson,
      importShipConfigFromJson,
    }
  }, [
    sceneManager,
    builderState.shipConfig,
    selectedSlot,
    experienceMode,
    transformMode,
    canUndo,
    canRedo,
    overlappingSlots,
    detachedSlots,
    message,
    updateSlot,
    setExperienceMode,
    toggleExperienceMode,
    undo,
    redo,
    resetSlot,
    resetShipConfig,
    replaceShipConfig,
    exportShipConfigToJson,
    importShipConfigFromJson,
  ])

  return <ShipBuilderContext.Provider value={value}>{children}</ShipBuilderContext.Provider>
}

export default ShipBuilderProvider
