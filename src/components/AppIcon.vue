<template>
  <image class="icon" :src="src" mode="aspectFit" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { iconPath, type IconTone } from '@/utils/icons'

const props = withDefaults(
  defineProps<{
    name: string
    tone?: IconTone
  }>(),
  { tone: 'ink' },
)

const src = computed(() => iconPath(props.name, props.tone))
</script>

<style scoped>
.icon {
  display: block;
  width: 32rpx;
  height: 32rpx;
  flex-shrink: 0;
}
</style>
