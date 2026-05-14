import { ShipConfigIOManager } from '@/lib/managers/ShipConfigIOManager'
import { ShipConfigManager } from '@/lib/managers/ShipConfigManager'
import type { ShipConfig } from '@/lib/models/ShipConfig'
import { SHIP_BUILDER_STORAGE_KEY } from '@/providers/ShipBuilderProvider/constants'
import {
  FLIGHT_VIEW_LANDSCAPE_ORIENTATION_LOCK,
  FLIGHT_VIEW_PORTRAIT_MEDIA_QUERY,
} from '@/views/FlightView/constants'
import type { ScreenWithLegacyOrientationLock } from '@/views/FlightView/types'

export const detectTouchDevice = (): boolean => {
  if (typeof window === 'undefined') {
    return false
  }

  return (
    'ontouchstart' in window ||
    window.navigator.maxTouchPoints > 0 ||
    window.matchMedia('(pointer: coarse)').matches
  )
}

export const isPortraitViewportMode = (): boolean => {
  if (typeof window === 'undefined') {
    return false
  }

  return window.matchMedia(FLIGHT_VIEW_PORTRAIT_MEDIA_QUERY).matches
}

const getLegacyOrientationLock = (
  screen: ScreenWithLegacyOrientationLock
): ScreenWithLegacyOrientationLock['lockOrientation'] => {
  return screen.lockOrientation ?? screen.msLockOrientation ?? screen.mozLockOrientation
}

export const requestLandscapeOrientation = async (): Promise<boolean> => {
  if (typeof window === 'undefined') {
    return false
  }

  const { screen } = window

  if (screen.orientation?.lock) {
    try {
      await screen.orientation.lock(FLIGHT_VIEW_LANDSCAPE_ORIENTATION_LOCK)
      return true
    } catch (error) {
      void error
    }
  }

  const legacyOrientationLock = getLegacyOrientationLock(screen as ScreenWithLegacyOrientationLock)
  if (typeof legacyOrientationLock !== 'function') {
    return false
  }

  try {
    return legacyOrientationLock.call(screen, FLIGHT_VIEW_LANDSCAPE_ORIENTATION_LOCK) === true
  } catch (error) {
    void error
  }

  return false
}

export const resolveFlightShipConfig = (fallbackConfig: ShipConfig): ShipConfig => {
  if (typeof window === 'undefined') {
    return fallbackConfig
  }

  const persistedConfig = window.localStorage.getItem(SHIP_BUILDER_STORAGE_KEY)
  if (!persistedConfig) {
    return fallbackConfig
  }

  const ioManager = new ShipConfigIOManager()
  const configManager = new ShipConfigManager()
  const importResult = ioManager.importFromJson(persistedConfig)

  if (!importResult.ok) {
    return fallbackConfig
  }

  return configManager.replaceConfig(importResult.config).config
}
