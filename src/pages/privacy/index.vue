<template>
  <view class="page">
    <text class="title">隐私说明</text>
    <text class="line">登录只用来识别账号。</text>
    <text class="line">不申请相册，也不申请位置。</text>
    <text class="line">自定义食材是你自己输入的文字。</text>
    <text class="line">官方菜谱来自程序员做饭指南，公有领域，可自由复制和使用。</text>
    <text class="line url" selectable>https://github.com/Anduin2017/HowToCook</text>
    <text class="line">你新建的菜是你自己写的。</text>
  </view>
</template>

<script setup lang="ts">
</script>

<style scoped>
.page {
  padding: 32rpx 32rpx 48rpx;
  box-sizing: border-box;
}

.title {
  display: block;
  margin-bottom: 24rpx;
  color: var(--color-text);
  font-size: 34rpx;
}

.line {
  display: block;
  margin-bottom: 16rpx;
  color: var(--color-muted);
  font-size: 28rpx;
  line-height: 1.6;
}

.url {
  word-break: break-all;
}
</style>
