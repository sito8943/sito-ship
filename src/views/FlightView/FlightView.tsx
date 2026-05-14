import { useCallback, useEffect, useMemo, useState } from 'react'
import { faScrewdriverWrench } from '@fortawesome/free-solid-svg-icons'
import FlightSceneCanvas from '@/components/FlightSceneCanvas'
import MobileFlightControls from '@/components/MobileFlightControls'
import { Button, IconButton } from '@/components/ui'
import { useShipBuilder } from '@/hooks/useShipBuilder'
import { ShipFlightSceneManager } from '@/lib/managers/ShipFlightSceneManager'
import type { ShipConfig } from '@/lib/models/ShipConfig'
import {
  FLIGHT_VIEW_BACK_LABEL,
  FLIGHT_VIEW_HELP_LINES,
  FLIGHT_VIEW_TITLE,
} from '@/views/FlightView/constants'
import { detectTouchDevice, resolveFlightShipConfig } from '@/views/FlightView/utils'

const FlightView = () => {
  const { shipConfig, setExperienceMode } = useShipBuilder()
  const [flightShipConfig] = useState<ShipConfig>(() => resolveFlightShipConfig(shipConfig))
  const [isHudHidden, setIsHudHidden] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(() => detectTouchDevice())
  const sceneManager = useMemo(() => new ShipFlightSceneManager(), [])

  useEffect(() => {
    const syncTouch = () => {
      setIsTouchDevice(detectTouchDevice())
    }

    syncTouch()

    window.addEventListener('resize', syncTouch)
    window.addEventListener('orientationchange', syncTouch)

    return () => {
      window.removeEventListener('resize', syncTouch)
      window.removeEventListener('orientationchange', syncTouch)
    }
  }, [])

  const closeFlightView = useCallback(() => {
    setExperienceMode('builder')
  }, [setExperienceMode])

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

  return (
    <section className="flight-view" aria-label="Flight View">
      <FlightSceneCanvas shipConfig={flightShipConfig} sceneManager={sceneManager} />

      <aside
        className={`flight-view__hud${isHudHidden ? ' flight-view__hud--hidden' : ''}`}
        role="status"
        aria-live="polite"
        aria-hidden={isHudHidden}
      >
        <header className="flight-view__hud-header">
          <h2 className="flight-view__title">{FLIGHT_VIEW_TITLE}</h2>
          {isTouchDevice ? (
            <IconButton
              size="sm"
              variant="ghost"
              icon={faScrewdriverWrench}
              label={FLIGHT_VIEW_BACK_LABEL}
              title={FLIGHT_VIEW_BACK_LABEL}
              onClick={closeFlightView}
            />
          ) : (
            <Button size="sm" variant="ghost" onClick={closeFlightView}>
              {FLIGHT_VIEW_BACK_LABEL}
            </Button>
          )}
        </header>

        {!isTouchDevice ? (
          <ul className="flight-view__help-list">
            {FLIGHT_VIEW_HELP_LINES.map((helpLine) => {
              return <li key={helpLine}>{helpLine}</li>
            })}
          </ul>
        ) : null}
      </aside>

      {isTouchDevice ? (
        <MobileFlightControls onStrafe={handleStrafe} onPitch={handlePitch} onFire={handleFire} />
      ) : null}
    </section>
  )
}

export default FlightView
