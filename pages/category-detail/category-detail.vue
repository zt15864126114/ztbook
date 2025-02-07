<template>
  <view class="container">
    <!-- 添加分享按钮 -->
    <view class="header-actions">
      <button class="share-btn" @click="shareCategory">
        <text class="iconfont icon-share"></text>
      </button>
    </view>
    <!-- 分类信息头部 -->
    <view class="category-header" :style="{ backgroundColor: categoryColor }">
      <view class="header-actions">
        <button class="action-btn" @click="showSearch = true">
          <text class="iconfont icon-search"></text>
        </button>
        <button class="action-btn" @click="shareCategory">
          <text class="iconfont icon-share"></text>
        </button>
      </view>
      <view class="category-info">
        <view class="icon">{{ categoryIcon }}</view>
        <view class="details">
          <text class="name">{{ categoryName }}</text>
          <text class="count">共{{ bills.length }}笔支出</text>
        </view>
      </view>
      <view class="amount-info">
        <text class="label">支出总额</text>
        <text class="amount">{{ accountStore.currencySymbol }}{{ totalAmount }}</text>
        <text class="average">平均 {{ accountStore.currencySymbol }}{{ averageAmount }}/笔</text>
      </view>
    </view>
    
    <!-- 搜索栏 -->
    <view class="search-wrapper" :class="{ 'show': showSearch }">
      <view class="search-bar">
        <text class="iconfont icon-search search-icon"></text>
        <input 
          type="text"
          class="search-input"
          v-model="searchText"
          placeholder="搜索备注"
          @input="onSearch"
          focus
        />
        <text 
          class="clear-btn" 
          v-if="searchText"
          @click="clearSearch"
        >✕</text>
      </view>
      <text class="cancel-btn" @click="cancelSearch">取消</text>
    </view>
    
    <!-- 账单列表 -->
    <scroll-view 
      scroll-y 
      class="bill-list"
      :style="{ height: `calc(100vh - 200rpx)` }"
      refresher-enabled
      :refresher-triggered="isRefreshing"
      @refresherrefresh="onRefresh"
    >
      <view class="date-group" v-for="group in groupedBills" :key="group.date">
        <view class="date-header">
          <text class="date">{{ group.displayDate }}</text>
          <text class="total">{{ accountStore.currencySymbol }}{{ group.total }}</text>
        </view>
        <view 
          class="bill-item" 
          v-for="bill in group.bills" 
          :key="bill.id"
          @click="showBillDetail(bill)"
        >
          <view class="time">{{ formatTime(bill.createTime) }}</view>
          <view class="content">
            <text class="remark">{{ bill.remark || '无备注' }}</text>
            <text class="amount">{{ accountStore.currencySymbol }}{{ bill.amount }}</text>
          </view>
        </view>
      </view>
      
      <!-- 空状态 -->
      <view v-if="bills.length === 0" class="empty-state">
        <image src="/static/empty.png" mode="aspectFit" class="empty-image"/>
        <text class="empty-text">暂无账单记录</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAccountStore } from '@/stores/account'
import { formatDateForDisplay, formatTime, formatDateTime } from '@/utils/date'

const categoryName = ref('')
const categoryIcon = ref('')
const categoryColor = ref('')
const bills = ref([])
const isRefreshing = ref(false)
const showSearch = ref(false)
const searchText = ref('')
const originalBills = ref([])

// 获取路由参数
const query = defineProps({
  category: String,
  year: Number,
  month: Number
})

// 计算总金额
const totalAmount = computed(() => {
  return bills.value
    .reduce((sum, bill) => sum + Number(bill.amount), 0)
    .toFixed(2)
})

// 计算平均金额
const averageAmount = computed(() => {
  if (bills.value.length === 0) return '0.00'
  return (Number(totalAmount.value) / bills.value.length).toFixed(2)
})

// 按日期分组的账单
const groupedBills = computed(() => {
  const groups = {}
  bills.value.forEach(bill => {
    const date = formatDate(bill.createTime)
    if (!groups[date]) {
      groups[date] = {
        date,
        displayDate: formatDateForDisplay(date),
        bills: [],
        total: 0
      }
    }
    groups[date].bills.push(bill)
    groups[date].total += Number(bill.amount)
  })
  
  return Object.values(groups)
    .map(group => ({
      ...group,
      total: group.total.toFixed(2)
    }))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
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
    content: `金额：¥${bill.amount}\n时间：${formatDateTime(bill.createTime)}\n备注：${bill.remark || '无'}`,
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
        const accountStore = useAccountStore()
        accountStore.deleteBill(bill.id)
        // 刷新账单列表
        bills.value = bills.value.filter(item => item.id !== bill.id)
        uni.showToast({
          title: '删除成功',
          icon: 'success'
        })
      }
    }
  })
}

// 分享分类账单
function shareCategory() {
  const summary = `${categoryName.value}类账单统计\n` +
    `总支出：${accountStore.currencySymbol}${totalAmount.value}\n` +
    `共${bills.value.length}笔\n` +
    `平均每笔：${accountStore.currencySymbol}${averageAmount.value}`
    
  // #ifdef H5
  if (navigator.share) {
    navigator.share({
      title: '账单分类明细',
      text: summary
    }).catch(err => {
      console.log('分享失败:', err)
    })
  } else {
    uni.setClipboardData({
      data: summary,
      success: () => {
        uni.showToast({
          title: '已复制到剪贴板',
          icon: 'success'
        })
      }
    })
  }
  // #endif
  
  // #ifdef MP
  uni.showModal({
    title: '分享统计',
    content: summary,
    confirmText: '复制',
    success: (res) => {
      if (res.confirm) {
        uni.setClipboardData({
          data: summary,
          success: () => {
            uni.showToast({
              title: '已复制到剪贴板',
              icon: 'success'
            })
          }
        })
      }
    }
  })
  // #endif
}

// 下拉刷新
async function onRefresh() {
  isRefreshing.value = true
  
  // 重新获取账单数据
  const accountStore = useAccountStore()
  bills.value = accountStore.accounts.filter(bill => 
    bill.category === categoryName.value &&
    new Date(bill.createTime).getFullYear() === Number(query.year) &&
    new Date(bill.createTime).getMonth() + 1 === Number(query.month)
  )
  
  setTimeout(() => {
    isRefreshing.value = false
    uni.showToast({
      title: '刷新成功',
      icon: 'success'
    })
  }, 500)
}

// 清除搜索
function clearSearch() {
  searchText.value = ''
  bills.value = originalBills.value
}

// 取消搜索
function cancelSearch() {
  showSearch.value = false
  clearSearch()
}

// 搜索功能
function onSearch() {
  if (!searchText.value.trim()) {
    bills.value = originalBills.value
    return
  }
  
  const keyword = searchText.value.toLowerCase().trim()
  bills.value = originalBills.value.filter(bill => 
    bill.remark?.toLowerCase().includes(keyword) ||
    bill.amount.toString().includes(keyword)
  )
}

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = currentPage.$page?.options
  
  if (options) {
    // 设置页面标题
    uni.setNavigationBarTitle({
      title: options.category + '的支出明细'
    })
    
    // 初始化分类信息
    categoryName.value = options.category
    categoryIcon.value = getCategoryIcon(options.category)
    categoryColor.value = getCategoryColor(options.category)
    
    // 从全局状态获取账单数据
    const accountStore = useAccountStore()
    bills.value = accountStore.accounts.filter(bill => 
      bill.category === options.category &&
      new Date(bill.createTime).getFullYear() === Number(options.year) &&
      new Date(bill.createTime).getMonth() + 1 === Number(options.month)
    )
    originalBills.value = [...bills.value]
  }
})
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.header-actions {
  position: absolute;
  top: 30rpx;
  right: 30rpx;
  z-index: 1;
  display: flex;
  gap: 20rpx;
  
  .action-btn {
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    line-height: 1;
    
    &::after {
      display: none;
    }
    
    .iconfont {
      font-size: 36rpx;
      color: #fff;
    }
  }
}

.category-header {
  padding: 40rpx 30rpx;
  color: #fff;
  
  .category-info {
    display: flex;
    align-items: center;
    margin-bottom: 30rpx;
    
    .icon {
      font-size: 48rpx;
      margin-right: 20rpx;
    }
    
    .details {
      .name {
        font-size: 36rpx;
        font-weight: 600;
        margin-bottom: 4rpx;
      }
      
      .count {
        font-size: 24rpx;
        opacity: 0.9;
      }
    }
  }
  
  .amount-info {
    .label {
      font-size: 24rpx;
      opacity: 0.9;
      margin-bottom: 4rpx;
    }
    
    .amount {
      font-size: 48rpx;
      font-weight: 600;
      margin-bottom: 4rpx;
    }
    
    .average {
      font-size: 24rpx;
      opacity: 0.9;
    }
  }
}

.search-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  padding: 20rpx 30rpx;
  display: flex;
  align-items: center;
  transform: translateY(-100%);
  transition: transform 0.3s ease;
  z-index: 100;
  
  &.show {
    transform: translateY(0);
  }
  
  .search-bar {
    flex: 1;
    height: 72rpx;
    background-color: #f5f5f5;
    border-radius: 36rpx;
    padding: 0 20rpx;
    margin-right: 20rpx;
    display: flex;
    align-items: center;
    
    .search-icon {
      font-size: 32rpx;
      color: #999;
      margin-right: 10rpx;
    }
    
    .search-input {
      flex: 1;
      height: 100%;
      font-size: 28rpx;
    }
    
    .clear-btn {
      padding: 10rpx;
      color: #999;
      font-size: 24rpx;
    }
  }
  
  .cancel-btn {
    padding: 10rpx;
    font-size: 28rpx;
    color: #666;
    
    &:active {
      opacity: 0.7;
    }
  }
}

.bill-list {
  padding: 24rpx;
  
  .date-group {
    margin-bottom: 24rpx;
    
    .date-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16rpx 0;
      
      .date {
        font-size: 28rpx;
        color: #666;
      }
      
      .total {
        font-size: 28rpx;
        color: #333;
        font-weight: 500;
      }
    }
  }
  
  .bill-item {
    background-color: #fff;
    border-radius: 12rpx;
    padding: 24rpx;
    margin-bottom: 16rpx;
    box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
    
    .time {
      font-size: 24rpx;
      color: #999;
      margin-bottom: 8rpx;
    }
    
    .content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .remark {
        font-size: 28rpx;
        color: #333;
      }
      
      .amount {
        font-size: 32rpx;
        color: #333;
        font-weight: 500;
      }
    }
    
    &:active {
      opacity: 0.7;
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
  }
}

// 当搜索栏显示时，调整列表位置
.search-wrapper.show + .bill-list {
  padding-top: 112rpx;
}
</style> 