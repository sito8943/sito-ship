import type { PropsWithChildren } from 'react'

const AppLayout = ({ children }: PropsWithChildren) => {
  return <main className="app-layout">{children}</main>
}

export default AppLayout
