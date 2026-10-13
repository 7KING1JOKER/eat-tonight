<template>
  <view class="page">
    <EmptyState v-if="have.length === 0" title="先去冰箱勾食材" />
    <SkeletonList v-else-if="showSkeleton" />
    <EmptyState v-else-if="noRecipes" title="菜谱暂时没有" />
    <template v-else>
      <scroll-view scroll-x class="filters" :show-scrollbar="false">
        <view class="filter-row">
          <view
            v-for="name in categoryOptions"
            :key="name"
            class="filter"
            :class="{ on: name === category }"
            @tap="pickCategory(name)"
          >
            <text class="filter-name">{{ name }}</text>
          </view>
        </view>
      </scroll-view>
      <EmptyState v-if="noMatch" title="没有能做或只差一两样的菜" />
      <template v-else>
        <view v-if="readyFiltered.length" class="group">
          <text class="group-name ready">今晚能做</text>
          <RecipeCard
            v-for="item in readyPageItems"
            :key="item.source + item.id"
            :name="item.name"
            :missing="namesOf(item.missing)"
            :source="item.source"
            @open="navigateToDetail(item)"
          />
          <Pager
            :page="readyPage"
            :total="readyFiltered.length"
            :page-size="PAGE_SIZE"
            @change="readyPage = $event"
          />
        </view>
        <view v-if="almostFiltered.length" class="group">
          <text class="group-name almost">还差 1～2 样</text>
          <RecipeCard
            v-for="item in almostPageItems"
            :key="item.source + item.id"
            :name="item.name"
            :missing="namesOf(item.missing)"
            :source="item.source"
            @open="navigateToDetail(item)"
          />
          <Pager
            :page="almostPage"
            :total="almostFiltered.length"
            :page-size="PAGE_SIZE"
            @change="almostPage = $event"
          />
        </view>
      </template>
    </template>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import EmptyState from '@/components/EmptyState.vue'
import Pager from '@/components/Pager.vue'
import RecipeCard from '@/components/RecipeCard.vue'
import SkeletonList from '@/components/SkeletonList.vue'
import { useFridge } from '@/composables/useFridge'
import { useMatch } from '@/composables/useMatch'
import { useRecipes } from '@/composables/useRecipes'
import type { Matched } from '@/types/eat'
import { CATEGORY_ORDER, recipeCategory } from '@/utils/recipeCategory'
import { CACHE_KEY_DETAIL, writeCache } from '@/utils/storage'

const PAGE_SIZE = 8

const { have, ingredients, custom, load: loadFridge } = useFridge()
const { official, mine, loading, loadError, load: loadRecipes } = useRecipes()
const { ready, almost } = useMatch()
const category = ref('全部')
const readyPage = ref(1)
const almostPage = ref(1)

const showSkeleton = computed(() => loading.value && official.value.length === 0 && mine.value.length === 0)
const noRecipes = computed(() => loadError.value && official.value.length === 0 && mine.value.length === 0)
const noMatch = computed(() => readyFiltered.value.length === 0 && almostFiltered.value.length === 0)

const categoryOptions = computed(() => {
  const present = new Set<string>()
  for (const item of ready.value) present.add(recipeCategory(item))
  for (const item of almost.value) present.add(recipeCategory(item))
  return ['全部', ...CATEGORY_ORDER.filter((name) => present.has(name))]
})

const readyFiltered = computed(() => ready.value.filter(inCategory))
const almostFiltered = computed(() => almost.value.filter(inCategory))
const readyPageItems = computed(() => slicePage(readyFiltered.value, readyPage.value))
const almostPageItems = computed(() => slicePage(almostFiltered.value, almostPage.value))

const ingredientName = computed(() => {
  const map = new Map<string, string>()
  for (const item of ingredients.value) map.set(item.id, item.name)
  for (const item of custom.value) map.set(item.id, item.name)
  return map
})

function inCategory(item: Matched): boolean {
  if (category.value === '全部') return true
  return recipeCategory(item) === category.value
}

function slicePage(list: Matched[], page: number): Matched[] {
  const start = (page - 1) * PAGE_SIZE
  return list.slice(start, start + PAGE_SIZE)
}

function namesOf(ids: string[]): string[] {
  return ids.flatMap((id) => {
    const name = ingredientName.value.get(id)
    return name ? [name] : []
  })
}

function pickCategory(name: string) {
  category.value = name
  readyPage.value = 1
  almostPage.value = 1
}

function navigateToDetail(item: Matched) {
  writeCache<Matched>(CACHE_KEY_DETAIL, item)
  uni.navigateTo({
    url: `/pages/detail/index?id=${item.id}&source=${item.source}`
  })
}

watch(categoryOptions, (options) => {
  if (!options.includes(category.value)) pickCategory('全部')
})

watch(readyFiltered, (list) => {
  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE))
  if (readyPage.value > pages) readyPage.value = pages
})

watch(almostFiltered, (list) => {
  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE))
  if (almostPage.value > pages) almostPage.value = pages
})

onShow(() => {
  void loadFridge()
  void loadRecipes()
})
</script>

<style scoped>
.page {
  padding: 32rpx 32rpx 48rpx;
  box-sizing: border-box;
}

.filters {
  width: 100%;
  height: 72rpx;
  margin-bottom: 28rpx;
  white-space: nowrap;
}

.filter-row {
  display: inline-flex;
  align-items: center;
  gap: 16rpx;
  height: 72rpx;
}

.filter {
  padding: 10rpx 24rpx;
  border-radius: 999rpx;
  background: var(--color-chip);
}

.filter-name {
  font-size: 26rpx;
  color: var(--color-text);
}

.filter.on {
  background: var(--color-ready);
}

.filter.on .filter-name {
  color: #fff;
}

.group {
  margin-bottom: 36rpx;
  animation: rise 0.25s ease;
}

.group-name {
  display: block;
  margin-bottom: 16rpx;
}

.ready {
  color: var(--color-ready);
  font-size: 36rpx;
  font-weight: 600;
}

.almost {
  color: var(--color-almost);
  font-size: 28rpx;
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(12rpx);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
</style>
