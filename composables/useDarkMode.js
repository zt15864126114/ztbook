import { ref, watchEffect } from 'vue'

export function useDarkMode() {
  const darkMode = ref(uni.getStorageSync('darkMode') || false)
  
  watchEffect(() => {
    // 监听深色模式变化
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    if (currentPage?.$vm) {
      currentPage.$vm.darkMode = darkMode.value
    }
    
    // 更新导航栏和底部标签栏样式
    if (darkMode.value) {
      uni.setNavigationBarColor({
        frontColor: '#ffffff',
        backgroundColor: '#2d2d2d'
      })
      uni.setTabBarStyle({
        backgroundColor: '#2d2d2d',
        borderStyle: 'black',
        color: '#8F8F8F',
        selectedColor: '#3498db'
      })
    } else {
      uni.setNavigationBarColor({
        frontColor: '#000000',
        backgroundColor: '#ffffff'
      })
      uni.setTabBarStyle({
        backgroundColor: '#ffffff',
        borderStyle: 'white',
        color: '#8F8F8F',
        selectedColor: '#3498db'
      })
    }
  })
  
  return {
    darkMode
  }
} 