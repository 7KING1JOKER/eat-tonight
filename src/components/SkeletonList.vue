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
  height: 88rpx;
  margin-bottom: 16rpx;
  border-radius: 24rpx;
  background: var(--color-line);
}
</style>
