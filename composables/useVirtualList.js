import { ref, computed } from 'vue'

export function useVirtualList(sourceData, options = {}) {
  const {
    itemHeight = 100,
    overscan = 5,
    containerHeight = 667
  } = options
  
  const startIndex = ref(0)
  const endIndex = ref(0)
  const scrollTop = ref(0)
  
  const visibleCount = computed(() => Math.ceil(containerHeight / itemHeight))
  
  const list = computed(() => {
    const start = Math.max(0, startIndex.value - overscan)
    const end = Math.min(sourceData.value.length, endIndex.value + overscan)
    return sourceData.value.slice(start, end).map((item, index) => ({
      ...item,
      _index: start + index,
      _style: {
        height: `${itemHeight}px`,
        transform: `translateY(${(start + index) * itemHeight}px)`
      }
    }))
  })
  
  function onScroll(e) {
    scrollTop.value = e.detail.scrollTop
    startIndex.value = Math.floor(scrollTop.value / itemHeight)
    endIndex.value = startIndex.value + visibleCount.value
  }
  
  return {
    list,
    onScroll,
    containerStyle: {
      height: `${sourceData.value.length * itemHeight}px`
    }
  }
} 