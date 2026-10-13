<template>
  <view class="card" :class="missing.length ? 'almost' : 'ready'" @tap.stop="emit('open')">
    <view class="head">
      <text class="name">{{ name }}</text>
      <text class="source">{{ source === 'mine' ? '我的' : '官方' }}</text>
    </view>
    <view v-if="missing.length" class="chips">
      <text v-for="item in missing" :key="item" class="chip">{{ item }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { RecipeSource } from '@/types/eat'

defineProps<{
  name: string
  missing: string[]
  source: RecipeSource
}>()

const emit = defineEmits<{
  open: []
}>()
</script>

<style scoped>
.card {
  margin-bottom: 16rpx;
  padding: 24rpx 28rpx;
  border-radius: 20rpx;
  background: var(--color-card);
}

.ready {
  border-left: 8rpx solid var(--color-ready);
}

.almost {
  border-left: 8rpx solid var(--color-almost);
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

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 16rpx;
}

.chip {
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  background: var(--color-chip);
  color: var(--color-almost);
  font-size: 24rpx;
}
</style>
