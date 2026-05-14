import { lazy, Suspense, useEffect, useState } from 'react'
import SceneCanvas from '@/components/SceneCanvas'
import ShipBuilderControls from '@/components/ShipBuilderControls'
import ViewTransitionOverlay from '@/components/ViewTransitionOverlay'
import { useShipBuilder } from '@/hooks/useShipBuilder'

const FlightView = lazy(() => import('@/views/FlightView'))

const FADE_IN_MS = 350
const HOLD_MS = 150

const HomeView = () => {
  const { experienceMode } = useShipBuilder()
  const [displayedMode, setDisplayedMode] = useState(experienceMode)
  const [overlayVisible, setOverlayVisible] = useState(false)

  useEffect(() => {
    if (experienceMode === displayedMode) {
      return
    }

    setOverlayVisible(true)
    const swapTimer = window.setTimeout(() => {
      setDisplayedMode(experienceMode)
    }, FADE_IN_MS)

    return () => {
      window.clearTimeout(swapTimer)
    }
  }, [experienceMode, displayedMode])

  useEffect(() => {
    if (!overlayVisible || experienceMode !== displayedMode) {
      return
    }

    const hideTimer = window.setTimeout(() => {
      setOverlayVisible(false)
    }, HOLD_MS)

    return () => {
      window.clearTimeout(hideTimer)
    }
  }, [overlayVisible, experienceMode, displayedMode])

  const content =
    displayedMode === 'flight' ? (
      <Suspense fallback={<ViewTransitionOverlay visible />}>
        <FlightView />
      </Suspense>
    ) : (
      <section className="home-view">
        <SceneCanvas />
        <ShipBuilderControls />
      </section>
    )

  return (
    <>
      {content}
      <ViewTransitionOverlay visible={overlayVisible} />
    </>
  )
}

export default HomeView
