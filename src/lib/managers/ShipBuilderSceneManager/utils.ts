import type { DisposableResource } from '@/lib/managers/ShipBuilderSceneManager/types'

export const isDisposableResource = (value: unknown): value is DisposableResource => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'dispose' in value &&
    typeof value.dispose === 'function'
  )
}
