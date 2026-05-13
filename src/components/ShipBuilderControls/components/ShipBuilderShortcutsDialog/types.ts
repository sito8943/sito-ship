export type ShortcutItem = {
  key: string
  description: string
}

export type ShortcutSection = {
  title: string
  shortcuts: ShortcutItem[]
}

export type ShipBuilderShortcutsDialogProps = {
  isOpen: boolean
  onClose: () => void
}

