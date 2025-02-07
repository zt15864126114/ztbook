<template>
	<view class="container">
		<!-- 顶部统计卡片 -->
		<view class="statistics-card">
			<view class="month-overview">
				<text class="month">{{ currentMonth }}月账单</text>
				<text class="total-amount">¥{{ monthTotal }}</text>
			</view>
			<view class="statistics-grid">
				<view class="grid-item">
					<text class="label">日均支出</text>
					<text class="value">¥{{ dailyAverage }}</text>
				</view>
				<view class="grid-item">
					<text class="label">最大支出</text>
					<text class="value">¥{{ maxExpense }}</text>
				</view>
				<view class="grid-item">
					<text class="label">记账天数</text>
					<text class="value">{{ recordDays }}天</text>
				</view>
			</view>
		</view>
		
		<!-- 分类统计 -->
		<view class="category-stats">
			<view class="section-title">支出构成</view>
			<view class="category-list">
				<view 
					v-for="category in categoryStats" 
					:key="category.name" 
					class="category-item"
				>
					<view class="category-info">
						<view class="category-icon" :style="{ backgroundColor: category.color }">
							{{ category.icon }}
						</view>
						<view class="category-detail">
							<text class="name">{{ category.name }}</text>
							<text class="amount">¥{{ category.amount }}</text>
						</view>
					</view>
					<text class="percentage">{{ category.percentage }}%</text>
				</view>
			</view>
		</view>
		
		<!-- 最近账单 -->
		<view class="recent-bills">
			<view class="section-title">
				<text>最近账单</text>
				<text class="more" @click="navigateToList">查看更多</text>
			</view>
			<view class="bill-list">
				<view 
					v-for="item in recentAccounts" 
					:key="item.id" 
					class="bill-item"
					@click="showBillDetail(item)"
				>
					<view class="left">
						<view class="category-icon" :style="{ backgroundColor: getCategoryColor(item.category) }">
							{{ getCategoryIcon(item.category) }}
						</view>
						<view class="bill-detail">
							<text class="category">{{ item.category }}</text>
							<text class="note">{{ item.note }}</text>
						</view>
					</view>
					<view class="right">
						<text class="amount">-{{ item.amount }}</text>
						<text class="time">{{ formatTime(item.createTime) }}</text>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 添加按钮 -->
		<view class="action-buttons">
			<view class="add-btn" @click="navigateToAdd">
				<text class="icon">+</text>
				<text>记一笔</text>
			</view>
		</view>
	</view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useAccountStore } from '@/stores/account'
import { onShow } from '@dcloudio/uni-app'
import { 
	formatTime, 
	formatDateTime, 
	getCurrentMonth,
	getCurrentYear 
} from '@/utils/date'

const accountStore = useAccountStore()
const currentMonth = ref(getCurrentMonth())

// 获取账目数据
const accounts = computed(() => accountStore.accounts)
const recentAccounts = computed(() => accounts.value.slice(-5).reverse())

// 计算月度总支出
const monthTotal = computed(() => {
	const thisMonth = accounts.value.filter(item => 
		dayjs(item.createTime).month() === currentMonth.value - 1
	)
	return thisMonth.reduce((total, item) => total + Number(item.amount), 0).toFixed(2)
})

// 计算日均支出
const dailyAverage = computed(() => {
	if (recordDays.value === 0) return '0.00'
	return (Number(monthTotal.value) / recordDays.value).toFixed(2)
})

// 计算最大支出
const maxExpense = computed(() => {
	const amounts = accounts.value.map(item => Number(item.amount))
	return Math.max(...amounts, 0).toFixed(2)
})

// 计算记账天数
const recordDays = computed(() => {
	const days = new Set(
		accounts.value.map(item => dayjs(item.createTime).format('YYYY-MM-DD'))
	)
	return days.size
})

// 计算分类统计
const categoryStats = computed(() => {
	const stats = {}
	const total = Number(monthTotal.value)
	
	accounts.value.forEach(item => {
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
	
	return Object.values(stats).map(item => ({
		...item,
		amount: item.amount.toFixed(2),
		percentage: total ? ((item.amount / total) * 100).toFixed(1) : '0.0'
	}))
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

// 导航函数
function navigateToAdd() {
	uni.navigateTo({ url: '/pages/add/add' })
}

function navigateToList() {
	uni.navigateTo({ url: '/pages/list/list' })
}

function showBillDetail(item) {
	uni.showModal({
		title: item.category,
		content: `金额：¥${item.amount}\n备注：${item.note}\n时间：${dayjs(item.createTime).format('YYYY-MM-DD HH:mm')}`,
		showCancel: false
	})
}
</script>

<style lang="scss" scoped>
.container {
	min-height: 100vh;
	background-color: #f5f5f5;
	padding: 20rpx;
}

.statistics-card {
	background: linear-gradient(135deg, #3498db, #2980b9);
	border-radius: 20rpx;
	padding: 40rpx 30rpx;
	color: #fff;
	margin-bottom: 20rpx;
	
	.month-overview {
		text-align: center;
		margin-bottom: 30rpx;
		
		.month {
			font-size: 28rpx;
			opacity: 0.9;
		}
		
		.total-amount {
			font-size: 60rpx;
			font-weight: bold;
			margin-top: 10rpx;
			display: block;
		}
	}
	
	.statistics-grid {
		display: flex;
		justify-content: space-around;
		
		.grid-item {
			text-align: center;
			
			.label {
				font-size: 24rpx;
				opacity: 0.9;
				display: block;
			}
			
			.value {
				font-size: 32rpx;
				font-weight: 500;
				margin-top: 10rpx;
				display: block;
			}
		}
	}
}

.section-title {
	font-size: 32rpx;
	font-weight: bold;
	margin: 30rpx 0 20rpx;
	display: flex;
	justify-content: space-between;
	align-items: center;
	
	.more {
		font-size: 24rpx;
		color: #666;
		font-weight: normal;
	}
}

.category-stats {
	background-color: #fff;
	border-radius: 20rpx;
	padding: 20rpx;
	
	.category-list {
		.category-item {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 20rpx;
			
			.category-info {
				display: flex;
				align-items: center;
				
				.category-icon {
					width: 80rpx;
					height: 80rpx;
					border-radius: 50%;
					display: flex;
					align-items: center;
					justify-content: center;
					margin-right: 20rpx;
					font-size: 32rpx;
				}
				
				.category-detail {
					.name {
						font-size: 28rpx;
						color: #333;
					}
					
					.amount {
						font-size: 24rpx;
						color: #666;
						margin-top: 4rpx;
					}
				}
			}
			
			.percentage {
				font-size: 28rpx;
				color: #666;
			}
		}
	}
}

.recent-bills {
	background-color: #fff;
	border-radius: 20rpx;
	padding: 20rpx;
	margin-top: 20rpx;
	
	.bill-list {
		.bill-item {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 20rpx 0;
			border-bottom: 1rpx solid #eee;
			
			&:last-child {
				border-bottom: none;
			}
			
			.left {
				display: flex;
				align-items: center;
				
				.category-icon {
					width: 80rpx;
					height: 80rpx;
					border-radius: 50%;
					display: flex;
					align-items: center;
					justify-content: center;
					margin-right: 20rpx;
					font-size: 32rpx;
				}
				
				.bill-detail {
					.category {
						font-size: 28rpx;
						color: #333;
					}
					
					.note {
						font-size: 24rpx;
						color: #999;
						margin-top: 4rpx;
					}
				}
			}
			
			.right {
				text-align: right;
				
				.amount {
					font-size: 32rpx;
					color: #333;
					font-weight: 500;
				}
				
				.time {
					font-size: 24rpx;
					color: #999;
					margin-top: 4rpx;
					display: block;
				}
			}
		}
	}
}

.action-buttons {
	position: fixed;
	bottom: 40rpx;
	left: 0;
	right: 0;
	display: flex;
	justify-content: center;
	
	.add-btn {
		background: linear-gradient(135deg, #3498db, #2980b9);
		color: #fff;
		padding: 20rpx 60rpx;
		border-radius: 100rpx;
		display: flex;
		align-items: center;
		box-shadow: 0 4rpx 12rpx rgba(52, 152, 219, 0.3);
		
		.icon {
			font-size: 40rpx;
			margin-right: 10rpx;
		}
	}
}
</style>
