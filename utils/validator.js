// 账单数据验证
export function validateAccount(account) {
  const errors = []
  
  // 验证必填字段
  if (!account.amount) {
    errors.push('金额不能为空')
  }
  if (!account.category) {
    errors.push('分类不能为空')
  }
  
  // 验证金额格式
  if (isNaN(Number(account.amount))) {
    errors.push('金额必须是数字')
  }
  if (Number(account.amount) <= 0) {
    errors.push('金额必须大于0')
  }
  
  // 验证日期
  if (account.createTime) {
    const date = new Date(account.createTime)
    if (isNaN(date.getTime())) {
      errors.push('日期格式不正确')
    }
    if (date > new Date()) {
      errors.push('日期不能超过今天')
    }
  }
  
  // 验证标签
  if (account.tags && !Array.isArray(account.tags)) {
    errors.push('标签必须是数组格式')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
} 