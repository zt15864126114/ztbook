// 格式化金额，添加千分位
export function formatAmount(amount, separator = true) {
  if (!amount) return '0.00'
  const num = Number(amount).toFixed(2)
  
  if (!separator) return num
  
  const parts = num.split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return parts.join('.')
}

// 格式化百分比
export function formatPercentage(value, decimals = 1) {
  if (!value) return '0%'
  return Number(value).toFixed(decimals) + '%'
}

// 格式化大数字（k, m, b）
export function formatLargeNumber(num) {
  if (num < 1000) return num
  if (num < 1000000) return (num / 1000).toFixed(1) + 'k'
  if (num < 1000000000) return (num / 1000000).toFixed(1) + 'm'
  return (num / 1000000000).toFixed(1) + 'b'
} 