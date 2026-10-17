import { ref } from 'vue'
import type { Recipe, RecipeCredit, RecipeItem } from '@/types/eat'
import { login } from '@/cloud/auth'
import { fetchMyRecipes, fetchOfficialRecipes, upsertMyRecipe, removeMyRecipe } from '@/cloud/db'
import { readSeedBundle } from '@/cloud/fixture'
import { CACHE_KEY_MINE, CACHE_KEY_REC, readCache, writeCache } from '@/utils/storage'
import { hasCloudEnv } from '@/cloud/env'
import { useJournal } from '@/composables/useJournal'

const official = ref<Recipe[]>([]) // 官方菜谱
const mine = ref<Recipe[]>([]) // 我的菜谱
const loading = ref(false) // 官方菜谱拉取状态
const loadError = ref(false) // 官方菜谱拉取错误状态

const { recordJournal } = useJournal()

/** 云失败且当前没有官方菜时，用种子填上，避免页面空白。 */
async function fillOfficialFromSeed(): Promise<void> {
  const seed = await readSeedBundle()
  official.value = seed.recipes
  writeCache(CACHE_KEY_REC, seed.recipes)
}

/**
 * 打开首页时加载菜谱。
 * 还没配置云环境时，内存里还没有官方菜才读种子并写入缓存。
 * 已经载入过就直接返回，避免每次切换 Tab 都重写整份菜谱。
 * 已配置云环境时先读本地缓存再尝试云。拉取失败不覆盖已有缓存。缓存和内存都空时，用种子填上。
 */
async function load(): Promise<void> {
  const cachedMine = readCache<Recipe[]>(CACHE_KEY_MINE)
  if (cachedMine) mine.value = cachedMine

  if (!hasCloudEnv()) {
    if (official.value.length > 0) return
    loading.value = true
    loadError.value = false
    try {
      await fillOfficialFromSeed()
    } catch {
      loadError.value = true
    }
    loading.value = false
    return
  }

  const cachedOfficial = readCache<Recipe[]>(CACHE_KEY_REC)
  if (cachedOfficial) official.value = cachedOfficial

  loading.value = official.value.length === 0
  loadError.value = false
  const session = await login()
  if (!session) {
    if (official.value.length === 0) await fillOfficialFromSeed()
    loading.value = false
    return
  }
  
  // 拉取云端官方菜谱
  try {
    const recipes = await fetchOfficialRecipes()
    official.value = recipes
    writeCache(CACHE_KEY_REC, recipes)
  } catch {
    if (official.value.length === 0) {
      // 如果官方菜谱为空，则用种子填充
      try {
        await fillOfficialFromSeed()
      } catch {
        loadError.value = true
      }
    }
  }

  // 拉取云端我的菜谱
  try {
    const rows = await fetchMyRecipes(session.openid)
    mine.value = rows
    writeCache(CACHE_KEY_MINE, rows)
  } catch {
    // 我的菜云失败时保留本地缓存。
  }
  loading.value = false
}

/** 按业务 id 替换或追加一道我的菜，并写入本地缓存。 */
function rememberMine(recipe: Recipe): void {
  mine.value = mine.value.filter((item) => item.id !== recipe.id).concat(recipe)
  writeCache(CACHE_KEY_MINE, mine.value)
}

/**
 * 保存一道我的菜。没有云或未登录时只写本地。
 * 云环境已配置且有 openid 时先 upsertMyRecipe；请求失败不改 mine。
 * 成功后再按 id 替换本地列表。步骤可以为空，最多 5 条。
 */
async function saveMine(input: {
  id?: string
  name: string
  need: string[]
  steps: string[]
  summary?: string
  servings?: string
  note?: string
  items?: RecipeItem[]
  credit?: RecipeCredit
}): Promise<void> {
  const name = input.name.trim()
  const need = input.need.map((item) => item.trim()).filter((item) => item.length > 0)
  const steps = input.steps.map((item) => item.trim()).filter((item) => item.length > 0)
  const recipe: Recipe = {
    id: input.id || `m_${Date.now()}`,
    name,
    need,
    steps,
    source: 'mine',
  }
  const summary = input.summary?.trim()
  const servings = input.servings?.trim()
  const note = input.note?.trim()
  if (summary) recipe.summary = summary
  if (servings) recipe.servings = servings
  if (note) recipe.note = note
  if (input.items?.length) recipe.items = input.items
  if (input.credit?.url) recipe.credit = input.credit
  
  // 是否是新创建的菜谱。
  const creating = !input.id
  function rememberAndNote() {
    rememberMine(recipe)
    if(!creating) return
    recordJournal({ at: Date.now(), kind: 'create', id: recipe.id, name: recipe.name, source: 'mine' })
  }

  if (name.length === 0 || need.length < 1) {
    throw new Error('菜名不能为空，且至少需要一样食材')
  }
  if (steps.length > 5) {
    throw new Error('步骤最多 5 条')
  }
  const session = await login()
  if (!hasCloudEnv() || !session) {
    rememberAndNote()
    return
  }
  // 更新云端
  await upsertMyRecipe({ ...recipe, ownerId: session.openid })
  rememberAndNote()
}

/**
 * 删除一道我的菜。云环境已配置且有 openid 时先 removeMyRecipe。
 * 请求失败不改本地列表。没有云或未登录时直接从本地去掉。
 */
async function removeMine(id: string): Promise<void> {
  const session = await login()
  if(hasCloudEnv() && session) {
    await removeMyRecipe(id, session.openid)
  }
  mine.value = mine.value.filter((item) => item.id !== id)
  writeCache(CACHE_KEY_MINE, mine.value)
}

export function useRecipes() {
  return { official, mine, loading, loadError, load, saveMine, removeMine }
}
