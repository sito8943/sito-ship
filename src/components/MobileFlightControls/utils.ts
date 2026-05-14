import { JOYSTICK_DEADZONE } from '@/components/MobileFlightControls/constants'

export const applyDeadzone = (value: number) => {
  if (Math.abs(value) < JOYSTICK_DEADZONE) {
    return 0
  }
  const sign = Math.sign(value)
  const scaled = (Math.abs(value) - JOYSTICK_DEADZONE) / (1 - JOYSTICK_DEADZONE)
  return sign * scaled
}
