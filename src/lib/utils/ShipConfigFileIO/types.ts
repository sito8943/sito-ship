export type FilePickerTypeLike = {
  description?: string
  accept: Record<string, string[]>
}

export type SaveFilePickerOptionsLike = {
  suggestedName?: string
  types?: FilePickerTypeLike[]
  excludeAcceptAllOption?: boolean
}

export type OpenFilePickerOptionsLike = {
  multiple?: boolean
  types?: FilePickerTypeLike[]
  excludeAcceptAllOption?: boolean
}

export type WritableFileStreamLike = {
  write: (data: Blob) => Promise<void>
  close: () => Promise<void>
}

export type SaveFileHandleLike = {
  createWritable: () => Promise<WritableFileStreamLike>
}

export type OpenFileHandleLike = {
  getFile: () => Promise<File>
}

export type WindowWithSaveFilePicker = Window & {
  showSaveFilePicker?: (options?: SaveFilePickerOptionsLike) => Promise<SaveFileHandleLike>
}

export type WindowWithOpenFilePicker = Window & {
  showOpenFilePicker?: (options?: OpenFilePickerOptionsLike) => Promise<OpenFileHandleLike[]>
}
