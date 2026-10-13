<template>
  <view class="list">
    <view v-for="index in 3" :key="index" class="row" />
  </view>
</template>

<style scoped>
.list {
  padding-top: 8rpx;
}

.row {
  height: 96rpx;
  margin-bottom: 16rpx;
  border-radius: 20rpx;
  background: linear-gradient(90deg, var(--color-chip), #f7f4ef, var(--color-chip));
  background-size: 200% 100%;
  animation: shimmer 1.2s ease infinite;
}

@keyframes shimmer {
  from {
    background-position: 100% 0;
  }
  to {
    background-position: -100% 0;
  }
}
</style>
