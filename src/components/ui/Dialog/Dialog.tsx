import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Button from '@/components/ui/Button'
import {
  DIALOG_CLOSE_BUTTON_LABEL,
  DIALOG_TRANSITION_DURATION_MS,
} from '@/components/ui/Dialog/constants'
import type { DialogProps } from '@/components/ui/Dialog/types'
import {
  getBackdropVisibilityClassName,
  getDialogVisibilityClassName,
  isBackdropClick,
  isEscapeKeyboardEvent,
  joinClassNames,
} from '@/components/ui/Dialog/utils'

const Dialog = ({ isOpen, title, onClose, children, footer, className }: DialogProps) => {
  const titleId = useId()
  const closeTimeoutIdRef = useRef<number | null>(null)
  const enterAnimationFrameIdRef = useRef<number | null>(null)
  const enterAnimationFrameCommitIdRef = useRef<number | null>(null)
  const [isMounted, setIsMounted] = useState(isOpen)
  const [isVisible, setIsVisible] = useState(isOpen)

  useEffect(() => {
    return () => {
      if (closeTimeoutIdRef.current !== null) {
        window.clearTimeout(closeTimeoutIdRef.current)
      }

      if (enterAnimationFrameIdRef.current !== null) {
        window.cancelAnimationFrame(enterAnimationFrameIdRef.current)
      }

      if (enterAnimationFrameCommitIdRef.current !== null) {
        window.cancelAnimationFrame(enterAnimationFrameCommitIdRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (closeTimeoutIdRef.current !== null) {
      window.clearTimeout(closeTimeoutIdRef.current)
      closeTimeoutIdRef.current = null
    }

    if (enterAnimationFrameIdRef.current !== null) {
      window.cancelAnimationFrame(enterAnimationFrameIdRef.current)
      enterAnimationFrameIdRef.current = null
    }

    if (enterAnimationFrameCommitIdRef.current !== null) {
      window.cancelAnimationFrame(enterAnimationFrameCommitIdRef.current)
      enterAnimationFrameCommitIdRef.current = null
    }

    if (isOpen) {
      setIsMounted(true)
      setIsVisible(false)

      enterAnimationFrameIdRef.current = window.requestAnimationFrame(() => {
        enterAnimationFrameIdRef.current = null
        enterAnimationFrameCommitIdRef.current = window.requestAnimationFrame(() => {
          setIsVisible(true)
          enterAnimationFrameCommitIdRef.current = null
        })
      })

      return
    }

    setIsVisible(false)
    closeTimeoutIdRef.current = window.setTimeout(() => {
      setIsMounted(false)
      closeTimeoutIdRef.current = null
    }, DIALOG_TRANSITION_DURATION_MS)
  }, [isOpen])

  useEffect(() => {
    if (!isMounted) {
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
  }, [isMounted, onClose])

  if (!isMounted) {
    return null
  }

  return createPortal(
    <div
      className={joinClassNames('ui-dialog-backdrop', getBackdropVisibilityClassName(isVisible))}
      onClick={(event) => {
        if (isBackdropClick(event)) {
          onClose()
        }
      }}
    >
      <section
        className={joinClassNames('ui-dialog', getDialogVisibilityClassName(isVisible), className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
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
