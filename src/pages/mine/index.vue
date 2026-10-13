<template>
  <view class="page">
    <button class="primary" hover-class="none" @tap="openCreate">新建</button>

    <EmptyState v-if="mine.length === 0" title="还没有自己的菜" />
    <view v-else>
      <view v-for="item in mine" :key="item.id" class="card" @tap="openEdit(item.id)">
        <view class="head">
          <text class="name">{{ item.name }}</text>
          <text class="remove" @tap.stop="confirmRemove(item.id, item.name)">删除</text>
        </view>
        <text class="meta">用了 {{ item.need.length }} 样</text>
      </view>
    </view>

    <button class="ghost" hover-class="none" @tap="clearOfficial">清官方菜缓存</button>
    <button class="ghost" hover-class="none" @tap="openPrivacy">隐私说明</button>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import EmptyState from '@/components/EmptyState.vue'
import { useRecipes } from '@/composables/useRecipes'
import { CACHE_KEY_ING, CACHE_KEY_REC, removeCache } from '@/utils/storage'

const { official, mine, load, removeMine } = useRecipes()

onShow(() => {
  void load()
})

function openCreate() {
  uni.navigateTo({ url: '/pages/mine/edit' })
}

function openEdit(id: string) {
  uni.navigateTo({ url: `/pages/mine/edit?id=${id}` })
}

function confirmRemove(id: string, name: string) {
  uni.showModal({
    title: '删除这道菜',
    content: name,
    success(res) {
      if (!res.confirm) return
      void removeMine(id).catch(() => {
        uni.showToast({ title: '删除失败', icon: 'none' })
      })
    },
  })
}

function openPrivacy() {
  uni.navigateTo({ url: '/pages/privacy/index' })
}

function clearOfficial() {
  removeCache(CACHE_KEY_REC)
  removeCache(CACHE_KEY_ING)
  official.value = []
  uni.showToast({ title: '已清除', icon: 'none' })
}
</script>

<style scoped>
.page {
  padding: 40rpx 40rpx calc(48rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.primary,
.ghost {
  margin: 0;
  height: 72rpx;
  line-height: 72rpx;
  border-radius: 24rpx;
  font-size: 30rpx;
}

.primary {
  margin-bottom: 32rpx;
  background: var(--color-ready);
  color: var(--color-on-ready);
}

.card {
  margin-bottom: 0;
  padding: 32rpx 0;
  border-bottom: 1px solid var(--color-line);
  background: transparent;
}

.head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16rpx;
}

.name {
  color: var(--color-text);
  font-size: 44rpx;
  font-weight: 600;
  line-height: 1.3;
}

.remove {
  flex-shrink: 0;
  color: var(--color-almost);
  font-size: 24rpx;
}

.meta {
  display: block;
  margin-top: 8rpx;
  color: var(--color-muted);
  font-size: 24rpx;
}

.ghost {
  margin-top: 32rpx;
  border: 1px solid var(--color-line);
  background: transparent;
  color: var(--color-text);
}
</style>
