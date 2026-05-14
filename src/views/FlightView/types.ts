export type OrientationLockMode =
  | 'any'
  | 'natural'
  | 'landscape'
  | 'portrait'
  | 'portrait-primary'
  | 'portrait-secondary'
  | 'landscape-primary'
  | 'landscape-secondary'

export type LegacyOrientationLock = (orientation: OrientationLockMode) => boolean

export type ScreenOrientationWithLock = ScreenOrientation & {
  lock?: (orientation: OrientationLockMode) => Promise<void>
}

export type ScreenWithLegacyOrientationLock = Screen & {
  lockOrientation?: LegacyOrientationLock
  msLockOrientation?: LegacyOrientationLock
  mozLockOrientation?: LegacyOrientationLock
}
