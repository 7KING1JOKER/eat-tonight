<template>
  <view class="empty">
    <view class="mark" />
    <text class="title">{{ title }}</text>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<style scoped>
.empty {
  padding: 80rpx 0;
}

.mark {
  width: 16rpx;
  height: 16rpx;
  margin-bottom: 24rpx;
  border-radius: 4rpx;
  background: var(--color-earth);
}

.title {
  color: var(--color-muted);
  font-size: 30rpx;
  line-height: 1.6;
}
</style>
