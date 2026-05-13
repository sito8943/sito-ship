import type { IconProp } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Button, { type ButtonProps } from '@/components/ui/Button'

export type IconButtonProps = Omit<ButtonProps, 'children' | 'aria-label'> & {
  icon: IconProp
  label: string
}

const joinClassNames = (...classes: Array<string | undefined | null | false>) => {
  return classes.filter(Boolean).join(' ')
}

const IconButton = ({ icon, label, className, title, ...restProps }: IconButtonProps) => {
  const tooltipText = title ?? label

  return (
    <span className="ui-icon-button-tooltip" data-tooltip={tooltipText} title={tooltipText}>
      <Button
        {...restProps}
        className={joinClassNames('ui-icon-button', className)}
        aria-label={label}
      >
        <FontAwesomeIcon icon={icon} fixedWidth />
      </Button>
    </span>
  )
}

export default IconButton
