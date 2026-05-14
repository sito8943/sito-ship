import { faSpinner } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export type ViewTransitionOverlayProps = {
  visible: boolean
}

const ViewTransitionOverlay = ({ visible }: ViewTransitionOverlayProps) => {
  return (
    <div
      className={`view-transition-overlay${visible ? ' view-transition-overlay--visible' : ''}`}
      aria-hidden={!visible}
      role="status"
    >
      <FontAwesomeIcon
        icon={faSpinner}
        className="view-transition-overlay__spinner"
        spin
        size="2x"
      />
    </div>
  )
}

export default ViewTransitionOverlay
