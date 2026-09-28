<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'
import { initCloud } from '@/cloud/auth'

onLaunch(() => {
  initCloud()
})
</script>
<style>
page {
  --color-bg: #f7f4ef;
  --color-card: #fff;
  --color-text: #1f1b16;
  --color-muted: #8a8278;
  --color-ready: #2f6b3a;
  --color-almost: #b86a1c;
  --color-chip: #efe8de;
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 28rpx;
}
</style>
