import type { ExperienceMode } from '@/lib/managers/ShipBuilderSceneManager/types'

export type ShipBuilderControlsFooterProps = {
  hideUI: boolean
  experienceMode: ExperienceMode
  onToggleHideUI: () => void
  onToggleExperienceMode: () => void
  onOpenKeyboardShortcuts: () => void
}
