const SHIP_CONFIG_FILE_MIME_TYPE = 'application/json'
const SHIP_CONFIG_FILE_EXTENSION = '.json'
const SHIP_CONFIG_FILE_ACCEPT = `${SHIP_CONFIG_FILE_EXTENSION},${SHIP_CONFIG_FILE_MIME_TYPE}`
const SHIP_CONFIG_FILE_NAME_PREFIX = 'sito-ship-config'

type FilePickerTypeLike = {
  description?: string
  accept: Record<string, string[]>
}

type SaveFilePickerOptionsLike = {
  suggestedName?: string
  types?: FilePickerTypeLike[]
  excludeAcceptAllOption?: boolean
}

type OpenFilePickerOptionsLike = {
  multiple?: boolean
  types?: FilePickerTypeLike[]
  excludeAcceptAllOption?: boolean
}

type WritableFileStreamLike = {
  write: (data: Blob) => Promise<void>
  close: () => Promise<void>
}

type SaveFileHandleLike = {
  createWritable: () => Promise<WritableFileStreamLike>
}

type OpenFileHandleLike = {
  getFile: () => Promise<File>
}

type WindowWithSaveFilePicker = Window & {
  showSaveFilePicker?: (options?: SaveFilePickerOptionsLike) => Promise<SaveFileHandleLike>
}

type WindowWithOpenFilePicker = Window & {
  showOpenFilePicker?: (options?: OpenFilePickerOptionsLike) => Promise<OpenFileHandleLike[]>
}

const SHIP_CONFIG_FILE_TYPES: FilePickerTypeLike[] = [
  {
    description: 'Ship config JSON',
    accept: {
      [SHIP_CONFIG_FILE_MIME_TYPE]: [SHIP_CONFIG_FILE_EXTENSION],
    },
  },
]

const isAbortError = (error: unknown): boolean => {
  return (
    typeof DOMException !== 'undefined' &&
    error instanceof DOMException &&
    error.name === 'AbortError'
  )
}

const createShipConfigFileName = (): string => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hour = String(now.getHours()).padStart(2, '0')
  const minute = String(now.getMinutes()).padStart(2, '0')
  const second = String(now.getSeconds()).padStart(2, '0')

  return `${SHIP_CONFIG_FILE_NAME_PREFIX}-${year}${month}${day}-${hour}${minute}${second}${SHIP_CONFIG_FILE_EXTENSION}`
}

const downloadBlobFile = (blob: Blob, fileName: string) => {
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = fileName
  anchor.style.display = 'none'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl)
  }, 0)
}

const requestFileFromInput = (): Promise<File | null> => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve(null)
  }

  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = SHIP_CONFIG_FILE_ACCEPT
    input.style.display = 'none'
    document.body.append(input)

    let settled = false
    const finalize = (file: File | null) => {
      if (settled) {
        return
      }

      settled = true
      window.removeEventListener('focus', handleWindowFocus)
      input.remove()
      resolve(file)
    }

    const handleWindowFocus = () => {
      window.setTimeout(() => {
        const selectedFile = input.files?.[0] ?? null
        if (!selectedFile) {
          finalize(null)
        }
      }, 0)
    }

    input.addEventListener(
      'change',
      () => {
        const selectedFile = input.files?.[0] ?? null
        finalize(selectedFile)
      },
      { once: true }
    )

    window.addEventListener('focus', handleWindowFocus, { once: true })
    input.click()
  })
}

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
