export function checkBudget(currentExpense, budget, notifyThresholds = [0.8, 0.9, 1]) {
  if (!budget) return null
  
  const usage = currentExpense / budget
  
  for (const threshold of notifyThresholds) {
    if (usage >= threshold) {
      return {
        threshold,
        usage: usage * 100,
        remaining: budget - currentExpense
      }
    }
  }
  
  return null
}

export function showBudgetNotification(budgetInfo) {
  if (!budgetInfo) return
  
  const { threshold, usage, remaining } = budgetInfo
  const message = threshold >= 1
    ? `您本月预算已用完！`
    : `您本月预算已使用${usage.toFixed(1)}%，剩余￥${remaining.toFixed(2)}`
  
  uni.showModal({
    title: '预算提醒',
    content: message,
    showCancel: false
  })
}

// 检查预算使用情况并提醒
export function checkBudgetAndNotify() {
  const budget = uni.getStorageSync('budget')
  if (!budget) return // 如果没有设置预算，直接返回
  
  // 获取当月支出
  const accounts = uni.getStorageSync('accounts') || []
  const now = new Date()
  const currentMonthExpense = accounts
    .filter(account => {
      const date = new Date(account.createTime)
      return date.getMonth() === now.getMonth() && 
             date.getFullYear() === now.getFullYear()
    })
    .reduce((total, account) => total + Number(account.amount), 0)
  
  // 计算使用比例
  const usagePercentage = (currentMonthExpense / budget) * 100
  
  // 设置提醒阈值
  const thresholds = [
    { value: 80, message: '预算已使用80%，请注意控制支出' },
    { value: 90, message: '预算已使用90%，建议减少非必要支出' },
    { value: 100, message: '已超出预算，请合理安排支出' }
  ]
  
  // 检查是否需要提醒
  for (const { value, message } of thresholds) {
    if (usagePercentage >= value) {
      // 检查是否已经提醒过
      const lastNotifyTime = uni.getStorageSync(`budget_notify_${value}`)
      const now = Date.now()
      
      // 每个阈值每月只提醒一次
      if (!lastNotifyTime || isNewMonth(lastNotifyTime)) {
        uni.showModal({
          title: '预算提醒',
          content: message + `\n\n当前支出：¥${currentMonthExpense.toFixed(2)}\n预算金额：¥${budget.toFixed(2)}`,
          confirmText: '知道了',
          showCancel: false,
          success: () => {
            // 记录提醒时间
            uni.setStorageSync(`budget_notify_${value}`, now)
          }
        })
        break // 只显示最高级别的提醒
      }
    }
  }
}

// 检查是否是新的月份
function isNewMonth(timestamp) {
  const date = new Date(timestamp)
  const now = new Date()
  return date.getMonth() !== now.getMonth() || 
         date.getFullYear() !== now.getFullYear()
}

// 获取预算使用情况
export function getBudgetUsage() {
  const budget = uni.getStorageSync('budget')
  if (!budget) return null
  
  const accounts = uni.getStorageSync('accounts') || []
  const now = new Date()
  const currentMonthExpense = accounts
    .filter(account => {
      const date = new Date(account.createTime)
      return date.getMonth() === now.getMonth() && 
             date.getFullYear() === now.getFullYear()
    })
    .reduce((total, account) => total + Number(account.amount), 0)
  
  return {
    budget,
    currentExpense: currentMonthExpense,
    remaining: budget - currentMonthExpense,
    percentage: (currentMonthExpense / budget) * 100
  }
} 