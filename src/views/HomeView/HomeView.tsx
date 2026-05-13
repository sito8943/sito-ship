import SceneCanvas from '@/components/SceneCanvas'
import ShipBuilderControls from '@/components/ShipBuilderControls'
import { useShipBuilder } from '@/hooks/useShipBuilder'
import FlightView from '@/views/FlightView'

const HomeView = () => {
  const { experienceMode } = useShipBuilder()

  if (experienceMode === 'flight') {
    return <FlightView />
  }

  return (
    <section className="home-view">
      <SceneCanvas />
      <ShipBuilderControls />
    </section>
  )
}

export default HomeView
