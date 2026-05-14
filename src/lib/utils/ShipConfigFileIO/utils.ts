import {
  SHIP_CONFIG_FILE_ACCEPT,
  SHIP_CONFIG_FILE_EXTENSION,
  SHIP_CONFIG_FILE_NAME_PREFIX,
} from '@/lib/utils/ShipConfigFileIO/constants'

export const isAbortError = (error: unknown): boolean => {
  return (
    typeof DOMException !== 'undefined' &&
    error instanceof DOMException &&
    error.name === 'AbortError'
  )
}

export const createShipConfigFileName = (): string => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hour = String(now.getHours()).padStart(2, '0')
  const minute = String(now.getMinutes()).padStart(2, '0')
  const second = String(now.getSeconds()).padStart(2, '0')

  return `${SHIP_CONFIG_FILE_NAME_PREFIX}-${year}${month}${day}-${hour}${minute}${second}${SHIP_CONFIG_FILE_EXTENSION}`
}

export const downloadBlobFile = (blob: Blob, fileName: string) => {
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

export const requestFileFromInput = (): Promise<File | null> => {
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
