<template>
  <scroll-view scroll-x class="filters" :show-scrollbar="false">
    <view class="filter-row">
      <view
        v-for="name in options"
        :key="name"
        class="filter"
        :class="{ on: name === current }"
        @tap="emit('pick', name)"
      >
        <AppIcon :name="categoryIcon(name)" :tone="name === current ? 'on' : 'ink'" />
        <text class="filter-name">{{ name }}</text>
      </view>
    </view>
  </scroll-view>
</template>

<script setup lang="ts">
import AppIcon from '@/components/AppIcon.vue'
import { categoryIcon } from '@/utils/icons'

defineProps<{
  options: string[]
  current: string
}>()

const emit = defineEmits<{
  pick: [name: string]
}>()
</script>

<style scoped>
.filters {
  width: 100%;
  height: 80rpx;
  margin-bottom: 32rpx;
  white-space: nowrap;
}

.filter-row {
  display: inline-flex;
  align-items: center;
  gap: 16rpx;
  height: 80rpx;
}

.filter {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  padding: 10rpx 16rpx;
  border: 1px solid var(--color-line);
  border-radius: 24rpx;
  background: transparent;
  transition:
    transform 160ms var(--ease-out),
    background-color 160ms var(--ease-out),
    border-color 160ms var(--ease-out);
}

.filter:active {
  transform: scale(0.96);
}

@media (hover: hover) and (pointer: fine) {
  .filter:not(.on):hover {
    border-color: var(--color-earth);
  }
}

.filter-name {
  font-size: 26rpx;
  color: var(--color-text);
}

.filter.on {
  border-color: var(--color-ready);
  background: var(--color-ready);
}

.filter.on .filter-name {
  color: var(--color-on-ready);
}
</style>
