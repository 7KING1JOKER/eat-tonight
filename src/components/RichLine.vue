<template>
  <text class="line">
    <text
      v-for="(part, index) in parts"
      :key="index"
      :class="{ bold: part.bold, italic: part.italic, link: part.link }"
      :style="styleOf(part)"
      :user-select="part.link ? true : false"
    >{{ part.text }}</text>
  </text>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { inlineParts, type InlinePart } from '@/utils/inlineMarkdown'

const props = withDefaults(
  defineProps<{
    text: string
    /** 说明和用量用灰棕。用量再配 `compact`，字小一号。 */
    tone?: 'body' | 'muted'
    compact?: boolean
  }>(),
  { tone: 'body', compact: false },
)

const parts = computed(() => inlineParts(props.text))

/** 微信里的 text 只认 font-weight: bold，不认 600。样式写在节点上，避免组件隔离吃掉 class。 */
function styleOf(part: InlinePart): string {
  const bits = [props.compact ? 'font-size:26rpx' : 'font-size:30rpx', 'line-height:1.6']
  if (part.link) {
    bits.push('color:#7A7166', 'font-size:24rpx', 'word-break:break-all')
  } else if (props.tone === 'muted') {
    bits.push('color:#7A7166')
  } else if (part.italic) {
    bits.push('color:#5C4D3C')
  } else {
    bits.push('color:#3C342C')
  }
  if (part.italic) bits.push('font-style:italic')
  if (part.bold) bits.push('font-weight:bold')
  return bits.join(';')
}
</script>

<style scoped>
.line {
  color: var(--color-text);
  font-size: 30rpx;
  line-height: 1.6;
}

.bold {
  font-weight: bold;
}

.italic {
  color: var(--color-earth);
  font-style: italic;
}

.link {
  color: var(--color-muted);
  font-size: 24rpx;
  word-break: break-all;
}
</style>
