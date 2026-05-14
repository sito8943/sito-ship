import type { OrientationLockMode } from '@/views/FlightView/types'

export const FLIGHT_VIEW_TITLE = 'Flight View'
export const FLIGHT_VIEW_BACK_LABEL = 'Back to Builder'
export const FLIGHT_VIEW_PORTRAIT_MEDIA_QUERY = '(orientation: portrait)'
export const FLIGHT_VIEW_LANDSCAPE_ORIENTATION_LOCK: OrientationLockMode = 'landscape'
export const FLIGHT_VIEW_HELP_LINES = [
  'A / D: strafe left / right (with bank + roll + slight yaw + pitch)',
  'W / S: move up / down (with pitch)',
  'Space: fire weapons (hold)',
  'Tab: hide / show this panel',
  'T or Esc: return to builder',
] as const
