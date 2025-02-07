// 添加离线数据同步
export function setupOfflineSync() {
  // 监听网络状态
  uni.onNetworkStatusChange((res) => {
    if (res.isConnected) {
      // 同步离线数据
      syncOfflineData()
    }
  })
} 