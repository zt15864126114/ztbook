<template>
	<view :class="['container', darkMode ? 'dark' : '']">
		<!-- 用户信息区域 -->
		<view class="section user-section">
			<view class="section-title">账户信息</view>
			<view class="setting-item" @click="setMonthlyBudget">
				<text class="item-label">月度预算</text>
				<view class="item-value">
					<text>{{ accountStore.currencySymbol }}{{ accountStore.formattedBudget }}</text>
					<text class="iconfont icon-right"></text>
				</view>
			</view>
			<view class="setting-item" @click="showCurrencyPicker">
				<text class="item-label">货币单位</text>
				<view class="item-value">
					<text>{{ currencies.find(c => c.code === accountStore.currency)?.name || '人民币' }}</text>
					<text class="iconfont icon-right"></text>
				</view>
			</view>
			<view class="setting-item">
				<text class="item-label">预算提醒</text>
				<switch 
					:checked="budgetAlert" 
					@change="toggleBudgetAlert"
					color="#3498db"
				/>
			</view>
		</view>
		
		<!-- 数据管理 -->
		<view class="section">
			<view class="section-title">数据管理</view>
			<view class="setting-item" @click="exportData">
				<text class="item-label">导出账单</text>
				<text class="iconfont icon-right"></text>
			</view>
			<view class="setting-item" @click="backupData">
				<text class="item-label">备份数据</text>
				<text class="iconfont icon-right"></text>
			</view>
			<view class="setting-item" @click="clearData">
				<text class="item-label danger">清空数据</text>
				<text class="iconfont icon-right"></text>
			</view>
			<view class="setting-item" @click="clearCache">
				<text class="item-label">清除缓存</text>
				<view class="item-value">
					<text>{{ cacheSize }}</text>
					<text class="iconfont icon-right"></text>
				</view>
			</view>
			<view class="setting-item" @click="showCategoryManager">
				<text class="item-label">分类管理</text>
				<text class="iconfont icon-right"></text>
			</view>
			<view class="setting-item" @click="restoreData">
				<text class="item-label">恢复数据</text>
				<text class="iconfont icon-right"></text>
			</view>
			<view class="setting-item">
				<text class="item-label">自动备份</text>
				<switch 
					:checked="autoBackup" 
					@change="toggleAutoBackup"
					color="#3498db"
				/>
			</view>
		</view>
		
		<!-- 关于 -->
		<view class="section">
			<view class="section-title">关于</view>
			<view class="setting-item" @click="checkUpdate">
				<text class="item-label">检查更新</text>
				<view class="item-value">
					<text class="version">v1.0.0</text>
					<text class="iconfont icon-right"></text>
				</view>
			</view>
			<view class="setting-item" @click="showAbout">
				<text class="item-label">关于我们</text>
				<text class="iconfont icon-right"></text>
			</view>
		</view>
		
		<!-- 添加主题设置部分 -->
		<view class="section">
			<view class="section-title">显示设置</view>
			<view class="setting-item">
				<text class="item-label">深色模式</text>
				<switch 
					:checked="darkMode" 
					@change="toggleDarkMode"
					color="#3498db"
				/>
			</view>
			<view class="setting-item">
				<text class="item-label">列表动画</text>
				<switch 
					:checked="listAnimation" 
					@change="toggleListAnimation"
					color="#3498db"
				/>
			</view>
			<view class="setting-item">
				<text class="item-label">金额千分位</text>
				<switch 
					:checked="thousandsSeparator" 
					@change="toggleThousandsSeparator"
					color="#3498db"
				/>
			</view>
		</view>
	</view>
	
	<!-- 添加分类管理弹窗 -->
	<uni-popup ref="categoryPopup" type="bottom">
		<view class="category-manager">
			<view class="popup-header">
				<text class="title">分类管理</text>
				<text class="close" @click="closeCategoryManager">×</text>
			</view>
			<scroll-view scroll-y class="category-list">
				<view 
					v-for="category in accountStore.categories" 
					:key="category.id"
					class="category-item"
				>
					<view class="category-info">
						<view class="icon" :style="{ backgroundColor: category.color }">
							{{ category.icon }}
						</view>
						<text class="name">{{ category.name }}</text>
					</view>
					<view class="actions">
						<button class="edit-btn" @click="editCategory(category)">编辑</button>
						<button 
							class="delete-btn" 
							@click="deleteCategory(category)"
							:disabled="category.isDefault"
						>删除</button>
					</view>
				</view>
				<view class="add-category" @click="addCategory">
					<text class="plus">+</text>
					<text>添加分类</text>
				</view>
			</scroll-view>
		</view>
	</uni-popup>
	
	<!-- 添加货币选择弹窗 -->
	<uni-popup ref="currencyPopup" type="bottom">
		<view class="currency-picker">
			<view class="popup-header">
				<text class="title">选择货币</text>
				<text class="close" @click="closeCurrencyPicker">×</text>
			</view>
			<scroll-view scroll-y class="currency-list">
				<view 
					v-for="item in currencies" 
					:key="item.code"
					class="currency-item"
					:class="{ active: accountStore.currency === item.code }"
					@click="selectCurrency(item)"
				>
					<text class="symbol">{{ item.symbol }}</text>
					<text class="name">{{ item.name }}</text>
					<text class="code">{{ item.code }}</text>
				</view>
			</scroll-view>
		</view>
	</uni-popup>
</template>

<script setup>
import { useAccountStore } from '@/stores/account'
import { ref, onMounted } from 'vue'
import { exportToCSV } from '@/utils/transfer.js'
import { backupData as backupDataUtil, restoreData as restoreDataUtil } from '@/utils/backup.js'

const accountStore = useAccountStore()

// 预算提醒开关
const budgetAlert = ref(uni.getStorageSync('budgetAlert') || false)

// 深色模式
const darkMode = ref(uni.getStorageSync('darkMode') || false)

const cacheSize = ref('0.00MB')

const categoryPopup = ref(null)

// 自动备份
const autoBackup = ref(uni.getStorageSync('autoBackup') || false)

// 添加货币选择弹窗
const currencyPopup = ref(null)

// 货币列表
const currencies = ref([
	{ code: 'CNY', symbol: '¥', name: '人民币' },
	{ code: 'USD', symbol: '$', name: '美元' },
	{ code: 'EUR', symbol: '€', name: '欧元' },
	{ code: 'GBP', symbol: '£', name: '英镑' },
	{ code: 'JPY', symbol: '¥', name: '日元' },
	{ code: 'KRW', name: '韩元', symbol: '₩' },
	{ code: 'HKD', name: '港币', symbol: 'HK$' },
	{ code: 'AUD', name: '澳元', symbol: 'A$' },
	{ code: 'CAD', name: '加元', symbol: 'CA$' },
	{ code: 'CHF', name: '瑞士法郎', symbol: 'CHF' },
	{ code: 'SEK', name: '瑞典克朗', symbol: 'SEK' },
	{ code: 'NOK', name: '挪威克朗', symbol: 'NOK' },
	{ code: 'NZD', name: '新西兰元', symbol: 'NZ$' },
	{ code: 'SGD', name: '新加坡元', symbol: 'S$' },
	{ code: 'THB', name: '泰铢', symbol: '฿' },
	{ code: 'ZAR', name: '南非兰特', symbol: 'R' },
	{ code: 'INR', name: '印度卢比', symbol: '₹' },
	{ code: 'BRL', name: '巴西雷亚尔', symbol: 'R$' },
	{ code: 'RUB', name: '俄罗斯卢布', symbol: '₽' },
	{ code: 'TRY', name: '土耳其里拉', symbol: '₺' },
	{ code: 'CNY', name: '人民币', symbol: '¥' },
])

// 添加新的设置项变量
const listAnimation = ref(uni.getStorageSync('listAnimation') ?? true)
const thousandsSeparator = ref(uni.getStorageSync('thousandsSeparator') ?? false)

// 切换预算提醒
function toggleBudgetAlert(e) {
	budgetAlert.value = e.detail.value
	uni.setStorageSync('budgetAlert', budgetAlert.value)
	
	if (budgetAlert.value) {
		uni.showToast({
			title: '已开启预算提醒',
			icon: 'success'
		})
	}
}

// 切换深色模式
function toggleDarkMode(e) {
	darkMode.value = e.detail.value
	uni.setStorageSync('darkMode', darkMode.value)
	
	if (darkMode.value) {
		// 设置导航栏样式
		uni.setNavigationBarColor({
			frontColor: '#ffffff',
			backgroundColor: '#2d2d2d'
		})
		// 设置底部导航栏样式
		uni.setTabBarStyle({
			backgroundColor: '#2d2d2d',
			borderStyle: 'black',
			color: '#8F8F8F',
			selectedColor: '#3498db'
		})
	} else {
		// 恢复默认样式
		uni.setNavigationBarColor({
			frontColor: '#000000',
			backgroundColor: '#ffffff'
		})
		uni.setTabBarStyle({
			backgroundColor: '#ffffff',
			borderStyle: 'white',
			color: '#8F8F8F',
			selectedColor: '#3498db'
		})
	}
}

// 设置月度预算
function setMonthlyBudget() {
	uni.showModal({
		title: '设置月度预算',
		editable: true,
		placeholderText: '请输入预算金额',
		success: (res) => {
			if (res.confirm && res.content) {
				const amount = Number(res.content)
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
		}
	})
}

// 导出数据
function exportData() {
	try {
		const data = accountStore.accounts
		const csv = exportToCSV(data)
		
		// #ifdef H5
		// 创建下载链接
		const blob = new Blob([csv], { type: 'text/csv' })
		const url = window.URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `账单明细_${new Date().toLocaleDateString()}.csv`
		a.click()
		window.URL.revokeObjectURL(url)
		// #endif
		
		// #ifdef APP-PLUS
		// 生成文本内容
		let content = `账单明细导出 (${data.length}笔)\n`
		content += `导出时间：${formatDateTime(new Date())}\n`
		content += '==============================\n\n'
		
		data.forEach(item => {
			const date = new Date(item.createTime)
			const amount = Number(item.amount)
			content += `${formatDateTime(date)}\n`
			content += `【${item.category}】 ${accountStore.currencySymbol}${amount.toFixed(2)}\n`
			if (item.tags?.length) content += `标签: ${item.tags.join('、')}\n`
			if (item.note) content += `备注: ${item.note}\n`
			content += '------------------------------\n'
		})
		
		const totalAmount = data.reduce((sum, item) => sum + Number(item.amount), 0)
		const averageAmount = data.length > 0 ? totalAmount / data.length : 0
		
		content += '\n==============================\n'
		content += `总支出：${accountStore.currencySymbol}${totalAmount.toFixed(2)}\n`
		content += `平均支出：${accountStore.currencySymbol}${averageAmount.toFixed(2)}\n`
		content += `记账天数：${new Set(data.map(item => new Date(item.createTime).toLocaleDateString())).size}天\n`
		content += `记账笔数：${data.length}笔\n\n`
		content += '导出自：记账本 App'
		
		// 使用系统分享
		uni.shareWithSystem({
			type: 'text',
			title: '账单明细',
			summary: content,
			content: content,
			success: function() {
				uni.showToast({
					title: '分享成功',
					icon: 'success'
				})
			},
			fail: function() {
				uni.showToast({
					title: '分享失败',
					icon: 'error'
				})
			}
		})
		// #endif
		
		// #ifdef MP
		uni.showModal({
			title: '提示',
			content: '小程序暂不支持导出功能',
			showCancel: false
		})
		// #endif
	} catch (error) {
		console.error('导出失败:', error)
		uni.showToast({
			title: '导出失败',
			icon: 'error'
		})
	}
}

// 备份数据
function backupData(silent = false) {
	try {
		uni.showLoading({
			title: '正在备份...'
		})
		
		const success = backupDataUtil()
		
		uni.hideLoading()
		
		if (success) {
			if (!silent) {
				// Toast 会在 backupDataUtil 中显示
			}
		} else {
			throw new Error('备份失败')
		}
	} catch (error) {
		console.error('备份失败:', error)
		if (!silent) {
			uni.showToast({
				title: '备份失败',
				icon: 'error'
			})
		}
	}
}

// 清空数据
function clearData() {
	uni.showModal({
		title: '清空数据',
		content: '确定要清空所有数据吗？此操作不可恢复。',
		success: (res) => {
			if (res.confirm) {
				try {
					// 清空所有数据
					uni.removeStorageSync('accounts')
					uni.removeStorageSync('categories')
					uni.removeStorageSync('tags')
					// 重新初始化账户数据
					accountStore.initAccounts()
					uni.showToast({
						title: '已清空数据',
						icon: 'success'
					})
				} catch (error) {
					console.error('清空数据失败:', error)
					uni.showToast({
						title: '操作失败',
						icon: 'error'
					})
				}
			}
		}
	})
}

// 检查更新
function checkUpdate() {
	uni.showToast({
		title: '已是最新版本',
		icon: 'none'
	})
}

// 关于我们
function showAbout() {
	uni.showModal({
		title: '关于记账本',
		content: '这是一个简单的记账应用，帮助您更好地管理个人财务。\n\n开发者：Claude\n版本：1.0.0',
		showCancel: false,
		confirmText: '知道了'
	})
}

// 获取缓存大小
function getCacheSize() {
	uni.getStorageInfo({
		success: (res) => {
			const size = (res.currentSize / 1024).toFixed(2)
			cacheSize.value = size + 'MB'
		}
	})
}

// 清除缓存
function clearCache() {
	uni.showModal({
		title: '清除缓存',
		content: '确定要清除缓存吗？\n(不会删除账单数据)',
		success: (res) => {
			if (res.confirm) {
				// 保存重要数据
				const accounts = accountStore.accounts
				const budget = accountStore.budget
				const budgetAlert = uni.getStorageSync('budgetAlert')
				
				// 清除所有缓存
				uni.clearStorageSync()
				
				// 恢复重要数据
				accountStore.accounts = accounts
				accountStore.budget = budget
				uni.setStorageSync('budgetAlert', budgetAlert)
				
				// 更新缓存大小显示
				getCacheSize()
				
				uni.showToast({
					title: '清除成功',
					icon: 'success'
				})
			}
		}
	})
}

// 页面加载时获取缓存大小
onMounted(() => {
	getCacheSize()
	
	// 初始化深色模式
	if (darkMode.value) {
		uni.setTabBarStyle({
			backgroundColor: '#2d2d2d',
			borderStyle: 'black',
			color: '#8F8F8F',
			selectedColor: '#3498db'
		})
		uni.setNavigationBarColor({
			frontColor: '#ffffff',
			backgroundColor: '#2d2d2d'
		})
	}
	
	// 检查是否需要自动备份
	if (autoBackup.value) {
		const lastBackup = uni.getStorageSync('backup_data')?.backupTime
		if (!lastBackup || isBackupOutdated(lastBackup)) {
			backupData(true) // 静默备份
		}
	}
})

// 检查备份是否过期（超过24小时）
function isBackupOutdated(lastBackupTime) {
	const last = new Date(lastBackupTime)
	const now = new Date()
	const hours = (now - last) / (1000 * 60 * 60)
	return hours >= 24
}

// 显示分类管理
function showCategoryManager() {
	categoryPopup.value.open()
}

// 关闭分类管理
function closeCategoryManager() {
	categoryPopup.value.close()
}

// 添加分类
function addCategory() {
	uni.showModal({
		title: '添加分类',
		editable: true,
		placeholderText: '请输入分类名称',
		success: (res) => {
			if (res.confirm && res.content) {
				const newCategory = {
					id: Date.now(),
					name: res.content,
					icon: '📝', // 默认图标
					color: '#999999', // 默认颜色
					isDefault: false
				}
				accountStore.addCategory(newCategory)
				uni.showToast({
					title: '添加成功',
					icon: 'success'
				})
			}
		}
	})
}

// 编辑分类
function editCategory(category) {
	if (category.isDefault) {
		uni.showToast({
			title: '默认分类不可编辑',
			icon: 'none'
		})
		return
	}
	
	uni.showModal({
		title: '编辑分类',
		editable: true,
		content: category.name,
		success: (res) => {
			if (res.confirm && res.content) {
				accountStore.updateCategory(category.id, {
					...category,
					name: res.content
				})
				uni.showToast({
					title: '修改成功',
					icon: 'success'
				})
			}
		}
	})
}

// 删除分类
function deleteCategory(category) {
	if (category.isDefault) return
	
	uni.showModal({
		title: '确认删除',
		content: '删除分类后，该分类下的账单将被归类为"其他"，是否继续？',
		success: (res) => {
			if (res.confirm) {
				accountStore.deleteCategory(category.id)
				uni.showToast({
					title: '删除成功',
					icon: 'success'
				})
			}
		}
	})
}

// 恢复数据
function restoreData() {
	uni.showModal({
		title: '恢复数据',
		content: '确定要恢复数据吗？当前数据将被覆盖。',
		success: (res) => {
			if (res.confirm) {
				try {
					const success = restoreDataUtil()
					if (success) {
						// 重新初始化账户数据
						accountStore.initAccounts()
						uni.showToast({
							title: '恢复成功',
							icon: 'success'
						})
					} else {
						throw new Error('恢复失败')
					}
				} catch (error) {
					console.error('恢复失败:', error)
					uni.showToast({
						title: '恢复失败',
						icon: 'error'
					})
				}
			}
		}
	})
}

// 切换自动备份
function toggleAutoBackup(e) {
	autoBackup.value = e.detail.value
	uni.setStorageSync('autoBackup', autoBackup.value)
	
	if (autoBackup.value) {
		uni.showToast({
			title: '已开启自动备份',
			icon: 'success'
		})
	}
}

// 显示货币选择弹窗
function showCurrencyPicker() {
	currencyPopup.value.open()
}

// 关闭货币选择弹窗
function closeCurrencyPicker() {
	currencyPopup.value.close()
}

// 选择货币
function selectCurrency(item) {
	accountStore.setCurrency(item.code)
	currencyPopup.value.close()
	
	uni.showToast({
		title: '设置成功',
		icon: 'success'
	})
}

// 切换列表动画
function toggleListAnimation(e) {
	listAnimation.value = e.detail.value
	uni.setStorageSync('listAnimation', listAnimation.value)
}

// 切换千分位显示
function toggleThousandsSeparator(e) {
	thousandsSeparator.value = e.detail.value
	uni.setStorageSync('thousandsSeparator', thousandsSeparator.value)
	accountStore.setThousandsSeparator(thousandsSeparator.value)
}

// 添加日期时间格式化函数
function formatDateTime(date) {
	const year = date.getFullYear()
	const month = date.getMonth() + 1
	const day = date.getDate()
	const hour = date.getHours().toString().padStart(2, '0')
	const minute = date.getMinutes().toString().padStart(2, '0')
	
	return `${year}年${month}月${day}日 ${hour}:${minute}`
}
</script>

<style lang="scss" scoped>
.container {
	min-height: 100vh;
	background-color: #f7f8fa;
	padding: 24rpx;
	
	&.dark {
		background-color: #1a1a1a;
		
		.section {
			background-color: #2d2d2d;
			
			.section-title {
				color: #888;
				border-bottom-color: #3d3d3d;
			}
		}
	}
}

.section {
	background-color: #fff;
	border-radius: 12rpx;
	margin-bottom: 24rpx;
	overflow: hidden;
	
	.section-title {
		font-size: 28rpx;
		color: #999;
		padding: 24rpx;
		border-bottom: 1rpx solid #f5f5f5;
	}
}

.setting-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 32rpx 24rpx;
	background-color: #fff;
	
	&:not(:last-child) {
		border-bottom: 1rpx solid #f5f5f5;
	}
	
	.item-label {
		font-size: 32rpx;
		color: #333;
		
		&.danger {
			color: #ff0000;
		}
	}
	
	.item-value {
		display: flex;
		align-items: center;
		color: #666;
		font-size: 28rpx;
	}
	
	.iconfont {
		font-size: 32rpx;
		color: #999;
		margin-left: 8rpx;
	}
	
	&:active {
		background-color: #f9f9f9;
	}
}

.category-manager {
	background-color: #fff;
	border-radius: 24rpx 24rpx 0 0;
	height: 85vh;
	display: flex;
	flex-direction: column;
	
	.popup-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 30rpx;
		border-bottom: 1rpx solid #eee;
		
		.title {
			font-size: 32rpx;
			font-weight: bold;
		}
		
		.close {
			font-size: 40rpx;
			color: #999;
			padding: 0 20rpx;
		}
	}
	
	.category-list {
		flex: 1;
		padding: 20rpx 30rpx;
		box-sizing: border-box;
		
		.category-item {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 24rpx 0;
			border-bottom: 1rpx solid #f5f5f5;
			
			.category-info {
				display: flex;
				align-items: center;
				
				.icon {
					width: 72rpx;
					height: 72rpx;
					border-radius: 16rpx;
					display: flex;
					align-items: center;
					justify-content: center;
					margin-right: 20rpx;
					font-size: 36rpx;
				}
				
				.name {
					font-size: 32rpx;
					color: #333;
				}
			}
			
			.actions {
				display: flex;
				gap: 16rpx;
				
				button {
					font-size: 28rpx;
					padding: 12rpx 24rpx;
					border-radius: 100rpx;
					min-width: 120rpx;
					text-align: center;
					
					&.edit-btn {
						color: #3498db;
						background-color: #f0f9ff;
						&:active {
							background-color: #e3f2fd;
						}
					}
					
					&.delete-btn {
						color: #ff0000;
						background-color: #fff0f0;
						
						&:disabled {
							opacity: 0.5;
						}
						&:active:not(:disabled) {
							background-color: #ffe6e6;
						}
					}
				}
			}
		}
		
		.add-category {
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 40rpx 0;
			margin-top: 20rpx;
			color: #3498db;
			font-size: 32rpx;
			
			.plus {
				font-size: 36rpx;
				margin-right: 8rpx;
			}
			
			&:active {
				opacity: 0.7;
			}
		}
	}
}

.currency-picker {
	background-color: #fff;
	border-radius: 24rpx 24rpx 0 0;
	max-height: 80vh;
	
	.popup-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 30rpx;
		border-bottom: 1rpx solid #eee;
		
		.title {
			font-size: 32rpx;
			font-weight: bold;
		}
		
		.close {
			font-size: 40rpx;
			color: #999;
		}
	}
	
	.currency-list {
		max-height: calc(80vh - 100rpx);
		padding: 20rpx 30rpx;
		
		.currency-item {
			display: flex;
			align-items: center;
			padding: 24rpx 0;
			border-bottom: 1rpx solid #f5f5f5;
			
			&.active {
				color: #3498db;
			}
			
			.symbol {
				font-size: 32rpx;
				margin-right: 20rpx;
			}
			
			.name {
				flex: 1;
				font-size: 28rpx;
			}
			
			.code {
				font-size: 24rpx;
				color: #999;
			}
			
			&:active {
				background-color: #f9f9f9;
			}
		}
	}
}

.picker {
	.picker-value {
		display: flex;
		align-items: center;
		color: #666;
		font-size: 28rpx;
		
		.iconfont {
			margin-left: 8rpx;
		}
	}
}
</style> 