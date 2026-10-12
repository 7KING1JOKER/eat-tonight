<template>
  <view class="page">
    <EmptyState v-if="!recipe" title="没有这道菜" />
    <template v-else>
      <view class="head">
        <text class="name">{{ recipe.name }}</text>
        <text class="source">{{ recipe.source === 'mine' ? '我的' : '官方' }}</text>
      </view>

      <view class="block">
        <text class="label have">已有</text>
        <text class="body">{{ ownedText }}</text>
      </view>
      <view class="block">
        <text class="label missing">还差</text>
        <text class="body">{{ missingText }}</text>
      </view>
      <view class="block">
        <text class="label">步骤</text>
        <view v-for="(step, index) in recipe.steps" :key="index" class="step">
          <text class="index">{{ index + 1 }}</text>
          <text class="body">{{ step }}</text>
        </view>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import EmptyState from '@/components/EmptyState.vue'
import { useFridge } from '@/composables/useFridge'
import type { Matched, RecipeSource } from '@/types/eat'
import { CACHE_KEY_DETAIL, readCache } from '@/utils/storage'

const { ingredients, custom, load } = useFridge()
const recipe = ref<Matched | null>(null)

const ingredientName = computed(() => {
  const map = new Map<string, string>()
  for (const item of ingredients.value) map.set(item.id, item.name)
  for (const item of custom.value) map.set(item.id, item.name)
  return map
})

function namesOf(ids: string[]): string[] {
  return ids.map((id) => ingredientName.value.get(id) ?? id)
}

const ownedText = computed(() => {
  const current = recipe.value
  if (!current) return ''
  const missing = new Set(current.missing)
  const owned = current.need.filter((id) => !missing.has(id))
  return owned.length ? namesOf(owned).join('、') : '还没有'
})

const missingText = computed(() => {
  const current = recipe.value
  if (!current || current.missing.length === 0) return '不缺'
  return namesOf(current.missing).join('、')
})

onLoad((query) => {
  const id = String(query?.id ?? '')
  const source = String(query?.source ?? '') as RecipeSource
  const cached = readCache<Matched>(CACHE_KEY_DETAIL)
  recipe.value = cached && cached.id === id && cached.source === source ? cached : null
  void load()
})
</script>

<style scoped>
.page {
  padding: 32rpx 32rpx 48rpx;
  box-sizing: border-box;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32rpx;
}

.name {
  color: var(--color-text);
  font-size: 40rpx;
}

.source {
  color: var(--color-muted);
  font-size: 26rpx;
}

.block {
  margin-bottom: 32rpx;
}

.label {
  display: block;
  margin-bottom: 12rpx;
  color: var(--color-text);
  font-size: 30rpx;
}

.have {
  color: var(--color-ready);
}

.missing {
  color: var(--color-almost);
}

.body {
  color: var(--color-text);
  font-size: 28rpx;
  line-height: 1.6;
}

.step {
  display: flex;
  align-items: flex-start;
  margin-bottom: 16rpx;
}

.index {
  width: 40rpx;
  margin-right: 12rpx;
  color: var(--color-muted);
  font-size: 28rpx;
}
</style>
