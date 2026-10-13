<template>
  <view>
    <view v-for="group in groups" :key="group.name" class="group">
    <view class="group-head" @tap="toggleGroup(group.name, group.extra)">
      <text class="group-name">{{ group.name }}</text>
      <text v-if="group.extra" class="arrow" :class="{ open: isOpen(group.name) }">▾</text>
    </view>
    <view class="chips">
      <IngredientChip
        v-for="item in shownItems(group)"
        :key="item.id"
        :id="item.id"
        :name="item.name"
        :selected="selected.includes(item.id)"
        @toggle="emit('toggle', $event)"
      />
    </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import IngredientChip from '@/components/IngredientChip.vue'
import { useFridge } from '@/composables/useFridge'
import { COMMON_INGREDIENTS } from '@/utils/commonIngredients'

const props = defineProps<{
  selected: string[]
}>()

const emit = defineEmits<{
  toggle: [id: string]
}>()

const { ingredients } = useFridge()
const opened = ref<Record<string, boolean>>({})

interface IngredientGroup {
  name: string
  items: { id: string; name: string }[]
  extra: boolean
}

const groups = computed(() => {
  const map = new Map<string, { id: string; name: string }[]>()
  for (const item of ingredients.value) {
    const list = map.get(item.group) ?? []
    list.push({ id: item.id, name: item.name })
    map.set(item.group, list)
  }
  return [...map.entries()].map(([name, items]) => ({
    name,
    items: [
      ...items.filter((item) => COMMON_INGREDIENTS.has(item.name)),
      ...items.filter((item) => !COMMON_INGREDIENTS.has(item.name)),
    ],
    extra: items.some((item) => !COMMON_INGREDIENTS.has(item.name)),
  }))
})

function isOpen(name: string): boolean {
  return opened.value[name] === true
}

function toggleGroup(name: string, extra: boolean) {
  if (!extra) return
  opened.value = { ...opened.value, [name]: !opened.value[name] }
}

function shownItems(group: IngredientGroup) {
  if (isOpen(group.name)) return group.items
  const picked = new Set(props.selected)
  return group.items.filter((item) => COMMON_INGREDIENTS.has(item.name) || picked.has(item.id))
}
</script>

<style scoped>
.group {
  margin-bottom: 36rpx;
}

.group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.group-name {
  display: block;
  color: var(--color-muted);
  font-size: 26rpx;
}

.arrow {
  color: var(--color-muted);
  font-size: 28rpx;
  padding: 4rpx 8rpx;
  transition: transform 0.2s ease;
}

.arrow.open {
  transform: rotate(180deg);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}
</style>

