import AppLayout from '@/layouts/AppLayout'
import DialogProvider from '@/providers/DialogProvider'
import ShipBuilderProvider from '@/providers/ShipBuilderProvider'
import HomeView from '@/views/HomeView'

const App = () => {
  return (
    <DialogProvider>
      <ShipBuilderProvider>
        <AppLayout>
          <HomeView />
        </AppLayout>
      </ShipBuilderProvider>
    </DialogProvider>
  )
}

export default App
