import { useEffect, useRef } from 'react'
import { useShipBuilder } from '@/hooks/useShipBuilder'

const SceneCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const { sceneManager, shipConfig } = useShipBuilder()

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
    <div className="scene-shell">
      <canvas ref={canvasRef} className="scene-canvas" />
    </div>
  )
}

export default SceneCanvas
