<template>
  <view class="page">
    <view class="block" :style="delay(0)">
      <text class="label">冰箱</text>
      <view class="rule" />
      <text v-if="journal.days.length === 0" class="quiet">还没有勾选记录</text>
      <view v-else class="timeline">
        <view class="spine" />
        <view v-for="day in journal.days" :key="day.date" class="day">
          <view class="dot" />
          <text class="date">{{ dayLabel(day.date) }}</text>
          <view class="day-side">
            <text v-if="day.on.length" class="side on">勾上 {{ day.on.join('、') }}</text>
            <text v-if="day.off.length" class="side off">取消 {{ day.off.join('、') }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="block" :style="delay(40)">
      <text class="label">看过</text>
      <view class="rule" />
      <text v-if="journal.recentViews.length === 0" class="quiet">还没有看过菜谱</text>
      <view v-else class="seen">
        <view
          v-for="item in journal.recentViews"
          :key="item.at + item.id"
          class="seen-item"
          @tap="openView(item.id, item.source)"
        >
          <view class="seen-mark" />
          <text class="name">{{ item.name }}</text>
        </view>
      </view>
    </view>

    <view class="block" :style="delay(80)">
      <text class="label">写下的</text>
      <view class="rule" />
      <text v-if="journal.created.length === 0" class="quiet">这 30 天还没有新菜</text>
      <view v-for="item in journal.created" :key="item.at + item.id" class="note" @tap="openDetail(item.id)">
        <text class="when">{{ when(item.at) }}</text>
        <view class="join" />
        <text class="name note-name">{{ item.name }}</text>
      </view>
    </view>

    <view class="block" :style="delay(120)">
      <text class="label">常看</text>
      <view class="rule" />
      <text v-if="journal.frequentRecipes.length === 0" class="quiet">还没有常看的菜</text>
      <view v-for="(item, index) in journal.frequentRecipes" :key="item.id" class="rank">
        <view class="rank-head">
          <text class="name">{{ item.name }}</text>
          <text class="count">{{ item.count }}</text>
        </view>
        <view class="track">
          <view class="fill" :style="barStyle(item.count, recipeMax, index)" />
        </view>
      </view>
    </view>

    <view class="block" :style="delay(160)">
      <text class="label">常勾</text>
      <view class="rule" />
      <text v-if="journal.frequentIngredients.length === 0" class="quiet">还没有常勾的食材</text>
      <view v-for="(item, index) in journal.frequentIngredients" :key="item.id" class="rank">
        <view class="rank-head">
          <text class="name">{{ item.name }}</text>
          <text class="count">{{ item.count }}</text>
        </view>
        <view class="track">
          <view class="fill" :style="barStyle(item.count, ingredientMax, index)" />
        </view>
      </view>
    </view>

    <button class="ghost" hover-class="none" @tap="openPrivacy">隐私说明</button>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import dayjs from 'dayjs'
import { useJournal } from '@/composables/useJournal'
import type { RecipeSource } from '@/types/eat'

const { view: journal, loadJournal } = useJournal()

onShow(() => {
  void loadJournal()
})

const recipeMax = computed(() => Math.max(1, ...journal.value.frequentRecipes.map((item) => item.count)))
const ingredientMax = computed(() => Math.max(1, ...journal.value.frequentIngredients.map((item) => item.count)))

function dayLabel(date: string): string {
  const [, month, day] = date.split('-')
  return `${Number(month)}月${Number(day)}日`
}

function when(at: number): string {
  return dayjs(at).format('M月D日 HH:mm')
}

function delay(ms: number): string {
  return `animation-delay:${ms}ms`
}

function barStyle(count: number, max: number, index: number) {
  return {
    '--scale': String(count / max),
    animationDelay: `${index * 40}ms`,
  }
}

function openView(id: string, source?: RecipeSource) {
  uni.navigateTo({ url: `/pages/detail/index?id=${id}&source=${source ?? 'official'}` })
}

function openDetail(id: string) {
  uni.navigateTo({ url: `/pages/detail/index?id=${id}&source=mine` })
}

function openPrivacy() {
  uni.navigateTo({ url: '/pages/privacy/index' })
}
</script>

<style scoped>
.page {
  padding: 40rpx 40rpx calc(48rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.block {
  margin-bottom: 48rpx;
  animation: rise 180ms var(--ease-out) backwards;
}

.label {
  color: var(--color-earth);
  font-size: 26rpx;
  letter-spacing: 0.08em;
}

.rule {
  height: 1px;
  margin: 16rpx 0 24rpx;
  background: var(--color-line);
  transform-origin: left center;
  animation: draw-x 420ms var(--ease-out) backwards;
}

.quiet {
  color: var(--color-muted);
  font-size: 30rpx;
  line-height: 1.6;
}

.timeline {
  position: relative;
  padding-left: 32rpx;
}

.spine {
  position: absolute;
  left: 7rpx;
  top: 14rpx;
  bottom: 8rpx;
  width: 1px;
  background: var(--color-earth);
  transform-origin: center top;
  animation: draw-y 480ms var(--ease-out) backwards;
}

.day {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24rpx;
  padding-bottom: 28rpx;
}

.dot {
  position: absolute;
  left: -28rpx;
  top: 12rpx;
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  background: var(--color-earth);
}

.date {
  flex-shrink: 0;
  color: var(--color-text);
  font-size: 30rpx;
  line-height: 1.4;
}

.day-side {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: flex-end;
  gap: 8rpx;
  min-width: 0;
}

.side {
  color: var(--color-text);
  font-size: 26rpx;
  line-height: 1.5;
  text-align: right;
}

.on {
  color: var(--color-ready);
}

.off {
  color: var(--color-almost);
}

.name {
  color: var(--color-text);
  font-size: 34rpx;
  line-height: 1.4;
}

.seen {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx 36rpx;
}

.seen-item {
  position: relative;
  transition: transform 180ms var(--ease-out), padding-left 180ms var(--ease-out);
}

.seen-item:active {
  transform: scale(0.98);
}

.seen-mark {
  position: absolute;
  left: 0;
  top: 50%;
  width: 8rpx;
  height: 8rpx;
  margin-top: -4rpx;
  border-radius: 50%;
  background: var(--color-earth);
  transform: scale(0);
  transition: transform 180ms var(--ease-out);
}

.note {
  display: flex;
  align-items: baseline;
  gap: 16rpx;
  margin-bottom: 24rpx;
  transition: transform 180ms var(--ease-out);
}

.note:active {
  transform: scale(0.98);
}

.when {
  flex-shrink: 0;
  color: var(--color-muted);
  font-size: 24rpx;
  line-height: 1.4;
}

.join {
  flex: 1;
  height: 1px;
  align-self: center;
  background: var(--color-earth);
  transform: scaleX(0);
  transform-origin: left center;
  transition: transform 220ms var(--ease-out);
}

.note-name {
  flex-shrink: 1;
  text-align: right;
}

.rank {
  margin-bottom: 24rpx;
}

.rank-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16rpx;
}

.count {
  flex-shrink: 0;
  color: var(--color-muted);
  font-size: 24rpx;
}

.track {
  height: 4rpx;
  margin-top: 12rpx;
  overflow: hidden;
  background: var(--color-line);
}

.fill {
  height: 100%;
  background: var(--color-ready);
  transform: scaleX(var(--scale, 1));
  transform-origin: left center;
  animation: draw-x 480ms var(--ease-out) backwards;
}

.ghost {
  margin: 16rpx 0 0;
  height: 72rpx;
  line-height: 72rpx;
  border: 1px solid var(--color-line);
  border-radius: 24rpx;
  background: transparent;
  color: var(--color-text);
  font-size: 30rpx;
}

@media (hover: hover) and (pointer: fine) {
  .seen-item:hover {
    padding-left: 20rpx;
    transform: translateY(-4rpx);
  }

  .seen-item:hover:active {
    transform: translateY(-4rpx) scale(0.98);
  }

  .seen-item:hover .seen-mark {
    transform: scale(1);
  }

  .seen-item:hover .name {
    color: var(--color-earth);
  }

  .note:hover .join {
    transform: scaleX(1);
  }

  .note:hover .note-name {
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

@keyframes draw-x {
  from {
    transform: scaleX(0);
  }
}

@keyframes draw-y {
  from {
    transform: scaleY(0);
  }
}
</style>
