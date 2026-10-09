<template>
  <view class="empty">
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

.title {
  color: var(--color-muted);
  font-size: 30rpx;
  line-height: 1.6;
}
</style>
