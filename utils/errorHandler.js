// 添加全局错误处理
export function setupErrorHandler() {
  uni.onError((err) => {
    console.error('Global Error:', err)
    // 上报错误到服务器
    reportError(err)
    // 显示用户友好的错误提示
    showErrorToast(err)
  })
} 