// 添加数据导出功能
export function exportData(format = 'csv') {
  switch (format) {
    case 'csv':
      return exportToCSV()
    case 'excel':
      return exportToExcel()
    case 'pdf':
      return exportToPDF()
  }
} 