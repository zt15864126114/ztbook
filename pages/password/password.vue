<template>
  <view class="container">
    <view class="header">
      <text class="title">请输入密码</text>
      <text class="subtitle">{{ isReset ? '请输入新密码' : '请输入6位数字密码' }}</text>
    </view>
    
    <!-- 密码输入框 -->
    <view class="password-input">
      <view 
        v-for="(digit, index) in 6" 
        :key="index"
        class="digit-box"
      >
        <text v-if="password[index]">•</text>
      </view>
    </view>
    
    <!-- 数字键盘 -->
    <view class="keyboard">
      <view class="keyboard-row" v-for="row in keyboardRows" :key="row[0]">
        <view 
          v-for="key in row" 
          :key="key"
          class="key"
          :class="{ 'key-function': key === 'delete' }"
          @click="handleKeyPress(key)"
        >
          <text v-if="key === 'delete'" class="iconfont icon-delete">×</text>
          <text v-else>{{ key }}</text>
        </view>
      </view>
    </view>
    
    <!-- 添加返回按钮 -->
    <view class="back-btn" @click="goBack">
      <text class="iconfont">×</text>
    </view>
    
    <!-- 添加锁定状态提示 -->
    <view v-if="isLocked" class="lock-tip">
      <text class="icon">🔒</text>
      <text class="message">密码错误次数过多</text>
      <text class="countdown">请等待 {{ lockCountdown }} 后重试</text>
    </view>
    
    <!-- 添加剩余次数提示 -->
    <view v-else-if="errorCount > 0" class="error-tip">
      <text>还可尝试 {{ 5 - errorCount }} 次</text>
    </view>
    
    <!-- 添加指纹解锁按钮 -->
    <view 
      v-if="supportFingerprint && fingerprintUnlock && !isReset && !isVerify" 
      class="fingerprint-btn"
      @click="verifyFingerprint"
    >
      <text class="icon">👆</text>
      <text class="text">点击使用指纹解锁</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const password = ref('')
const isReset = ref(false)
const isVerify = ref(false)
const eventChannel = ref(null)
const storedPassword = uni.getStorageSync('appPassword')

// 添加错误次数限制
const errorCount = ref(0)
const isLocked = ref(false)
const lockEndTime = ref(0)
const supportFingerprint = ref(false)

// 添加新的状态变量
const fingerprintUnlock = ref(uni.getStorageSync('fingerprintUnlock') ?? false)

// 数字键盘布局
const keyboardRows = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', 'delete']
]

// 获取页面参数和事件通道
onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = currentPage.$page?.options
  
  if (options?.reset === 'true') {
    isReset.value = true
  }
  if (options?.verify === 'true') {
    isVerify.value = true
  }
  
  // 获取事件通道
  eventChannel.value = currentPage.getOpenerEventChannel?.()
  
  // 检查锁定状态
  const savedLockEndTime = uni.getStorageSync('passwordLockEndTime')
  if (savedLockEndTime) {
    const now = Date.now()
    if (now < savedLockEndTime) {
      isLocked.value = true
      lockEndTime.value = savedLockEndTime
      startLockCountdown()
    } else {
      uni.removeStorageSync('passwordLockEndTime')
      uni.removeStorageSync('passwordErrorCount')
    }
  }
  
  // 恢复错误次数
  errorCount.value = uni.getStorageSync('passwordErrorCount') || 0
  
  // 检查指纹支持
  // #ifdef APP-PLUS
  if (plus.os.name.toLowerCase() === 'android') {
    // Android 设备
    try {
      const main = plus.android.runtimeMainActivity();
      const FingerprintManagerCompat = plus.android.importClass('androidx.core.hardware.fingerprint.FingerprintManagerCompat');
      const fingerprintManager = FingerprintManagerCompat.from(main);
      
      if (fingerprintManager.isHardwareDetected() && fingerprintManager.hasEnrolledFingerprints()) {
        supportFingerprint.value = true;
      } else {
        supportFingerprint.value = false;
      }
    } catch (e) {
      console.error('检测指纹支持失败:', e);
      supportFingerprint.value = false;
    }
  } else {
    // iOS 设备
    try {
      const touchId = plus.ios.import("LAContext");
      const context = new touchId();
      const canEvaluate = context.canEvaluatePolicy(2);
      plus.ios.deleteObject(context);
      supportFingerprint.value = canEvaluate;
    } catch (e) {
      console.error('检测指纹支持失败:', e);
      supportFingerprint.value = false;
    }
  }
  // #endif
  
  // #ifdef MP-WEIXIN
  uni.checkIsSupportSoterAuthentication({
    success: (res) => {
      supportFingerprint.value = res.supportMode?.includes('fingerPrint') || false
    },
    fail: () => {
      supportFingerprint.value = false
    }
  })
  // #endif
  
  // #ifdef H5
  supportFingerprint.value = false
  // #endif
})

// 锁定倒计时
const lockCountdown = ref('')
function startLockCountdown() {
  const timer = setInterval(() => {
    const now = Date.now()
    if (now >= lockEndTime.value) {
      clearInterval(timer)
      isLocked.value = false
      lockCountdown.value = ''
      errorCount.value = 0
      uni.removeStorageSync('passwordLockEndTime')
      uni.removeStorageSync('passwordErrorCount')
    } else {
      const minutes = Math.floor((lockEndTime.value - now) / 60000)
      const seconds = Math.floor(((lockEndTime.value - now) % 60000) / 1000)
      lockCountdown.value = `${minutes}:${seconds.toString().padStart(2, '0')}`
    }
  }, 1000)
}

// 修改处理按键点击方法
function handleKeyPress(key) {
  // 锁定状态下禁止输入
  if (isLocked.value) return
  
  if (key === 'delete') {
    password.value = password.value.slice(0, -1)
    return
  }
  
  if (password.value.length < 6 && key !== '') {
    password.value += key
    
    // 密码输入完成时验证
    if (password.value.length === 6) {
      if (isReset.value) {
        // 设置新密码
        uni.setStorageSync('appPassword', password.value)
        uni.showToast({
          title: '密码已设置',
          icon: 'success'
        })
        // 通知设置页面设置成功
        eventChannel.value?.emit('success')
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
      } else if (isVerify.value) {
        // 验证当前密码
        if (password.value === storedPassword) {
          uni.showToast({
            title: '验证成功',
            icon: 'success'
          })
          // 通知设置页面验证成功
          eventChannel.value?.emit('success')
          setTimeout(() => {
            uni.navigateBack()
          }, 1500)
        } else {
          uni.showToast({
            title: '密码错误',
            icon: 'error'
          })
          // 通知设置页面验证失败
          eventChannel.value?.emit('fail')
          password.value = ''
        }
      } else {
        // 验证密码
        if (password.value === storedPassword) {
          // 验证成功，重置错误次数
          errorCount.value = 0
          uni.removeStorageSync('passwordErrorCount')
          
          uni.showToast({
            title: '验证成功',
            icon: 'success'
          })
          setTimeout(() => {
            uni.navigateBack()
          }, 1500)
        } else {
          // 错误次数加1
          errorCount.value++
          uni.setStorageSync('passwordErrorCount', errorCount.value)
          
          // 错误5次后锁定30分钟
          if (errorCount.value >= 5) {
            isLocked.value = true
            lockEndTime.value = Date.now() + 30 * 60 * 1000 // 30分钟
            uni.setStorageSync('passwordLockEndTime', lockEndTime.value)
            startLockCountdown()
            
            uni.showToast({
              title: '密码错误次数过多，请30分钟后重试',
              icon: 'none',
              duration: 2000
            })
          } else {
            uni.showToast({
              title: `密码错误，还可尝试${5 - errorCount.value}次`,
              icon: 'error'
            })
          }
          password.value = ''
        }
      }
    }
  }
}

// 添加返回按钮
function goBack() {
  if (isReset.value) {
    eventChannel.value?.emit('cancel')
  }
  uni.navigateBack()
}

// 添加指纹验证方法
function verifyFingerprint() {
  // #ifdef APP-PLUS
  try {
    if (plus.os.name.toLowerCase() === 'android') {
      const FingerprintManagerCompat = plus.android.importClass('androidx.core.hardware.fingerprint.FingerprintManagerCompat');
      const CancellationSignal = plus.android.importClass('android.os.CancellationSignal');
      const main = plus.android.runtimeMainActivity();
      const fingerprintManager = FingerprintManagerCompat.from(main);
      const signal = new CancellationSignal();
      
      const callback = new FingerprintManagerCompat.AuthenticationCallback({
        onAuthenticationSucceeded: function(result) {
          uni.showToast({
            title: '验证成功',
            icon: 'success'
          });
          uni.removeStorageSync('lastHideTime');
          uni.setStorageSync('lastVerifyTime', Date.now());
          setTimeout(() => {
            uni.navigateBack();
          }, 1500);
        },
        onAuthenticationFailed: function() {
          uni.showToast({
            title: '验证失败',
            icon: 'error'
          });
        }
      });
      
      fingerprintManager.authenticate(null, 0, signal, callback, null);
    } else {
      const touchId = plus.ios.import("LAContext");
      const context = new touchId();
      context.evaluatePolicy(2, "请验证指纹", (success) => {
        if (success) {
          uni.showToast({
            title: '验证成功',
            icon: 'success'
          });
          uni.removeStorageSync('lastHideTime');
          uni.setStorageSync('lastVerifyTime', Date.now());
          setTimeout(() => {
            uni.navigateBack();
          }, 1500);
        }
      }, () => {
        uni.showToast({
          title: '验证失败',
          icon: 'error'
        });
      });
      plus.ios.deleteObject(context);
    }
  } catch (e) {
    console.error('指纹验证失败:', e);
    uni.showToast({
      title: '验证失败',
      icon: 'error'
    });
  }
  // #endif
  
  // #ifdef MP-WEIXIN
  uni.startSoterAuthentication({
    requestAuthModes: ['fingerPrint'],
    challenge: 'test',
    authContent: '请验证指纹',
    success: (res) => {
      if (res.errCode === 0) {
        uni.showToast({
          title: '验证成功',
          icon: 'success'
        })
        // 清除后台时间记录
        uni.removeStorageSync('lastHideTime')
        // 更新验证时间
        uni.setStorageSync('lastVerifyTime', Date.now())
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
      } else {
        uni.showToast({
          title: '验证失败',
          icon: 'error'
        })
      }
    },
    fail: () => {
      uni.showToast({
        title: '验证失败',
        icon: 'error'
      })
    }
  })
  // #endif
  
  // #ifdef H5
  uni.showToast({
    title: '当前环境不支持指纹识别',
    icon: 'none'
  })
  // #endif
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 100rpx;
}

.header {
  text-align: center;
  margin-bottom: 60rpx;
  
  .title {
    font-size: 40rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 16rpx;
  }
  
  .subtitle {
    font-size: 28rpx;
    color: #999;
  }
}

.password-input {
  display: flex;
  gap: 24rpx;
  margin-bottom: 80rpx;
  
  .digit-box {
    width: 80rpx;
    height: 80rpx;
    border: 2rpx solid #ddd;
    border-radius: 12rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 36rpx;
  }
}

.keyboard {
  width: 100%;
  padding: 0 40rpx;
  
  .keyboard-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 24rpx;
    
    .key {
      width: 180rpx;
      height: 100rpx;
      background-color: #f5f5f5;
      border-radius: 16rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36rpx;
      color: #333;
      
      &:active {
        opacity: 0.7;
      }
      
      &.key-function {
        background-color: #e0e0e0;
        
        .icon-delete {
          font-size: 48rpx;
          color: #666;
        }
      }
    }
  }
}

.back-btn {
  position: fixed;
  top: 40rpx;
  left: 40rpx;
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .iconfont {
    font-size: 48rpx;
    color: #666;
  }
}

.lock-tip {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  
  .icon {
    font-size: 80rpx;
    margin-bottom: 20rpx;
    display: block;
  }
  
  .message {
    font-size: 32rpx;
    color: #ff6b6b;
    margin-bottom: 16rpx;
    display: block;
  }
  
  .countdown {
    font-size: 28rpx;
    color: #666;
  }
}

.error-tip {
  position: absolute;
  bottom: 100rpx;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 24rpx;
  color: #ff6b6b;
}

.fingerprint-btn {
  position: absolute;
  bottom: 200rpx;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx;
  
  .icon {
    font-size: 80rpx;
    margin-bottom: 16rpx;
  }
  
  .text {
    font-size: 28rpx;
    color: #666;
  }
  
  &:active {
    opacity: 0.7;
  }
}
</style> 