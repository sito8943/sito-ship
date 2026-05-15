import { PMREMGenerator, Texture, WebGLRenderer } from 'three'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'

const loader = new RGBELoader()
const cache = new Map<string, Texture>()
const pending = new Map<string, Promise<Texture>>()

export const loadBuilderEnvironmentMap = (
  renderer: WebGLRenderer,
  url: string
): Promise<Texture> => {
  const cached = cache.get(url)
  if (cached) {
    return Promise.resolve(cached)
  }

  const inflight = pending.get(url)
  if (inflight) {
    return inflight
  }

  const pmrem = new PMREMGenerator(renderer)
  const promise = new Promise<Texture>((resolve, reject) => {
    loader.load(
      url,
      (hdr) => {
        const envMap = pmrem.fromEquirectangular(hdr).texture
        hdr.dispose()
        pmrem.dispose()
        cache.set(url, envMap)
        pending.delete(url)
        resolve(envMap)
      },
      undefined,
      (error) => {
        pmrem.dispose()
        pending.delete(url)
        reject(
          error instanceof Error
            ? error
            : new Error(`Failed to load builder environment HDR from "${url}".`)
        )
      }
    )
  })

  pending.set(url, promise)
  return promise
}
