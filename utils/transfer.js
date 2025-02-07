import { formatDate, formatTime } from './date'

// 导出为JSON格式
export function exportToJSON(data) {
  try {
    return JSON.stringify(data, null, 2)
  } catch (error) {
    console.error('导出JSON失败:', error)
    return null
  }
}

// 从JSON导入
export function importFromJSON(jsonString) {
  try {
    const data = JSON.parse(jsonString)
    // 验证数据格式
    if (!validateImportData(data)) {
      throw new Error('数据格式不正确')
    }
    return data
  } catch (error) {
    console.error('导入JSON失败:', error)
    return null
  }
}

// 导出为Excel格式
export function exportToExcel(accounts) {
  try {
    const headers = [
      '日期',
      '时间',
      '分类',
      '金额',
      '备注',
      '标签',
      '创建时间',
      '更新时间'
    ]
    
    const rows = accounts.map(account => [
      formatDate(account.createTime),
      formatTime(account.createTime),
      account.category,
      account.amount,
      account.note || '',
      account.tags?.join('|') || '',
      formatDate(account.createTime),
      account.updateTime ? formatDate(account.updateTime) : ''
    ])
    
    // 添加表头
    rows.unshift(headers)
    
    // 生成Excel内容
    const content = rows.map(row => row.join('\t')).join('\n')
    
    return content
  } catch (error) {
    console.error('导出Excel失败:', error)
    return null
  }
}

// 从Excel导入
export function importFromExcel(content) {
  try {
    const rows = content.split('\n')
    const headers = rows[0].split('\t')
    
    // 验证表头
    if (!validateExcelHeaders(headers)) {
      throw new Error('Excel格式不正确')
    }
    
    const accounts = rows.slice(1).map(row => {
      const cols = row.split('\t')
      return {
        createTime: new Date(`${cols[0]} ${cols[1]}`),
        category: cols[2],
        amount: Number(cols[3]),
        note: cols[4],
        tags: cols[5] ? cols[5].split('|') : [],
        updateTime: cols[7] ? new Date(cols[7]) : null
      }
    })
    
    return accounts
  } catch (error) {
    console.error('导入Excel失败:', error)
    return null
  }
}

// 验证导入的数据格式
function validateImportData(data) {
  if (!Array.isArray(data)) return false
  
  return data.every(item => (
    item.createTime &&
    item.category &&
    typeof item.amount === 'number' &&
    !isNaN(item.amount)
  ))
}

// 验证Excel表头
function validateExcelHeaders(headers) {
  const requiredHeaders = ['日期', '时间', '分类', '金额']
  return requiredHeaders.every(header => headers.includes(header))
}

// 导出为HTML格式（用于打印）
export function exportToHTML(accounts) {
  try {
    const template = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>账单明细</title>
        <style>
          body { font-family: sans-serif; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 8px; border: 1px solid #ddd; }
          th { background: #f5f5f5; }
          .amount { text-align: right; }
          .footer { margin-top: 20px; text-align: right; }
        </style>
      </head>
      <body>
        <h1>账单明细</h1>
        <table>
          <thead>
            <tr>
              <th>日期</th>
              <th>分类</th>
              <th>金额</th>
              <th>备注</th>
              <th>标签</th>
            </tr>
          </thead>
          <tbody>
            ${accounts.map(account => `
              <tr>
                <td>${formatDate(account.createTime)}</td>
                <td>${account.category}</td>
                <td class="amount">${account.amount.toFixed(2)}</td>
                <td>${account.note || ''}</td>
                <td>${account.tags?.join(', ') || ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          <p>总计: ${accounts.reduce((sum, account) => sum + Number(account.amount), 0).toFixed(2)}</p>
          <p>导出时间: ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `
    
    return template
  } catch (error) {
    console.error('导出HTML失败:', error)
    return null
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

// 从CSV导入
export function importFromCSV(csvContent) {
  const lines = csvContent.split('\n')
  const headers = lines[0].split(',')
  const accounts = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',')
    if (values.length !== headers.length) continue
    
    const account = {
      createTime: new Date(`${values[0]} ${values[1]}`).getTime(),
      category: values[2],
      amount: Number(values[3]),
      note: values[4],
      tags: values[5] ? values[5].split('|') : [],
      id: Date.now() + i
    }
    accounts.push(account)
  }
  
  return accounts
} 