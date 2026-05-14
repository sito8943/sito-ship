import { useEffect, useRef } from 'react'
import { useShipBuilder } from '@/hooks/useShipBuilder'
import type { SceneCanvasProps } from '@/components/SceneCanvas/types'

const SceneCanvas = ({ onReady }: SceneCanvasProps) => {
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
    let frameId = 0
    if (onReady) {
      frameId = window.requestAnimationFrame(() => {
        onReady()
      })
    }

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId)
      }
      sceneManager.destroy()
    }
  }, [sceneManager, onReady])

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
