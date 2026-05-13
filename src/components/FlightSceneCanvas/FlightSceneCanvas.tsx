import { useEffect, useMemo, useRef } from 'react'
import { ShipFlightSceneManager } from '@/lib/managers/ShipFlightSceneManager'
import type { FlightSceneCanvasProps } from '@/components/FlightSceneCanvas/types'

const FlightSceneCanvas = ({ shipConfig }: FlightSceneCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const sceneManager = useMemo(() => new ShipFlightSceneManager(), [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    sceneManager.mount(canvas)
    return () => {
      sceneManager.destroy()
    }
  }, [sceneManager])

  useEffect(() => {
    sceneManager.syncShipConfig(shipConfig)
  }, [sceneManager, shipConfig])

  return (
    <div className="flight-scene-shell">
      <canvas ref={canvasRef} className="flight-scene-canvas" />
    </div>
  )
}

export default FlightSceneCanvas
