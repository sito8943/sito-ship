export type RendererQualityTier = 'low' | 'high'

export interface RendererQualityProfile {
  tier: RendererQualityTier
  maxPixelRatio: number
  bloomEnabled: boolean
  outlineEnabled: boolean
}

const HIGH_PROFILE: RendererQualityProfile = {
  tier: 'high',
  maxPixelRatio: 1.5,
  bloomEnabled: true,
  outlineEnabled: true,
}

const LOW_PROFILE: RendererQualityProfile = {
  tier: 'low',
  maxPixelRatio: 1.0,
  bloomEnabled: false,
  outlineEnabled: false,
}

export const getRendererQualityProfile = (): RendererQualityProfile => {
  if (typeof window === 'undefined') {
    return HIGH_PROFILE
  }
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches
  const narrowViewport = window.matchMedia('(max-width: 900px)').matches
  if (coarsePointer || narrowViewport) {
    return LOW_PROFILE
  }
  return HIGH_PROFILE
}
