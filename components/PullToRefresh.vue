<template>
  <view class="pull-refresh">
    <view 
      class="refresh-content"
      :style="contentStyle"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    >
      <view class="refresh-indicator" :class="{ active: refreshing }">
        <text class="indicator-text">{{ refreshText }}</text>
      </view>
      <slot></slot>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  refreshing: Boolean,
  threshold: {
    type: Number,
    default: 60
  }
})

const emit = defineEmits(['refresh'])

const pulling = ref(false)
const pullDistance = ref(0)

const refreshText = computed(() => {
  if (props.refreshing) return '刷新中...'
  if (pullDistance.value >= props.threshold) return '释放刷新'
  return '下拉刷新'
})

const contentStyle = computed(() => ({
  transform: `translateY(${pullDistance.value}px)`,
  transition: pulling.value ? 'none' : 'transform 0.3s'
}))

let startY = 0
let currentY = 0

function onTouchStart(e) {
  if (props.refreshing) return
  startY = e.touches[0].clientY
  pulling.value = true
}

function onTouchMove(e) {
  if (props.refreshing || !pulling.value) return
  currentY = e.touches[0].clientY
  const distance = Math.max(0, (currentY - startY) * 0.5) // 添加阻尼效果
  pullDistance.value = distance
}

function onTouchEnd() {
  if (!pulling.value) return
  pulling.value = false
  
  if (pullDistance.value >= props.threshold) {
    emit('refresh')
  }
  pullDistance.value = 0
}
</script>

<style lang="scss" scoped>
.pull-refresh {
  position: relative;
  overflow: hidden;
  
  .refresh-content {
    position: relative;
    z-index: 1;
  }
  
  .refresh-indicator {
    position: absolute;
    left: 0;
    right: 0;
    top: -60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &.active {
      .indicator-text {
        animation: rotating 1s linear infinite;
      }
    }
  }
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.indicator-text {
  font-size: 28rpx;
  color: #666;
  
  .dark & {
    color: #888;
  }
}
</style> 