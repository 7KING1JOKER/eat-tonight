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
  background: var(--color-chip);
}
</style>
