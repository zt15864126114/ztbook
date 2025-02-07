import { formatDate } from './date'

// 按日期分组账单
export function groupByDate(bills) {
  const groups = {}
  bills.forEach(bill => {
    const date = formatDate(bill.createTime)
    if (!groups[date]) {
      groups[date] = {
        bills: [],
        total: 0
      }
    }
    groups[date].bills.push(bill)
    groups[date].total += Number(bill.amount)
  })
  
  // 格式化总金额
  Object.values(groups).forEach(group => {
    group.total = group.total.toFixed(2)
  })
  
  return groups
}

// 按分类统计
export function analyzeByCategory(bills) {
  const stats = {}
  bills.forEach(bill => {
    if (!stats[bill.category]) {
      stats[bill.category] = {
        amount: 0,
        count: 0
      }
    }
    stats[bill.category].amount += Number(bill.amount)
    stats[bill.category].count += 1
  })
  
  const total = Object.values(stats).reduce((sum, item) => sum + item.amount, 0)
  
  return Object.entries(stats).map(([category, data]) => ({
    category,
    amount: data.amount.toFixed(2),
    count: data.count,
    percentage: total ? ((data.amount / total) * 100).toFixed(1) : '0.0'
  }))
}

// 分析消费趋势
export function analyzeTrend(bills, type = 'day') {
  const trend = {}
  
  bills.forEach(bill => {
    const date = new Date(bill.createTime)
    let key
    
    switch(type) {
      case 'day':
        key = formatDate(date)
        break
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        break
      case 'year':
        key = date.getFullYear().toString()
        break
    }
    
    if (!trend[key]) {
      trend[key] = 0
    }
    trend[key] += Number(bill.amount)
  })
  
  return Object.entries(trend).map(([date, amount]) => ({
    date,
    amount: amount.toFixed(2)
  }))
}

// 计算统计指标
export function calculateMetrics(bills) {
  if (!bills.length) {
    return {
      total: '0.00',
      average: '0.00',
      max: '0.00',
      min: '0.00',
      count: 0,
      daysCount: 0
    }
  }
  
  const amounts = bills.map(bill => Number(bill.amount))
  const total = amounts.reduce((sum, amount) => sum + amount, 0)
  
  // 计算记账天数
  const days = new Set(bills.map(bill => formatDate(bill.createTime)))
  
  return {
    total: total.toFixed(2),
    average: (total / bills.length).toFixed(2),
    max: Math.max(...amounts).toFixed(2),
    min: Math.min(...amounts).toFixed(2),
    count: bills.length,
    daysCount: days.size
  }
}

// 分析标签
export function analyzeByTags(bills) {
  const stats = {}
  
  bills.forEach(bill => {
    if (!bill.tags) return
    
    bill.tags.forEach(tag => {
      if (!stats[tag]) {
        stats[tag] = {
          amount: 0,
          count: 0
        }
      }
      stats[tag].amount += Number(bill.amount)
      stats[tag].count += 1
    })
  })
  
  const total = Object.values(stats).reduce((sum, item) => sum + item.amount, 0)
  
  return Object.entries(stats).map(([tag, data]) => ({
    tag,
    amount: data.amount.toFixed(2),
    count: data.count,
    percentage: total ? ((data.amount / total) * 100).toFixed(1) : '0.0'
  }))
}

// 预算分析
export function analyzeBudget(bills, budget) {
  if (!budget) return null
  
  const total = bills.reduce((sum, bill) => sum + Number(bill.amount), 0)
  const percentage = (total / budget) * 100
  
  return {
    total: total.toFixed(2),
    budget: budget.toFixed(2),
    remaining: (budget - total).toFixed(2),
    percentage: percentage.toFixed(1),
    isOverBudget: total > budget
  }
} 