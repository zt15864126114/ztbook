<template>
  <view :class="['container', darkMode ? 'dark' : '']">
    <!-- 金额输入区 -->
    <view class="amount-section">
      <text class="currency">{{ accountStore.currencySymbol }}</text>
      <input 
        type="digit" 
        v-model="form.amount" 
        placeholder="0.00"
        class="amount-input"
        focus
      />
    </view>
    
    <!-- 分类选择 -->
    <view class="category-section">
      <text class="section-title">选择分类</text>
      <view class="category-grid">
        <view 
          v-for="item in categories" 
          :key="item.id"
          class="category-item"
          :class="{ active: form.category === item.name }"
          @click="selectCategory(item)"
        >
          <view class="icon" :style="{ backgroundColor: item.color }">
            {{ item.icon }}
          </view>
          <text class="name">{{ item.name }}</text>
        </view>
      </view>
    </view>
    
    <!-- 详细信息 -->
    <view class="detail-section">
      <view class="form-item">
        <text class="label">日期</text>
        <picker 
          mode="date" 
          :value="form.date" 
          @change="onDateChange"
          class="picker"
        >
          <text class="picker-text">{{ form.date || '今天' }}</text>
        </picker>
      </view>
      
      <view class="form-item">
        <text class="label">时间</text>
        <picker 
          mode="time" 
          :value="form.time" 
          @change="onTimeChange"
          class="picker"
        >
          <text class="picker-text">{{ form.time || '现在' }}</text>
        </picker>
      </view>
      
      <view class="form-item">
        <text class="label">备注</text>
        <input 
          type="text" 
          v-model="form.note" 
          placeholder="添加备注"
          class="input"
        />
      </view>
      
      <!-- 标签选择 -->
      <view class="form-item">
        <text class="label">标签</text>
        <view class="tags-wrap">
          <view 
            v-for="tag in selectedTags" 
            :key="tag"
            class="tag"
          >
            {{ tag }}
            <text class="remove" @click="removeTag(tag)">×</text>
          </view>
          <view class="add-tag" @click="showTagPicker">
            <text class="plus">+</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 保存按钮 -->
    <view class="button-group">
      <button 
        class="submit-btn" 
        :disabled="!isValid"
        @click="handleSubmit"
      >
        保存
      </button>
    </view>
    
    <!-- 标签选择弹窗 -->
    <uni-popup ref="tagPopup" type="bottom">
      <view class="tag-picker">
        <view class="picker-header">
          <text class="title">选择标签</text>
          <text class="close" @click="closeTagPicker">×</text>
        </view>
        <view class="tag-list">
          <view 
            v-for="tag in availableTags" 
            :key="tag"
            class="tag-item"
            @click="toggleTag(tag)"
          >
            {{ tag }}
          </view>
          <view class="add-new-tag" @click="showAddTagInput">
            <text class="plus">+</text>
            <text>新建标签</text>
          </view>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAccountStore } from '@/stores/account'
import { useAppStore } from '@/stores/app'
import { formatDate, formatTime } from '@/utils/date'

const accountStore = useAccountStore()
const appStore = useAppStore()
const tagPopup = ref(null)
const darkMode = computed(() => appStore.darkMode)

// 表单数据
const form = ref({
  amount: '',
  category: '',
  date: formatDate(new Date()),
  time: formatTime(new Date()),
  note: '',
  tags: []
})

// 获取路由参数
const editId = ref(null)

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = currentPage.$page.options
  
  if (options.id) {
    editId.value = options.id
    const bill = accountStore.accounts.find(item => item.id === options.id)
    if (bill) {
      form.value = {
        ...bill,
        date: formatDate(bill.createTime),
        time: formatTime(bill.createTime)
      }
    }
  }
})

// 分类列表
const categories = computed(() => accountStore.categories)

// 已选标签
const selectedTags = computed(() => form.value.tags)

// 可选标签
const availableTags = computed(() => {
  return accountStore.tags.filter(tag => !form.value.tags.includes(tag))
})

// 表单验证
const isValid = computed(() => {
  return form.value.amount > 0 && form.value.category
})

// 选择分类
function selectCategory(category) {
  form.value.category = category.name
}

// 日期选择
function onDateChange(e) {
  form.value.date = e.detail.value
}

// 时间选择
function onTimeChange(e) {
  form.value.time = e.detail.value
}

// 显示标签选择器
function showTagPicker() {
  tagPopup.value.open()
}

// 关闭标签选择器
function closeTagPicker() {
  tagPopup.value.close()
}

// 切换标签选择
function toggleTag(tag) {
  const index = form.value.tags.indexOf(tag)
  if (index === -1) {
    form.value.tags.push(tag)
  } else {
    form.value.tags.splice(index, 1)
  }
}

// 移除标签
function removeTag(tag) {
  const index = form.value.tags.indexOf(tag)
  if (index !== -1) {
    form.value.tags.splice(index, 1)
  }
}

// 显示添加标签输入框
function showAddTagInput() {
  uni.showModal({
    title: '新建标签',
    editable: true,
    placeholderText: '请输入标签名称',
    success: (res) => {
      if (res.confirm && res.content) {
        accountStore.addTag(res.content)
        form.value.tags.push(res.content)
      }
    }
  })
}

// 提交表单
function handleSubmit() {
  if (!isValid.value) return
  
  const datetime = `${form.value.date} ${form.value.time}`
  const data = {
    ...form.value,
    amount: Number(form.value.amount),
    createTime: new Date(datetime)
  }
  
  if (editId.value) {
    accountStore.editAccount(editId.value, data)
  } else {
    accountStore.addAccount(data)
  }
  
  uni.showToast({
    title: editId.value ? '修改成功' : '添加成功',
    icon: 'success'
  })
  
  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 120rpx;
  transition: background-color 0.3s;
  
  &.dark {
    background-color: #121212;
  }
}

.amount-section {
  background-color: #fff;
  padding: 40rpx;
  display: flex;
  align-items: center;
  transition: background-color 0.3s;
  
  &.dark {
    background-color: #1e1e1e;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.2);
  }
  
  .currency {
    font-size: 48rpx;
    color: #333;
    margin-right: 20rpx;
  }
  
  .amount-input {
    flex: 1;
    font-size: 60rpx;
    font-weight: bold;
    text-align: center;
    padding: 20rpx 0;
    
    &.dark {
      color: #eee;
    }
  }
}

.category-section {
  background-color: #fff;
  margin-top: 20rpx;
  padding: 30rpx;
  transition: background-color 0.3s;
  
  &.dark {
    background-color: #1e1e1e;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.2);
  }
  
  .section-title {
    font-size: 28rpx;
    color: #666;
    margin-bottom: 20rpx;
  }
  
  .category-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20rpx;
    
    .category-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20rpx;
      
      &.active {
        background-color: #f0f9ff;
        border-radius: 12rpx;
        
        &.dark {
          background-color: rgba(52, 152, 219, 0.2);
        }
      }
      
      .icon {
        width: 80rpx;
        height: 80rpx;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32rpx;
        
        &.dark {
          box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.3);
        }
      }
      
      .name {
        font-size: 24rpx;
        color: #333;
        
        &.dark {
          color: #eee;
        }
      }
    }
  }
}

.detail-section {
  background-color: #fff;
  margin-top: 20rpx;
  padding: 0 30rpx;
  transition: background-color 0.3s;
  
  &.dark {
    background-color: #1e1e1e;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.2);
  }
  
  .form-item {
    display: flex;
    align-items: center;
    padding: 30rpx 0;
    border-bottom: 1rpx solid #eee;
    
    &:last-child {
      border-bottom: none;
    }
    
    .label {
      width: 120rpx;
      font-size: 28rpx;
      color: #333;
      
      &.dark {
        color: #eee;
      }
    }
    
    .input, .picker {
      flex: 1;
      font-size: 28rpx;
    }
    
    .picker-text {
      font-size: 28rpx;
      color: #333;
    }
    
    .tags-wrap {
      flex: 1;
      display: flex;
      flex-wrap: wrap;
      gap: 16rpx;
      
      .tag {
        background-color: #f0f9ff;
        padding: 8rpx 20rpx;
        border-radius: 100rpx;
        font-size: 24rpx;
        color: #3498db;
        display: flex;
        align-items: center;
        
        .remove {
          margin-left: 8rpx;
          font-size: 32rpx;
        }
      }
      
      .add-tag {
        padding: 8rpx 20rpx;
        border: 2rpx dashed #999;
        border-radius: 100rpx;
        
        .plus {
          font-size: 24rpx;
          color: #999;
        }
      }
    }
  }
}

.button-group {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx;
  background-color: #fff;
  box-shadow: 0 -2rpx 10rpx rgba(0,0,0,0.05);
  transition: background-color 0.3s;
  
  &.dark {
    background-color: #1e1e1e;
    box-shadow: 0 -2rpx 10rpx rgba(255,255,255,0.05);
  }
  
  .submit-btn {
    background: linear-gradient(135deg, #3498db, #2980b9);
    color: #fff;
    border-radius: 100rpx;
    font-size: 32rpx;
    
    &:disabled {
      opacity: 0.6;
    }
    
    &.dark {
      background: linear-gradient(135deg, #3498db, #1a5276);
      box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.4);
    }
  }
}

.tag-picker {
  background-color: #fff;
  border-radius: 24rpx 24rpx 0 0;
  transition: background-color 0.3s;
  
  &.dark {
    background-color: #1e1e1e;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.2);
  }
  
  .picker-header {
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
  
  .tag-list {
    padding: 30rpx;
    display: flex;
    flex-wrap: wrap;
    gap: 20rpx;
    
    .tag-item {
      padding: 16rpx 30rpx;
      background-color: #f5f5f5;
      border-radius: 100rpx;
      font-size: 28rpx;
      color: #333;
    }
    
    .add-new-tag {
      padding: 16rpx 30rpx;
      border: 2rpx dashed #999;
      border-radius: 100rpx;
      display: flex;
      align-items: center;
      
      .plus {
        font-size: 28rpx;
        margin-right: 8rpx;
      }
    }
  }
}
</style> 