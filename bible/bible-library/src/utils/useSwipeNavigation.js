import { useRef, useCallback } from 'react'

const MIN_DISTANCE = 70 // px -- has to be a deliberate swipe, not a stray drag
const MAX_VERTICAL_RATIO = 0.5 // vertical movement must stay well under horizontal

/**
 * Returns onTouchStart/onTouchMove/onTouchEnd handlers that call
 * onSwipeLeft/onSwipeRight after a clearly horizontal swipe. Mostly-
 * vertical gestures (scrolling) are ignored so this doesn't fight with
 * normal page scroll.
 */
export function useSwipeNavigation({ onSwipeLeft, onSwipeRight }) {
  const start = useRef(null)

  const onTouchStart = useCallback((e) => {
    const t = e.touches[0]
    start.current = { x: t.clientX, y: t.clientY }
  }, [])

  const onTouchEnd = useCallback(
    (e) => {
      if (!start.current) return
      const t = e.changedTouches[0]
      const dx = t.clientX - start.current.x
      const dy = t.clientY - start.current.y
      start.current = null

      if (Math.abs(dx) < MIN_DISTANCE) return
      if (Math.abs(dy) > Math.abs(dx) * MAX_VERTICAL_RATIO) return // too vertical -- was a scroll

      if (dx < 0) onSwipeLeft?.() // swiped left -> reveal next (next chapter)
      else onSwipeRight?.() // swiped right -> reveal previous (previous chapter)
    },
    [onSwipeLeft, onSwipeRight]
  )

  const onTouchCancel = useCallback(() => {
    start.current = null
  }, [])

  return { onTouchStart, onTouchEnd, onTouchCancel }
}
