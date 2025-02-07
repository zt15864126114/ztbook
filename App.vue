<script>
	import { useAccountStore } from '@/stores/account'

	export default {
		onLaunch: function() {
			console.log('App Launch')
			const accountStore = useAccountStore()
			accountStore.initAccounts()
			
			// 初始化深色模式
			const darkMode = uni.getStorageSync('darkMode')
			if (darkMode) {
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
	.dark {
		background-color: #1a1a1a;
	}
	
	.dark view, 
	.dark text, 
	.dark button {
		color: #fff;
	}
	
	.dark .uni-popup {
		background-color: rgba(0, 0, 0, 0.7);
	}
	
	.dark .uni-popup__wrapper {
		background-color: #2d2d2d;
	}
	
	.dark .uni-popup__wrapper button {
		background-color: #3d3d3d;
		color: #fff;
	}
	
	.dark .uni-popup__wrapper input {
		background-color: #3d3d3d;
		color: #fff;
	}
	
	/* 设置全局字体 */
	view, text, button {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
			Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
	}
</style>
