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
  padding: 16rpx 24rpx;
  border: 1px solid var(--color-line);
  border-radius: 24rpx;
  background: var(--color-bg);
  transition:
    transform 160ms var(--ease-out),
    background-color 0.15s linear,
    border-color 0.15s linear;
}

.chip:active {
  transform: scale(0.96);
}

@media (hover: hover) and (pointer: fine) {
  .chip:not(.selected):hover {
    border-color: var(--color-earth);
  }
}

.name {
  font-size: 30rpx;
  color: var(--color-text);
  transition: color 0.15s linear;
}

.selected {
  border-color: var(--color-ready);
  background: var(--color-ready);
}

.selected .name {
  color: var(--color-on-ready);
}
</style>
