import App from './App'
import { createPinia } from 'pinia'
import { createSSRApp } from 'vue'

// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'
Vue.config.productionTip = false
App.mpType = 'app'
const app = new Vue({
  ...App
})
app.$mount()
// #endif

// #ifdef VUE3
export function createApp() {
  const app = createSSRApp(App)
  
  // 引入 pinia
  const pinia = createPinia()
  app.use(pinia)
  
  return {
    app
  }
}
// #endif