<template>
  <view v-if="pages > 1" class="pager">
    <text class="btn" :class="{ off: page <= 1 }" @tap="go(page - 1)">上一页</text>
    <text class="index">{{ page }} / {{ pages }}</text>
    <text class="btn" :class="{ off: page >= pages }" @tap="go(page + 1)">下一页</text>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  page: number
  total: number
  pageSize: number
}>()

const emit = defineEmits<{
  change: [page: number]
}>()

const pages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))

function go(next: number) {
  if (next < 1 || next > pages.value || next === props.page) return
  emit('change', next)
}
</script>

<style scoped>
.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 28rpx;
  margin-top: 8rpx;
}

.btn,
.index {
  font-size: 26rpx;
  color: var(--color-text);
}

.btn {
  padding: 8rpx 20rpx;
  border-radius: 999rpx;
  background: var(--color-chip);
}

.off {
  opacity: 0.35;
}
</style>
