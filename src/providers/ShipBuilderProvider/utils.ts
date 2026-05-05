import type { ShipConfig, ShipSlot } from '@/lib/models/ShipConfig'

export const areShipConfigsEqual = (a: ShipConfig, b: ShipConfig): boolean => {
  if (a.version !== b.version) {
    return false
  }

  const slots: readonly ShipSlot[] = ['body', 'cockpit', 'wings', 'engines', 'weapons']

  return slots.every((slot) => {
    const currentSlot = a[slot]
    const nextSlot = b[slot]
    const hasSameEngineAimRotation =
      slot !== 'engines' ||
      (a.engines.aimRotation[0] === b.engines.aimRotation[0] &&
        a.engines.aimRotation[1] === b.engines.aimRotation[1] &&
        a.engines.aimRotation[2] === b.engines.aimRotation[2])
    const hasSameSymmetricPairSpread =
      (slot !== 'wings' || a.wings.pairSpread === b.wings.pairSpread) &&
      (slot !== 'engines' || a.engines.pairSpread === b.engines.pairSpread) &&
      (slot !== 'weapons' || a.weapons.pairSpread === b.weapons.pairSpread)

    return (
      currentSlot.variant === nextSlot.variant &&
      currentSlot.color === nextSlot.color &&
      currentSlot.scale[0] === nextSlot.scale[0] &&
      currentSlot.scale[1] === nextSlot.scale[1] &&
      currentSlot.scale[2] === nextSlot.scale[2] &&
      currentSlot.offset[0] === nextSlot.offset[0] &&
      currentSlot.offset[1] === nextSlot.offset[1] &&
      currentSlot.offset[2] === nextSlot.offset[2] &&
      currentSlot.rotation[0] === nextSlot.rotation[0] &&
      currentSlot.rotation[1] === nextSlot.rotation[1] &&
      currentSlot.rotation[2] === nextSlot.rotation[2] &&
      currentSlot.pivotLocal[0] === nextSlot.pivotLocal[0] &&
      currentSlot.pivotLocal[1] === nextSlot.pivotLocal[1] &&
      currentSlot.pivotLocal[2] === nextSlot.pivotLocal[2] &&
      hasSameEngineAimRotation &&
      hasSameSymmetricPairSpread
    )
  })
}

export const pushHistorySnapshot = ({
  entries,
  currentIndex,
  snapshot,
  maxEntries,
}: {
  entries: ShipConfig[]
  currentIndex: number
  snapshot: ShipConfig
  maxEntries: number
}) => {
  const baseEntries = entries.slice(0, currentIndex + 1)
  const previous = baseEntries[baseEntries.length - 1]

  if (previous && areShipConfigsEqual(previous, snapshot)) {
    return {
      entries: baseEntries,
      currentIndex: baseEntries.length - 1,
      changed: false,
    }
  }

  const nextEntries = [...baseEntries, snapshot]
  if (nextEntries.length > maxEntries) {
    nextEntries.splice(0, nextEntries.length - maxEntries)
  }

  return {
    entries: nextEntries,
    currentIndex: nextEntries.length - 1,
    changed: true,
  }
}

export const isEditableKeyboardTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  const tagName = target.tagName.toLowerCase()
  if (tagName === 'input' || tagName === 'textarea' || target.isContentEditable) {
    return true
  }

  return false
}
