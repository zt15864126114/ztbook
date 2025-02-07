<template>
  <view :class="['container', darkMode ? 'dark' : '']">
    <!-- 主内容区 -->
    <view class="main-content">
      <!-- 金额卡片 -->
      <view class="amount-card" :style="{ backgroundColor: category.color }">
        <!-- 玻璃态背景 -->
        <view class="glass-bg"></view>
        
        <!-- 背景装饰 -->
        <view class="card-decoration">
          <!-- 光晕效果 -->
          <view class="light-effect"></view>
          <view class="circles">
            <view class="circle"></view>
            <view class="circle"></view>
            <view class="circle"></view>
          </view>
          <!-- 动态渐变背景 -->
          <view class="gradient-bg"></view>
          <view class="pattern"></view>
        </view>

        <!-- 分类信息 -->
        <view class="category-info">
          <view class="icon-wrap">
            <view class="icon-bg"></view>
            <text class="icon">{{ category.icon }}</text>
            <view class="icon-ring"></view>
            <view class="icon-glow"></view>
          </view>
          <text class="name">{{ category.name }}</text>
        </view>

        <!-- 金额信息 -->
        <view class="amount-section">
          <text class="label">本月支出</text>
          <view class="amount-wrap">
            <text class="amount">{{ accountStore.currencySymbol }}{{ category.amount }}</text>
            <view class="amount-glow"></view>
          </view>
          <view class="trend">
            <text class="trend-label">较上月</text>
            <text class="trend-value" :class="{ 'up': monthOverMonthChange > 0 }">
              {{ monthOverMonthChange > 0 ? '+' : '' }}{{ monthOverMonthChange }}%
            </text>
          </view>
          <view class="progress-bar">
            <view 
              class="bar" 
              :style="{ width: category.percentage + '%' }"
            >
              <view class="bar-shine"></view>
            </view>
            <view class="bar-label">占支出{{ category.percentage }}%</view>
          </view>
        </view>

        <!-- 统计信息 -->
        <view class="stats-section">
          <view 
            v-for="(stat, index) in [
              { value: totalCount, label: '笔数' },
              { value: averagePerBill, label: '单笔均值' },
              { value: category.percentage + '%', label: '占比' }
            ]"
            :key="index"
            class="stat"
          >
            <view class="stat-content">
              <text class="value">{{ stat.value }}</text>
              <text class="label">{{ stat.label }}</text>
            </view>
            <view class="stat-glow"></view>
          </view>
        </view>
      </view>

      <!-- 账单列表 -->
      <view class="bills-section">
        <view class="list-header">
          <view class="header-left">
            <text class="title">本月账单</text>
            <text class="count">{{ totalCount }}笔</text>
          </view>
          <view class="sort-buttons">
            <view 
              class="sort-btn"
              :class="{ active: currentSort === 'time' }"
              @click="currentSort = 'time'"
              :style="{ 
                backgroundColor: currentSort === 'time' ? `${category.color}15` : '#f5f7fa',
                color: currentSort === 'time' ? category.color : '#666'
              }"
            >
              <text class="icon">⏱️</text>
              <text class="text">时间</text>
            </view>
            <view 
              class="sort-btn"
              :class="{ active: currentSort === 'amount' }"
              @click="currentSort = 'amount'"
              :style="{ 
                backgroundColor: currentSort === 'amount' ? `${category.color}15` : '#f5f7fa',
                color: currentSort === 'amount' ? category.color : '#666'
              }"
            >
              <text class="icon">💰</text>
              <text class="text">金额</text>
            </view>
          </view>
        </view>

        <view class="bill-groups">
          <template v-if="monthlyBills.length">
            <view 
              v-for="group in monthlyBills" 
              :key="group.title" 
              class="bill-group"
            >
              <view class="group-title">
                <view class="date-wrap">
                  <text class="dot"></text>
                  <text class="date">{{ group.title }}</text>
                  <text class="count">{{ group.bills.length }}笔</text>
                </view>
                <text class="total">{{ accountStore.currencySymbol }}{{ calculateGroupTotal(group.bills) }}</text>
              </view>
              
              <view 
                v-for="bill in group.bills"
                :key="bill.id"
                class="bill-item"
                hover-class="bill-item-hover"
                @click="showBillDetail(bill)"
              >
                <view class="time">{{ formatTime(bill.createTime) }}</view>
                <view class="content">
                  <text class="note">{{ bill.note || '无备注' }}</text>
                  <view class="tags" v-if="bill.tags?.length">
                    <text 
                      v-for="tag in bill.tags" 
                      :key="tag" 
                      class="tag"
                      :style="{ 
                        backgroundColor: `${category.color}15`,
                        color: category.color 
                      }"
                    >{{ tag }}</text>
                  </view>
                </view>
                <text class="amount">{{ accountStore.currencySymbol }}{{ bill.amount }}</text>
              </view>
            </view>
          </template>
          <template v-else>
            <view class="empty-state">
              <text class="icon">📝</text>
              <text class="empty-text">本月暂无记录</text>
            </view>
          </template>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useAccountStore } from '@/stores/account'
import { useAppStore } from '@/stores/app'
import { formatDate, formatTime, formatDayOfWeek } from '@/utils/date'

const accountStore = useAccountStore()
const appStore = useAppStore()
const darkMode = computed(() => appStore.darkMode)

// 获取路由参数
const category = ref({})

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = currentPage.$page.options
  if (options.category) {
    category.value = JSON.parse(decodeURIComponent(options.category))
  }
})

// 返回上一页
function goBack() {
  uni.navigateBack()
}

// 显示账单详情
function showBillDetail(bill) {
  uni.showModal({
    title: formatDate(bill.createTime),
    content: `金额：${accountStore.currencySymbol}${bill.amount}\n${bill.note ? '备注：' + bill.note : ''}${bill.tags?.length ? '\n标签：' + bill.tags.join('、') : ''}`,
    confirmText: '编辑',
    cancelText: '关闭',
    success: (res) => {
      if (res.confirm) {
        uni.navigateTo({
          url: `/pages/add/add?id=${bill.id}`
        })
      }
    }
  })
}

// 获取本月账单并排序
const monthlyBills = computed(() => {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  const bills = accountStore.accounts
    .filter(bill => {
      const date = new Date(bill.createTime)
      return bill.category === category.value.name &&
             date.getMonth() === currentMonth &&
             date.getFullYear() === currentYear
    })
    // 根据排序方式排序
    .sort((a, b) => {
      if (currentSort.value === 'time') {
        return new Date(b.createTime) - new Date(a.createTime)
      } else {
        return Number(b.amount) - Number(a.amount)
      }
    })

  // 按日期分组
  return bills.reduce((groups, bill) => {
    const date = new Date(bill.createTime)
    const dayStr = `${date.getMonth() + 1}月${date.getDate()}日`
    
    const group = groups.find(g => g.title === dayStr)
    if (group) {
      group.bills.push(bill)
    } else {
      groups.push({
        title: dayStr,
        bills: [bill]
      })
    }
    return groups
  }, [])
})

// 排序选项
const sortOptions = [
  { type: 'time', name: '按时间' },
  { type: 'amount', name: '按金额' }
]
const currentSort = ref('time')

// 计算分组总金额
function calculateGroupTotal(bills) {
  return bills.reduce((sum, bill) => sum + Number(bill.amount), 0).toFixed(2)
}

// 计算总笔数
const totalCount = computed(() => {
  return monthlyBills.value.reduce((sum, group) => sum + group.bills.length, 0)
})

// 计算平均每笔金额
const averagePerBill = computed(() => {
  const totalAmount = monthlyBills.value.reduce((sum, group) => sum + group.bills.reduce((sum, bill) => sum + Number(bill.amount), 0), 0)
  return (totalAmount / totalCount.value).toFixed(2)
})

// 计算月度变化
const monthOverMonthChange = computed(() => {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  const bills = accountStore.accounts
    .filter(bill => {
      const date = new Date(bill.createTime)
      return bill.category === category.value.name &&
             date.getMonth() === currentMonth &&
             date.getFullYear() === currentYear
    })
    .reduce((sum, bill) => sum + Number(bill.amount), 0)
  
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear
  
  const previousBills = accountStore.accounts
    .filter(bill => {
      const date = new Date(bill.createTime)
      return bill.category === category.value.name &&
             date.getMonth() === previousMonth &&
             date.getFullYear() === previousYear
    })
    .reduce((sum, bill) => sum + Number(bill.amount), 0)
  
  if (previousBills === 0) return 0
  
  const change = ((bills - previousBills) / previousBills) * 100
  return change.toFixed(2)
})
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: #f8f9fa;
  padding: 24rpx;
  
  &.dark {
    background: #121212;
  }
}

.amount-card {
  padding: 40rpx 32rpx;
  border-radius: 24rpx;
  color: #fff;
  margin-bottom: 24rpx;
  position: relative;
  overflow: hidden;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.15);
  
  .glass-bg {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.2),
      rgba(255, 255, 255, 0.1)
    );
    backdrop-filter: blur(10px);
  }

  .card-decoration {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
    
    .light-effect {
      position: absolute;
      width: 200%;
      height: 200%;
      background: radial-gradient(
        circle at center,
        rgba(255, 255, 255, 0.2) 0%,
        transparent 70%
      );
      animation: rotate 15s linear infinite;
    }
    
    .gradient-bg {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        45deg,
        transparent,
        rgba(255, 255, 255, 0.1),
        transparent
      );
      animation: slide 3s ease-in-out infinite alternate;
    }
    
    .circles {
      position: absolute;
      right: -100rpx;
      top: -100rpx;
      
      .circle {
        position: absolute;
        border: 2rpx solid rgba(255,255,255,0.1);
        border-radius: 50%;
        
        &:nth-child(1) {
          width: 300rpx;
          height: 300rpx;
        }
        
        &:nth-child(2) {
          width: 400rpx;
          height: 400rpx;
        }
        
        &:nth-child(3) {
          width: 500rpx;
          height: 500rpx;
        }
      }
    }
    
    .pattern {
      position: absolute;
      inset: 0;
      opacity: 0.05;
      background-image: radial-gradient(circle at 2rpx 2rpx, #fff 1rpx, transparent 0);
      background-size: 20rpx 20rpx;
    }
  }

  .category-info {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-bottom: 32rpx;
    
    .icon-wrap {
      .icon-bg {
        position: absolute;
        inset: 0;
        background: radial-gradient(
          circle at center,
          rgba(255, 255, 255, 0.3),
          transparent
        );
        filter: blur(5px);
      }
      
      .icon {
        position: relative;
        z-index: 1;
        font-size: 40rpx;
        filter: drop-shadow(0 2rpx 4rpx rgba(0,0,0,0.1));
      }
      
      .icon-ring {
        position: absolute;
        inset: -6rpx;
        border: 2rpx solid rgba(255,255,255,0.2);
        border-radius: 50%;
      }
      
      .icon-glow {
        position: absolute;
        inset: -10rpx;
        background: radial-gradient(
          circle at center,
          rgba(255,255,255,0.3) 0%,
          transparent 70%
        );
        animation: glow 2s ease-in-out infinite;
      }
    }
    
    .name {
      font-size: 36rpx;
      font-weight: 600;
      text-shadow: 0 2rpx 4rpx rgba(0,0,0,0.1);
    }
  }

  .amount-section {
    position: relative;
    z-index: 1;
    margin-bottom: 32rpx;
    
    .label {
      font-size: 28rpx;
      opacity: 0.9;
    }
    
    .amount-wrap {
      position: relative;
      display: inline-block;
      
      .amount {
        position: relative;
        z-index: 1;
      }
      
      .amount-glow {
        position: absolute;
        inset: -10rpx;
        background: radial-gradient(
          circle at center,
          rgba(255, 255, 255, 0.3),
          transparent
        );
        filter: blur(10px);
      }
    }
    
    .trend {
      display: flex;
      align-items: center;
      gap: 8rpx;
      margin-bottom: 16rpx;
      
      .trend-label {
        font-size: 24rpx;
        opacity: 0.8;
      }
      
      .trend-value {
        font-size: 24rpx;
        color: #2ecc71;
        
        &.up {
          color: #e74c3c;
        }
      }
    }
    
    .progress-bar {
      height: 4rpx;
      background: rgba(255,255,255,0.2);
      border-radius: 2rpx;
      margin: 20rpx 0 8rpx;
      overflow: hidden;
      position: relative;
      
      .bar {
        height: 100%;
        background: #fff;
        border-radius: 2rpx;
        transition: width 0.6s ease;
        box-shadow: 0 0 8rpx rgba(255,255,255,0.5);
      }
      
      .bar-label {
        font-size: 24rpx;
        opacity: 0.8;
        margin-top: 8rpx;
      }
      
      .bar-shine {
        position: absolute;
        top: 0;
        left: -100%;
        width: 50%;
        height: 100%;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(255, 255, 255, 0.3),
          transparent
        );
        animation: shine 2s ease-in-out infinite;
      }
    }
  }

  .stats-section {
    position: relative;
    z-index: 1;
    display: flex;
    justify-content: space-between;
    padding-top: 24rpx;
    border-top: 1rpx solid rgba(255,255,255,0.1);
    
    .stat {
      text-align: center;
      
      .value {
        font-size: 32rpx;
        font-weight: 500;
        display: block;
        margin-bottom: 4rpx;
      }
      
      .label {
        font-size: 24rpx;
        opacity: 0.8;
      }
      
      .stat-content {
        position: relative;
        z-index: 1;
      }
      
      .stat-glow {
        position: absolute;
        inset: -5rpx;
        background: radial-gradient(
          circle at center,
          rgba(255, 255, 255, 0.2),
          transparent
        );
        filter: blur(5px);
        opacity: 0;
        transition: opacity 0.3s;
      }
      
      &:hover .stat-glow {
        opacity: 1;
      }
    }
    
    .divider {
      width: 1rpx;
      height: 40rpx;
      background: rgba(255,255,255,0.2);
      margin-top: 8rpx;
    }
  }
}

.bills-section {
  background: #fff;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
  
  .list-header {
    padding: 32rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .header-left {
      display: flex;
      align-items: center;
      gap: 12rpx;
      
      .title {
        font-size: 32rpx;
        font-weight: 600;
      }
      
      .count {
        font-size: 24rpx;
        color: #999;
        background: #f5f7fa;
        padding: 4rpx 12rpx;
        border-radius: 100rpx;
      }
    }
    
    .sort-buttons {
      display: flex;
      gap: 12rpx;
      
      .sort-btn {
        display: flex;
        align-items: center;
        gap: 6rpx;
        padding: 12rpx 20rpx;
        border-radius: 100rpx;
        transition: all 0.3s;
        
        .icon {
          font-size: 24rpx;
        }
        
        .text {
          font-size: 24rpx;
        }
      }
    }
  }
  
  .bill-groups {
    .bill-group {
      .group-title {
        padding: 24rpx 32rpx;
        background: #f8f9fa;
        display: flex;
        justify-content: space-between;
        font-size: 13px;
        color: #666;
      }
      
      .bill-item {
        padding: 32rpx;
        display: flex;
        align-items: center;
        border-bottom: 1rpx solid #f0f0f0;
        
        &:last-child {
          border-bottom: none;
        }
        
        &:active {
          background-color: #f8f9fa;
        }
        
        .time {
          width: 120rpx;
          font-size: 26rpx;
          color: #999;
        }
        
        .content {
          flex: 1;
          margin: 0 24rpx;
          
          .note {
            font-size: 30rpx;
            margin-bottom: 8rpx;
          }
          
          .tags {
            display: flex;
            flex-wrap: wrap;
            gap: 12rpx;
            
            .tag {
              font-size: 24rpx;
              padding: 4rpx 16rpx;
              background: #f8f9fa;
              border-radius: 100rpx;
            }
          }
        }
        
        .amount {
          font-size: 32rpx;
          font-weight: 500;
          min-width: 140rpx;
          text-align: right;
        }
      }
    }
  }
}

.empty-state {
  padding: 48rpx 0;
  text-align: center;
  
  .empty-text {
    font-size: 28rpx;
    color: #999;
  }
  
  .dark & {
    .empty-text {
      color: #666;
    }
  }
}

// 深色模式样式
.dark {
  .bills-section {
    background: #1e1e1e;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.2);
    
    .list-header {
      .header-left .count {
        background: #2d2d2d;
        color: #666;
      }
      
      .sort-buttons .sort-btn {
        background: #2d2d2d;
        
        .text {
          color: #888;
        }
        
        &.active {
          background: rgba(255, 255, 255, 0.1);
          
          .text {
            color: #fff;
          }
        }
      }
    }
    
    .group-title .date-wrap .count {
      background: #2d2d2d;
      color: #666;
    }
    
    .bill-item {
      border-color: #2d2d2d;
      
      &:active {
        background-color: #2d2d2d;
      }
    }
  }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes slide {
  from { transform: translateX(-50%); }
  to { transform: translateX(50%); }
}

@keyframes shine {
  from { left: -100%; }
  to { left: 200%; }
}

@keyframes glow {
  0% { opacity: 0.5; }
  50% { opacity: 0.3; }
  100% { opacity: 0.5; }
}
</style> 