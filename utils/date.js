import dayjs from 'dayjs'

// 格式化日期
export function formatDate(dateStr) {
	const date = dayjs(dateStr)
	const today = dayjs().format('YYYY-MM-DD')
	const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD')
	
	if (dateStr === today) return '今天'
	if (dateStr === yesterday) return '昨天'
	return date.format('M月D日')
}

// 格式化时间
export function formatTime(time) {
	return dayjs(time).format('HH:mm')
}

// 格式化完整日期时间
export function formatDateTime(time) {
	return dayjs(time).format('YYYY-MM-DD HH:mm')
}

// 获取当前月份
export function getCurrentMonth() {
	return dayjs().month() + 1
}

// 获取当前年份
export function getCurrentYear() {
	return dayjs().year()
}

// 判断是否是同一个月
export function isSameMonth(date1, date2) {
	return dayjs(date1).isSame(date2, 'month')
}

// 获取上个月的年月
export function getLastMonth() {
	const lastMonth = dayjs().subtract(1, 'month')
	return {
		year: lastMonth.year(),
		month: lastMonth.month() + 1
	}
} 