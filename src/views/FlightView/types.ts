export type LegacyOrientationLock = (orientation: OrientationLockType) => boolean

export type ScreenWithLegacyOrientationLock = Screen & {
  lockOrientation?: LegacyOrientationLock
  msLockOrientation?: LegacyOrientationLock
  mozLockOrientation?: LegacyOrientationLock
}
