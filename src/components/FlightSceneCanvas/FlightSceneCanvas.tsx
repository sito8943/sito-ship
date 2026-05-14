import { useEffect, useRef } from 'react'
import type { FlightSceneCanvasProps } from '@/components/FlightSceneCanvas/types'

const FlightSceneCanvas = ({ shipConfig, sceneManager }: FlightSceneCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

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
