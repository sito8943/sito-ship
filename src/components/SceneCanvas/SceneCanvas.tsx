import { useEffect, useRef } from 'react'
import { useShipBuilder } from '@/hooks/useShipBuilder'

const SceneCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const { sceneManager, shipConfig } = useShipBuilder()

  useEffect(() => {
    if (!sceneManager) {
      return
    }

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
    if (!sceneManager) {
      return
    }

    sceneManager.syncShipConfig(shipConfig)
  }, [sceneManager, shipConfig])

  return (
    <div className="scene-shell">
      <canvas ref={canvasRef} className="scene-canvas" />
    </div>
  )
}

export default SceneCanvas
