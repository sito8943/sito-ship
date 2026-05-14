import { useCallback, useEffect, useState } from 'react'
import FlightSceneCanvas from '@/components/FlightSceneCanvas'
import { Button } from '@/components/ui'
import { useShipBuilder } from '@/hooks/useShipBuilder'
import type { ShipConfig } from '@/lib/models/ShipConfig'
import {
  FLIGHT_VIEW_BACK_LABEL,
  FLIGHT_VIEW_HELP_LINES,
  FLIGHT_VIEW_TITLE,
} from '@/views/FlightView/constants'
import { resolveFlightShipConfig } from '@/views/FlightView/utils'

const FlightView = () => {
  const { shipConfig, setExperienceMode } = useShipBuilder()
  const [flightShipConfig] = useState<ShipConfig>(() => resolveFlightShipConfig(shipConfig))
  const [isHudHidden, setIsHudHidden] = useState(false)

  const closeFlightView = useCallback(() => {
    setExperienceMode('builder')
  }, [setExperienceMode])

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
      <FlightSceneCanvas shipConfig={flightShipConfig} />

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
    </section>
  )
}

export default FlightView
