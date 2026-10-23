<template>
  <view class="page">
    <input v-model="name" class="input" placeholder="菜名" />
    <textarea v-model="summary" class="area" placeholder="简介，可以不写" />
    <input v-model="servings" class="input" placeholder="一份够几个人吃，可以不写" />

    <IngredientGroups :selected="need" @toggle="toggleNeed" />

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
          :selected="need.includes(item.id)"
          @toggle="toggleNeed"
        />
      </view>
    </view>

    <view v-if="need.length" class="group">
      <text class="group-name">用量</text>
      <view v-for="id in need" :key="id" class="amount-row">
        <text class="amount-name">{{ ingredientLabel(id) }}</text>
        <input v-model="amounts[id]" class="amount-input" placeholder="用量" />
      </view>
    </view>

    <view class="group">
      <text class="group-name">其他用料</text>
      <view v-for="(item, index) in extras" :key="index" class="extra-row">
        <input v-model="item.name" class="extra-name" placeholder="名称，如水" />
        <input v-model="item.amount" class="extra-amount" placeholder="用量" />
        <text class="extra-remove" @tap="removeExtra(index)">去掉</text>
      </view>
      <text class="add-extra" @tap="addExtra">加上一样</text>
    </view>

    <textarea v-model="stepsText" class="steps" placeholder="步骤，一行一条，最多 5 条" />
    <textarea v-model="note" class="area" placeholder="说明，可以不写" />

    <text class="group-name">出处</text>
    <input v-model="creditSite" class="input" placeholder="来源名称，可以不写" />
    <input v-model="creditUrl" class="input" placeholder="链接，可以不写" />

    <button class="primary" hover-class="none" @tap="submit">保存</button>
    <button v-if="editingId" class="danger" hover-class="none" @tap="confirmRemove">删除</button>
  </view>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import AppIcon from '@/components/AppIcon.vue'
import IngredientChip from '@/components/IngredientChip.vue'
import IngredientGroups from '@/components/IngredientGroups.vue'
import { useFridge } from '@/composables/useFridge'
import { useRecipes } from '@/composables/useRecipes'
import type { RecipeCredit, RecipeItem } from '@/types/eat'

const { custom, ingredients, load: loadFridge } = useFridge()
const { mine, load: loadRecipes, saveMine, removeMine } = useRecipes()

const editingId = ref('')
const name = ref('')
const summary = ref('')
const servings = ref('')
const need = ref<string[]>([])
const amounts = reactive<Record<string, string>>({})
const extras = ref<{ name: string; amount: string }[]>([])
const stepsText = ref('')
const note = ref('')
const creditSite = ref('')
const creditUrl = ref('')

onLoad((query) => {
  const id = String(query?.id ?? '')
  uni.setNavigationBarTitle({ title: id ? '编辑菜谱' : '新建菜谱' })
  void prepare(id)
})

async function prepare(id: string) {
  await Promise.all([loadFridge(), loadRecipes()])
  if (!id) return
  const found = mine.value.find((item) => item.id === id)
  if (!found) return
  editingId.value = found.id
  name.value = found.name
  summary.value = found.summary ?? ''
  servings.value = found.servings ?? ''
  need.value = [...found.need]
  for (const itemId of found.need) {
    amounts[itemId] = found.items?.find((item) => item.id === itemId)?.amount ?? ''
  }
  extras.value = (found.items ?? [])
    .filter((item) => !item.id || !found.need.includes(item.id))
    .map((item) => ({ name: item.name, amount: item.amount }))
  stepsText.value = found.steps.join('\n')
  note.value = found.note ?? ''
  creditSite.value = found.credit?.site ?? ''
  creditUrl.value = found.credit?.url ?? ''
}

function ingredientLabel(id: string): string {
  return (
    ingredients.value.find((item) => item.id === id)?.name ??
    custom.value.find((item) => item.id === id)?.name ??
    (id.startsWith('o_') ? id.slice(2) : id)
  )
}

function toggleNeed(id: string) {
  if (need.value.includes(id)) {
    need.value = need.value.filter((item) => item !== id)
    delete amounts[id]
    return
  }
  need.value = need.value.concat(id)
  if (amounts[id] == null) amounts[id] = ''
}

function addExtra() {
  extras.value = extras.value.concat({ name: '', amount: '' })
}

function removeExtra(index: number) {
  extras.value = extras.value.filter((_, itemIndex) => itemIndex !== index)
}

function buildItems(): RecipeItem[] {
  const selected: RecipeItem[] = need.value.map((id) => ({
    id,
    name: ingredientLabel(id),
    amount: amounts[id]?.trim() ?? '',
  }))
  const added = extras.value
    .map((item) => ({ name: item.name.trim(), amount: item.amount.trim() }))
    .filter((item) => item.name.length > 0)
  return selected.concat(added)
}

function buildCredit(): RecipeCredit | undefined {
  const url = creditUrl.value.trim()
  if (!url) return undefined
  const site = creditSite.value.trim() || '出处'
  return { site, url, recipeBy: site, license: '用户自建' }
}

async function submit() {
  const steps = stepsText.value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
  if (!name.value.trim() || need.value.length < 1) {
    uni.showToast({ title: '写下菜名，并至少勾一样食材', icon: 'none' })
    return
  }
  if (need.value.some((id) => !amounts[id]?.trim())) {
    uni.showToast({ title: '给勾选的食材写上用量', icon: 'none' })
    return
  }
  if (steps.length > 5) {
    uni.showToast({ title: '步骤最多 5 条', icon: 'none' })
    return
  }
  try {
    await saveMine({
      id: editingId.value || undefined,
      name: name.value,
      need: need.value,
      steps,
      summary: summary.value,
      servings: servings.value,
      note: note.value,
      items: buildItems(),
      credit: buildCredit(),
    })
    uni.navigateBack()
  } catch {
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}

function confirmRemove() {
  uni.showModal({
    title: '删除这道菜',
    content: name.value,
    success(res) {
      if (!res.confirm) return
      void removeMine(editingId.value)
        .then(() => uni.navigateBack())
        .catch(() => {
          uni.showToast({ title: '删除失败', icon: 'none' })
        })
    },
  })
}
</script>

<style scoped>
.page {
  padding: 40rpx 40rpx calc(48rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.input,
.area,
.steps,
.amount-input,
.extra-name,
.extra-amount {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--color-line);
  border-radius: 24rpx;
  background: transparent;
  color: var(--color-text);
  font-size: 30rpx;
  transition: border-color 180ms var(--ease-out);
}

.input:focus,
.area:focus,
.steps:focus,
.amount-input:focus,
.extra-name:focus,
.extra-amount:focus {
  border-color: var(--color-earth);
}

.input {
  height: 72rpx;
  margin-bottom: 24rpx;
  padding: 0 24rpx;
}

.area {
  min-height: 140rpx;
  margin-bottom: 24rpx;
  padding: 20rpx 24rpx;
}

.group {
  margin-bottom: 40rpx;
}

.group-label {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 16rpx;
}

.group-label .group-name {
  margin-bottom: 0;
}

.group-name {
  display: block;
  margin-bottom: 16rpx;
  color: var(--color-earth);
  font-size: 26rpx;
  line-height: 1;
  letter-spacing: 0.04em;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.amount-row,
.extra-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.amount-name {
  flex: 0 0 28%;
  color: var(--color-text);
  font-size: 30rpx;
  line-height: 1.4;
}

.amount-input,
.extra-name,
.extra-amount {
  flex: 1;
  height: 72rpx;
  margin-bottom: 0;
  padding: 0 24rpx;
}

.extra-remove,
.add-extra {
  color: var(--color-earth);
  font-size: 24rpx;
  transition: transform 180ms var(--ease-out), color 180ms var(--ease-out);
}

.extra-remove:active,
.add-extra:active {
  transform: scale(0.96);
}

@media (hover: hover) and (pointer: fine) {
  .input:hover,
  .area:hover,
  .steps:hover,
  .amount-input:hover,
  .extra-name:hover,
  .extra-amount:hover {
    border-color: var(--color-earth);
  }

  .extra-remove:hover,
  .add-extra:hover {
    color: var(--color-text);
  }
}

.extra-remove {
  flex-shrink: 0;
}

.add-extra {
  display: inline-block;
  margin-top: 4rpx;
}

.steps {
  min-height: 180rpx;
  margin-bottom: 24rpx;
  padding: 20rpx 24rpx;
}

.primary,
.danger {
  margin: 0;
  height: 72rpx;
  line-height: 72rpx;
  border-radius: 24rpx;
  font-size: 30rpx;
}

.primary {
  background: var(--color-ready);
  color: var(--color-on-ready);
}

.danger {
  margin-top: 24rpx;
  border: 1px solid var(--color-line);
  background: transparent;
  color: var(--color-almost);
}
</style>
