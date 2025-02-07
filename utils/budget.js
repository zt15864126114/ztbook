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