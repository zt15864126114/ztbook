// 获取全局 dayjs 实例
function getDayjs() {
	const app = getApp()
	return app.$vm.$.appContext.config.globalProperties.$dayjs
}

// 格式化日期（显示为今天、昨天、X月X日）
export function formatDateForDisplay(dateStr) {
	const dayjs = getDayjs()
	const date = dayjs(dateStr)
	const today = dayjs().format('YYYY-MM-DD')
	const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD')
	
	if (dateStr === today) return '今天'
	if (dateStr === yesterday) return '昨天'
	return date.format('M月D日')
}

// 格式化日期为 YYYY-MM-DD
export function formatDate(date) {
	if (typeof date === 'string') {
		date = new Date(date)
	}
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

// 格式化时间为 HH:mm
export function formatTime(date) {
	if (typeof date === 'string') {
		date = new Date(date)
	}
	const hours = String(date.getHours()).padStart(2, '0')
	const minutes = String(date.getMinutes()).padStart(2, '0')
	return `${hours}:${minutes}`
}

// 获取当前年份
export function getCurrentYear() {
	return new Date().getFullYear()
}

// 获取当前月份
export function getCurrentMonth() {
	return new Date().getMonth() + 1
}

// 获取指定月份的天数
export function getDaysInMonth(year, month) {
	return new Date(year, month, 0).getDate()
}

// 格式化日期时间为 YYYY-MM-DD HH:mm
export function formatDateTime(date) {
	return `${formatDate(date)} ${formatTime(date)}`
}

// 判断是否是同一个月
export function isSameMonth(date1, date2) {
	const dayjs = getDayjs()
	return dayjs(date1).isSame(date2, 'month')
}

// 获取上个月的年月
export function getLastMonth() {
	const dayjs = getDayjs()
	const lastMonth = dayjs().subtract(1, 'month')
	return {
		year: lastMonth.year(),
		month: lastMonth.month() + 1
	}
} 