import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

type ButtonVariant = 'solid' | 'ghost'
type ButtonSize = 'sm' | 'md'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
}

const BUTTON_VARIANT_CLASS: Record<ButtonVariant, string> = {
  solid: 'ui-button--solid',
  ghost: 'ui-button--ghost',
}

const BUTTON_SIZE_CLASS: Record<ButtonSize, string> = {
  sm: 'ui-button--sm',
  md: 'ui-button--md',
}

const joinClassNames = (...classes: Array<string | undefined | null | false>) => {
  return classes.filter(Boolean).join(' ')
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      type = 'button',
      variant = 'solid',
      size = 'md',
      leadingIcon,
      trailingIcon,
      className,
      children,
      ...restProps
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        className={joinClassNames(
          'ui-button',
          BUTTON_VARIANT_CLASS[variant],
          BUTTON_SIZE_CLASS[size],
          className
        )}
        {...restProps}
      >
        {leadingIcon ? <span className="ui-button__icon">{leadingIcon}</span> : null}
        {children ? <span className="ui-button__label">{children}</span> : null}
        {trailingIcon ? <span className="ui-button__icon">{trailingIcon}</span> : null}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
