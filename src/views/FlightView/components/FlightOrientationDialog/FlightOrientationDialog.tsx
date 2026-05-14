import { faMobileScreenButton } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button, Dialog } from '@/components/ui'
import {
  FLIGHT_ORIENTATION_DIALOG_ACCEPT_LABEL,
  FLIGHT_ORIENTATION_DIALOG_HINT,
  FLIGHT_ORIENTATION_DIALOG_MESSAGE,
  FLIGHT_ORIENTATION_DIALOG_TITLE,
} from '@/views/FlightView/components/FlightOrientationDialog/constants'
import type { FlightOrientationDialogProps } from '@/views/FlightView/components/FlightOrientationDialog/types'

const FlightOrientationDialog = ({ isOpen, onConfirm }: FlightOrientationDialogProps) => {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onConfirm}
      title={FLIGHT_ORIENTATION_DIALOG_TITLE}
      className="flight-orientation-dialog__panel"
      footer={
        <div className="flight-orientation-dialog__footer">
          <Button onClick={onConfirm}>{FLIGHT_ORIENTATION_DIALOG_ACCEPT_LABEL}</Button>
        </div>
      }
    >
      <div className="flight-orientation-dialog">
        <div className="flight-orientation-dialog__icon-wrap" aria-hidden>
          <FontAwesomeIcon
            icon={faMobileScreenButton}
            className="flight-orientation-dialog__icon"
          />
        </div>
        <p className="flight-orientation-dialog__message">{FLIGHT_ORIENTATION_DIALOG_MESSAGE}</p>
        <p className="flight-orientation-dialog__hint">{FLIGHT_ORIENTATION_DIALOG_HINT}</p>
      </div>
    </Dialog>
  )
}

export default FlightOrientationDialog
