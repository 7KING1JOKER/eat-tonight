import { ref } from 'vue'
import type { CustomIngredient, FridgeState, Ingredient } from '@/types/eat'
import { login } from '@/cloud/auth'
import { fetchIngredients, getFridge, setFridge } from '@/cloud/db'
import { readSeedBundle } from '@/cloud/fixture'
import { CACHE_KEY_FRIDGE, CACHE_KEY_ING, readCache, writeCache } from '@/utils/storage'

/** 模块顶层一份状态，首页和冰箱页看到的是同一份 have。 */
const have = ref<string[]>([])  // 冰箱里的食材
const ingredients = ref<Ingredient[]>([])  // 官方食材
const custom = ref<CustomIngredient[]>([])  // 自定义食材
const pendingSync = ref(false) // 用来标记是否写上云失败了

function snapshot(): FridgeState {
  return {
    have: have.value,
    custom: custom.value,
    pendingSync: pendingSync.value,
  }
}

/**
 * 把当前冰箱写入本地后再尝试上云。失败不回滚 have。
 * login() 为 null，或 setFridge 抛错：toast「未同步」，pendingSync 设为 true。
 * 成功则 pendingSync 设为 false。两种结果都要再次 writeCache(CACHE_KEY_FRIDGE, snapshot())。
 */
async function sync(): Promise<void> {
  // 先把刚改过的 have / custom 落盘。这时 pendingSync 还是旧值，云请求还没发出。
  writeCache(CACHE_KEY_FRIDGE, snapshot())
  const session = await login()
  if (!session) {
    uni.showToast({ title: '未同步', icon: 'none' })
    pendingSync.value = true
    writeCache(CACHE_KEY_FRIDGE, snapshot())
    return
  }
  try {
    await setFridge(session.openid, have.value, custom.value)
    pendingSync.value = false
    writeCache(CACHE_KEY_FRIDGE, snapshot())
  } catch {
    uni.showToast({ title: '未同步', icon: 'none' })
    pendingSync.value = true
    writeCache(CACHE_KEY_FRIDGE, snapshot())
    return
  }
}

/**
 * 点选食材。已在 have 里就去掉，否则加进去。先改本地，再 sync。
 * @param id 官方食材 id，或 `c_` 开头的自定义 id
 */
function toggle(id: string): void {
  if (have.value.includes(id)) {
    have.value = have.value.filter(item => item !== id)
  } else {
    have.value.push(id)
  }
  sync()
}

/**
 * 增加自定义食材。去掉首尾空格，空名字直接返回。
 * id 为 `c_${名字}`。该 id 已在 custom 里则不要再插一条，也不要打云。
 * 新名字写入 custom，并把 id 放进 have，然后 sync。
 * @param name 用户输入的食材名
 */
function addCustom(name: string): void {
  const trimmed = name.trim()
  if (trimmed === '') return
  const id = `c_${trimmed}`
  if (custom.value.some((item) => item.id === id)) return
  custom.value.push({ id, name: trimmed })
  have.value.push(id)
  sync()
}

/**
 * 打开冰箱页时调用。先读本地缓存填界面，再尝试云。
 * 食材拉成功就更新 CACHE_KEY_ING。失败且本地食材为空时，用 readSeedBundle() 填食材，不要在页面里 import JSON。
 * 冰箱只有在本地还没有缓存、且 pendingSync 不为真时，才用 getFridge 的结果覆盖。
 */
async function load(): Promise<void> {
  // 冰箱缓存
  const cache = readCache<FridgeState>(CACHE_KEY_FRIDGE)
  if (cache) {
    have.value = cache.have
    custom.value = cache.custom
    pendingSync.value = cache.pendingSync
  }

  // 食材缓存
  const cachedIngredients = readCache<Ingredient[]>(CACHE_KEY_ING)
  if (cachedIngredients) {
    ingredients.value = cachedIngredients
  }

  const session = await login()
  if (session) {
    try {
      // 云食材
      const cloudIngredients = await fetchIngredients()
      ingredients.value = cloudIngredients
      writeCache(CACHE_KEY_ING, cloudIngredients)
    } catch {
      // 云失败时保留上面读到的食材缓存。
    }
    if (!cache && !pendingSync.value) {
      try {
        const fridge = await getFridge(session.openid)
        have.value = fridge.have
        custom.value = fridge.custom
        writeCache(CACHE_KEY_FRIDGE, snapshot())
      } catch {
        // 云上还没有冰箱文档时保留本地勾选。
      }
    }
  }

  if (ingredients.value.length === 0) {
    const seed = await readSeedBundle()
    ingredients.value = seed.ingredients
    writeCache(CACHE_KEY_ING, seed.ingredients)
  }
}

export function useFridge() {
  return { have, ingredients, custom, toggle, addCustom, load }
}
