// 生成饼图配置
export function generatePieChartConfig(data, darkMode = false) {
  return {
    backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
    series: [{
      type: 'pie',
      radius: ['50%', '70%'],
      avoidLabelOverlap: true,
      label: {
        show: true,
        color: darkMode ? '#eeeeee' : '#333333',
        formatter: '{b}: {d}%'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: '16',
          fontWeight: 'bold'
        }
      },
      data: data
    }]
  }
}

// 生成趋势图配置
export function generateTrendChartConfig(data, darkMode = false) {
  return {
    backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
    xAxis: {
      type: 'category',
      data: data.dates,
      axisLabel: {
        color: darkMode ? '#888888' : '#666666'
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: darkMode ? '#888888' : '#666666'
      }
    },
    series: [{
      data: data.values,
      type: 'line',
      smooth: true,
      lineStyle: {
        color: '#3498db'
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [{
            offset: 0,
            color: 'rgba(52,152,219,0.3)'
          }, {
            offset: 1,
            color: 'rgba(52,152,219,0.1)'
          }]
        }
      }
    }]
  }
} 