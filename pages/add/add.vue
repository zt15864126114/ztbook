<template>
  <view class="container">
    <view class="form">
      <view class="form-item">
        <text class="label">金额</text>
        <input 
          type="digit" 
          v-model="form.amount" 
          placeholder="请输入金额"
          class="input"
        />
      </view>
      
      <view class="form-item">
        <text class="label">分类</text>
        <picker 
          :range="categories" 
          range-key="name"
          @change="onCategoryChange"
          class="picker"
        >
          <view class="picker-text">
            {{ form.category || '请选择分类' }}
          </view>
        </picker>
      </view>
      
      <view class="form-item">
        <text class="label">备注</text>
        <input 
          type="text" 
          v-model="form.note" 
          placeholder="请输入备注"
          class="input"
        />
      </view>
    </view>
    
    <button class="submit-btn" @click="handleSubmit">保存</button>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { useAccountStore } from '@/stores/account'

const accountStore = useAccountStore()
const categories = accountStore.categories

const form = ref({
  amount: '',
  category: '',
  note: ''
})

function onCategoryChange(e) {
  const index = e.detail.value
  form.value.category = categories[index].name
}

function handleSubmit() {
  if (!form.value.amount) {
    uni.showToast({
      title: '请输入金额',
      icon: 'none'
    })
    return
  }
  
  if (!form.value.category) {
    uni.showToast({
      title: '请选择分类',
      icon: 'none'
    })
    return
  }
  
  accountStore.addAccount(form.value)
  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
.container {
  padding: 20rpx;
}

.form {
  background-color: #fff;
  border-radius: 12rpx;
  padding: 0 20rpx;
}

.form-item {
  display: flex;
  align-items: center;
  padding: 30rpx 0;
  border-bottom: 1rpx solid #eee;
  
  .label {
    width: 120rpx;
    font-size: 28rpx;
    color: #333;
  }
  
  .input {
    flex: 1;
    font-size: 28rpx;
  }
  
  .picker {
    flex: 1;
  }
  
  .picker-text {
    font-size: 28rpx;
    color: #333;
  }
}

.submit-btn {
  margin-top: 40rpx;
  background-color: #007AFF;
  color: #fff;
}
</style> 