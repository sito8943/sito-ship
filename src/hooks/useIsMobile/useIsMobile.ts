import { useEffect, useState } from 'react'

const MOBILE_QUERY = '(max-width: 900px)'

export const useIsMobile = (): boolean => {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false
    }
    return window.matchMedia(MOBILE_QUERY).matches
  })

  useEffect(() => {
    const mediaQueryList = window.matchMedia(MOBILE_QUERY)
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches)
    }
    mediaQueryList.addEventListener('change', handleChange)
    setIsMobile(mediaQueryList.matches)
    return () => {
      mediaQueryList.removeEventListener('change', handleChange)
    }
  }, [])

  return isMobile
}
