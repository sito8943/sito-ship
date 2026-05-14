import { useCallback, useRef, useState, type PointerEvent } from 'react'
import { useDrag } from '@use-gesture/react'
import { JOYSTICK_DEADZONE, JOYSTICK_RADIUS } from '@/components/MobileFlightControls/constants'
import type { MobileFlightControlsProps } from '@/components/MobileFlightControls/types'

const applyDeadzone = (value: number) => {
  if (Math.abs(value) < JOYSTICK_DEADZONE) {
    return 0
  }
  const sign = Math.sign(value)
  const scaled = (Math.abs(value) - JOYSTICK_DEADZONE) / (1 - JOYSTICK_DEADZONE)
  return sign * scaled
}

const MobileFlightControls = ({ onStrafe, onPitch, onFire }: MobileFlightControlsProps) => {
  const [knob, setKnob] = useState({ x: 0, y: 0 })
  const lastStrafe = useRef(0)
  const lastPitch = useRef(0)

  const emit = useCallback(
    (rawX: number, rawY: number) => {
      const strafe = applyDeadzone(rawX / JOYSTICK_RADIUS)
      const pitch = applyDeadzone(-rawY / JOYSTICK_RADIUS)
      if (strafe !== lastStrafe.current) {
        lastStrafe.current = strafe
        onStrafe(strafe)
      }
      if (pitch !== lastPitch.current) {
        lastPitch.current = pitch
        onPitch(pitch)
      }
    },
    [onStrafe, onPitch]
  )

  const bindJoystick = useDrag(
    ({ down, movement: [mx, my] }) => {
      let x = mx
      let y = my
      const dist = Math.hypot(x, y)
      if (dist > JOYSTICK_RADIUS) {
        x = (x / dist) * JOYSTICK_RADIUS
        y = (y / dist) * JOYSTICK_RADIUS
      }
      if (!down) {
        x = 0
        y = 0
      }
      setKnob({ x, y })
      emit(x, y)
    },
    { filterTaps: false, pointer: { touch: true } }
  )

  const handleFireDown = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId)
      onFire(true)
    },
    [onFire]
  )

  const handleFireUp = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
      onFire(false)
    },
    [onFire]
  )

  return (
    <div className="flight-touch" aria-hidden>
      <div className="flight-touch__joystick" {...bindJoystick()}>
        <div className="flight-touch__joystick-base" />
        <div
          className="flight-touch__joystick-knob"
          style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }}
        />
      </div>
      <button
        type="button"
        className="flight-touch__fire"
        aria-label="Fire"
        onPointerDown={handleFireDown}
        onPointerUp={handleFireUp}
        onPointerCancel={handleFireUp}
        onPointerLeave={handleFireUp}
      >
        FIRE
      </button>
    </div>
  )
}

export default MobileFlightControls
