<template>
  <view class="page">
    <button class="primary" @tap="openCreate">新建</button>

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

    <button class="ghost" @tap="clearOfficial">清官方菜缓存</button>
    <button class="ghost" @tap="openPrivacy">隐私说明</button>
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
  padding: 32rpx 32rpx 48rpx;
  box-sizing: border-box;
}

.primary,
.ghost {
  margin: 0;
  height: 72rpx;
  line-height: 72rpx;
  border-radius: 16rpx;
  font-size: 28rpx;
}

.primary {
  margin-bottom: 28rpx;
  background: var(--color-ready);
  color: #fff;
}

.card {
  margin-bottom: 16rpx;
  padding: 24rpx 28rpx;
  border-radius: 20rpx;
  background: var(--color-card);
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.name {
  color: var(--color-text);
  font-size: 32rpx;
}

.remove {
  color: var(--color-almost);
  font-size: 26rpx;
}

.meta {
  display: block;
  margin-top: 8rpx;
  color: var(--color-muted);
  font-size: 26rpx;
}

.ghost {
  margin-top: 28rpx;
  background: var(--color-chip);
  color: var(--color-text);
}
</style>
