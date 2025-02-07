// 备份数据
export function backupData() {
  try {
    const data = {
      accounts: uni.getStorageSync('accounts'),
      categories: uni.getStorageSync('categories'),
      tags: uni.getStorageSync('tags'),
      budget: uni.getStorageSync('budget'),
      currency: uni.getStorageSync('currency'),
      settings: {
        darkMode: uni.getStorageSync('darkMode'),
        listAnimation: uni.getStorageSync('listAnimation'),
        thousandsSeparator: uni.getStorageSync('thousandsSeparator'),
        hideAmount: uni.getStorageSync('hideAmount')
      },
      backupTime: Date.now()
    }
    
    // 检查是否有数据需要备份
    if (!data.accounts?.length && !data.categories?.length) {
      uni.showToast({
        title: '暂无数据需要备份',
        icon: 'none'
      })
      return false
    }
    
    // 将数据转换为字符串
    const backupString = JSON.stringify(data)
    
    // 保存备份
    uni.setStorageSync('backup_data', data)
    
    // 记录备份时间
    uni.setStorageSync('lastBackupTime', Date.now())
    
    // 计算数据大小(以字符串长度估算)
    const size = (backupString.length / 1024).toFixed(2)
    uni.showToast({
      title: `已备份 ${size}KB 数据`,
      icon: 'success'
    })
    
    return true
  } catch (error) {
    console.error('备份失败:', error)
    uni.showToast({
      title: '备份失败: ' + error.message,
      icon: 'error'
    })
    return false
  }
}

// 恢复数据
export function restoreData() {
  try {
    const backup = uni.getStorageSync('backup_data')
    if (!backup) return false
    
    // 恢复账单数据
    if (backup.accounts) uni.setStorageSync('accounts', backup.accounts)
    if (backup.categories) uni.setStorageSync('categories', backup.categories)
    if (backup.tags) uni.setStorageSync('tags', backup.tags)
    if (backup.budget) uni.setStorageSync('budget', backup.budget)
    if (backup.currency) uni.setStorageSync('currency', backup.currency)
    
    // 恢复设置
    if (backup.settings) {
      const { darkMode, listAnimation, thousandsSeparator, hideAmount } = backup.settings
      if (darkMode !== undefined) uni.setStorageSync('darkMode', darkMode)
      if (listAnimation !== undefined) uni.setStorageSync('listAnimation', listAnimation)
      if (thousandsSeparator !== undefined) uni.setStorageSync('thousandsSeparator', thousandsSeparator)
      if (hideAmount !== undefined) uni.setStorageSync('hideAmount', hideAmount)
    }
    
    return true
  } catch (error) {
    console.error('恢复失败:', error)
    return false
  }
}

// 导出为CSV
export function exportToCSV(accounts) {
  const headers = ['日期', '时间', '分类', '金额', '备注', '标签']
  const rows = accounts.map(account => [
    new Date(account.createTime).toLocaleDateString(),
    new Date(account.createTime).toLocaleTimeString(),
    account.category,
    account.amount,
    account.note || '',
    account.tags?.join(',') || ''
  ])
  
  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')
  
  return csv
} 