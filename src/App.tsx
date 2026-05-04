import AppLayout from '@/layouts/AppLayout'
import ShipBuilderProvider from '@/providers/ShipBuilderProvider'
import HomeView from '@/views/HomeView'

const App = () => {
  return (
    <ShipBuilderProvider>
      <AppLayout>
        <HomeView />
      </AppLayout>
    </ShipBuilderProvider>
  )
}

export default App
