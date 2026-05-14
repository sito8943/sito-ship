import type { PropsWithChildren } from 'react'

const preventContextMenu = (event: React.MouseEvent<HTMLElement>) => {
  event.preventDefault()
}

const AppLayout = ({ children }: PropsWithChildren) => {
  return (
    <main className="app-layout" onContextMenu={preventContextMenu}>
      {children}
    </main>
  )
}

export default AppLayout
