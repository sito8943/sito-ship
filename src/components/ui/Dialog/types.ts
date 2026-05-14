import type { MouseEvent, ReactNode } from 'react'

export type DialogProps = {
  isOpen: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export type BackdropClickEvent = MouseEvent<HTMLDivElement>
