import type { ExperienceMode } from '@/lib/managers/ShipBuilderSceneManager/types'

export type DesktopAsideProps = {
  isHidden: boolean
  panelVisibilityClassName: string
}

export type DesktopImportExportProps = {
  isHidden: boolean
  panelVisibilityClassName: string
}

export type DesktopFooterProps = {
  hideUI: boolean
  experienceMode: ExperienceMode
  onToggleHideUI: () => void
  onToggleExperienceMode: () => void
  onOpenKeyboardShortcuts: () => void
}
