<template>
	<view :class="['container', darkMode ? 'dark' : '']" @touchstart="gesture.onTouchStart" @touchend="gesture.onTouchEnd">
		<!-- 月份选择器 -->
		<view class="month-header">
			<view class="month-picker" @click="showMonthPicker">
				<view class="date-wrapper">
					<text class="year">{{ selectedYear }}年</text>
					<text class="month">{{ selectedMonth }}月</text>
				</view>
				<text class="arrow" :class="{ 'arrow-rotate': isPickerVisible }">▼</text>
			</view>
			<view class="total">
				<text class="label">总支出</text>
				<text class="amount">{{ accountStore.currencySymbol }}{{ monthTotal }}</text>
			</view>
		</view>
		
		<!-- 添加下拉刷新 -->
		<pull-to-refresh 
			@refresh="onRefresh"
			:refreshing="refreshing"
		>
			<!-- 统计内容区域 -->
			<scroll-view 
				scroll-y 
				class="statistics-content"
				:style="{
					height: `calc(100vh - ${statusBarHeight}px - 44px - 52px - ${safeAreaBottom}px)`
				}"
			>
				<template v-if="monthlyBills.length">
					<!-- 饼图统计 -->
					<view class="chart-section">
						<view class="section-header">
							<text class="title">支出构成</text>
							<text class="subtitle">本月共{{ categoryRanking.length }}个支出类别</text>
						</view>
						<view class="pie-chart">
							<qiun-data-charts 
								type="pie"
								:opts="pieOpts"
								:chartData="pieData"
								canvasId="pieChart"
								:background="darkMode ? '#1e1e1e' : '#ffffff'"
								:onInit="onPieChartInit"
								:disableScroll="true"
							/>
						</view>
					</view>
					
					<!-- 分类排行 -->
					<view class="ranking-section">
						<view class="section-header">
							<text class="title">分类排行</text>
							<text class="subtitle">按支出金额排序</text>
						</view>
						<view class="ranking-list">
							<view 
								class="ranking-item"
								v-for="(category, index) in categoryRanking" 
								:key="category.name"
								@click="showCategoryDetail(category)"
							>
								<view class="rank-info">
									<text class="rank-number">{{ index + 1 }}</text>
									<view class="category-icon" :style="{ backgroundColor: category.color }">
										{{ category.icon }}
									</view>
									<view class="category-detail">
										<text class="name">{{ category.name }}</text>
										<text class="amount">{{ accountStore.currencySymbol }}{{ category.amount }}</text>
									</view>
								</view>
								<view class="progress-bar">
									<view 
										class="progress" 
										:style="{ 
											width: category.percentage + '%',
											backgroundColor: category.color
										}"
									></view>
								</view>
								<text class="percentage">{{ category.percentage }}%</text>
							</view>
						</view>
					</view>
					
					<!-- 趋势图表 -->
					<view class="trend-section">
						<view class="section-header">
							<view class="header-main">
								<text class="title">支出趋势</text>
								<view class="trend-tabs">
									<text 
										v-for="tab in trendTabs" 
										:key="tab.type"
										:class="['tab-item', { active: currentTrendType === tab.type }]"
										@click="currentTrendType = tab.type"
									>{{ tab.name }}</text>
								</view>
							</view>
							<view class="trend-overview">
								<view class="overview-item">
									<text class="label">日均支出</text>
									<text class="value">{{ accountStore.currencySymbol }}{{ Number(dailyAverage).toFixed(2) }}</text>
								</view>
								<view class="overview-item">
									<text class="label">记账天数</text>
									<text class="value">{{ recordDays }}天</text>
								</view>
							</view>
							<view class="subtitle">
								<text class="dot"></text>
								<text>{{ currentTrendType === 'day' ? selectedMonth + '月每日支出变化' : 
									   currentTrendType === 'month' ? selectedYear + '年每月支出变化' : 
									   '近12个月支出变化' }}</text>
							</view>
						</view>
						<view class="trend-chart">
							<qiun-data-charts 
								type="column"
								:opts="trendOpts"
								:chartData="trendData"
								canvasId="trendChart"
								:background="darkMode ? '#1e1e1e' : '#ffffff'"
								:onInit="onTrendChartInit"
								:disableScroll="true"
							/>
						</view>
					</view>
				</template>
				<view v-else class="empty-state">
					<image src="/static/empty.png" mode="aspectFit" class="empty-image"/>
					<text class="empty-text">本月还没有记账哦</text>
					<button class="add-btn" @click="goToAdd">去记一笔</button>
				</view>
			</scroll-view>
		</pull-to-refresh>
		
		<!-- 添加分享功能 -->
		<button 
			class="share-btn"
			@click="shareStatistics"
		>
			分享账单统计
		</button>
		
		<!-- 用于生成分享图片的隐藏画布 -->
		<canvas 
			canvas-id="shareCanvas"
			style="width: 750px; height: 1200px; position: fixed; left: -9999px;"
		></canvas>
	</view>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted, nextTick } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useAccountStore } from '@/stores/account'
import { useAppStore } from '@/stores/app'
import { formatDate, getCurrentMonth, getCurrentYear } from '@/utils/date'
import { useVirtualList } from '@/composables/useVirtualList'
import { useGesture } from '@/composables/useGesture'
import { generateShareImage } from '@/utils/share'

const accountStore = useAccountStore()
const appStore = useAppStore()
const darkMode = computed(() => appStore.darkMode)
const statusBarHeight = ref(0)
const safeAreaBottom = ref(0)
const selectedYear = ref(getCurrentYear())
const selectedMonth = ref(getCurrentMonth())

// 图表尺寸
const chartWidth = ref(0)
const chartHeight = ref(0)

const isPickerVisible = ref(false)

// 先定义数据相关的计算属性
// 本月账单
const monthlyBills = computed(() => {
	return accountStore.accounts.filter(item => {
		const date = new Date(item.createTime)
		return date.getMonth() + 1 === selectedMonth.value && 
			   date.getFullYear() === selectedYear.value
	})
})

// 月度总支出
const monthTotal = computed(() => {
	return monthlyBills.value
		.reduce((total, item) => total + Number(item.amount), 0)
		.toFixed(2)
})

// 获取当月天数
const daysInMonth = computed(() => {
	return new Date(selectedYear.value, selectedMonth.value, 0).getDate()
})

// 日均支出
const dailyAverage = computed(() => {
	return Number(monthTotal.value) / daysInMonth.value
})

// 计算记账天数
const recordDays = computed(() => {
	const days = new Set()
	monthlyBills.value.forEach(bill => {
		const day = new Date(bill.createTime).getDate()
		days.add(day)
	})
	return days.size
})

// 分类统计和排行
const categoryRanking = computed(() => {
	const stats = {}
	monthlyBills.value.forEach(bill => {
		if (!stats[bill.category]) {
			stats[bill.category] = {
				name: bill.category,
				amount: 0,
				count: 0,
				color: getCategoryColor(bill.category),
				icon: getCategoryIcon(bill.category)
			}
		}
		stats[bill.category].amount += Number(bill.amount)
		stats[bill.category].count += 1
	})
	
	const total = Number(monthTotal.value)
	return Object.values(stats)
		.map(item => ({
			...item,
			amount: item.amount.toFixed(2),
			percentage: total ? ((item.amount / total) * 100).toFixed(1) : '0.0'
		}))
		.sort((a, b) => Number(b.amount) - Number(a.amount))
})

// 获取分类图标
function getCategoryIcon(category) {
	const icons = {
		'餐饮': '🍚',
		'交通': '🚗',
		'购物': '🛒',
		'娱乐': '🎮',
		'居家': '🏠'
	}
	return icons[category] || '💰'
}

// 获取分类颜色
function getCategoryColor(category) {
	const colors = {
		'餐饮': '#FF9800',
		'交通': '#2196F3',
		'购物': '#E91E63',
		'娱乐': '#9C27B0',
		'居家': '#4CAF50'
	}
	return colors[category] || '#999999'
}

// 显示月份选择器
function showMonthPicker() {
	isPickerVisible.value = true
	const date = new Date()
	const months = []
	// 生成最近6个月的选项
	for (let i = 0; i < 6; i++) {
		const m = new Date(date.getFullYear(), date.getMonth() - i, 1)
		months.push(`${m.getFullYear()}年${m.getMonth() + 1}月`)
	}
	
	uni.showActionSheet({
		itemList: months,
		success: (res) => {
			const selected = months[res.tapIndex]
			const [year, month] = selected.match(/\d+/g)
			selectedYear.value = parseInt(year)
			selectedMonth.value = parseInt(month)
		},
		complete: () => {
			isPickerVisible.value = false
		}
	})
}

// 饼图配置
const pieOpts = computed(() => ({
	padding: [0, 0, 0, 0],
	legend: {
		show: true,
		position: 'right',
		lineHeight: 25,
		color: darkMode.value ? '#eee' : '#333',
		backgroundColor: 'transparent',
		padding: 10,
		format: '{name}'
	},
	series: {
		radius: ['60%', '85%'],
		center: ['40%', '50%'],
		avoidLabelOverlap: true,
		roseType: false,
		backgroundColor: darkMode.value ? '#1e1e1e' : '#ffffff'
	},
	extra: {
		pie: {
			activeOpacity: 0.5,
			activeRadius: 10,
			offsetAngle: 0,
			labelWidth: 15,
			border: false,
			linearType: 'custom',
			radius: 0.8,
			labelLine: false,
			activeRadius: 8,
			activeOpacity: 0.7,
			customColor: darkMode.value ? [
				'#3498db', '#e74c3c', '#2ecc71',
				'#f1c40f', '#9b59b6', '#1abc9c'
			] : [
				'#3498db', '#e74c3c', '#2ecc71',
				'#f1c40f', '#9b59b6', '#1abc9c'
			]
		},
		tooltip: {
			showBox: true,
			showArrow: true,
			showCategory: false,
			borderWidth: 0,
			borderRadius: 4,
			borderColor: darkMode.value ? '#ffffff' : '#000000',
			backgroundColor: darkMode.value ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.7)',
			fontColor: darkMode.value ? '#eee' : '#ffffff',
			fontSize: 12,
			format: (item) => {
				if (!item.data) return '无支出'
				return `${item.name}\n${accountStore.currencySymbol}${Number(item.data).toFixed(2)}`
			}
		}
	}
}))

// 饼图数据
const pieData = computed(() => ({
	series: [{
		data: categoryRanking.value.map(item => ({
			name: item.name,
			value: Number(item.amount),
			color: item.color
		}))
	}]
}))

// 趋势类型
const trendTabs = [
	{ type: 'day', name: '日' },
	{ type: 'month', name: '月' },
	{ type: 'year', name: '年' }
]
const currentTrendType = ref('day')

// 趋势图副标题
const getTrendSubtitle = computed(() => {
	switch (currentTrendType.value) {
		case 'day':
			return `${selectedMonth}月每日支出变化`
		case 'month':
			return `${selectedYear}年每月支出变化`
		case 'year':
			return '近12个月支出变化'
	}
})

// 趋势图数据
const trendData = computed(() => {
	switch (currentTrendType.value) {
		case 'day':
			return getDailyTrendData()
		case 'month':
			return getMonthlyTrendData()
		case 'year':
			return getYearlyTrendData()
	}
})

// 日支出趋势数据
function getDailyTrendData() {
	const dailyStats = {}
	
	// 初始化每天的数据
	for (let i = 1; i <= daysInMonth.value; i++) {
		dailyStats[i] = 0
	}
	
	// 统计每天的支出
	monthlyBills.value.forEach(bill => {
		const day = new Date(bill.createTime).getDate()
		dailyStats[day] = Number(dailyStats[day]) + Number(bill.amount)
	})
	
	const categories = []
	const data = []
	
	Object.entries(dailyStats).forEach(([day, amount]) => {
		categories.push(`${day}日`)
		data.push(amount > 0 ? Number(amount) : null)
	})
	
	return {
		categories,
		series: [{
			name: '日支出',
			data,
			format: val => val ? '¥' + Number(val).toFixed(2) : '无支出'
		}]
	}
}

// 月支出趋势数据
function getMonthlyTrendData() {
	const monthlyStats = {}
	
	// 初始化每月的数据
	for (let i = 1; i <= 12; i++) {
		monthlyStats[i] = 0
	}
	
	// 统计每月的支出
	accountStore.accounts.forEach(bill => {
		const date = new Date(bill.createTime)
		if (date.getFullYear() === selectedYear.value) {
			const month = date.getMonth() + 1
			monthlyStats[month] = Number(monthlyStats[month]) + Number(bill.amount)
		}
	})
	
	const categories = []
	const data = []
	
	Object.entries(monthlyStats).forEach(([month, amount]) => {
		categories.push(`${month}月`)
		data.push(amount > 0 ? Number(amount) : null)
	})
	
	return {
		categories,
		series: [{
			name: '月支出',
			data,
			format: val => val ? '¥' + Number(val).toFixed(2) : '无支出'
		}]
	}
}

// 年支出趋势数据（近12个月）
function getYearlyTrendData() {
	const yearlyStats = {}
	const now = new Date()
	
	// 初始化近12个月的数据
	for (let i = 0; i < 12; i++) {
		const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
		const key = `${date.getFullYear()}-${date.getMonth() + 1}`
		yearlyStats[key] = {
			year: date.getFullYear(),
			month: date.getMonth() + 1,
			amount: 0
		}
	}
	
	// 统计每月的支出
	accountStore.accounts.forEach(bill => {
		const date = new Date(bill.createTime)
		const key = `${date.getFullYear()}-${date.getMonth() + 1}`
		if (yearlyStats[key]) {
			yearlyStats[key].amount += Number(bill.amount)
		}
	})
	
	const categories = []
	const data = []
	
	Object.values(yearlyStats).reverse().forEach(({ year, month, amount }) => {
		categories.push(`${year}/${month}`)
		data.push(amount > 0 ? Number(amount) : null)
	})
	
	return {
		categories,
		series: [{
			name: '月支出',
			data,
			format: val => val ? '¥' + Number(val).toFixed(2) : '无支出'
		}]
	}
}

// 趋势图配置
const trendOpts = computed(() => ({
	padding: [10, 15, 15, 15],
	background: darkMode.value ? '#1e1e1e' : '#ffffff',
	xAxis: {
		disableGrid: true,
		itemCount: currentTrendType.value === 'day' ? 31 : 12,
		labelCount: currentTrendType.value === 'day' ? 7 : 6,
		fontSize: 11,
		color: darkMode.value ? '#888' : '#666666',
		rotateLabel: true,
		gridColor: darkMode.value ? '#2d2d2d' : '#f5f5f5',
		gridType: 'dash',
	},
	yAxis: {
		gridType: 'dash',
		dashLength: 4,
		splitNumber: 4,
		min: 0,
		max: 'auto',
		format: val => accountStore.currencySymbol + Number(val).toFixed(0),
		fontSize: 11,
		color: darkMode.value ? '#888' : '#666666',
		boundaryGap: ['20%', '20%'],
		gridColor: darkMode.value ? '#2d2d2d' : '#f5f5f5',
	},
	extra: {
		column: {
			type: 'group',
			width: 20,
			activeBgColor: darkMode.value ? '#ffffff' : '#000000',
			activeBgOpacity: 0.08,
			seriesGap: 2,
			barBorderRadius: [4, 4, 0, 0],
			linearType: 'custom',
			gradient: true,
			color: darkMode.value ? ['#3498db', '#1a5276'] : ['#3498db', '#2980b9']
		},
		tooltip: {
			showBox: true,
			showArrow: true,
			showCategory: false,
			borderWidth: 0,
			borderRadius: 4,
			borderColor: darkMode.value ? '#ffffff' : '#000000',
			backgroundColor: darkMode.value ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.7)',
			fontColor: darkMode.value ? '#eee' : '#ffffff',
			fontSize: 12,
			format: (item, category) => {
				if (!item.data) return `${category}\n无支出`
				return `${category}\n${accountStore.currencySymbol}${Number(item.data).toFixed(2)}`
			}
		}
	}
}))

// 设置图表主题
const chartTheme = computed(() => {
	return darkMode.value ? {
		backgroundColor: 'transparent',
		textStyle: {
			color: '#eee'
		},
		title: {
			textStyle: {
				color: '#eee'
			}
		},
		legend: {
			textStyle: {
				color: '#eee'
			}
		},
		xAxis: {
			axisLine: {
				lineStyle: {
					color: '#333'
				}
			},
			axisLabel: {
				color: '#888'
			}
		},
		yAxis: {
			axisLine: {
				lineStyle: {
					color: '#333'
				}
			},
			axisLabel: {
				color: '#888'
			}
		}
	} : {}
})

// 在图表配置中使用主题
const pieChartOptions = computed(() => ({
	...chartTheme.value,
	series: [
		// ... 其他配置
	]
}))

const lineChartOptions = computed(() => ({
	...chartTheme.value,
	series: [
		// ... 其他配置
	]
}))

// 添加图表初始化函数
const pieChartRef = ref(null)
const trendChartRef = ref(null)

function onPieChartInit(chart) {
	pieChartRef.value = chart
	setTimeout(() => {
		if (pieChartRef.value) {
			pieChartRef.value.updateData(pieData.value)
		}
	}, 100)
}

function onTrendChartInit(chart) {
	trendChartRef.value = chart
	setTimeout(() => {
		if (trendChartRef.value) {
			trendChartRef.value.updateData(trendData.value)
		}
	}, 100)
}

onMounted(() => {
	uni.getSystemInfo({
		success: (res) => {
			statusBarHeight.value = res.statusBarHeight
			safeAreaBottom.value = res.safeAreaInsets?.bottom || 0
			chartWidth.value = res.windowWidth - 40
			chartHeight.value = 200
		}
	})
})

// 监听数据变化
watch([categoryRanking, trendData], () => {
	nextTick(() => {
		setTimeout(() => {
			if (pieChartRef.value) {
				pieChartRef.value.updateData({
					series: [{
						data: categoryRanking.value.map(item => ({
							name: item.name,
							value: Number(item.amount),
							color: item.color
						}))
					}]
				})
			}
			
			if (trendChartRef.value) {
				trendChartRef.value.updateData(trendData.value)
			}
		}, 100)
	})
})

// 监听深色模式变化
watch(() => darkMode.value, () => {
	nextTick(() => {
		setTimeout(() => {
			if (pieChartRef.value) {
				pieChartRef.value.updateData(pieData.value)
			}
			if (trendChartRef.value) {
				trendChartRef.value.updateData(trendData.value)
			}
		}, 100)
	})
}, { immediate: true })

// 显示分类详情
function showCategoryDetail(category) {
	uni.showModal({
		title: category.name + '支出明细',
		content: `共${category.count}笔支出\n占比${category.percentage}%\n平均每笔${accountStore.currencySymbol}${(Number(category.amount) / category.count).toFixed(2)}`,
		showCancel: false,
		confirmText: '知道了'
	})
}

// 添加分类账单列表功能
function viewCategoryBills(category) {
	const bills = monthlyBills.value.filter(bill => bill.category === category.name)
	// TODO: 跳转到账单列表页面，传递筛选参数
}

function goToAdd() {
	uni.switchTab({
		url: '/pages/add/add'
	})
}

// 添加页面显示事件处理
onShow(() => {
	// 每次页面显示时刷新数据
	accountStore.refresh()
})

// 在账单列表中使用虚拟列表
const { list: virtualBills } = useVirtualList(monthlyBills, {
	itemHeight: 88,
	overscan: 5
})

// 添加手势操作
const gesture = useGesture({
	onSwipeLeft: () => {
		// 切换到下个月
		switchMonth(1)
	},
	onSwipeRight: () => {
		// 切换到上个月
		switchMonth(-1)
	}
})

// 切换月份
function switchMonth(offset) {
	const date = new Date(selectedYear.value, selectedMonth.value - 1)
	date.setMonth(date.getMonth() + offset)
	
	selectedYear.value = date.getFullYear()
	selectedMonth.value = date.getMonth() + 1
}

// 分享统计数据
async function shareStatistics() {
	try {
		uni.showLoading({ title: '生成图片中...' })
		
		// 准备分享数据
		const shareData = {
			year: selectedYear.value,
			month: selectedMonth.value,
			total: monthTotal.value,
			currency: accountStore.currencySymbol,
			categories: categoryRanking.value,
			darkMode: darkMode.value
		}
		
		// 生成分享图片
		const imagePath = await generateShareImage(shareData)
		
		// 保存图片到相册
		uni.saveImageToPhotosAlbum({
			filePath: imagePath,
			success: () => {
				uni.showToast({
					title: '已保存到相册',
					icon: 'success'
				})
			},
			fail: () => {
				uni.showToast({
					title: '保存失败',
					icon: 'error'
				})
			}
		})
	} catch (err) {
		console.error('分享失败:', err)
		uni.showToast({
			title: '分享失败',
			icon: 'error'
		})
	} finally {
		uni.hideLoading()
	}
}
</script>

<style lang="scss" scoped>
.container {
	min-height: 100vh;
	background-color: #f5f5f5;
	padding: 20rpx;
	transition: background-color 0.3s;
	
	&.dark {
		background-color: #121212;
		
		.month-header {
			background-color: #1e1e1e;
			box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.2);
			
			.month-picker {
				.date-wrapper {
					.year, .month {
						color: #eee;
					}
				}
				
				.arrow {
					color: #888;
				}
			}
			
			.total {
				.label {
					color: #888;
				}
				
				.amount {
					color: #eee;
				}
			}
		}
		
		.statistics-content {
			background-color: #121212;
			
			.chart-section, 
			.ranking-section, 
			.trend-section {
				background-color: #1e1e1e;
				box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.2);
				
				.section-header {
					.title {
						color: #eee;
					}
					
					.subtitle {
						color: #888;
						
						.dot {
							background-color: #3498db;
						}
					}
					
					.trend-tabs {
						background-color: #2d2d2d;
						border-radius: 8rpx;
						padding: 4rpx;
						
						.tab-item {
							color: #888;
							background-color: transparent;
							
							&.active {
								color: #3498db;
								background-color: #1e1e1e;
							}
						}
					}
					
					.trend-overview {
						.overview-item {
							background-color: #2d2d2d;
							border-radius: 8rpx;
							padding: 16rpx 24rpx;
						}
					}
				}
				
				.ranking-list {
					.ranking-item {
						border-bottom: 1rpx solid #2d2d2d;
						
						.rank-info {
							.rank-number {
								color: #888;
							}
							
							.category-icon {
								box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.3);
							}
							
							.category-detail {
								.name {
									color: #eee;
								}
								
								.amount {
									color: #888;
								}
							}
						}
						
						.progress-bar {
							background-color: #2d2d2d;
						}
						
						.percentage {
							color: #888;
						}
						
						&:active {
							background-color: #2a2a2a;
						}
						
						&:last-child {
							border-bottom: none;
						}
					}
				}
				
				:deep(.charts-box) {
					background-color: #1e1e1e !important;
					margin: 0 !important;
					padding: 0 !important;
					
					.qiun-charts {
						background-color: #1e1e1e !important;
						width: 100% !important;
						height: 100% !important;
						
						canvas {
							background-color: #1e1e1e !important;
							width: 100% !important;
							height: 100% !important;
						}
					}
					
					.qiun-title,
					.qiun-legend {
						background-color: #1e1e1e !important;
					}
					
					.qiun-loading {
						background-color: #1e1e1e !important;
					}
				}
			}
			
			.empty-state {
				.empty-text {
					color: #888;
				}
				
				.add-btn {
					background: linear-gradient(135deg, #3498db, #1a5276);
					box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.4);
				}
			}
		}
	}
}

.month-header {
	padding: 24rpx 30rpx;
	background-color: #fff;
	height: 52px;
	box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.02);
	display: flex;
	justify-content: space-between;
	align-items: center;
	
	.month-picker {
		display: flex;
		align-items: center;
		font-size: 34rpx;
		color: #333;
		font-weight: 600;
		
		.arrow {
			margin-left: 8rpx;
			font-size: 24rpx;
			color: #666;
			transition: transform 0.3s ease;
		}
		
		.date-wrapper {
			display: flex;
			align-items: baseline;
			
			.year {
				font-size: 28rpx;
				margin-right: 8rpx;
			}
			
			.month {
				font-size: 34rpx;
			}
		}
	}
	
	.total {
		text-align: right;
		
		.label {
			font-size: 24rpx;
			color: #666;
			margin-bottom: 4rpx;
			display: block;
		}
		
		.amount {
			font-size: 36rpx;
			color: #333;
			font-weight: 600;
		}
	}
}

.statistics-content {
	flex: 1;
	padding: 24rpx;
	box-sizing: border-box;
	background-color: #f7f8fa;
}

.chart-section, .ranking-section, .trend-section {
	background-color: #fff;
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 24rpx;
	box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04);
	
	&:last-child {
		margin-bottom: 0;
		padding-bottom: calc(30rpx + var(--safe-area-inset-bottom));
	}
}

.section-header {
	margin-bottom: 30rpx;
	
	.title {
		font-size: 32rpx;
		font-weight: 600;
		color: #333;
		margin-bottom: 8rpx;
		display: block;
	}
	
	.subtitle {
		font-size: 24rpx;
		color: #999;
	}
}

.ranking-list {
	.ranking-item {
		display: flex;
		align-items: center;
		padding: 24rpx 0;
		
		.rank-info {
			display: flex;
			align-items: center;
			width: 240rpx;
			
			.rank-number {
				width: 40rpx;
				font-size: 28rpx;
				color: #999;
				font-weight: 600;
			}
			
			.category-icon {
				width: 64rpx;
				height: 64rpx;
				border-radius: 16rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				margin-right: 16rpx;
				font-size: 32rpx;
				box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);
			}
			
			.category-detail {
				flex: 1;
				
				.name {
					font-size: 28rpx;
					color: #333;
					font-weight: 500;
					margin-bottom: 4rpx;
				}
				
				.amount {
					font-size: 24rpx;
					color: #666;
				}
			}
		}
		
		.progress-bar {
			flex: 1;
			height: 12rpx;
			background-color: #f5f5f5;
			border-radius: 6rpx;
			margin: 0 24rpx;
			overflow: hidden;
			
			.progress {
				height: 100%;
				border-radius: 6rpx;
				transition: width 0.5s ease;
			}
		}
		
		.percentage {
			width: 80rpx;
			text-align: right;
			font-size: 26rpx;
			color: #666;
			font-weight: 500;
		}
		
		&:active {
			opacity: 0.7;
		}
	}
}

.pie-chart, .trend-chart {
	margin: 0;
	padding: 0;
	width: 100%;
	height: 400rpx;
	background-color: transparent;
	
	:deep(.charts-box) {
		background-color: inherit;
	}
}

.trend-section {
	.header-main {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 8rpx;
	}
	
	.trend-tabs {
		display: flex;
		align-items: center;
		background-color: #f5f5f5;
		border-radius: 8rpx;
		padding: 4rpx;
		
		.tab-item {
			padding: 8rpx 20rpx;
			font-size: 24rpx;
			color: #666;
			border-radius: 6rpx;
			transition: all 0.3s;
			
			&.active {
				color: #fff;
				background-color: #3498db;
			}
			
			&:not(:last-child) {
				margin-right: 4rpx;
			}
		}
	}
	
	.trend-overview {
		display: flex;
		align-items: center;
		margin: 16rpx 0;
		padding: 16rpx 0;
		background-color: transparent;
		border-radius: 12rpx;
		
		.overview-item {
			flex: 1;
			display: flex;
			flex-direction: column;
			align-items: center;
			background-color: #f5f5f5;
			padding: 20rpx;
			border-radius: 12rpx;
			margin: 0 8rpx;
			
			.label {
				font-size: 24rpx;
				color: #666;
				margin-bottom: 8rpx;
			}
			
			.value {
				font-size: 32rpx;
				color: #333;
				font-weight: 600;
			}
		}
	}
	
	.subtitle {
		display: flex;
		align-items: center;
		font-size: 24rpx;
		color: #999;
		margin-top: 8rpx;
		
		.dot {
			width: 6rpx;
			height: 6rpx;
			background-color: #3498db;
			border-radius: 50%;
			margin-right: 8rpx;
		}
	}
}

.month-picker {
	.arrow {
		transition: transform 0.3s ease;
		
		&.arrow-rotate {
			transform: rotate(180deg);
		}
	}
}

.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 100rpx 0;
	
	.empty-image {
		width: 200rpx;
		height: 200rpx;
		margin-bottom: 20rpx;
	}
	
	.empty-text {
		font-size: 28rpx;
		color: #999;
		margin-bottom: 30rpx;
	}
	
	.add-btn {
		width: 200rpx;
		height: 80rpx;
		line-height: 80rpx;
		font-size: 28rpx;
		color: #fff;
		background-color: #3498db;
		border-radius: 40rpx;
	}
}

.share-btn {
	width: 200rpx;
	height: 80rpx;
	line-height: 80rpx;
	font-size: 28rpx;
	color: #fff;
	background-color: #3498db;
	border-radius: 40rpx;
	margin-top: 20rpx;
	
	&:active {
		opacity: 0.8;
	}
	
	.dark & {
		background: linear-gradient(135deg, #3498db, #1a5276);
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.4);
	}
}
</style> 