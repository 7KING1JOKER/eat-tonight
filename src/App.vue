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
  --color-bg: #f4f1de;
  --color-card: #f4f1de;
  --color-text: #3c342c;
  --color-muted: #7a7166;
  --color-ready: #2f6b3a;
  --color-almost: #9a4f22;
  --color-chip: #f4f1de;
  --color-earth: #5c4d3c;
  --color-line: #e4dcc8;
  --color-chrome: #e8e0c8;
  --color-on-ready: #fffcf7;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  min-height: 100%;
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 30rpx;
  padding-bottom: env(safe-area-inset-bottom);
}

html,
body,
uni-app,
uni-page,
uni-page-wrapper {
  background: #f4f1de;
}

button {
  border: none;
  transition: transform 180ms var(--ease-out);
}

button::after {
  border: none;
}

button:active,
button.button-hover {
  opacity: 1;
  transform: scale(0.98);
}

@media (hover: hover) and (pointer: fine) {
  button:hover {
    transform: translateY(-4rpx);
  }

  button:active:hover {
    transform: scale(0.98);
  }
}
</style>
