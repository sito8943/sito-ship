import type { ExperienceMode } from '@/lib/managers/ShipBuilderSceneManager/types'

export type MobileAsideProps = {
  isHidden: boolean
  panelVisibilityClassName: string
}

export type MobileImportExportProps = {
  isHidden: boolean
  panelVisibilityClassName: string
}

export type MobileVariantPickerProps = {
  panelVisibilityClassName: string
}

export type MobileFooterProps = {
  hideUI: boolean
  experienceMode: ExperienceMode
  onToggleHideUI: () => void
  onToggleExperienceMode: () => void
}
