// 添加性能监控
export function setupPerformanceMonitor() {
  // 监控页面加载时间
  const pageLoadTime = performance.now()
  // 监控内存使用
  const memoryInfo = performance.memory
  // 上报性能数据
  reportPerformance({
    pageLoadTime,
    memoryInfo
  })
} 