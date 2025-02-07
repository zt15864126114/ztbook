import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    darkMode: uni.getStorageSync('darkMode') || false
  }),
  
  actions: {
    toggleDarkMode(value) {
      this.darkMode = value
      uni.setStorageSync('darkMode', value)
      
      // 更新导航栏和底部标签栏样式
      if (value) {
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
    }
  }
}) 