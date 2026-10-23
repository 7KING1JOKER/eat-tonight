<template>
  <image class="icon" :src="src" mode="aspectFit" :style="box" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { iconPath, type IconTone } from '@/utils/icons'

const props = withDefaults(
  defineProps<{
    name: string
    tone?: IconTone
    /** 右侧文字的字号，单位 rpx。图形按这个高度画。 */
    size?: number
  }>(),
  { tone: 'ink', size: 26 },
)

const src = computed(() => iconPath(props.name, props.tone))

/** 图形约占画布 40/64，放大外框后可见大小才等于字号。 */
const box = computed(() => {
  const edge = Math.round(props.size * (64 / 40))
  return { width: `${edge}rpx`, height: `${edge}rpx` }
})
</script>

<style scoped>
.icon {
  display: block;
  flex-shrink: 0;
  align-self: center;
}
</style>
