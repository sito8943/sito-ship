import type { FilePickerTypeLike } from '@/lib/utils/ShipConfigFileIO/types'

export const SHIP_CONFIG_FILE_MIME_TYPE = 'application/json'
export const SHIP_CONFIG_FILE_EXTENSION = '.json'
export const SHIP_CONFIG_FILE_ACCEPT = `${SHIP_CONFIG_FILE_EXTENSION},${SHIP_CONFIG_FILE_MIME_TYPE}`
export const SHIP_CONFIG_FILE_NAME_PREFIX = 'sito-ship-config'

export const SHIP_CONFIG_FILE_TYPES: FilePickerTypeLike[] = [
  {
    description: 'Ship config JSON',
    accept: {
      [SHIP_CONFIG_FILE_MIME_TYPE]: [SHIP_CONFIG_FILE_EXTENSION],
    },
  },
]
