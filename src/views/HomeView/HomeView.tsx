import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import SceneCanvas from '@/components/SceneCanvas'
import ShipBuilderControls from '@/components/ShipBuilderControls'
import ViewTransitionOverlay from '@/components/ViewTransitionOverlay'
import { useShipBuilder } from '@/hooks/useShipBuilder'
import { FADE_IN_MS, HOLD_MS, INITIAL_BUILDER_UI_REVEAL_DELAY_MS } from '@/views/HomeView/constants'

const FlightView = lazy(() => import('@/views/FlightView'))

const HomeView = () => {
  const { experienceMode } = useShipBuilder()
  const [displayedMode, setDisplayedMode] = useState(experienceMode)
  const [overlayVisible, setOverlayVisible] = useState(false)
  const [isInitialBuilderLoading, setIsInitialBuilderLoading] = useState(true)
  const [isBuilderUIVisible, setIsBuilderUIVisible] = useState(false)

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

  const handleBuilderSceneReady = useCallback(() => {
    setIsInitialBuilderLoading(false)
  }, [])

  useEffect(() => {
    if (isInitialBuilderLoading) {
      return
    }

    const showBuilderUITimer = window.setTimeout(() => {
      setIsBuilderUIVisible(true)
    }, INITIAL_BUILDER_UI_REVEAL_DELAY_MS)

    return () => {
      window.clearTimeout(showBuilderUITimer)
    }
  }, [isInitialBuilderLoading])

  const homeViewClassName = `home-view ${isBuilderUIVisible ? 'home-view--builder-ui-visible' : 'home-view--builder-ui-hidden'}`

  const content =
    displayedMode === 'flight' ? (
      <Suspense fallback={<ViewTransitionOverlay visible />}>
        <FlightView />
      </Suspense>
    ) : (
      <section className={homeViewClassName}>
        <SceneCanvas onReady={handleBuilderSceneReady} />
        <ShipBuilderControls />
      </section>
    )

  return (
    <>
      {content}
      <ViewTransitionOverlay visible={overlayVisible || isInitialBuilderLoading} />
    </>
  )
}

export default HomeView
