// 主题颜色
export const themeColors = {
  primary: '#3498db',
  success: '#2ecc71',
  warning: '#f1c40f',
  danger: '#e74c3c',
  info: '#3498db'
}

// 深色模式颜色
export const darkColors = {
  background: '#1a1a1a',
  card: '#2d2d2d',
  text: '#ffffff',
  border: '#3d3d3d',
  placeholder: '#666666'
}

// 浅色模式颜色
export const lightColors = {
  background: '#f7f8fa',
  card: '#ffffff',
  text: '#333333',
  border: '#eeeeee',
  placeholder: '#999999'
}

// 获取当前主题颜色
export function getThemeColors(isDark = false) {
  return {
    ...themeColors,
    ...(isDark ? darkColors : lightColors)
  }
} 