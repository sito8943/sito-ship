import {
  SHIP_CONFIG_FILE_MIME_TYPE,
  SHIP_CONFIG_FILE_TYPES,
} from '@/lib/utils/ShipConfigFileIO/constants'
import type {
  WindowWithOpenFilePicker,
  WindowWithSaveFilePicker,
} from '@/lib/utils/ShipConfigFileIO/types'
import {
  createShipConfigFileName,
  downloadBlobFile,
  isAbortError,
  requestFileFromInput,
} from '@/lib/utils/ShipConfigFileIO/utils'

export const saveShipConfigJsonToFile = async (jsonPayload: string): Promise<void> => {
  if (typeof window === 'undefined') {
    return
  }

  const fileName = createShipConfigFileName()
  const blob = new Blob([jsonPayload], { type: SHIP_CONFIG_FILE_MIME_TYPE })
  const windowWithPicker = window as WindowWithSaveFilePicker

  if (typeof windowWithPicker.showSaveFilePicker === 'function') {
    try {
      const fileHandle = await windowWithPicker.showSaveFilePicker({
        suggestedName: fileName,
        types: SHIP_CONFIG_FILE_TYPES,
      })
      const writableStream = await fileHandle.createWritable()
      await writableStream.write(blob)
      await writableStream.close()
      return
    } catch (error) {
      if (isAbortError(error)) {
        return
      }
    }
  }

  downloadBlobFile(blob, fileName)
}

export const readShipConfigJsonFromFile = async (): Promise<string | null> => {
  if (typeof window === 'undefined') {
    return null
  }

  const windowWithPicker = window as WindowWithOpenFilePicker
  if (typeof windowWithPicker.showOpenFilePicker === 'function') {
    try {
      const fileHandles = await windowWithPicker.showOpenFilePicker({
        multiple: false,
        types: SHIP_CONFIG_FILE_TYPES,
      })
      const fileHandle = fileHandles[0]
      if (!fileHandle) {
        return null
      }

      try {
        const file = await fileHandle.getFile()
        return await file.text()
      } catch (error) {
        void error
        return null
      }
    } catch (error) {
      if (isAbortError(error)) {
        return null
      }
    }
  }

  const fallbackFile = await requestFileFromInput()
  if (!fallbackFile) {
    return null
  }

  try {
    return await fallbackFile.text()
  } catch (error) {
    void error
    return null
  }
}
