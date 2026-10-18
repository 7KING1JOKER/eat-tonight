<template>
  <view class="page">
    <view class="note">
      <view class="rule title-row" style="--at: 0ms">
        <text class="title">隐私说明</text>
      </view>
      <view class="row rule" style="--at: 80ms">
        <text class="line">勾选食材、打开菜谱和新建菜谱会记在这台设备上。云开通之后，这些记录只同步到当前登录的账号。</text>
      </view>
      <view class="row rule" style="--at: 160ms">
        <text class="line">官方菜谱文字来自程序员做饭指南，公有领域，可自由复制和使用。</text>
      </view>
      <view class="row rule" style="--at: 240ms">
        <view
          class="source-link"
          hover-class="is-down"
          :hover-stay-time="160"
          @tap="openSource"
        >
          <text class="source-link-text" user-select>https://github.com/Anduin2017/HowToCook</text>
        </view>
      </view>
      <view class="row rule" style="--at: 320ms">
        <text class="line">封面是Nano Banana生成的配图，不是菜谱原图。</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
const SOURCE = 'https://github.com/Anduin2017/HowToCook'

/** 网页新开页打开出处；小程序打不开 GitHub，改为复制链接。 */
function openSource() {
  if (uni.getSystemInfoSync().uniPlatform === 'web') {
    window.open(SOURCE, '_blank', 'noopener,noreferrer')
    return
  }
  uni.setClipboardData({
    data: SOURCE,
    success: () => uni.showToast({ title: '已复制出处链接', icon: 'none' }),
  })
}
</script>

<style scoped>
.page {
  padding: 40rpx 40rpx calc(48rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.note {
  position: relative;
  padding: 36rpx 32rpx 8rpx 44rpx;
  border: 1px solid var(--color-line);
  border-radius: 24rpx;
  background: #fbf6e8;
  box-shadow: 0 16rpx 40rpx rgba(60, 52, 44, 0.06);
  box-sizing: border-box;
}

.note::before {
  content: '';
  position: absolute;
  top: 28rpx;
  bottom: 28rpx;
  left: 18rpx;
  width: 2px;
  background: rgba(154, 79, 34, 0.28);
}

.title-row {
  padding-bottom: 18rpx;
}

.title {
  display: block;
  color: var(--color-text);
  font-size: 44rpx;
  font-weight: 600;
  line-height: 1.3;
}

.row {
  padding: 22rpx 0 20rpx;
}

.line {
  display: block;
  color: var(--color-text);
  font-size: 30rpx;
  line-height: 1.7;
}

.rule {
  position: relative;
}

.rule::after {
  content: '';
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 1px;
  z-index: 0;
  background: rgba(92, 77, 60, 0.28);
  transform: scaleX(0);
  transform-origin: left center;
  animation: draw 900ms var(--ease-out) both;
  animation-delay: var(--at, 0ms);
  pointer-events: none;
}

.source-link {
  display: inline-block;
  position: relative;
  max-width: 100%;
  color: var(--color-earth);
  transition: transform 180ms var(--ease-out), color 180ms var(--ease-out);
}

.source-link-text {
  color: var(--color-earth);
  font-size: 30rpx;
  line-height: 1.7;
  word-break: break-all;
  transition: color 180ms var(--ease-out);
}

.source-link:active,
.source-link.is-down {
  transform: scale(0.98);
}

@media (hover: hover) and (pointer: fine) {
  .rule::before {
    content: '';
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 1;
    height: 1px;
    background: var(--color-earth);
    transform: scaleX(0);
    transform-origin: left center;
    transition: transform 640ms var(--ease-out);
    pointer-events: none;
  }

  .rule:hover::before {
    transform: scaleX(1);
  }

  .source-link {
    cursor: pointer;
  }

  .source-link:hover,
  .source-link:hover .source-link-text {
    color: var(--color-text);
  }
}

@keyframes draw {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}
</style>
