<template>
  <view class="page">
    <view class="count">已选 {{ have.length }}</view>

    <view v-for="group in groups" :key="group.name" class="group">
      <text class="group-name">{{ group.name }}</text>
      <view class="chips">
        <IngredientChip
          v-for="item in group.items"
          :key="item.id"
          :id="item.id"
          :name="item.name"
          :selected="have.includes(item.id)"
          @toggle="toggle"
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
          :selected="have.includes(item.id)"
          @toggle="toggle"
        />
      </view>
    </view>

    <view class="add">
      <input
        v-model="draft"
        class="input"
        placeholder="自定义食材"
        confirm-type="done"
        @confirm="submitCustom"
      />
      <button class="add-btn" @tap="submitCustom">添加</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import IngredientChip from '@/components/IngredientChip.vue'
import { useFridge } from '@/composables/useFridge'

const { have, ingredients, custom, toggle, addCustom, load } = useFridge()
const draft = ref('')

// 根据ingredient的group分组
const groups = computed(() => {
  const map = new Map<string, { id: string; name: string }[]>()
  for (const item of ingredients.value) {
    const list = map.get(item.group) ?? []
    list.push({ id: item.id, name: item.name })
    map.set(item.group, list)
  }
  return [...map.entries()].map(([name, items]) => ({ name, items }))
})

onShow(() => {
  void load()
})

function submitCustom() {
  const name = draft.value.trim()
  if (!name) return
  addCustom(name)
  draft.value = ''
}
</script>

<style scoped>
.page {
  padding: 32rpx 32rpx 48rpx;
  box-sizing: border-box;
}

.count {
  display: inline-flex;
  margin-bottom: 32rpx;
  padding: 8rpx 24rpx;
  border-radius: 999rpx;
  background: var(--color-ready);
  color: #fff;
  font-size: 26rpx;
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

.add {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 12rpx;
}

.input {
  flex: 1;
  height: 72rpx;
  padding: 0 24rpx;
  border-radius: 16rpx;
  background: var(--color-card);
  color: var(--color-text);
  font-size: 28rpx;
}

.add-btn {
  margin: 0;
  padding: 0 28rpx;
  height: 72rpx;
  line-height: 72rpx;
  border-radius: 16rpx;
  background: var(--color-chip);
  color: var(--color-text);
  font-size: 28rpx;
}
</style>
