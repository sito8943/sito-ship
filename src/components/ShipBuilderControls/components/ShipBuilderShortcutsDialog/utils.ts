export const splitShortcutKeys = (shortcutKeys: string): string[] => {
  return shortcutKeys.split('+').map((keyPart) => keyPart.trim())
}
