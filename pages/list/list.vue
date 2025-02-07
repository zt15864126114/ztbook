<template>
	<view class="container">
		<!-- 月份选择器 -->
		<view class="month-header">
			<view class="month-picker" @click="showMonthPicker">
				<text class="year">{{ selectedYear }}年</text>
				<text class="month">{{ selectedMonth }}月</text>
				<text class="arrow">▼</text>
			</view>
			<view class="total">
				<text class="label">支出</text>
				<text class="amount">¥{{ monthTotal }}</text>
			</view>
		</view>
		
		<!-- 账单列表 -->
		<scroll-view 
			scroll-y 
			class="bill-list"
			@scrolltolower="loadMore"
			:style="{
				height: `calc(100vh - ${statusBarHeight}px - 44px - 52px - ${safeAreaBottom}px)`
			}"
		>
			<block v-for="(group, date) in groupedBills" :key="date">
				<view class="date-group">
					<view class="date-header">
						<text class="date">{{ formatDate(date) }}</text>
						<text class="day-total">支出 ¥{{ getDayTotal(group) }}</text>
					</view>
					<view class="bill-items">
						<view 
							class="bill-item"
							v-for="item in group"
							:key="item.id"
							@click="showBillDetail(item)"
							@longpress="showActions(item)"
						>
							<view class="left">
								<view class="icon" :style="{ backgroundColor: getCategoryColor(item.category) }">
									{{ getCategoryIcon(item.category) }}
								</view>
								<view class="detail">
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
		
		<!-- 添加操作菜单 -->
		<uni-popup ref="actionPopup" type="bottom">
			<view class="action-sheet">
				<view class="action-item" @click="editBill">
					<text>编辑</text>
				</view>
				<view class="action-item" @click="deleteBill">
					<text>删除</text>
				</view>
				<view class="action-item cancel" @click="closeActions">
					<text>取消</text>
				</view>
			</view>
		</uni-popup>
	</view>
</template>

<script setup>
import { ref, computed, onMounted, getCurrentInstance } from 'vue'
import { useAccountStore } from '@/stores/account'
import { 
	formatDate, 
	formatTime, 
	formatDateTime,
	getCurrentMonth,
	getCurrentYear,
	getLastMonth 
} from '@/utils/date'

const { proxy } = getCurrentInstance()
const accountStore = useAccountStore()
const scrollHeight = ref(0)
const loading = ref(false)
const selectedYear = ref(getCurrentYear())
const selectedMonth = ref(getCurrentMonth())
const actionPopup = ref(null)
const currentBill = ref(null)
const slideOffset = ref(0)
let startX = 0
const safeAreaBottom = ref(0)
const statusBarHeight = ref(0)

// 获取窗口高度
onMounted(() => {
	uni.getSystemInfo({
		success: (res) => {
			statusBarHeight.value = res.statusBarHeight
			safeAreaBottom.value = res.safeAreaInsets?.bottom || 0
		}
	})
})

// 按月筛选账单
const monthlyBills = computed(() => {
	return accountStore.accounts.filter(item => {
		const billDate = proxy.$dayjs(item.createTime)
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
		const date = proxy.$dayjs(bill.createTime).format('YYYY-MM-DD')
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
					selectedMonth.value = proxy.$dayjs().month() + 1
					selectedYear.value = proxy.$dayjs().year()
					break
				case 1:
					const lastMonth = proxy.$dayjs().subtract(1, 'month')
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
		content: `金额：¥${item.amount}\n备注：${item.note || '无备注'}\n时间：${proxy.$dayjs(item.createTime).format('YYYY-MM-DD HH:mm')}`,
		showCancel: false
	})
}

// 显示操作菜单
function showActions(item) {
	currentBill.value = item
	actionPopup.value.open()
}

// 关闭操作菜单
function closeActions() {
	actionPopup.value.close()
	currentBill.value = null
}

// 编辑账单
function editBill() {
	if (currentBill.value) {
		uni.navigateTo({
			url: `/pages/add/add?id=${currentBill.value.id}`
		})
		closeActions()
	}
}

// 删除账单
function deleteBill() {
	if (currentBill.value) {
		uni.showModal({
			title: '提示',
			content: '确定要删除这条账单吗？',
			success: (res) => {
				if (res.confirm) {
					accountStore.deleteAccount(currentBill.value.id)
					uni.showToast({
						title: '删除成功',
						icon: 'success'
					})
				}
				closeActions()
			}
		})
	}
}

// 滑动删除相关方法
function touchStart(e) {
	startX = e.touches[0].clientX
	slideOffset.value = 0
}

function touchMove(e) {
	const moveX = e.touches[0].clientX - startX
	if (moveX < 0) {
		slideOffset.value = Math.max(moveX, -80)
	}
}

function touchEnd() {
	if (slideOffset.value < -40) {
		slideOffset.value = -80
	} else {
		slideOffset.value = 0
	}
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
	display: flex;
	flex-direction: column;
	height: 100vh;
	background-color: #f5f5f5;
}

.month-header {
	padding: 20rpx 30rpx;
	background-color: #fff;
	height: 52px;
	box-sizing: border-box;
	display: flex;
	justify-content: space-between;
	align-items: center;
	position: relative;
	z-index: 1;
	
	.month-picker {
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
	
	.total {
		.label {
			font-size: 24rpx;
			color: #666;
			margin-right: 10rpx;
		}
		
		.amount {
			font-size: 32rpx;
			font-weight: bold;
		}
	}
}

.bill-list {
	flex: 1;
	padding: 20rpx;
	box-sizing: border-box;
}

.date-group {
	margin-bottom: 20rpx;
	
	&:last-child {
		margin-bottom: 0;
		padding-bottom: 20rpx;
	}
	
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
		transition: transform 0.3s ease;
		
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
				
				.icon {
					width: 80rpx;
					height: 80rpx;
					border-radius: 50%;
					display: flex;
					align-items: center;
					justify-content: center;
					margin-right: 20rpx;
					font-size: 32rpx;
				}
				
				.detail {
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

.action-sheet {
	background-color: #fff;
	border-radius: 20rpx 20rpx 0 0;
	overflow: hidden;
	
	.action-item {
		height: 100rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 32rpx;
		border-bottom: 1rpx solid #eee;
		
		&.cancel {
			color: #999;
			margin-top: 20rpx;
		}
	}
}

.safe-area-bottom {
	height: var(--safe-area-inset-bottom);
	background-color: #fff;
}
</style> 