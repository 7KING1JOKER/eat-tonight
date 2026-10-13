<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'
import { initCloud } from '@/cloud/auth'

onLaunch(() => {
  initCloud()
})
</script>
<style>
page,
uni-page-body {
  --color-bg: #f7f4ef;
  --color-card: #fff;
  --color-text: #1f1b16;
  --color-muted: #8a8278;
  --color-ready: #2f6b3a;
  --color-almost: #b86a1c;
  --color-chip: #efe8de;
  min-height: 100%;
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 28rpx;
  padding-bottom: env(safe-area-inset-bottom);
}

html,
body,
uni-app,
uni-page,
uni-page-wrapper {
  background: #f7f4ef;
}
</style>
