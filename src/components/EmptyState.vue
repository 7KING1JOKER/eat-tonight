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
  padding: 80rpx 32rpx;
}

.mark {
  width: 72rpx;
  height: 72rpx;
  margin-bottom: 24rpx;
  border-radius: 50%;
  background: var(--color-chip);
}

.title {
  color: var(--color-muted);
  font-size: 30rpx;
  line-height: 1.6;
}
</style>
