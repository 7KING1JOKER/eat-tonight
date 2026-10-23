<template>
  <view>
    <view
      v-for="(group, index) in groups"
      :key="group.name"
      class="group reveal"
      :class="{ shown: revealed[group.name] }"
      :data-index="index"
    >
    <view class="group-head" @tap="toggleGroup(group.name, group.extra)">
      <view class="group-label">
        <AppIcon :name="groupIcon(group.name)" tone="earth" />
        <text class="group-name">{{ group.name }}</text>
      </view>
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
import { computed, getCurrentInstance, nextTick, onUnmounted, ref, watch } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import IngredientChip from '@/components/IngredientChip.vue'
import { useFridge } from '@/composables/useFridge'
import { COMMON_INGREDIENTS } from '@/utils/commonIngredients'
import { groupIcon } from '@/utils/icons'

const props = defineProps<{
  selected: string[]
}>()

const emit = defineEmits<{
  toggle: [id: string]
}>()

const { ingredients } = useFridge()
const opened = ref<Record<string, boolean>>({})
const revealed = ref<Record<string, boolean>>({})
let revealObserver: { disconnect: () => void } | null = null
let revealFallback: ReturnType<typeof setTimeout> | null = null

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

function showAt(index: number) {
  const name = groups.value[index]?.name
  if (!name || revealed.value[name]) return
  revealed.value = { ...revealed.value, [name]: true }
}

function revealAll() {
  const next = { ...revealed.value }
  for (const group of groups.value) next[group.name] = true
  revealed.value = next
}

function bindReveal(proxy: object | null | undefined) {
  revealObserver?.disconnect()
  revealObserver = null
  if (groups.value.length === 0) return
  if (proxy == null || typeof uni.createIntersectionObserver !== 'function') {
    revealAll()
    return
  }
  const observer = uni.createIntersectionObserver(proxy as never, { observeAll: true })
  revealObserver = observer
  observer.relativeToViewport({ bottom: 32 }).observe('.reveal', (res) => {
    const hit = res as { intersectionRatio?: number; dataset?: { index?: string | number } }
    const index = Number(hit.dataset?.index)
    if ((hit.intersectionRatio ?? 0) > 0 && Number.isFinite(index)) showAt(index)
  })
  if (revealFallback) clearTimeout(revealFallback)
  revealFallback = setTimeout(() => {
    const anyShown = groups.value.some((group) => revealed.value[group.name])
    if (!anyShown) revealAll()
  }, 500)
}

const host = getCurrentInstance()?.proxy
watch(groups, () => {
  void nextTick(() => bindReveal(host))
}, { immediate: true })

onUnmounted(() => {
  revealObserver?.disconnect()
  if (revealFallback) clearTimeout(revealFallback)
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
  margin-bottom: 48rpx;
  padding-bottom: 16rpx;
  border-bottom: 1px solid var(--color-line);
}

.reveal {
  opacity: 0;
  transform: translateY(16rpx);
}

.reveal.shown {
  opacity: 1;
  transform: none;
  transition: opacity 180ms var(--ease-out), transform 180ms var(--ease-out);
}

.group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
  transition: opacity 160ms var(--ease-out);
}

.group-head:active {
  opacity: 0.65;
}

.group-label {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.group-name {
  color: var(--color-earth);
  font-size: 26rpx;
  line-height: 1;
  letter-spacing: 0.04em;
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

