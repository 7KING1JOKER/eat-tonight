import { ref } from 'vue'
import type { Recipe } from '@/types/eat'
import { login } from '@/cloud/auth'
import { fetchMyRecipes, fetchOfficialRecipes } from '@/cloud/db'
import { readSeedBundle } from '@/cloud/fixture'
import { CACHE_KEY_MINE, CACHE_KEY_REC, readCache, writeCache } from '@/utils/storage'

const official = ref<Recipe[]>([]) // 官方菜谱
const mine = ref<Recipe[]>([]) // 我的菜谱
const loading = ref(false) // 官方菜谱拉取状态
const loadError = ref(false) // 官方菜谱拉取错误状态

/** 云失败且当前没有官方菜时，用种子填上，避免页面空白。 */
async function fillOfficialFromSeed(): Promise<void> {
  const seed = await readSeedBundle()
  official.value = seed.recipes
  writeCache(CACHE_KEY_REC, seed.recipes)
}

/**
 * 打开首页时加载菜谱。先读本地缓存再尝试云。
 * 拉取失败不覆盖已有缓存。缓存和内存都空时，用 readSeedBundle() 填官方菜。
 */
async function load(): Promise<void> {
  const cachedOfficial = readCache<Recipe[]>(CACHE_KEY_REC)
  if (cachedOfficial) official.value = cachedOfficial
  const cachedMine = readCache<Recipe[]>(CACHE_KEY_MINE)
  if (cachedMine) mine.value = cachedMine

  loading.value = official.value.length === 0
  loadError.value = false
  const session = await login()
  if (!session) {
    // 未登录时，如果官方菜谱为空，则用种子填充
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

export function useRecipes() {
  return { official, mine, loading, loadError, load }
}
