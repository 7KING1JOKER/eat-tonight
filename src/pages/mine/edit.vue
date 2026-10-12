<template>
  <view class="page">
    <input v-model="name" class="input" placeholder="菜名" />

    <view v-for="group in groups" :key="group.name" class="group">
      <text class="group-name">{{ group.name }}</text>
      <view class="chips">
        <IngredientChip
          v-for="item in group.items"
          :key="item.id"
          :id="item.id"
          :name="item.name"
          :selected="need.includes(item.id)"
          @toggle="toggleNeed"
        />
      </view>
    </view>

    <view v-if="custom.length" class="group">
      <text class="group-name">自定义</text>
      <view class="chips">
        <IngredientChip
          v-for="item in custom"
          :key="item.id"
          :id="item.id"
          :name="item.name"
          :selected="need.includes(item.id)"
          @toggle="toggleNeed"
        />
      </view>
    </view>

    <textarea v-model="stepsText" class="steps" placeholder="步骤，一行一条，最多 5 条" />
    <button class="primary" @tap="submit">保存</button>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import IngredientChip from '@/components/IngredientChip.vue'
import { useFridge } from '@/composables/useFridge'
import { useRecipes } from '@/composables/useRecipes'

const { ingredients, custom, load: loadFridge } = useFridge()
const { mine, load: loadRecipes, saveMine } = useRecipes()

const editingId = ref('')
const name = ref('')
const need = ref<string[]>([])
const stepsText = ref('')

const groups = computed(() => {
  const map = new Map<string, { id: string; name: string }[]>()
  for (const item of ingredients.value) {
    const list = map.get(item.group) ?? []
    list.push({ id: item.id, name: item.name })
    map.set(item.group, list)
  }
  return [...map.entries()].map(([groupName, items]) => ({ name: groupName, items }))
})

onLoad((query) => {
  void prepare(String(query?.id ?? ''))
})

async function prepare(id: string) {
  await Promise.all([loadFridge(), loadRecipes()])
  if (!id) return
  const found = mine.value.find((item) => item.id === id)
  if (!found) return
  editingId.value = found.id
  name.value = found.name
  need.value = [...found.need]
  stepsText.value = found.steps.join('\n')
}

function toggleNeed(id: string) {
  if (need.value.includes(id)) {
    need.value = need.value.filter((item) => item !== id)
    return
  }
  need.value = need.value.concat(id)
}

async function submit() {
  const steps = stepsText.value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
  if (!name.value.trim() || need.value.length < 1) {
    uni.showToast({ title: '写下菜名，并至少勾一样食材', icon: 'none' })
    return
  }
  if (steps.length > 5) {
    uni.showToast({ title: '步骤最多 5 条', icon: 'none' })
    return
  }
  try {
    await saveMine({
      id: editingId.value || undefined,
      name: name.value,
      need: need.value,
      steps,
    })
    uni.navigateBack()
  } catch {
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}
</script>

<style scoped>
.page {
  padding: 32rpx 32rpx 48rpx;
  box-sizing: border-box;
}

.input,
.steps {
  width: 100%;
  box-sizing: border-box;
  border-radius: 16rpx;
  background: var(--color-card);
  color: var(--color-text);
  font-size: 28rpx;
}

.input {
  height: 72rpx;
  margin-bottom: 32rpx;
  padding: 0 24rpx;
}

.group {
  margin-bottom: 36rpx;
}

.group-name {
  display: block;
  margin-bottom: 16rpx;
  color: var(--color-muted);
  font-size: 26rpx;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.steps {
  min-height: 180rpx;
  margin-bottom: 28rpx;
  padding: 20rpx 24rpx;
}

.primary {
  margin: 0;
  height: 72rpx;
  line-height: 72rpx;
  border-radius: 16rpx;
  background: var(--color-ready);
  color: #fff;
  font-size: 28rpx;
}
</style>
