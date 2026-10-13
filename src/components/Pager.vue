<template>
  <view v-if="pages > 1" class="pager">
    <view class="btn" :class="{ off: page <= 1 }" @tap="go(page - 1)">
      <AppIcon name="arrow-left" />
    </view>
    <text class="index">{{ page }} / {{ pages }}</text>
    <view class="btn" :class="{ off: page >= pages }" @tap="go(page + 1)">
      <AppIcon name="arrow-right" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/components/AppIcon.vue'

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
  gap: 32rpx;
  margin-top: 24rpx;
}

.index {
  font-size: 24rpx;
  color: var(--color-text);
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64rpx;
  height: 64rpx;
  transition: transform 160ms var(--ease-out);
}

@media (hover: hover) and (pointer: fine) {
  .btn:not(.off):hover {
    transform: translateY(-4rpx);
  }
}

.btn:not(.off):active {
  transform: scale(0.92);
}

.off {
  opacity: 0.35;
}
</style>
