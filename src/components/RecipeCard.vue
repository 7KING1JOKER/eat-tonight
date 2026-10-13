<template>
  <view
    class="card"
    :class="missing.length ? 'almost' : 'ready'"
    :style="{ animationDelay: `${delay}ms` }"
    @tap.stop="emit('open')"
  >
    <view class="lift">
    <view class="face">
      <view class="name">{{ name }}</view>
      <view v-if="missing.length" class="missing">{{ missing.join('、') }}</view>
    </view>
    </view>
  </view>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    name: string
    missing: string[]
    delay?: number
  }>(),
  { delay: 0 },
)

const emit = defineEmits<{
  open: []
}>()
</script>

<style scoped>
.card {
  width: 100%;
  aspect-ratio: 1;
  animation: rise 180ms var(--ease-out) backwards;
}

.lift {
  position: relative;
  width: 100%;
  height: 100%;
  border: 1px solid var(--color-line);
  border-radius: 24rpx;
  border-bottom-width: 4rpx;
  background: var(--color-bg);
  box-sizing: border-box;
  overflow: hidden;
  transition: transform 180ms var(--ease-out);
}

.ready .lift {
  border-bottom-color: var(--color-ready);
}

.almost .lift {
  border-bottom-color: var(--color-almost);
}

@media (hover: hover) and (pointer: fine) {
  .card:hover .lift {
    transform: translateY(-8rpx);
  }
}

.card:active .lift {
  transform: scale(0.97);
}

.face {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 16rpx;
  box-sizing: border-box;
}

.name {
  display: -webkit-box;
  overflow: hidden;
  color: var(--color-text);
  font-size: 28rpx;
  font-weight: 600;
  line-height: 1.3;
  white-space: normal;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.missing {
  display: block;
  overflow: hidden;
  margin-top: 8rpx;
  color: var(--color-almost);
  font-size: 22rpx;
  line-height: 1.4;
  white-space: nowrap;
  text-overflow: ellipsis;
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(16rpx);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
</style>
