<template>
  <view class="page">
    <SkeletonList v-if="showSkeleton" />
    <EmptyState v-else-if="noRecipes" title="菜谱暂时没有" />
    <template v-else>
      <view class="search-box">
        <AppIcon name="search" />
        <input
          v-model="keyword"
          class="search"
          placeholder="搜索菜名或食材"
          confirm-type="search"
        />
      </view>
      <template v-if="query">
        <CategoryFilters :options="categoryOptions" :current="category" @pick="pickCategory" />
        <EmptyState v-if="searchFiltered.length === 0" title="没有找到这道菜" />
        <view v-else class="group">
          <view class="grid">
            <view v-for="(item, index) in searchPageItems" :key="item.source + item.id" class="cell">
              <RecipeCard
                :name="item.name"
                :missing="namesOf(item.missing)"
                :delay="index * 40"
                @open="navigateToDetail(item)"
              />
            </view>
          </view>
          <Pager
            :page="searchPage"
            :total="searchFiltered.length"
            :page-size="PAGE_SIZE"
            @change="searchPage = $event"
          />
        </view>
      </template>
      <EmptyState v-else-if="have.length === 0" title="先去冰箱勾食材" />
      <template v-else>
      <CategoryFilters :options="categoryOptions" :current="category" @pick="pickCategory" />
      <EmptyState v-if="noMatch" title="没有能做或只差一两样的菜" />
      <template v-else>
        <view v-if="readyFiltered.length" class="group">
          <text class="group-name ready">今晚能做</text>
          <view class="grid">
            <view v-for="(item, index) in readyPageItems" :key="item.source + item.id" class="cell">
              <RecipeCard
                :name="item.name"
                :missing="namesOf(item.missing)"
                :delay="index * 40"
                @open="navigateToDetail(item)"
              />
            </view>
          </view>
          <Pager
            :page="readyPage"
            :total="readyFiltered.length"
            :page-size="PAGE_SIZE"
            @change="readyPage = $event"
          />
        </view>
        <view v-if="almostFiltered.length" class="group">
          <text class="group-name almost">还差 1～2 样</text>
          <view class="grid">
            <view v-for="(item, index) in almostPageItems" :key="item.source + item.id" class="cell">
              <RecipeCard
                :name="item.name"
                :missing="namesOf(item.missing)"
                :delay="index * 40"
                @open="navigateToDetail(item)"
              />
            </view>
          </view>
          <Pager
            :page="almostPage"
            :total="almostFiltered.length"
            :page-size="PAGE_SIZE"
            @change="almostPage = $event"
          />
        </view>
      </template>
    </template>
    </template>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import AppIcon from '@/components/AppIcon.vue'
import CategoryFilters from '@/components/CategoryFilters.vue'
import EmptyState from '@/components/EmptyState.vue'
import Pager from '@/components/Pager.vue'
import RecipeCard from '@/components/RecipeCard.vue'
import SkeletonList from '@/components/SkeletonList.vue'
import { useFridge } from '@/composables/useFridge'
import { useMatch } from '@/composables/useMatch'
import { useRecipes } from '@/composables/useRecipes'
import type { Matched, Recipe } from '@/types/eat'
import { CATEGORY_ORDER, recipeCategory } from '@/utils/recipeCategory'
import { CACHE_KEY_DETAIL, writeCache } from '@/utils/storage'

const PAGE_SIZE = 8

const { have, ingredients, custom, load: loadFridge } = useFridge()
const { official, mine, loading, loadError, load: loadRecipes } = useRecipes()
const { ready, almost } = useMatch()
const category = ref('全部')
const keyword = ref('')
const readyPage = ref(1)
const almostPage = ref(1)
const searchPage = ref(1)

const showSkeleton = computed(() => loading.value && official.value.length === 0 && mine.value.length === 0)
const noRecipes = computed(() => loadError.value && official.value.length === 0 && mine.value.length === 0)
const query = computed(() => keyword.value.trim())
const noMatch = computed(() => readyFiltered.value.length === 0 && almostFiltered.value.length === 0)

const named = computed(() => {
  const text = query.value
  if (!text) return []
  return official.value
    .concat(mine.value)
    .filter((item) => item.name.includes(text) || recipeHasIngredient(item, text))
    .map(asMatched)
    .sort((a, b) => {
      const nameRank = Number(b.name.includes(text)) - Number(a.name.includes(text))
      if (nameRank !== 0) return nameRank
      return a.name.localeCompare(b.name, 'zh')
    })
})

const categoryOptions = computed(() => {
  const present = new Set<string>()
  const source = query.value ? named.value : ready.value.concat(almost.value)
  for (const item of source) present.add(recipeCategory(item))
  return ['全部', ...CATEGORY_ORDER.filter((name) => present.has(name))]
})

const readyFiltered = computed(() => ready.value.filter(inCategory))
const almostFiltered = computed(() => almost.value.filter(inCategory))
const readyPageItems = computed(() => slicePage(readyFiltered.value, readyPage.value))
const almostPageItems = computed(() => slicePage(almostFiltered.value, almostPage.value))
const searchFiltered = computed(() => named.value.filter(inCategory))
const searchPageItems = computed(() => slicePage(searchFiltered.value, searchPage.value))

const ingredientName = computed(() => {
  const map = new Map<string, string>()
  for (const item of ingredients.value) map.set(item.id, item.name)
  for (const item of custom.value) map.set(item.id, item.name)
  return map
})

function recipeHasIngredient(recipe: Recipe, text: string): boolean {
  for (const id of recipe.need) {
    const name = ingredientName.value.get(id)
    if (name?.includes(text)) return true
  }
  for (const item of recipe.items ?? []) {
    if (item.name.includes(text)) return true
  }
  return false
}

function inCategory(item: Recipe): boolean {
  if (category.value === '全部') return true
  return recipeCategory(item) === category.value
}

function asMatched(recipe: Recipe): Matched {
  const owned = new Set(have.value)
  return {
    ...recipe,
    missing: recipe.need.filter((id) => !owned.has(id)),
  }
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
  searchPage.value = 1
}

watch(query, () => {
  readyPage.value = 1
  almostPage.value = 1
  searchPage.value = 1
})

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

watch(searchFiltered, (list) => {
  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE))
  if (searchPage.value > pages) searchPage.value = pages
})

onShow(() => {
  void loadFridge()
  void loadRecipes()
})
</script>

<style scoped>
.page {
  padding: 40rpx 40rpx calc(48rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 12rpx;
  height: 72rpx;
  margin-bottom: 24rpx;
  padding: 0 24rpx;
  border: 1px solid var(--color-line);
  border-radius: 24rpx;
}

.search {
  flex: 1;
  height: 72rpx;
  background: transparent;
  color: var(--color-text);
  font-size: 30rpx;
}

.group {
  margin-bottom: 48rpx;
}

.grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.cell {
  width: calc((100% - 16rpx) / 2);
}

@media (min-width: 768px) {
  .cell {
    width: calc((100% - 48rpx) / 4);
  }
}

@media (max-width: 300px) {
  .cell {
    width: 100%;
  }
}

.group-name {
  display: block;
  margin-bottom: 8rpx;
  letter-spacing: 0.04em;
}

.ready {
  color: var(--color-ready);
  font-size: 30rpx;
  font-weight: 500;
}

.almost {
  color: var(--color-almost);
  font-size: 26rpx;
  font-weight: 500;
}
</style>
