import { useCallback, useEffect, useMemo, useState } from 'react'
import FlightSceneCanvas from '@/components/FlightSceneCanvas'
import MobileFlightControls from '@/components/MobileFlightControls'
import { Button } from '@/components/ui'
import { useDialog } from '@/hooks/useDialog'
import { useShipBuilder } from '@/hooks/useShipBuilder'
import { ShipFlightSceneManager } from '@/lib/managers/ShipFlightSceneManager'
import type { ShipConfig } from '@/lib/models/ShipConfig'
import { DIALOG_IDS } from '@/providers/DialogProvider'
import FlightOrientationDialog from '@/views/FlightView/components/FlightOrientationDialog'
import {
  FLIGHT_VIEW_BACK_LABEL,
  FLIGHT_VIEW_HELP_LINES,
  FLIGHT_VIEW_TITLE,
} from '@/views/FlightView/constants'
import {
  detectTouchDevice,
  isPortraitViewportMode,
  requestLandscapeOrientation,
  resolveFlightShipConfig,
} from '@/views/FlightView/utils'

const FlightView = () => {
  const { shipConfig, setExperienceMode } = useShipBuilder()
  const orientationDialog = useDialog(DIALOG_IDS.MOBILE_LANDSCAPE)
  const [flightShipConfig] = useState<ShipConfig>(() => resolveFlightShipConfig(shipConfig))
  const [isHudHidden, setIsHudHidden] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const [isPortraitViewport, setIsPortraitViewport] = useState(false)
  const [isLandscapeOverrideEnabled, setIsLandscapeOverrideEnabled] = useState(false)
  const sceneManager = useMemo(() => new ShipFlightSceneManager(), [])

  useEffect(() => {
    const syncMobileViewportState = () => {
      setIsTouchDevice(detectTouchDevice())
      setIsPortraitViewport(isPortraitViewportMode())
    }

    syncMobileViewportState()

    window.addEventListener('resize', syncMobileViewportState)
    window.addEventListener('orientationchange', syncMobileViewportState)

    return () => {
      window.removeEventListener('resize', syncMobileViewportState)
      window.removeEventListener('orientationchange', syncMobileViewportState)
    }
  }, [])

  const closeFlightView = useCallback(() => {
    setExperienceMode('builder')
  }, [setExperienceMode])

  useEffect(() => {
    if (!isPortraitViewport) {
      setIsLandscapeOverrideEnabled(false)
    }
  }, [isPortraitViewport])

  useEffect(() => {
    const shouldOpenOrientationDialog =
      isTouchDevice && isPortraitViewport && !isLandscapeOverrideEnabled

    if (shouldOpenOrientationDialog) {
      if (!orientationDialog.isOpen) {
        orientationDialog.open()
      }
      return
    }

    if (orientationDialog.isOpen) {
      orientationDialog.close()
    }
  }, [isLandscapeOverrideEnabled, isPortraitViewport, isTouchDevice, orientationDialog])

  const handleStrafe = useCallback(
    (value: number) => {
      sceneManager.setTouchInput({ strafe: value })
    },
    [sceneManager]
  )

  const handlePitch = useCallback(
    (value: number) => {
      sceneManager.setTouchInput({ pitch: value })
    },
    [sceneManager]
  )

  const handleFire = useCallback(
    (active: boolean) => {
      sceneManager.setTouchInput({ fire: active })
    },
    [sceneManager]
  )

  const handleAcceptLandscape = useCallback(() => {
    void (async () => {
      const landscapeLockApplied = await requestLandscapeOrientation()
      if (!landscapeLockApplied) {
        setIsLandscapeOverrideEnabled(true)
      }
      orientationDialog.close()
    })()
  }, [orientationDialog])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) {
        return
      }

      if (event.target instanceof HTMLElement) {
        const tagName = event.target.tagName.toLowerCase()
        if (tagName === 'input' || tagName === 'textarea' || event.target.isContentEditable) {
          return
        }
      }

      const normalizedKey = event.key.toLowerCase()
      if (normalizedKey === 't' || normalizedKey === 'escape') {
        event.preventDefault()
        closeFlightView()
        return
      }

      if (normalizedKey === 'tab') {
        event.preventDefault()
        setIsHudHidden((previous) => !previous)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [closeFlightView])

  const shouldForceLandscapeView = isTouchDevice && isPortraitViewport && isLandscapeOverrideEnabled
  const flightViewClassName = `flight-view${shouldForceLandscapeView ? ' flight-view--portrait-locked' : ''}`

  return (
    <section className={flightViewClassName} aria-label="Flight View">
      <FlightSceneCanvas shipConfig={flightShipConfig} sceneManager={sceneManager} />

      <aside
        className={`flight-view__hud${isHudHidden ? ' flight-view__hud--hidden' : ''}`}
        role="status"
        aria-live="polite"
        aria-hidden={isHudHidden}
      >
        <header className="flight-view__hud-header">
          <h2 className="flight-view__title">{FLIGHT_VIEW_TITLE}</h2>
          <Button size="sm" variant="ghost" onClick={closeFlightView}>
            {FLIGHT_VIEW_BACK_LABEL}
          </Button>
        </header>

        <ul className="flight-view__help-list">
          {FLIGHT_VIEW_HELP_LINES.map((helpLine) => {
            return <li key={helpLine}>{helpLine}</li>
          })}
        </ul>
      </aside>

      {isTouchDevice ? (
        <MobileFlightControls onStrafe={handleStrafe} onPitch={handlePitch} onFire={handleFire} />
      ) : null}
      {orientationDialog.isOpen ? (
        <FlightOrientationDialog
          isOpen={orientationDialog.isOpen}
          onConfirm={handleAcceptLandscape}
        />
      ) : null}
    </section>
  )
}

export default FlightView
