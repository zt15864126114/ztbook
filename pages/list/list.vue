<template>
	<view :class="['container', darkMode ? 'dark' : '']">
		<!-- 月份选择器 -->
		<view class="month-header">
			<view class="month-picker">
				<text class="year">{{ selectedYear }}年</text>
				<text class="month">{{ selectedMonth }}月</text>
				<text class="arrow">▼</text>
			</view>
			<view class="total">
				<text>支出</text>
				<text class="amount">{{ accountStore.currencySymbol }}{{ accountStore.formatAmount(monthTotal) }}</text>
			</view>
		</view>
		
		<!-- 账单列表 -->
		<scroll-view 
			scroll-y 
			class="bill-list"
			:style="{ height: `calc(100vh - ${statusBarHeight}px - 44px - 52px - ${safeAreaBottom}px)` }"
		>
			<view v-for="(group, date) in groupedBills" :key="date" class="date-group">
				<view class="date-header">
					<text>{{ date }}</text>
					<text>支出 {{ accountStore.currencySymbol }}{{ group.total }}</text>
				</view>
				<view 
					class="bill-item" 
					v-for="bill in group.bills" 
					:key="bill.id"
					:class="{ 'animate': accountStore.listAnimation }"
					@click="showBillDetail(bill)"
				>
					<view 
						class="category-icon" 
						:style="{ backgroundColor: getCategoryColor(bill.category) }"
					>
						{{ getCategoryIcon(bill.category) }}
					</view>
					<view class="bill-info">
						<text class="category">{{ bill.category }}</text>
						<text class="remark">{{ bill.remark || '无备注' }}</text>
					</view>
					<view class="bill-amount">
						<text class="amount">-{{ accountStore.currencySymbol }}{{ accountStore.formatAmount(bill.amount) }}</text>
						<text class="time">{{ formatTime(bill.createTime) }}</text>
					</view>
				</view>
			</view>
			
			<!-- 空状态 -->
			<view v-if="!monthlyBills.length" class="empty-state">
				<image src="/static/empty.png" mode="aspectFit" class="empty-image"/>
				<text class="empty-text">本月还没有记账哦</text>
				<button class="add-btn" @click="goToAdd">去记一笔</button>
			</view>
		</scroll-view>
	</view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onPullDownRefresh } from '@dcloudio/uni-app'
import { useAccountStore } from '@/stores/account'
import { useAppStore } from '@/stores/app'
import { formatDate, formatTime, getCurrentYear, getCurrentMonth } from '@/utils/date'

const accountStore = useAccountStore()
const appStore = useAppStore()
const statusBarHeight = ref(0)
const safeAreaBottom = ref(0)
const selectedYear = ref(getCurrentYear())
const selectedMonth = ref(getCurrentMonth())
const darkMode = computed(() => appStore.darkMode)

// 获取本月账单
const monthlyBills = computed(() => {
	if (!accountStore?.accounts) return []
	
	return accountStore.accounts.filter(bill => {
		const date = new Date(bill.createTime)
		return date.getFullYear() === selectedYear.value &&
			   date.getMonth() + 1 === selectedMonth.value
	})
})

// 计算月度总支出
const monthTotal = computed(() => {
	if (!monthlyBills.value) return '0.00'
	
	return monthlyBills.value
		.reduce((sum, bill) => sum + Number(bill.amount), 0)
		.toFixed(2)
})

// 按日期分组的账单
const groupedBills = computed(() => {
	if (!monthlyBills.value) return {}
	
	const groups = {}
	monthlyBills.value.forEach(bill => {
		const date = formatDate(bill.createTime)
		if (!groups[date]) {
			groups[date] = {
				bills: [],
				total: 0
			}
		}
		groups[date].bills.push(bill)
		groups[date].total += Number(bill.amount)
	})
	
	// 格式化总金额
	Object.values(groups).forEach(group => {
		group.total = group.total.toFixed(2)
	})
	
	return groups
})

// 初始化数据
onMounted(async () => {
	const sysInfo = uni.getSystemInfoSync()
	statusBarHeight.value = sysInfo.statusBarHeight
	safeAreaBottom.value = sysInfo.safeAreaInsets?.bottom || 0
	
	// 确保数据已初始化
	if (!accountStore.accounts) {
		await accountStore.initAccounts()
	}
})

// 显示账单详情
function showBillDetail(bill) {
	uni.showActionSheet({
		itemList: ['查看详情', '编辑账单', '删除账单'],
		success: (res) => {
			switch(res.tapIndex) {
				case 0:
					showBillInfo(bill)
					break
				case 1:
					editBill(bill)
					break
				case 2:
					deleteBill(bill)
					break
			}
		}
	})
}

// 显示账单信息
function showBillInfo(bill) {
	uni.showModal({
		title: '账单详情',
		content: `金额：${accountStore.currencySymbol}${bill.amount}\n分类：${bill.category}\n时间：${formatDate(bill.createTime)} ${formatTime(bill.createTime)}\n备注：${bill.remark || '无'}`,
		showCancel: false,
		confirmText: '知道了'
	})
}

// 编辑账单
function editBill(bill) {
	uni.navigateTo({
		url: `/pages/add/add?id=${bill.id}&edit=true`
	})
}

// 删除账单
function deleteBill(bill) {
	uni.showModal({
		title: '确认删除',
		content: '确定要删除这笔账单吗？',
		success: (res) => {
			if (res.confirm) {
				const billElement = document.querySelector(`[data-id="${bill.id}"]`)
				if (billElement && accountStore.listAnimation) {
					// 添加删除动画
					billElement.classList.add('animate-leave')
					// 等待动画完成后删除
					setTimeout(() => {
						accountStore.deleteAccount(bill.id)
					}, 300)
				} else {
					accountStore.deleteAccount(bill.id)
				}
			}
		}
	})
}

// 跳转到记账页面
function goToAdd() {
	uni.navigateTo({
		url: '/pages/add/add'
	})
}

// 获取分类图标
function getCategoryIcon(category) {
	const icons = {
		'餐饮': '🍚',
		'交通': '🚗',
		'购物': '🛒',
		'娱乐': '��',
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

// 页面的下拉刷新处理函数
onPullDownRefresh(async () => {
	try {
		await accountStore.initAccounts()
		uni.showToast({
			title: '刷新成功',
			icon: 'success'
		})
	} catch (error) {
		uni.showToast({
			title: '刷新失败',
			icon: 'error'
		})
	} finally {
		uni.stopPullDownRefresh()
	}
})
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
				.year, .month {
					color: #eee;
				}
				
				.arrow {
					color: #888;
				}
			}
			
			.total {
				text {
					color: #eee;
					
					&.amount {
						color: #eee;
					}
				}
			}
		}
		
		.bill-list {
			.date-group {
				.date-header {
					background-color: #1a1a1a;
					color: #888;
				}
				
				.bill-item {
					background-color: #1e1e1e;
					border-bottom-color: #2d2d2d;
					
					.category-icon {
						box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.3);
					}
					
					.bill-info {
						.category {
							color: #eee;
						}
						
						.remark {
							color: #888;
						}
					}
					
					.bill-amount {
						.amount {
							color: #eee;
						}
							
						.time {
							color: #888;
						}
					}
					
					&:active {
						background-color: #2a2a2a;
					}
					
					&:last-child {
						border-bottom: none;
					}
				}
			}
		}
	}
	
	.month-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 24rpx 32rpx;
		background-color: #fff;
		transition: background-color 0.3s;
		
		.month-picker {
			display: flex;
			align-items: baseline;
			
			.year {
				font-size: 32rpx;
				color: #333;
				margin-right: 8rpx;
			}
			
			.month {
				font-size: 40rpx;
				font-weight: bold;
				color: #333;
				margin-right: 8rpx;
			}
			
			.arrow {
				font-size: 24rpx;
				color: #666;
			}
		}
		
		.total {
			text-align: right;
			
			text {
				font-size: 28rpx;
				color: #333;
				
				&.amount {
					margin-left: 8rpx;
					font-size: 32rpx;
					font-weight: bold;
				}
			}
		}
	}
	
	.bill-list {
		flex: 1;
		
		.date-group {
			.date-header {
				display: flex;
				justify-content: space-between;
				padding: 20rpx 32rpx;
				font-size: 28rpx;
				color: #666;
				background-color: #f5f5f5;
			}
			
			.bill-item {
				display: flex;
				align-items: center;
				padding: 24rpx 32rpx;
				background-color: #fff;
				border-bottom: 1rpx solid #f5f5f5;
				transition: background-color 0.3s;
				
				.category-icon {
					width: 88rpx;
					height: 88rpx;
					margin-right: 24rpx;
					border-radius: 16rpx;
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: 40rpx;
				}
				
				.bill-info {
					flex: 1;
					
					.category {
						font-size: 32rpx;
						color: #333;
						margin-bottom: 8rpx;
					}
					
					.remark {
						font-size: 28rpx;
						color: #999;
					}
				}
				
				.bill-amount {
					text-align: right;
					
					.amount {
						display: block;
						font-size: 32rpx;
						color: #333;
						margin-bottom: 8rpx;
					}
					
					.time {
						font-size: 24rpx;
						color: #999;
					}
				}
				
				&:active {
					background-color: #f9f9f9;
				}
				
				// 添加动画样式
				&.animate {
					animation: slideIn 0.3s ease-out;
					
					@keyframes slideIn {
						from {
							opacity: 0;
							transform: translateY(20rpx);
						}
						to {
							opacity: 1;
							transform: translateY(0);
						}
					}
				}
				
				// 删除时的动画
				&.animate-leave {
					animation: slideOut 0.3s ease-out;
					
					@keyframes slideOut {
						from {
							opacity: 1;
							transform: translateX(0);
						}
						to {
							opacity: 0;
							transform: translateX(-100%);
						}
					}
				}
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
}
</style> 