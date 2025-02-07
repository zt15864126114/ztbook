import { onMounted, onUnmounted } from 'vue'

export function useGesture(options = {}) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50
  } = options
  
  let startX = 0
  let startY = 0
  let startTime = 0
  
  function onTouchStart(e) {
    startX = e.touches[0].clientX
    startY = e.touches[0].clientY
    startTime = Date.now()
  }
  
  function onTouchEnd(e) {
    const deltaX = e.changedTouches[0].clientX - startX
    const deltaY = e.changedTouches[0].clientY - startY
    const deltaTime = Date.now() - startTime
    
    if (deltaTime > 500) return // 超过500ms不算滑动
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0 && onSwipeRight) onSwipeRight()
        if (deltaX < 0 && onSwipeLeft) onSwipeLeft()
      }
    } else {
      if (Math.abs(deltaY) > threshold) {
        if (deltaY > 0 && onSwipeDown) onSwipeDown()
        if (deltaY < 0 && onSwipeUp) onSwipeUp()
      }
    }
  }
  
  return {
    onTouchStart,
    onTouchEnd
  }
} 