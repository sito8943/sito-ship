const BASE_URL = 'https://ik.imagekit.io/lgqp0wffgtp/sito-ship/'

export const PLANET_TEXTURE_URLS = [
  BASE_URL + 'ChatGPT%20Image%20May%2013,%202026,%2007_36_21%20PM_re0QT9b_7.png',
  BASE_URL + 'ChatGPT%20Image%20May%2013,%202026,%2007_31_43%20PM_BGSEvPQVP.png',
  BASE_URL + 'ChatGPT%20Image%20May%2013,%202026,%2007_39_05%20PM_fNlA6R_BR.png',
  BASE_URL + 'ChatGPT%20Image%20May%2013,%202026,%2007_32_57%20PM_Rz9N07Yv-.png',
  BASE_URL + 'ChatGPT%20Image%20May%2013,%202026,%2007_34_15%20PM_lMwVUbdt9.png',
] as const

// Optional 1k HDR for builder PBR reflections on metallic ship parts.
// Leave empty to skip and rely on the 3-light setup (key/rim/fill).
// When provided, the builder scene loads it lazily and assigns it to `scene.environment`.
// Example: BASE_URL + 'studio-1k.hdr'
export const BUILDER_ENVIRONMENT_HDR_URL = ''
