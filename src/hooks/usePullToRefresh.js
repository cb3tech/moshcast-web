import { useState, useEffect, useCallback } from 'react'

/**
 * Pull-to-refresh hook for mobile
 * Only triggers on touch devices, no impact on desktop
 * 
 * Usage:
 * const { isRefreshing, pullProgress, handlers } = usePullToRefresh(fetchData)
 * <div {...handlers}>content</div>
 */
export function usePullToRefresh(onRefresh, threshold = 80) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullProgress, setPullProgress] = useState(0)
  const [startY, setStartY] = useState(0)
  const [isPulling, setIsPulling] = useState(false)

  const handleTouchStart = useCallback((e) => {
    // Only activate if scrolled to top
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY)
      setIsPulling(true)
    }
  }, [])

  const handleTouchMove = useCallback((e) => {
    if (!isPulling || isRefreshing) return
    
    const currentY = e.touches[0].clientY
    const diff = currentY - startY
    
    // Only track downward pulls
    if (diff > 0) {
      const progress = Math.min(diff / threshold, 1)
      setPullProgress(progress)
    }
  }, [isPulling, isRefreshing, startY, threshold])

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return
    
    setIsPulling(false)
    
    if (pullProgress >= 1 && !isRefreshing) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
      }
    }
    
    setPullProgress(0)
  }, [isPulling, pullProgress, isRefreshing, onRefresh])

  // Reset on unmount
  useEffect(() => {
    return () => {
      setPullProgress(0)
      setIsRefreshing(false)
    }
  }, [])

  return {
    isRefreshing,
    pullProgress,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    }
  }
}

/**
 * Pull indicator component
 * Shows spinner/arrow based on pull state
 */
export function PullIndicator({ progress, isRefreshing }) {
  if (progress === 0 && !isRefreshing) return null
  
  return (
    <div 
      className="flex justify-center py-2 transition-opacity"
      style={{ opacity: Math.max(progress, isRefreshing ? 1 : 0) }}
    >
      {isRefreshing ? (
        <div className="w-6 h-6 border-2 border-mosh-accent border-t-transparent rounded-full animate-spin" />
      ) : (
        <div 
          className="w-6 h-6 text-mosh-accent transition-transform text-center"
          style={{ transform: `rotate(${progress * 180}deg)` }}
        >
          &#8595;
        </div>
      )}
    </div>
  )
}
