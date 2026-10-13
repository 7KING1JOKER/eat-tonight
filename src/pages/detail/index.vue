<template>
  <view class="page">
    <EmptyState v-if="!recipe" title="没有这道菜" />
    <template v-else>
      <view class="head">
        <text class="name">{{ recipe.name }}</text>
        <text class="source">{{ recipe.source === 'mine' ? '我的' : '官方' }}</text>
      </view>
      <text v-if="recipe.summary" class="body intro">{{ recipe.summary }}</text>
      <text v-if="recipe.servings" class="note">{{ recipe.servings }}</text>

      <view class="compare">
        <view class="block">
          <text class="label have">已有</text>
          <text class="body">{{ ownedText }}</text>
        </view>
        <view class="block">
          <text class="label missing">还差</text>
          <text class="body">{{ missingText }}</text>
        </view>
      </view>
      <view v-if="recipe.items?.length" class="block">
        <text class="label">食材</text>
        <view v-for="(item, index) in recipe.items" :key="index" class="ingredient">
          <text class="body">{{ item.name }} · {{ item.amount }}</text>
          <text v-if="item.note" class="note">{{ item.note }}</text>
        </view>
      </view>
      <view class="block">
        <text class="label">步骤</text>
        <view v-for="(step, index) in recipe.steps" :key="index" class="step">
          <text class="index">{{ index + 1 }}</text>
          <text class="body">{{ step }}</text>
        </view>
      </view>
      <view v-if="recipe.note" class="block">
        <text class="label">说明</text>
        <text class="body">{{ recipe.note }}</text>
      </view>
      <view v-if="recipe.credit" class="block">
        <text class="label">出处</text>
        <text class="body">{{ recipe.credit.site }} · {{ recipe.credit.recipeBy }}</text>
        <text class="note">{{ recipe.credit.license }}</text>
        <text class="url" user-select>{{ recipe.credit.url }}</text>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import EmptyState from '@/components/EmptyState.vue'
import { useFridge } from '@/composables/useFridge'
import { useRecipes } from '@/composables/useRecipes'
import type { Matched, RecipeSource } from '@/types/eat'
import { CACHE_KEY_DETAIL, readCache } from '@/utils/storage'

const { have, ingredients, custom, load } = useFridge()
const { official, mine, load: loadRecipes } = useRecipes()
const recipe = ref<Matched | null>(null)

const ingredientName = computed(() => {
  const map = new Map<string, string>()
  for (const item of ingredients.value) map.set(item.id, item.name)
  for (const item of custom.value) map.set(item.id, item.name)
  return map
})

function namesOf(ids: string[]): string[] {
  return ids.flatMap((id) => {
    const name = ingredientName.value.get(id)
    return name ? [name] : []
  })
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
  const source = String(query?.source ?? 'official') as RecipeSource
  const cached = readCache<Matched>(CACHE_KEY_DETAIL)
  if (cached && cached.id === id && cached.source === source) recipe.value = cached
  void (async () => {
    await Promise.all([load(), loadRecipes()])
    if (recipe.value?.id === id && recipe.value.source === source) return
    const list = source === 'mine' ? mine.value : official.value
    const found = list.find((item) => item.id === id)
    if (!found) return
    const owned = new Set(have.value)
    recipe.value = {
      ...found,
      source,
      missing: found.need.filter((itemId) => !owned.has(itemId)),
    }
  })()
})
</script>

<style scoped>
.page {
  padding: 40rpx 40rpx calc(48rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.compare {
  display: flex;
  gap: 24rpx;
}

.compare .block {
  flex: 1;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32rpx;
}

.name {
  color: var(--color-text);
  font-size: 44rpx;
  font-weight: 600;
  line-height: 1.3;
}

.intro {
  display: block;
  margin-bottom: 12rpx;
}

.note,
.url {
  display: block;
  margin-top: 8rpx;
  color: var(--color-muted);
  font-size: 24rpx;
  line-height: 1.4;
}

.url {
  word-break: break-all;
}

.ingredient {
  margin-bottom: 16rpx;
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
  color: var(--color-earth);
  font-size: 26rpx;
  letter-spacing: 0.04em;
}

.have {
  color: var(--color-ready);
}

.missing {
  color: var(--color-almost);
}

.body {
  color: var(--color-text);
  font-size: 30rpx;
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
