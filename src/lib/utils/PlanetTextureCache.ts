import { SRGBColorSpace, Texture, TextureLoader } from 'three'

const loader = new TextureLoader()
const cache = new Map<string, Texture>()
const pending = new Map<string, Promise<Texture>>()

export function getCachedPlanetTexture(url: string): Texture | undefined {
  return cache.get(url)
}

export function loadPlanetTexture(url: string): Promise<Texture> {
  const cached = cache.get(url)
  if (cached) {
    return Promise.resolve(cached)
  }

  const inflight = pending.get(url)
  if (inflight) {
    return inflight
  }

  const promise = new Promise<Texture>((resolve, reject) => {
    loader.load(
      url,
      (texture) => {
        texture.colorSpace = SRGBColorSpace
        cache.set(url, texture)
        pending.delete(url)
        resolve(texture)
      },
      undefined,
      (error) => {
        pending.delete(url)
        reject(error)
      }
    )
  })

  pending.set(url, promise)
  return promise
}
