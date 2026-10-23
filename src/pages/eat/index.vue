<template>
  <view class="page">
    <view class="search-box" :class="{ 'is-focus': searchFocus }">
      <AppIcon name="search" :size="30" />
      <input
        v-model="keyword"
        class="search"
        placeholder="搜索菜名或食材"
        confirm-type="search"
        @focus="searchFocus = true"
        @blur="searchFocus = false"
      />
    </view>
    <view class="ledger">
      <view class="ledger-link" @tap="openCreate">
        <AppIcon name="write" />
        <text class="ledger-text">记下这道菜</text>
      </view>
      <text class="ledger-slash">/</text>
      <view class="ledger-link" :class="{ on: showingMine }" @tap="showingMine = !showingMine">
        <AppIcon :name="showingMine ? 'tab-eat' : 'mine'" />
        <text class="ledger-text">{{ showingMine ? '今晚吃啥' : '我的菜' }}</text>
      </view>
    </view>

    <template v-if="showingMine">
      <EmptyState v-if="myListed.length === 0" :title="query ? '没有找到这道菜' : '还没有自己的菜'" />
      <view v-else>
        <view
          v-for="(item, index) in myListed"
          :key="item.id"
          class="mine-row"
          :style="rowDelay(index)"
          @tap="openMineDetail(item)"
        >
          <view class="mine-mark">
            <AppIcon name="mine" :size="40" />
          </view>
          <view class="mine-copy">
            <text class="mine-name">{{ item.name }}</text>
            <text class="mine-meta">用了 {{ item.need.length }} 样</text>
          </view>
          <view class="mine-actions">
            <view class="mine-action" @tap.stop="openEdit(item.id)">
              <AppIcon name="edit" />
            </view>
            <view class="mine-action" @tap.stop="confirmRemoveMine(item)">
              <AppIcon name="delete" />
            </view>
          </view>
        </view>
      </view>
    </template>
    <SkeletonList v-else-if="showSkeleton" />
    <EmptyState v-else-if="noRecipes" title="菜谱暂时没有" />
    <template v-else>
      <template v-if="query">
        <CategoryFilters :options="categoryOptions" :current="category" @pick="pickCategory" />
        <EmptyState v-if="searchFiltered.length === 0" title="没有找到这道菜" />
        <view v-else class="group">
          <view class="grid">
            <view v-for="(item, index) in searchPageItems" :key="item.source + item.id" class="cell">
              <RecipeCard
                :name="item.name"
                :missing="namesOf(item.missing)"
                :cover="coverOf(item.id)"
                :marked="item.source === 'mine'"
                :delay="index * 40"
                @open="navigateToDetail(item)"
                @cover-error="dropCover(item.id)"
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
                :cover="coverOf(item.id)"
                :marked="item.source === 'mine'"
                :delay="index * 40"
                @open="navigateToDetail(item)"
                @cover-error="dropCover(item.id)"
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
                :cover="coverOf(item.id)"
                :marked="item.source === 'mine'"
                :delay="index * 40"
                @open="navigateToDetail(item)"
                @cover-error="dropCover(item.id)"
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
import { fetchCovers, tempFileUrls } from '@/cloud/db'
import { hasCloudEnv } from '@/cloud/env'
import { useFridge } from '@/composables/useFridge'
import { useMatch } from '@/composables/useMatch'
import { useRecipes } from '@/composables/useRecipes'
import type { Matched, Recipe } from '@/types/eat'
import { coverFileId } from '@/utils/covers'
import { CATEGORY_ORDER, recipeCategory } from '@/utils/recipeCategory'
import { CACHE_KEY_DETAIL, writeCache } from '@/utils/storage'

const PAGE_SIZE = 8
const SEARCH_WAIT = 200

const { have, ingredients, custom, load: loadFridge } = useFridge()
const { official, mine, loading, loadError, load: loadRecipes, removeMine } = useRecipes()
const { ready, almost } = useMatch()
const category = ref('全部')
const keyword = ref('')
const query = ref('')
let queryTimer: ReturnType<typeof setTimeout> | undefined

const searchFocus = ref(false)
const showingMine = ref(false)
const readyPage = ref(1)
const almostPage = ref(1)
const searchPage = ref(1)
const coverMap = ref<Record<string, string>>({})

const showSkeleton = computed(() => loading.value && official.value.length === 0 && mine.value.length === 0)
const noRecipes = computed(() => loadError.value && official.value.length === 0 && mine.value.length === 0)

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
const myListed = computed(() => {
  const text = query.value
  return mine.value
    .filter((item) => !text || item.name.includes(text) || recipeHasIngredient(item, text))
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, 'zh'))
})

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

function coverOf(id: string): string {
  return coverFileId(id, coverMap.value)
}

async function loadCovers() {
  if (!hasCloudEnv()) {
    coverMap.value = {}
    return
  }
  try {
    const rows = await fetchCovers()
    const urls = await tempFileUrls(rows.map((row) => row.fileID))
    const next: Record<string, string> = {}
    for (const row of rows) {
      const url = urls[row.fileID]
      if (url) next[row.id] = url
    }
    if (Object.keys(next).length === 0) return
    coverMap.value = { ...coverMap.value, ...next }
  } catch {
    // 换链接失败时留下已经显示的封面，避免整页变成空白。
  }
}

function dropCover(id: string) {
  if (!coverMap.value[id]) return
  const next = { ...coverMap.value }
  delete next[id]
  coverMap.value = next
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

watch(keyword, (value) => {
  const text = value.trim()
  clearTimeout(queryTimer)
  if(!text) {
    query.value = ''
    return
  }
  queryTimer = setTimeout(() => {
    query.value = text
  }, SEARCH_WAIT)
})

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

function openCreate() {
  uni.navigateTo({ url: '/pages/mine/edit' })
}

function openEdit(id: string) {
  uni.navigateTo({ url: `/pages/mine/edit?id=${id}` })
}

function openMineDetail(item: Recipe) {
  navigateToDetail(asMatched(item))
}

function confirmRemoveMine(item: Recipe) {
  uni.showModal({
    title: '删除这道菜',
    content: item.name,
    success(res) {
      if (!res.confirm) return
      void removeMine(item.id).catch(() => {
        uni.showToast({ title: '删除失败', icon: 'none' })
      })
    },
  })
}

function rowDelay(index: number) {
  return `animation-delay:${index * 40}ms`
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
  void loadCovers()
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
  transition: border-color 180ms var(--ease-out), transform 180ms var(--ease-out);
}

.search-box:active:not(.is-focus) {
  transform: scale(0.98);
}

.search-box.is-focus {
  border-color: var(--color-earth);
}

.search {
  flex: 1;
  height: 72rpx;
  line-height: 72rpx;
  background: transparent;
  color: var(--color-text);
  font-size: 30rpx;
}

.ledger {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 32rpx;
}

.ledger-link {
  display: flex;
  align-items: center;
  gap: 8rpx;
  transition: transform 180ms var(--ease-out);
}

.ledger-link:active {
  transform: scale(0.98);
}

.ledger-text {
  color: var(--color-earth);
  font-size: 26rpx;
  line-height: 1;
  letter-spacing: 0.06em;
  transition: color 180ms var(--ease-out);
}

.ledger-link.on .ledger-text {
  color: var(--color-ready);
}

.ledger-slash {
  color: var(--color-text);
  font-size: 32rpx;
  line-height: 1;
}

.mine-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  padding: 28rpx 0;
  border-bottom: 1px solid var(--color-line);
  animation: rise 180ms var(--ease-out) backwards;
}

.mine-mark {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 96rpx;
  height: 96rpx;
  border-radius: 24rpx;
  background: var(--color-chrome);
}

.mine-copy {
  flex: 1;
  min-width: 0;
}

.mine-actions {
  display: flex;
  flex-shrink: 0;
  gap: 8rpx;
  opacity: 1;
}

.mine-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56rpx;
  height: 56rpx;
  transition: transform 180ms var(--ease-out);
}

.mine-action:active {
  transform: scale(0.96);
}

.mine-row:active {
  transform: scale(0.98);
}

.mine-name {
  display: block;
  color: var(--color-text);
  font-size: 40rpx;
  line-height: 1.3;
}

.mine-meta {
  display: block;
  margin-top: 8rpx;
  color: var(--color-muted);
  font-size: 24rpx;
}

@media (hover: hover) and (pointer: fine) {
  .search-box:hover {
    border-color: var(--color-earth);
  }

  .ledger-link:hover .ledger-text {
    color: var(--color-text);
  }

  .ledger-link.on:hover .ledger-text {
    color: var(--color-ready);
  }

  .mine-actions {
    opacity: 0;
    transform: translateX(8rpx);
    transition: opacity 180ms var(--ease-out), transform 180ms var(--ease-out);
  }

  .mine-row:hover .mine-actions {
    opacity: 1;
    transform: none;
  }

  .mine-row:hover .mine-name {
    color: var(--color-earth);
  }
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
