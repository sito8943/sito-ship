import type { ShipSlot } from '@/lib/models/ShipConfig'
import type { TransformMode } from '@/lib/managers/ShipBuilderSceneManager/types'

export type UseShipBuilderKeyboardShortcutsOptions = {
  onToggleHideUI: () => void
}

export type ShortcutSlotMap = Record<string, ShipSlot>
export type ShortcutTransformModeMap = Record<string, TransformMode>
