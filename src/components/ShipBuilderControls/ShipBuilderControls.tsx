import { lazy, Suspense } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'

const ShipBuilderControlsDesktop = lazy(
  () => import('@/components/ShipBuilderControls/components/desktop')
)
const ShipBuilderControlsMobile = lazy(
  () => import('@/components/ShipBuilderControls/components/mobile')
)

const ShipBuilderControls = () => {
  const isMobile = useIsMobile()

  return (
    <Suspense fallback={null}>
      {isMobile ? <ShipBuilderControlsMobile /> : <ShipBuilderControlsDesktop />}
    </Suspense>
  )
}

export default ShipBuilderControls
