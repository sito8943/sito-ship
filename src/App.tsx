import { lazy, Suspense } from 'react'
import ViewTransitionOverlay from '@/components/ViewTransitionOverlay'
import AppLayout from '@/layouts/AppLayout'
import DialogProvider from '@/providers/DialogProvider'

const ShipBuilderProvider = lazy(() => import('@/providers/ShipBuilderProvider'))
const HomeView = lazy(() => import('@/views/HomeView'))

const App = () => {
  return (
    <DialogProvider>
      <Suspense fallback={<ViewTransitionOverlay visible />}>
        <ShipBuilderProvider>
          <AppLayout>
            <HomeView />
          </AppLayout>
        </ShipBuilderProvider>
      </Suspense>
    </DialogProvider>
  )
}

export default App
