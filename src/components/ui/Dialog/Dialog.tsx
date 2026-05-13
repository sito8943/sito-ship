import { useEffect, useId } from 'react'
import { createPortal } from 'react-dom'
import Button from '@/components/ui/Button'
import { DIALOG_CLOSE_BUTTON_LABEL } from '@/components/ui/Dialog/constants'
import type { DialogProps } from '@/components/ui/Dialog/types'
import { isBackdropClick, isEscapeKeyboardEvent, joinClassNames } from '@/components/ui/Dialog/utils'

const Dialog = ({ isOpen, title, onClose, children, footer, className }: DialogProps) => {
  const titleId = useId()

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const previousBodyOverflow = document.body.style.overflow
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isEscapeKeyboardEvent(event)) {
        return
      }

      event.preventDefault()
      onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousBodyOverflow
    }
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  return createPortal(
    <div
      className="ui-dialog-backdrop"
      onClick={(event) => {
        if (isBackdropClick(event)) {
          onClose()
        }
      }}
    >
      <section className={joinClassNames('ui-dialog', className)} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="ui-dialog__header">
          <h2 id={titleId} className="ui-dialog__title">
            {title}
          </h2>
          <Button
            className="ui-dialog__close-button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label={DIALOG_CLOSE_BUTTON_LABEL}
            title={DIALOG_CLOSE_BUTTON_LABEL}
          >
            {DIALOG_CLOSE_BUTTON_LABEL}
          </Button>
        </header>
        <div className="ui-dialog__content">{children}</div>
        {footer ? <footer className="ui-dialog__footer">{footer}</footer> : null}
      </section>
    </div>,
    document.body
  )
}

export default Dialog

