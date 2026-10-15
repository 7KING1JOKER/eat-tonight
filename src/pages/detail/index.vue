<template>
  <view class="page">
    <EmptyState v-if="!recipe" title="没有这道菜" />
    <template v-else>
      <view class="rise head" :style="delay(riseOf.head)">
        <text class="name">{{ recipe.name }}</text>
        <view class="meta">
          <text class="meta-text">{{ recipe.source === 'mine' ? '我的' : '官方' }}</text>
          <text v-if="recipe.servings" class="meta-text">{{ recipe.servings }}</text>
        </view>
      </view>

      <view v-if="recipe.summary" class="rise intro" :style="delay(riseOf.summary)">
        <text class="body">{{ recipe.summary }}</text>
      </view>

      <view class="rise compare" :style="delay(riseOf.compare)">
        <view class="panel have">
          <text class="label">已有</text>
          <text class="body">{{ ownedText }}</text>
        </view>
        <view class="panel miss">
          <text class="label">还差</text>
          <text class="body">{{ missingText }}</text>
        </view>
      </view>

      <view v-if="recipe.items?.length" class="rise section" :style="delay(riseOf.items)">
        <text class="label">食材</text>
        <view v-for="(item, index) in recipe.items" :key="index" class="ingredient">
          <view class="ingredient-name">
            <RichLine :text="item.name" />
            <text v-if="item.note" class="note">{{ item.note }}</text>
          </view>
          <view class="amount">
            <RichLine :text="item.amount" tone="muted" compact />
          </view>
        </view>
      </view>

      <view class="rise section" :style="delay(riseOf.steps)">
        <text class="label">步骤</text>
        <view v-for="(step, index) in steps" :key="index" class="step">
          <text class="index">{{ index + 1 }}</text>
          <view class="step-body">
            <RichLine :text="step" />
          </view>
        </view>
      </view>

      <view v-if="recipe.note" class="rise section" :style="delay(riseOf.note)">
        <text class="label">说明</text>
        <view class="aside">
          <RichLine :text="recipe.note" tone="muted" />
        </view>
      </view>

      <view v-if="recipe.credit" class="rise section" :style="delay(riseOf.credit)">
        <text class="label">出处</text>
        <view
          class="source-link"
          hover-class="is-down"
          :hover-stay-time="160"
          @click="openCredit(recipe.credit.url)"
        >
          <text class="source-link-text">{{ recipe.credit.site }}</text>
        </view>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import EmptyState from '@/components/EmptyState.vue'
import RichLine from '@/components/RichLine.vue'
import { useFridge } from '@/composables/useFridge'
import { useRecipes } from '@/composables/useRecipes'
import type { Matched, RecipeSource } from '@/types/eat'
import { hasInlineText } from '@/utils/inlineMarkdown'
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

const steps = computed(() => (recipe.value?.steps ?? []).filter((step) => hasInlineText(step)))

const missingText = computed(() => {
  const current = recipe.value
  if (!current || current.missing.length === 0) return '不缺'
  return namesOf(current.missing).join('、')
})

const riseOf = computed(() => {
  const current = recipe.value
  let at = 0
  const take = () => {
    const value = at
    at += 40
    return value
  }
  return {
    head: take(),
    summary: current?.summary ? take() : 0,
    compare: take(),
    items: current?.items?.length ? take() : 0,
    steps: take(),
    note: current?.note ? take() : 0,
    credit: current?.credit ? take() : 0,
  }
})

function delay(ms: number) {
  return `animation-delay:${ms}ms`
}

/** 网页新开页打开出处；小程序打不开 GitHub，改为复制链接。 */
function openCredit(url: string) {
  if (uni.getSystemInfoSync().uniPlatform === 'web') {
    window.open(url, '_blank', 'noopener,noreferrer')
    return
  }
  uni.setClipboardData({
    data: url,
    success: () => uni.showToast({ title: '已复制出处链接', icon: 'none' }),
  })
}

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

.rise {
  animation: rise 180ms var(--ease-out) backwards;
}

.head {
  margin-bottom: 8rpx;
}

.name {
  display: block;
  color: var(--color-text);
  font-size: 44rpx;
  font-weight: 600;
  line-height: 1.3;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 12rpx;
}

.meta-text {
  color: var(--color-muted);
  font-size: 24rpx;
  line-height: 1.4;
}

.intro {
  margin-top: 32rpx;
  padding-top: 32rpx;
  border-top: 1px solid var(--color-line);
}

.compare {
  display: flex;
  gap: 24rpx;
  margin-top: 48rpx;
}

.panel {
  flex: 1;
  min-width: 0;
  padding: 24rpx;
  border: 1px solid var(--color-line);
  border-bottom-width: 4rpx;
  border-radius: 24rpx;
  box-sizing: border-box;
}

.have {
  border-bottom-color: var(--color-ready);
}

.miss {
  border-bottom-color: var(--color-almost);
}

.have .label {
  color: var(--color-ready);
}

.miss .label {
  color: var(--color-almost);
}

.section {
  margin-top: 48rpx;
}

.ingredient,
.step {
  display: flex;
  align-items: flex-start;
}

.ingredient {
  padding: 24rpx 0;
}

.ingredient + .ingredient,
.step + .step {
  border-top: 1px solid var(--color-line);
}

.ingredient-name,
.step-body {
  flex: 1;
  min-width: 0;
}

.amount {
  flex: 0 1 46%;
  margin-left: 24rpx;
  text-align: right;
}

.step {
  padding: 28rpx 0;
}

.index {
  width: 56rpx;
  margin-right: 8rpx;
  color: var(--color-muted);
  font-size: 28rpx;
  line-height: 1.6;
  flex-shrink: 0;
}

.aside {
  padding-left: 20rpx;
  border-left: 4rpx solid var(--color-earth);
}

.note {
  display: block;
  margin-top: 8rpx;
  color: var(--color-muted);
  font-size: 24rpx;
  line-height: 1.4;
}

.source-link {
  display: inline-block;
  position: relative;
  color: var(--color-earth);
  transition: transform 180ms var(--ease-out), color 180ms var(--ease-out);
}

.source-link-text {
  color: var(--color-earth);
  font-size: 30rpx;
  line-height: 1.6;
  transition: color 180ms var(--ease-out);
}

.source-link::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 2rpx;
  height: 2rpx;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: left center;
  transition: transform 180ms var(--ease-out);
}

.source-link:active,
.source-link.is-down {
  transform: scale(0.98);
}

.source-link:active::after,
.source-link.is-down::after {
  transform: scaleX(1);
}

@media (hover: hover) and (pointer: fine) {
  .source-link {
    cursor: pointer;
  }

  .source-link:hover,
  .source-link:hover .source-link-text {
    color: var(--color-text);
  }

  .source-link:hover::after {
    transform: scaleX(1);
  }

  .source-link:active:hover {
    transform: scale(0.98);
  }
}

.label {
  display: block;
  margin-bottom: 12rpx;
  color: var(--color-earth);
  font-size: 26rpx;
  letter-spacing: 0.04em;
}

.body {
  color: var(--color-text);
  font-size: 30rpx;
  line-height: 1.6;
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
