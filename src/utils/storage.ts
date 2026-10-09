export const CACHE_KEY_ING = 'eat.ingredients' // 官方食材缓存键
export const CACHE_KEY_REC = 'eat.recipes' // 官方菜谱缓存键
export const CACHE_KEY_FRIDGE = 'eat.fridge' // 冰箱缓存键
export const CACHE_KEY_MINE = 'eat.myRecipes' // 我的菜谱缓存键
export const CACHE_KEY_DETAIL = 'eat.detail' // 菜谱详情缓存键
export const CACHE_KEY_ANON = 'eat.anonId' // 匿名用户 ID 缓存键

/**
 * 读本地缓存。统一按 JSON 字符串存放，也兼容运行时已经反序列化过的值。
 * 坏数据返回 null，不抛到页面。
 */
export function readCache<T>(key: string): T | null {
  try {
    const raw = uni.getStorageSync(key) as unknown
    if (raw == null || raw === '') return null
    if (typeof raw === 'string') return JSON.parse(raw) as T
    return raw as T
  } catch {
    return null
  }
}

/** 写入本地缓存。失败时静默，调用方仍可使用内存里的值。 */
export function writeCache<T>(key: string, value: T): void {
  try {
    uni.setStorageSync(key, JSON.stringify(value))
  } catch {
    // 存储满或不可用时不打断勾选和匹配。
  }
}

/** 删掉一条缓存。清官方菜时用，不存在也算成功。 */
export function removeCache(key: string): void {
  try {
    uni.removeStorageSync(key)
  } catch {
    // 与 writeCache 相同，清理失败不抛到页面。
  }
}
