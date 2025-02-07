<script>
	import { useAccountStore } from '@/stores/account'
	import { useAppStore } from '@/stores/app'

	export default {
		onLaunch: function() {
			console.log('App Launch')
			const accountStore = useAccountStore()
			const appStore = useAppStore()
			accountStore.initAccounts()
			
			// 初始化深色模式
			const darkMode = uni.getStorageSync('darkMode')
			if (darkMode) {
				appStore.toggleDarkMode(true)
			}
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		},
	}
</script>

<style>
	/* 全局样式 */
	page {
		background-color: #f7f8fa;
	}
	
	/* 深色模式全局样式 */
	page.dark {
		background-color: #1a1a1a;
	}
	
	.dark {
		background-color: #1a1a1a;
		color: #fff;
	}
	
	.dark-mode page {
		background-color: #1a1a1a;
	}
	
	.dark-mode view, 
	.dark-mode text, 
	.dark-mode button {
		color: #fff;
	}
	
	.dark-mode .uni-popup {
		background-color: rgba(0, 0, 0, 0.7);
	}
	
	.dark-mode .uni-popup__wrapper {
		background-color: #2d2d2d;
	}
	
	.dark-mode .uni-popup__wrapper button {
		background-color: #3d3d3d;
		color: #fff;
	}
	
	.dark-mode .uni-popup__wrapper input {
		background-color: #3d3d3d;
		color: #fff;
	}
	
	/* 深色模式下的卡片样式 */
	.dark-mode .card {
		background-color: #2d2d2d;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.2);
	}
	
	/* 深色模式下的列表项样式 */
	.dark-mode .list-item {
		background-color: #2d2d2d;
		border-color: #3d3d3d;
	}
	
	/* 深色模式下的输入框样式 */
	.dark-mode input,
	.dark-mode textarea {
		background-color: #3d3d3d;
		color: #fff;
	}
	
	/* 深色模式下的分割线样式 */
	.dark-mode .divider {
		background-color: #3d3d3d;
	}
	
	/* 深色模式下的图标颜色 */
	.dark-mode .icon {
		color: #aaa;
	}
	
	/* 深色模式下的次要文本颜色 */
	.dark-mode .text-secondary {
		color: #888;
	}
	
	/* 设置全局字体 */
	view, text, button {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
			Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
	}
</style>
