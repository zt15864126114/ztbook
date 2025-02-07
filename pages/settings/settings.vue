<template>
	<view class="container">
		<!-- 用户信息 -->
		<view class="user-info">
			<view class="avatar">
				<image :src="userInfo.avatar || '/static/default-avatar.png'" mode="aspectFill"></image>
			</view>
			<view class="info">
				<text class="nickname">{{ userInfo.nickname || '点击登录' }}</text>
				<text class="desc">{{ userInfo.desc || '登录后体验更多功能' }}</text>
			</view>
		</view>
		
		<!-- 设置列表 -->
		<view class="settings-list">
			<!-- 预算设置 -->
			<view class="settings-group">
				<view class="group-title">预算管理</view>
				<view class="settings-item" @click="showBudgetModal">
					<text class="label">月度预算</text>
					<view class="value">
						<text>¥{{ budget }}</text>
						<text class="arrow">></text>
					</view>
				</view>
				<view class="settings-item">
					<text class="label">预算提醒</text>
					<switch :checked="budgetAlert" @change="toggleBudgetAlert" color="#3498db" />
				</view>
			</view>
			
			<!-- 分类管理 -->
			<view class="settings-group">
				<view class="group-title">分类管理</view>
				<view class="settings-item" @click="navigateToCategories">
					<text class="label">自定义分类</text>
					<text class="arrow">></text>
				</view>
				<view class="settings-item" @click="navigateToTags">
					<text class="label">标签管理</text>
					<text class="arrow">></text>
				</view>
			</view>
			
			<!-- 数据管理 -->
			<view class="settings-group">
				<view class="group-title">数据管理</view>
				<view class="settings-item" @click="exportData">
					<text class="label">导出账单</text>
					<text class="arrow">></text>
				</view>
				<view class="settings-item" @click="showBackupModal">
					<text class="label">数据备份</text>
					<text class="arrow">></text>
				</view>
			</view>
			
			<!-- 其他设置 -->
			<view class="settings-group">
				<view class="group-title">其他设置</view>
				<view class="settings-item">
					<text class="label">深色模式</text>
					<switch :checked="darkMode" @change="toggleDarkMode" color="#3498db" />
				</view>
				<view class="settings-item" @click="clearCache">
					<text class="label">清除缓存</text>
					<text class="value">{{ cacheSize }}</text>
				</view>
				<view class="settings-item" @click="showAbout">
					<text class="label">关于我们</text>
					<text class="arrow">></text>
				</view>
			</view>
		</view>
		
		<!-- 预算设置弹窗 -->
		<uni-popup ref="budgetPopup" type="dialog">
			<uni-popup-dialog
				mode="input"
				title="设置月度预算"
				placeholder="请输入预算金额"
				:value="String(budget)"
				@confirm="setBudget"
			/>
		</uni-popup>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAccountStore } from '@/stores/account'

const accountStore = useAccountStore()
const budgetPopup = ref(null)

// 用户信息
const userInfo = ref({
	avatar: '',
	nickname: '',
	desc: ''
})

// 设置数据
const budget = computed(() => accountStore.budget)
const budgetAlert = ref(uni.getStorageSync('budgetAlert') || false)
const darkMode = ref(uni.getStorageSync('darkMode') || false)
const cacheSize = ref('0.00MB')

// 显示预算设置弹窗
function showBudgetModal() {
	budgetPopup.value.open()
}

// 设置预算
function setBudget(value) {
	const amount = Number(value)
	if (isNaN(amount) || amount < 0) {
		uni.showToast({
			title: '请输入有效金额',
			icon: 'none'
		})
		return
	}
	accountStore.setBudget(amount)
	uni.showToast({
		title: '设置成功',
		icon: 'success'
	})
}

// 切换预算提醒
function toggleBudgetAlert(e) {
	budgetAlert.value = e.detail.value
	uni.setStorageSync('budgetAlert', budgetAlert.value)
}

// 切换深色模式
function toggleDarkMode(e) {
	darkMode.value = e.detail.value
	uni.setStorageSync('darkMode', darkMode.value)
	// 实现深色模式切换逻辑
}

// 导出数据
function exportData() {
	const data = {
		accounts: accountStore.accounts,
		categories: accountStore.categories,
		tags: accountStore.tags,
		budget: accountStore.budget
	}
	
	const str = JSON.stringify(data)
	// 实现数据导出逻辑，可以保存为文件或分享
	uni.showToast({
		title: '导出成功',
		icon: 'success'
	})
}

// 清除缓存
function clearCache() {
	uni.showModal({
		title: '提示',
		content: '确定要清除缓存吗？',
		success: (res) => {
			if (res.confirm) {
				// 实现清除缓存逻辑
				uni.showToast({
					title: '清除成功',
					icon: 'success'
				})
				getCacheSize()
			}
		}
	})
}

// 获取缓存大小
function getCacheSize() {
	// 实现获取缓存大小的逻辑
	cacheSize.value = '0.00MB'
}

// 显示关于页面
function showAbout() {
	uni.showModal({
		title: '关于我们',
		content: '这是一个简单的记账应用\n版本：1.0.0\n开发者：Your Name',
		showCancel: false
	})
}

// 页面加载时获取缓存大小
onMounted(() => {
	getCacheSize()
})
</script>

<style lang="scss" scoped>
.container {
	min-height: 100vh;
	background-color: #f5f5f5;
}

.user-info {
	background-color: #fff;
	padding: 40rpx 30rpx;
	display: flex;
	align-items: center;
	
	.avatar {
		width: 120rpx;
		height: 120rpx;
		border-radius: 60rpx;
		overflow: hidden;
		margin-right: 30rpx;
		
		image {
			width: 100%;
			height: 100%;
		}
	}
	
	.info {
		flex: 1;
		
		.nickname {
			font-size: 32rpx;
			font-weight: bold;
			color: #333;
			margin-bottom: 10rpx;
			display: block;
		}
		
		.desc {
			font-size: 24rpx;
			color: #999;
		}
	}
}

.settings-group {
	margin-top: 20rpx;
	background-color: #fff;
	
	.group-title {
		font-size: 28rpx;
		color: #666;
		padding: 20rpx 30rpx;
	}
	
	.settings-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 30rpx;
		border-bottom: 1rpx solid #eee;
		
		&:last-child {
			border-bottom: none;
		}
		
		.label {
			font-size: 28rpx;
			color: #333;
		}
		
		.value {
			font-size: 28rpx;
			color: #666;
			display: flex;
			align-items: center;
			
			.arrow {
				margin-left: 10rpx;
				color: #999;
			}
		}
		
		.arrow {
			color: #999;
		}
	}
}
</style> 