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
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		},
		methods: {
		}
	}
</script>

<style>
	/* 全局样式 */
	page {
		background-color: #f7f8fa;
	}
	
	/* 深色模式全局样式 */
	[data-theme='dark'] {
		page {
			background-color: #1a1a1a;
		}
	}
	
	/* 设置全局字体和颜色 */
	view, text, button {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
			Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
	}
	
	[data-theme='dark'] {
		view, text, button {
			color: #fff;
		}
		
		page {
			background-color: #1a1a1a;
		}
		
		.uni-popup {
			background-color: rgba(0, 0, 0, 0.7);
		}
		
		.uni-popup__wrapper {
			background-color: #2d2d2d;
		}
		
		.uni-popup__wrapper button {
			background-color: #3d3d3d;
			color: #fff;
		}
		
		.uni-popup__wrapper input {
			background-color: #3d3d3d;
			color: #fff;
		}
	}
</style>
