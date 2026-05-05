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
  return (
    <Button
      {...restProps}
      className={joinClassNames('ui-icon-button', className)}
      aria-label={label}
      title={title ?? label}
    >
      <FontAwesomeIcon icon={icon} fixedWidth />
    </Button>
  )
}

export default IconButton
