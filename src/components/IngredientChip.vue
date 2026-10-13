<template>
  <view class="chip" :class="{ selected }" @tap="emit('toggle', id)">
    <text class="name">{{ name }}</text>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  id: string
  name: string
  selected: boolean
}>()

const emit = defineEmits<{
  toggle: [id: string]
}>()
</script>

<style scoped>
.chip {
  display: inline-flex;
  padding: 12rpx 28rpx;
  border-radius: 999rpx;
  background: var(--color-chip);
  transition: background-color 0.15s linear;
}

.name {
  font-size: 28rpx;
  color: var(--color-text);
}

.selected {
  background: var(--color-ready);
}

.selected .name {
  color: #fff;
}
</style>
