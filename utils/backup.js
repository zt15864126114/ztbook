// 备份数据
export async function backupData() {
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
    
    const json = JSON.stringify(data)
    const size = (json.length / 1024).toFixed(2)
    
    // 保存文件
    const fileName = `backup_${new Date().toISOString().split('T')[0]}.json`
    return new Promise((resolve, reject) => {
      uni.saveFile({
        tempFilePath: URL.createObjectURL(new Blob([json], { type: 'application/json' })),
        success(res) {
          uni.showToast({
            title: `已备份 ${size}KB 数据`,
            icon: 'success'
          })
          resolve(res.savedFilePath)
        },
        fail(err) {
          reject(err)
        }
      })
    })
  } catch (err) {
    console.error('备份失败', err)
    uni.showToast({
      title: '备份失败',
      icon: 'error'
    })
    throw err
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