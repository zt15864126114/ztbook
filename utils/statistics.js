// 计算月度统计数据
export function calculateMonthlyStats(accounts, year, month) {
  const monthlyAccounts = accounts.filter(account => {
    const date = new Date(account.createTime)
    return date.getFullYear() === year && date.getMonth() + 1 === month
  })
  
  const stats = {
    total: 0,
    dailyAverage: 0,
    maxExpense: 0,
    recordDays: new Set(),
    categoryStats: {},
    dayStats: {}
  }
  
  monthlyAccounts.forEach(account => {
    const amount = Number(account.amount)
    const date = new Date(account.createTime)
    const day = date.getDate()
    
    // 更新总支出
    stats.total += amount
    
    // 更新最大支出
    stats.maxExpense = Math.max(stats.maxExpense, amount)
    
    // 更新记账天数
    stats.recordDays.add(day)
    
    // 更新分类统计
    if (!stats.categoryStats[account.category]) {
      stats.categoryStats[account.category] = {
        amount: 0,
        count: 0
      }
    }
    stats.categoryStats[account.category].amount += amount
    stats.categoryStats[account.category].count++
    
    // 更新日支出统计
    if (!stats.dayStats[day]) {
      stats.dayStats[day] = 0
    }
    stats.dayStats[day] += amount
  })
  
  // 计算日均支出
  const daysInMonth = new Date(year, month, 0).getDate()
  stats.dailyAverage = stats.total / daysInMonth
  
  return stats
}

// 计算年度统计数据
export function calculateYearlyStats(accounts, year) {
  // ... 类似的统计逻辑
}

// 计算标签统计数据
export function calculateTagStats(accounts) {
  const tagStats = {}
  
  accounts.forEach(account => {
    account.tags?.forEach(tag => {
      if (!tagStats[tag]) {
        tagStats[tag] = {
          amount: 0,
          count: 0
        }
      }
      tagStats[tag].amount += Number(account.amount)
      tagStats[tag].count++
    })
  })
  
  return tagStats
} 