<template>
  <view class="card">
    <view class="head">
      <text class="name">{{ name }}</text>
      <text class="source">{{ source === 'mine' ? '我的' : '官方' }}</text>
    </view>
    <text v-if="missing.length" class="missing">还差 {{ missing.join('、') }}</text>
  </view>
</template>

<script setup lang="ts">
import type { RecipeSource } from '@/types/eat'

defineProps<{
  name: string
  missing: string[]
  source: RecipeSource
}>()
</script>

<style scoped>
.card {
  margin-bottom: 16rpx;
  padding: 24rpx 28rpx;
  border-radius: 20rpx;
  background: var(--color-card);
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.name {
  color: var(--color-text);
  font-size: 32rpx;
}

.source {
  color: var(--color-muted);
  font-size: 24rpx;
}

.missing {
  display: block;
  margin-top: 12rpx;
  color: var(--color-almost);
  font-size: 26rpx;
}
</style>
