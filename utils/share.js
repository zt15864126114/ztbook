export function shareStatistics(data) {
  // 生成分享图片
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  
  // 设置画布尺寸
  canvas.width = 750
  canvas.height = 1334
  
  // 绘制背景
  ctx.fillStyle = data.darkMode ? '#121212' : '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  // 绘制标题
  ctx.fillStyle = data.darkMode ? '#eeeeee' : '#333333'
  ctx.font = 'bold 48px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('月度账单统计', canvas.width / 2, 100)
  
  // 绘制月份和总支出
  ctx.font = '36px sans-serif'
  ctx.fillText(`${data.year}年${data.month}月`, canvas.width / 2, 160)
  ctx.fillText(`总支出: ${data.currency}${data.total}`, canvas.width / 2, 220)
  
  // 绘制饼图
  const pieChart = data.pieChart
  if (pieChart) {
    ctx.drawImage(pieChart, 50, 280, 650, 400)
  }
  
  // 绘制分类排行
  let y = 720
  data.categories.forEach((category, index) => {
    // 绘制排名
    ctx.font = 'bold 32px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`${index + 1}`, 50, y)
    
    // 绘制分类名称
    ctx.fillText(category.name, 100, y)
    
    // 绘制金额
    ctx.textAlign = 'right'
    ctx.fillText(`${data.currency}${category.amount}`, 700, y)
    
    y += 60
  })
  
  // 绘制底部信息
  ctx.font = '24px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillStyle = data.darkMode ? '#888888' : '#999999'
  ctx.fillText('来自记账应用', canvas.width / 2, canvas.height - 50)
  
  // 转换为图片
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(URL.createObjectURL(blob))
      } else {
        reject(new Error('生成图片失败'))
      }
    })
  })
}

// 生成分享图片
export async function generateShareImage(data) {
  const canvasId = 'shareCanvas'
  const ctx = uni.createCanvasContext(canvasId)
  
  // 绘制背景
  ctx.fillStyle = data.darkMode ? '#121212' : '#ffffff'
  ctx.fillRect(0, 0, 750, 1200)
  
  // 绘制标题
  ctx.fillStyle = data.darkMode ? '#eeeeee' : '#333333'
  ctx.font = 'bold 36px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('月度账单统计', 375, 80)
  
  // 绘制月份和总支出
  ctx.font = '32px sans-serif'
  ctx.fillText(`${data.year}年${data.month}月`, 375, 140)
  ctx.fillText(`总支出: ${data.currency}${data.total}`, 375, 190)
  
  // 绘制分类统计
  let y = 260
  data.categories.forEach((category, index) => {
    // 绘制图标和名称
    ctx.font = '28px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`${index + 1}. ${category.name}`, 50, y)
    
    // 绘制金额
    ctx.textAlign = 'right'
    ctx.fillText(`${data.currency}${category.amount}`, 700, y)
    
    // 绘制进度条
    ctx.fillStyle = data.darkMode ? '#2d2d2d' : '#f5f5f5'
    ctx.fillRect(50, y + 20, 650, 10)
    
    ctx.fillStyle = category.color
    ctx.fillRect(50, y + 20, 650 * (category.percentage / 100), 10)
    
    y += 80
  })
  
  // 绘制底部信息
  ctx.fillStyle = data.darkMode ? '#888888' : '#999999'
  ctx.font = '24px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('来自记账应用', 375, 1150)
  
  return new Promise((resolve, reject) => {
    // 绘制到画布
    ctx.draw(false, () => {
      setTimeout(() => {  // 等待画布渲染完成
        uni.canvasToTempFilePath({
          canvasId,
          x: 0,
          y: 0,
          width: 750,
          height: 1200,
          destWidth: 750,
          destHeight: 1200,
          success: (res) => {
            resolve(res.tempFilePath)
          },
          fail: (err) => {
            reject(err)
          }
        })
      }, 100)
    })
  })
} 