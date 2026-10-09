<template>
  <view class="page">
    <EmptyState v-if="have.length === 0" title="先去冰箱勾食材" />
    <SkeletonList v-else-if="showSkeleton" />
    <EmptyState v-else-if="noRecipes" title="菜谱暂时没有" />
    <EmptyState v-else-if="noMatch" title="没有能做或只差一两样的菜" />
    <template v-else>
      <view class="group">
        <text class="group-name ready">今晚能做</text>
        <RecipeCard
          v-for="item in ready"
          :key="item.source + item.id"
          :name="item.name"
          :missing="namesOf(item.missing)"
          :source="item.source"
        />
      </view>
      <view class="group">
        <text class="group-name almost">还差 1～2 样</text>
        <RecipeCard
          v-for="item in almost"
          :key="item.source + item.id"
          :name="item.name"
          :missing="namesOf(item.missing)"
          :source="item.source"
        />
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import EmptyState from '@/components/EmptyState.vue'
import RecipeCard from '@/components/RecipeCard.vue'
import SkeletonList from '@/components/SkeletonList.vue'
import { useFridge } from '@/composables/useFridge'
import { useMatch } from '@/composables/useMatch'
import { useRecipes } from '@/composables/useRecipes'

const { have, ingredients, custom, load: loadFridge } = useFridge()
const { official, mine, loading, loadError, load: loadRecipes } = useRecipes()
const { ready, almost } = useMatch()

const showSkeleton = computed(() => loading.value && official.value.length === 0 && mine.value.length === 0)
const noRecipes = computed(() => loadError.value && official.value.length === 0 && mine.value.length === 0)
const noMatch = computed(() => ready.value.length === 0 && almost.value.length === 0)

const ingredientName = computed(() => {
  const map = new Map<string, string>()
  for (const item of ingredients.value) map.set(item.id, item.name)
  for (const item of custom.value) map.set(item.id, item.name)
  return map
})

function namesOf(ids: string[]): string[] {
  return ids.map((id) => ingredientName.value.get(id) ?? id)
}

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

.group {
  margin-bottom: 36rpx;
}

.group-name {
  display: block;
  margin-bottom: 16rpx;
  font-size: 30rpx;
}

.ready {
  color: var(--color-ready);
}

.almost {
  color: var(--color-almost);
}
</style>
