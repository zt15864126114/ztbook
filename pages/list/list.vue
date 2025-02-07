<template>
	<view class="container">
		<!-- 月份选择器 -->
		<view class="month-picker">
			<view class="picker-wrap" @click="showMonthPicker">
				<text class="year">{{ selectedYear }}年</text>
				<text class="month">{{ selectedMonth }}月</text>
				<text class="arrow">▼</text>
			</view>
			<view class="month-total">
				<text class="label">支出</text>
				<text class="amount">¥{{ monthTotal }}</text>
			</view>
		</view>
		
		<!-- 账单列表 -->
		<scroll-view 
			scroll-y 
			class="bill-list"
			@scrolltolower="loadMore"
			:style="{ height: scrollHeight + 'px' }"
		>
			<block v-for="(group, date) in groupedBills" :key="date">
				<!-- 日期分组 -->
				<view class="date-group">
					<view class="date-header">
						<text class="date">{{ formatDate(date) }}</text>
						<text class="day-total">支出 ¥{{ getDayTotal(group) }}</text>
					</view>
					
					<!-- 当日账单列表 -->
					<view class="bill-items">
						<view 
							class="bill-item"
							v-for="item in group"
							:key="item.id"
							@click="showBillDetail(item)"
							@longpress="showActions(item)"
						>
							<view class="left">
								<view class="category-icon" :style="{ backgroundColor: getCategoryColor(item.category) }">
									{{ getCategoryIcon(item.category) }}
								</view>
								<view class="bill-detail">
									<text class="category">{{ item.category }}</text>
									<text class="note">{{ item.note || '无备注' }}</text>
								</view>
							</view>
							<view class="right">
								<text class="amount">-{{ item.amount }}</text>
								<text class="time">{{ formatTime(item.createTime) }}</text>
							</view>
						</view>
					</view>
				</view>
			</block>
			
			<!-- 加载状态 -->
			<view class="loading-state" v-if="loading">
				<text>加载中...</text>
			</view>
			
			<!-- 无数据提示 -->
			<view class="empty-state" v-if="!loading && !hasData">
				<text>暂无账单记录</text>
			</view>
		</scroll-view>
	</view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAccountStore } from '@/stores/account'
import { 
	formatDate, 
	formatTime, 
	formatDateTime,
	getCurrentMonth,
	getCurrentYear,
	getLastMonth 
} from '@/utils/date'
import dayjs from 'dayjs'

const accountStore = useAccountStore()
const scrollHeight = ref(0)
const loading = ref(false)
const selectedYear = ref(getCurrentYear())
const selectedMonth = ref(getCurrentMonth())

// 获取窗口高度
onMounted(() => {
	uni.getSystemInfo({
		success: (res) => {
			// 减去月份选择器的高度和状态栏高度
			scrollHeight.value = res.windowHeight - 100
		}
	})
})

// 按月筛选账单
const monthlyBills = computed(() => {
	return accountStore.accounts.filter(item => {
		const billDate = dayjs(item.createTime)
		return billDate.year() === selectedYear.value && 
			   billDate.month() === selectedMonth.value - 1
	})
})

// 计算月度总支出
const monthTotal = computed(() => {
	return monthlyBills.value
		.reduce((total, item) => total + Number(item.amount), 0)
		.toFixed(2)
})

// 按日期分组
const groupedBills = computed(() => {
	const groups = {}
	monthlyBills.value.forEach(bill => {
		const date = dayjs(bill.createTime).format('YYYY-MM-DD')
		if (!groups[date]) {
			groups[date] = []
		}
		groups[date].push(bill)
	})
	
	// 按日期降序排序
	return Object.fromEntries(
		Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
	)
})

// 判断是否有数据
const hasData = computed(() => Object.keys(groupedBills.value).length > 0)

// 计算日总支出
function getDayTotal(bills) {
	return bills
		.reduce((total, item) => total + Number(item.amount), 0)
		.toFixed(2)
}

// 显示月份选择器
function showMonthPicker() {
	uni.showActionSheet({
		itemList: ['本月', '上月', '更早'],
		success: (res) => {
			switch(res.tapIndex) {
				case 0:
					selectedMonth.value = dayjs().month() + 1
					selectedYear.value = dayjs().year()
					break
				case 1:
					const lastMonth = dayjs().subtract(1, 'month')
					selectedMonth.value = lastMonth.month() + 1
					selectedYear.value = lastMonth.year()
					break
				case 2:
					// 可以添加自定义月份选择器
					break
			}
		}
	})
}

// 显示账单详情
function showBillDetail(item) {
	uni.showModal({
		title: item.category,
		content: `金额：¥${item.amount}\n备注：${item.note || '无备注'}\n时间：${dayjs(item.createTime).format('YYYY-MM-DD HH:mm')}`,
		showCancel: false
	})
}

// 显示操作菜单
function showActions(item) {
	uni.showActionSheet({
		itemList: ['编辑', '删除'],
		success: (res) => {
			if (res.tapIndex === 0) {
				// 编辑账单
				uni.navigateTo({
					url: `/pages/add/add?id=${item.id}`
				})
			} else if (res.tapIndex === 1) {
				// 删除账单
				uni.showModal({
					title: '确认删除',
					content: '是否删除该笔账单？',
					success: (res) => {
						if (res.confirm) {
							accountStore.deleteAccount(item.id)
						}
					}
				})
			}
		}
	})
}

// 获取分类图标和颜色的函数（与首页相同）
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

// 加载更多数据（如果需要分页）
function loadMore() {
	if (loading.value) return
	// 实现分页加载逻辑
}
</script>

<style lang="scss" scoped>
.container {
	background-color: #f5f5f5;
	min-height: 100vh;
}

.month-picker {
	background-color: #fff;
	padding: 20rpx 30rpx;
	display: flex;
	justify-content: space-between;
	align-items: center;
	position: sticky;
	top: 0;
	z-index: 100;
	
	.picker-wrap {
		display: flex;
		align-items: center;
		
		.year {
			font-size: 28rpx;
			color: #666;
			margin-right: 10rpx;
		}
		
		.month {
			font-size: 36rpx;
			font-weight: bold;
			margin-right: 10rpx;
		}
		
		.arrow {
			font-size: 24rpx;
			color: #666;
		}
	}
	
	.month-total {
		text-align: right;
		
		.label {
			font-size: 24rpx;
			color: #666;
			margin-right: 10rpx;
		}
		
		.amount {
			font-size: 32rpx;
			font-weight: bold;
			color: #333;
		}
	}
}

.bill-list {
	padding: 20rpx;
}

.date-group {
	margin-bottom: 20rpx;
	
	.date-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20rpx 0;
		
		.date {
			font-size: 28rpx;
			color: #666;
		}
		
		.day-total {
			font-size: 24rpx;
			color: #999;
		}
	}
	
	.bill-items {
		background-color: #fff;
		border-radius: 12rpx;
		overflow: hidden;
		
		.bill-item {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 20rpx;
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

.loading-state, .empty-state {
	text-align: center;
	padding: 40rpx;
	color: #999;
	font-size: 28rpx;
}
</style> 