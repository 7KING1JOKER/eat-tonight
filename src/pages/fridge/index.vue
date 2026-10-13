<template>
  <view class="page">
    <view class="bar">
      <text class="count">已选 {{ have.length }}</text>
      <text v-if="have.length" class="clear" @tap="confirmClear">清空</text>
    </view>

    <IngredientGroups :selected="have" @toggle="toggle" />

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
      <button class="add-btn" hover-class="none" @tap="submitCustom">添加</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import AppIcon from '@/components/AppIcon.vue'
import IngredientChip from '@/components/IngredientChip.vue'
import IngredientGroups from '@/components/IngredientGroups.vue'
import { useFridge } from '@/composables/useFridge'

const { have, custom, toggle, clearHave, addCustom, load } = useFridge()
const draft = ref('')

onShow(() => {
  void load()
})

function confirmClear() {
  uni.showModal({
    title: '清空冰箱',
    content: '已勾选的食材都会取消。',
    success(res) {
      if (res.confirm) clearHave()
    },
  })
}

function submitCustom() {
  const name = draft.value.trim()
  if (!name) return
  addCustom(name)
  draft.value = ''
}
</script>

<style scoped>
.page {
  padding: 40rpx 40rpx calc(48rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32rpx;
}

.count {
  color: var(--color-ready);
  font-size: 26rpx;
  letter-spacing: 0.04em;
}

.clear {
  color: var(--color-almost);
  font-size: 26rpx;
  letter-spacing: 0.04em;
}

.group-label {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 16rpx;
}

.group {
  margin-bottom: 48rpx;
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
  border: 1px solid var(--color-line);
  border-radius: 24rpx;
  background: transparent;
  color: var(--color-text);
  font-size: 30rpx;
}

.add-btn {
  margin: 0;
  padding: 0 28rpx;
  height: 72rpx;
  line-height: 72rpx;
  border-radius: 24rpx;
  background: var(--color-ready);
  color: var(--color-on-ready);
  font-size: 30rpx;
}
</style>
