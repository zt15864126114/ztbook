<template>
	<view class="container">
		<!-- 时间范围选择 -->
		<view class="time-range">
			<view 
				v-for="(range, index) in timeRanges" 
				:key="index"
				class="range-item"
				:class="{ active: currentRange === index }"
				@click="selectRange(index)"
			>
				{{ range }}
			</view>
		</view>
		
		<!-- 总支出卡片 -->
		<view class="total-card">
			<view class="title">总支出</view>
			<view class="amount">¥{{ totalExpense }}</view>
			<view class="compare" v-if="comparePercentage !== 0">
				<text>较上{{ currentRange === 0 ? '月' : '年' }}</text>
				<text :class="comparePercentage > 0 ? 'up' : 'down'">
					{{ comparePercentage > 0 ? '↑' : '↓' }}
					{{ Math.abs(comparePercentage) }}%
				</text>
			</view>
		</view>
		
		<!-- 分类统计 -->
		<view class="stats-section">
			<view class="section-title">支出分类</view>
			<view class="category-stats">
				<view 
					v-for="category in categoryStats" 
					:key="category.name"
					class="category-item"
				>
					<view class="category-info">
						<view class="icon-wrap" :style="{ backgroundColor: category.color }">
							{{ category.icon }}
						</view>
						<view class="detail">
							<text class="name">{{ category.name }}</text>
							<text class="amount">¥{{ category.amount }}</text>
						</view>
					</view>
					<view class="progress-wrap">
						<view 
							class="progress-bar" 
							:style="{ 
								width: category.percentage + '%',
								backgroundColor: category.color
							}"
						></view>
						<text class="percentage">{{ category.percentage }}%</text>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 支出趋势 -->
		<view class="stats-section">
			<view class="section-title">支出趋势</view>
			<view class="trend-chart">
				<view 
					v-for="(item, index) in trendData" 
					:key="index"
					class="trend-item"
				>
					<view 
						class="bar" 
						:style="{ height: item.height + '%' }"
					></view>
					<text class="label">{{ item.label }}</text>
				</view>
			</view>
		</view>
		
		<!-- 消费习惯分析 -->
		<view class="stats-section">
			<view class="section-title">消费习惯分析</view>
			<view class="habits-list">
				<view class="habit-item">
					<view class="label">最常消费时段</view>
					<view class="value">{{ mostExpenseTime }}</view>
				</view>
				<view class="habit-item">
					<view class="label">平均每笔支出</view>
					<view class="value">¥{{ averageExpense }}</view>
				</view>
				<view class="habit-item">
					<view class="label">最大单笔支出</view>
					<view class="value">¥{{ maxExpense }}</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAccountStore } from '@/stores/account'
import { getCurrentMonth, getCurrentYear, formatDateTime } from '@/utils/date'
import dayjs from 'dayjs'

const accountStore = useAccountStore()
const timeRanges = ['本月', '本年', '全部']
const currentRange = ref(0)

// 根据时间范围筛选账单
const filteredBills = computed(() => {
	const now = dayjs()
	return accountStore.accounts.filter(item => {
		const billDate = dayjs(item.createTime)
		switch(currentRange.value) {
			case 0: // 本月
				return billDate.month() === now.month() && 
					   billDate.year() === now.year()
			case 1: // 本年
				return billDate.year() === now.year()
			default: // 全部
				return true
		}
	})
})

// 计算总支出
const totalExpense = computed(() => {
	return filteredBills.value
		.reduce((total, item) => total + Number(item.amount), 0)
		.toFixed(2)
})

// 计算环比
const comparePercentage = computed(() => {
	const current = Number(totalExpense.value)
	if (current === 0) return 0
	
	const now = dayjs()
	const previousBills = accountStore.accounts.filter(item => {
		const billDate = dayjs(item.createTime)
		switch(currentRange.value) {
			case 0: // 上月
				return billDate.month() === now.month() - 1 && 
					   billDate.year() === now.year()
			case 1: // 去年
				return billDate.year() === now.year() - 1
			default:
				return false
		}
	})
	
	const previous = previousBills.reduce((total, item) => total + Number(item.amount), 0)
	if (previous === 0) return 100
	
	return Math.round((current - previous) / previous * 100)
})

// 分类统计
const categoryStats = computed(() => {
	const stats = {}
	const total = Number(totalExpense.value)
	
	filteredBills.value.forEach(item => {
		if (!stats[item.category]) {
			stats[item.category] = {
				name: item.category,
				amount: 0,
				icon: getCategoryIcon(item.category),
				color: getCategoryColor(item.category)
			}
		}
		stats[item.category].amount += Number(item.amount)
	})
	
	return Object.values(stats)
		.map(item => ({
			...item,
			amount: item.amount.toFixed(2),
			percentage: total ? Math.round(item.amount / total * 100) : 0
		}))
		.sort((a, b) => Number(b.amount) - Number(a.amount))
})

// 支出趋势数据
const trendData = computed(() => {
	const data = []
	const now = dayjs()
	
	if (currentRange.value === 0) {
		// 本月按天统计
		const daysInMonth = now.daysInMonth()
		for (let i = 1; i <= daysInMonth; i++) {
			const dayStr = `${now.year()}-${String(now.month() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
			const amount = filteredBills.value
				.filter(item => dayjs(item.createTime).format('YYYY-MM-DD') === dayStr)
				.reduce((total, item) => total + Number(item.amount), 0)
			data.push({
				label: `${i}日`,
				amount,
				height: 0
			})
		}
	} else {
		// 按月统计
		for (let i = 0; i < 12; i++) {
			const monthStr = dayjs().month(i).format('M月')
			const amount = filteredBills.value
				.filter(item => dayjs(item.createTime).month() === i)
				.reduce((total, item) => total + Number(item.amount), 0)
			data.push({
				label: monthStr,
				amount,
				height: 0
			})
		}
	}
	
	// 计算高度百分比
	const maxAmount = Math.max(...data.map(item => item.amount))
	return data.map(item => ({
		...item,
		height: maxAmount ? Math.round(item.amount / maxAmount * 100) : 0
	}))
})

// 消费习惯分析
const mostExpenseTime = computed(() => {
	const timeStats = {}
	filteredBills.value.forEach(item => {
		const hour = dayjs(item.createTime).hour()
		const period = Math.floor(hour / 6)
		const periods = ['凌晨', '上午', '下午', '晚上']
		timeStats[period] = (timeStats[period] || 0) + Number(item.amount)
	})
	
	const maxPeriod = Object.entries(timeStats)
		.sort((a, b) => b[1] - a[1])[0]
	return maxPeriod ? ['凌晨', '上午', '下午', '晚上'][Number(maxPeriod[0])] : '暂无数据'
})

const averageExpense = computed(() => {
	if (filteredBills.value.length === 0) return '0.00'
	return (Number(totalExpense.value) / filteredBills.value.length).toFixed(2)
})

const maxExpense = computed(() => {
	if (filteredBills.value.length === 0) return '0.00'
	return Math.max(...filteredBills.value.map(item => Number(item.amount))).toFixed(2)
})

// 切换时间范围
function selectRange(index) {
	currentRange.value = index
}

// 获取分类图标和颜色的函数（与其他页面相同）
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
</script>

<style lang="scss" scoped>
.container {
	min-height: 100vh;
	background-color: #f5f5f5;
	padding: 20rpx;
}

.time-range {
	display: flex;
	background-color: #fff;
	padding: 20rpx;
	border-radius: 12rpx;
	margin-bottom: 20rpx;
	
	.range-item {
		flex: 1;
		text-align: center;
		padding: 10rpx 0;
		font-size: 28rpx;
		color: #666;
		position: relative;
		
		&.active {
			color: #3498db;
			font-weight: bold;
			
			&::after {
				content: '';
				position: absolute;
				bottom: -10rpx;
				left: 50%;
				transform: translateX(-50%);
				width: 40rpx;
				height: 4rpx;
				background-color: #3498db;
				border-radius: 2rpx;
			}
		}
	}
}

.total-card {
	background: linear-gradient(135deg, #3498db, #2980b9);
	padding: 40rpx;
	border-radius: 12rpx;
	color: #fff;
	margin-bottom: 20rpx;
	
	.title {
		font-size: 28rpx;
		opacity: 0.9;
	}
	
	.amount {
		font-size: 60rpx;
		font-weight: bold;
		margin: 20rpx 0;
	}
	
	.compare {
		font-size: 24rpx;
		opacity: 0.9;
		
		.up {
			color: #ff5252;
			margin-left: 10rpx;
		}
		
		.down {
			color: #4caf50;
			margin-left: 10rpx;
		}
	}
}

.stats-section {
	background-color: #fff;
	border-radius: 12rpx;
	padding: 20rpx;
	margin-bottom: 20rpx;
	
	.section-title {
		font-size: 32rpx;
		font-weight: bold;
		margin-bottom: 20rpx;
	}
}

.category-stats {
	.category-item {
		margin-bottom: 30rpx;
		
		.category-info {
			display: flex;
			align-items: center;
			margin-bottom: 10rpx;
			
			.icon-wrap {
				width: 60rpx;
				height: 60rpx;
				border-radius: 50%;
				display: flex;
				align-items: center;
				justify-content: center;
				margin-right: 20rpx;
				font-size: 28rpx;
			}
			
			.detail {
				flex: 1;
				display: flex;
				justify-content: space-between;
				align-items: center;
				
				.name {
					font-size: 28rpx;
					color: #333;
				}
				
				.amount {
					font-size: 28rpx;
					color: #666;
				}
			}
		}
		
		.progress-wrap {
			height: 6rpx;
			background-color: #f5f5f5;
			border-radius: 3rpx;
			position: relative;
			
			.progress-bar {
				height: 100%;
				border-radius: 3rpx;
				transition: width 0.3s ease;
			}
			
			.percentage {
				position: absolute;
				right: 0;
				top: -40rpx;
				font-size: 24rpx;
				color: #999;
			}
		}
	}
}

.trend-chart {
	display: flex;
	align-items: flex-end;
	height: 400rpx;
	padding: 20rpx 0;
	
	.trend-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		height: 100%;
		
		.bar {
			width: 30rpx;
			background: linear-gradient(to top, #3498db, #2980b9);
			border-radius: 15rpx;
			transition: height 0.3s ease;
		}
		
		.label {
			font-size: 24rpx;
			color: #999;
			margin-top: 10rpx;
			transform: rotate(-45deg);
		}
	}
}

.habits-list {
	.habit-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20rpx 0;
		border-bottom: 1rpx solid #eee;
		
		&:last-child {
			border-bottom: none;
		}
		
		.label {
			font-size: 28rpx;
			color: #666;
		}
		
		.value {
			font-size: 28rpx;
			color: #333;
			font-weight: 500;
		}
	}
}
</style> 