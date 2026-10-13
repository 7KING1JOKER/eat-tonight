<template>
  <view class="page">
    <input v-model="name" class="input" placeholder="菜名" />

    <IngredientGroups :selected="need" @toggle="toggleNeed" />

    <view v-if="custom.length" class="group">
      <view class="group-label">
        <AppIcon name="custom" tone="earth" />
        <text class="group-name">自定义</text>
      </view>
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
    <button class="primary" hover-class="none" @tap="submit">保存</button>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import AppIcon from '@/components/AppIcon.vue'
import IngredientChip from '@/components/IngredientChip.vue'
import IngredientGroups from '@/components/IngredientGroups.vue'
import { useFridge } from '@/composables/useFridge'
import { useRecipes } from '@/composables/useRecipes'

const { custom, load: loadFridge } = useFridge()
const { mine, load: loadRecipes, saveMine } = useRecipes()

const editingId = ref('')
const name = ref('')
const need = ref<string[]>([])
const stepsText = ref('')

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
  padding: 40rpx 40rpx calc(48rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.input,
.steps {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--color-line);
  border-radius: 24rpx;
  background: transparent;
  color: var(--color-text);
  font-size: 30rpx;
}

.input {
  height: 72rpx;
  margin-bottom: 32rpx;
  padding: 0 24rpx;
}

.group {
  margin-bottom: 48rpx;
}

.group-label {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 16rpx;
}

.group-name {
  color: var(--color-earth);
  font-size: 26rpx;
  letter-spacing: 0.04em;
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
  border-radius: 24rpx;
  background: var(--color-ready);
  color: var(--color-on-ready);
  font-size: 30rpx;
}
</style>
